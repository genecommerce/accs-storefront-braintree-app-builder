import * as orderApi from '@dropins/storefront-order/api.js';
import { events } from '@dropins/tools/event-bus.js';
import * as checkoutApi from '@dropins/storefront-checkout/api.js';

import {
  loader,
  getCart,
  getClientToken,
  getConfig,
  errors,
  orderProcessing,
} from '../../helpers/index.js';

let braintreeInstance;
let container;

const attachEventListeners = (instance) => {
  instance.on('changeActiveView', ({ newViewId }) => {
    if (newViewId === 'methods') {
      /** @type HTMLElement */
      const submit = document.querySelector('.checkout-place-order__button');
      if (submit) {
        submit.click();
      }
    }
  });
};

/**
 * Gets the payment configuration to be passed to Braintree Web Drop In.
 *
 * @param {string} clientToken
 * @returns {Promise<object>}
 */
const getPaymentOptions = async (clientToken) => {
  container.querySelector('.braintree_googlepay').innerHTML = '';

  const cart = getCart();
  const {
    braintree_oope: braintree,
    braintree_googlepay_oope: braintreeGooglePay,
  } = await getConfig();

  const options = {
    authorization: clientToken,
    container: container.querySelector('.braintree_googlepay'),
    card: false,
    googlePay: {
      merchantId: braintreeGooglePay.merchantId,
      googlePayVersion: 2,
      transactionInfo: {
        currencyCode: cart.total.includingTax.currency,
        totalPriceStatus: 'FINAL',
        totalPrice: cart.total.includingTax.value.toString(),
      },
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: braintreeGooglePay.acceptedCards,
          billingAddressRequired: true,
          billingAddressParameters: {
            format: 'FULL',
            phoneNumberRequired: true,
          },
        },
      }],
      button: {
        buttonColor: braintreeGooglePay.buttonColor,
        buttonSizeMode: 'fill',
        onClick: () => {},
      },
    },
  };

  if (braintree.threeds.enable) {
    options.threeDSecure = {
      amount: cart.total.includingTax.value.toString(),
    };
  }

  return options;
};

const createBraintreeInstance = (handleValidation) => {
  if (braintreeInstance && typeof braintreeInstance.teardown === 'function') {
    braintreeInstance.teardown();
  }

  return getClientToken()
    .then(getPaymentOptions)
    .then(window.braintree.dropin.create)
    .then((dropinInstance) => {
      braintreeInstance = dropinInstance;

      const originalGooglePay = braintreeInstance._mainView._views.googlePay.tokenize
        .bind(braintreeInstance._mainView._views.googlePay);

      braintreeInstance._mainView._views.googlePay.tokenize = async () => {
        if (!handleValidation()) {
          return Promise.resolve();
        }

        return originalGooglePay();
      };

      attachEventListeners(dropinInstance);
    })
    .catch((error) => {
      errors.addError(error, container);
    })
    .finally(loader.removeOverlaySpinner);
};

const handler = async (ctx, handleValidation) => {
  await loader.displayOverlaySpinner();

  container = document.createElement('div');
  container.innerHTML = `
    <div class="braintree_wrapper">
      <div class="braintree_errors"></div>
      <div class="braintree_googlepay"></div>
    </div>
  `;

  ctx.replaceHTML(container);

  createBraintreeInstance(handleValidation);

  events.on('cart/data', () => {
    if (!orderProcessing.getState()) {
      createBraintreeInstance(handleValidation);
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
    };
  }

  return braintreeInstance.requestPaymentMethod(paymentOptions)
    .then((payload) => checkoutApi.setPaymentMethod({
      code: 'braintree_googlepay_oope',
      additional_data: [
        {
          key: 'payment_method_nonce',
          value: payload.nonce,
        },
      ],
    }))
    .then(() => orderApi.placeOrder(ctx.cartId))
    .catch((err) => {
      braintreeInstance._mainView.setPrimaryView('googlePay');
      errors.addError(err, container);
      orderProcessing.setState(false);
      loader.removeOverlaySpinner();
    });
};

export default {
  handler,
  placeOrder,
};
