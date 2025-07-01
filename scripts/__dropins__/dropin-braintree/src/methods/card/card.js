// Dropin Components
import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import * as orderApi from '@dropins/storefront-order/api.js';
import { events } from '@dropins/tools/event-bus.js';

import {
  loader,
  getCart,
  getClientToken,
  errors,
  getConfig,
  orderProcessing,
} from '../../helpers/index.js';

let braintreeInstance;
let container;

/**
 * Gets the payment configuration to be passed to Braintree Web Drop In.
 *
 * @param {string} clientToken
 * @returns {Promise<object>}
 */
const getPaymentOptions = async (clientToken) => {
  const cart = getCart();
  const { braintree_oope: braintree } = await getConfig();

  const options = {
    authorization: clientToken,
    container: container.querySelector('.braintree_card'),
  };

  if (braintree.threeds.enable) {
    options.threeDSecure = {
      amount: cart.total.includingTax.value.toString(),
    };
  }

  return options;
};

const createBraintreeInstance = () => {
  container.querySelector('.braintree_card').innerHTML = '';

  if (braintreeInstance && typeof braintreeInstance.teardown === 'function') {
    braintreeInstance.teardown();
  }

  getClientToken()
    .then(getPaymentOptions)
    .then(window.braintree.dropin.create)
    .then((dropinInstance) => {
      braintreeInstance = dropinInstance;
    })
    .catch((error) => {
      errors.addError(error, container);
    })
    .finally(loader.removeOverlaySpinner);
};

const handler = async (ctx) => {
  await loader.displayOverlaySpinner();

  container = document.createElement('div');
  container.innerHTML = `
    <div class="braintree_wrapper">
      <div class="braintree_errors"></div>
      <div class="braintree_card"></div>
    </div>
  `;

  ctx.replaceHTML(container);

  createBraintreeInstance();

  events.on('cart/data', () => {
    if (!orderProcessing.getState()) {
      createBraintreeInstance();
    }
  });
};

const placeOrder = async (ctx) => {
  orderProcessing.setState(true);
  errors.removeErrors(container);

  await loader.displayOverlaySpinner();

  const cart = getCart();
  const { braintree_oope: braintree } = await getConfig();
  const paymentOptions = {};

  if (braintree.threeds.enable) {
    const {
      billingAddress = {},
      email,
    } = events.lastPayload('checkout/updated') || events.lastPayload('checkout/initialized');

    const formattedBillingAddress = {
      givenName: billingAddress.firstName,
      surname: billingAddress.lastName,
      phoneNumber: billingAddress.telephone,
      streetAddress: billingAddress.street[0],
      extendedAddress: billingAddress.street[1],
      locality: billingAddress.city,
      region: billingAddress.region.code,
      postalCode: billingAddress.postCode,
      countryCodeAlpha2: billingAddress.country.value,
    };

    paymentOptions.threeDSecure = {
      amount: cart.total.includingTax.value.toFixed(2),
      email,
      billingAddress: formattedBillingAddress,
      challengeRequested: braintree.threeds.always_request
        || cart.total.includingTax.value >= parseFloat(braintree.threeds.threshold),
      collectDeviceData: true
    };
  }

  return braintreeInstance.requestPaymentMethod(paymentOptions)
    .then((payload) => checkoutApi.setPaymentMethod({
      code: 'braintree_oope',
      additional_data: [
        {
          key: 'payment_method_nonce',
          value: payload.nonce,
        },
      ],
    }))
    .then(() => orderApi.placeOrder(ctx.cartId))
    .catch((err) => {
      braintreeInstance._mainView.setPrimaryView('card');

      if (!err.name || err.name !== 'DropinError') {
        errors.addError(err, container);
      }

      orderProcessing.setState(false);
      loader.removeOverlaySpinner();
    });
};

export default {
  handler,
  placeOrder,
};
