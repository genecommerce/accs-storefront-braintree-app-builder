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
  const cart = getCart();
  const { braintree_applepay_oope: braintreeApplePay } = await getConfig();

  const options = {
    authorization: clientToken,
    container: container.querySelector('.braintree_applepay'),
    card: false,
    applePay: {
      buttonStyle: braintreeApplePay.buttonStyle,
      displayName: braintreeApplePay.merchantName,
      paymentRequest: {
        total: {
          label: braintreeApplePay.merchantName,
          amount: cart.total.includingTax.value.toString(),
        },
      },
    },
  };

  return options;
};

const createBraintreeInstance = (handleValidation) => {
  container.querySelector('.braintree_applepay').innerHTML = '';

  if (braintreeInstance && typeof braintreeInstance.teardown === 'function') {
    braintreeInstance.teardown();
  }

  getClientToken()
    .then(getPaymentOptions)
    .then(window.braintree.dropin.create)
    .then((dropinInstance) => {
      braintreeInstance = dropinInstance;

      const originalApplePay = braintreeInstance._mainView._views.applePay.buttonDiv.onclick
        .bind(braintreeInstance._mainView._views.applePay);

      braintreeInstance._mainView._views.applePay.buttonDiv.onclick = (event) => {
        if (!handleValidation()) {
          return false;
        }

        return originalApplePay(event);
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
      <div class="braintree_applepay"></div>
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

  return braintreeInstance.requestPaymentMethod()
    .then((payload) => checkoutApi.setPaymentMethod({
      code: 'braintree_applepay_oope',
      additional_data: [
        {
          key: 'payment_method_nonce',
          value: payload.nonce,
        },
      ],
    }))
    .then(() => orderApi.placeOrder(ctx.cartId))
    .catch((err) => {
      braintreeInstance._mainView.setPrimaryView('applePay');
      errors.addError(err, container);
      orderProcessing.setState(false);
      loader.removeOverlaySpinner();
    });
};

export default {
  handler,
  placeOrder,
};
