import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import * as orderApi from '@dropins/storefront-order/api.js';
import { events } from '@dropins/tools/event-bus.js';

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
  const { braintree_paypal_oope: braintreePayPal } = await getConfig();

  const options = {
    authorization: clientToken,
    container: container.querySelector('.braintree_paypal'),
    card: false,
    paypal: {
      flow: 'checkout',
      amount: cart.total.includingTax.value,
      currency: cart.total.includingTax.currency,
      commit: true,
      buttonStyle: {
        size: 'responsive',
      },
    },
  };

  if (braintreePayPal.creditEnable) {
    options.paypalCredit = {
      flow: 'checkout',
      amount: cart.total.includingTax.value,
      currency: cart.total.includingTax.currency,
      buttonStyle: {
        size: 'responsive',
      },
      commit: true,
    };
  }

  return options;
};

const createBraintreeInstance = (handleValidation) => {
  container.querySelector('.braintree_paypal').innerHTML = '';

  if (braintreeInstance && typeof braintreeInstance.teardown === 'function') {
    braintreeInstance.teardown();
  }

  getClientToken()
    .then(getPaymentOptions)
    .then(window.braintree.dropin.create)
    .then((dropinInstance) => {
      braintreeInstance = dropinInstance;

      const originalPayment = braintreeInstance._mainView._views.paypal.paypalInstance.createPayment
        .bind(braintreeInstance._mainView._views.paypal.paypalInstance);

      braintreeInstance._mainView._views.paypal.paypalInstance.createPayment = (data) => {
        if (!handleValidation()) {
          return Promise.reject();
        }

        return originalPayment(data);
      };

      const originalReportError = braintreeInstance._mainView.model.reportError
        .bind(braintreeInstance._mainView.model);

      braintreeInstance._mainView.model.reportError = (error) => {
        if (error && !error.message.includes('No value passed to payment')) {
          originalReportError(error);
        }
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
      <div class="braintree_paypal"></div>
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
      code: 'braintree_paypal_oope',
      additional_data: [
        {
          key: 'payment_method_nonce',
          value: payload.nonce,
        },
      ],
    }))
    .then(() => orderApi.placeOrder(ctx.cartId))
    .catch((err) => {
      braintreeInstance._mainView.setPrimaryView('paypal');
      errors.addError(err, container);
      orderProcessing.setState(false);
      loader.removeOverlaySpinner();
    });
};

export default {
  handler,
  placeOrder,
};
