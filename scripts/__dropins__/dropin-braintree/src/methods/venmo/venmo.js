import * as orderApi from '@dropins/storefront-order/api.js';
import { events } from '@dropins/tools/event-bus.js';
import * as checkoutApi from '@dropins/storefront-checkout/api.js';

import {
  loader,
  getClientToken,
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

const createBraintreeInstance = (handleValidation) => {
  container.querySelector('.braintree_venmo').innerHTML = '';

  if (braintreeInstance && typeof braintreeInstance.teardown === 'function') {
    braintreeInstance.teardown();
  }

  getClientToken()
    .then((clientToken) => window.braintree.dropin.create({
      authorization: clientToken,
      container: container.querySelector('.braintree_venmo'),
      card: false,
      venmo: {
        allowDesktop: true,
      },
    }))
    .then((dropinInstance) => {
      braintreeInstance = dropinInstance;

      const originalPayment = braintreeInstance._mainView._views.venmo.venmoInstance.tokenize
        .bind(braintreeInstance._mainView._views.venmo.venmoInstance);

      braintreeInstance._mainView._views.venmo.venmoInstance.tokenize = async () => {
        if (!handleValidation()) {
          return Promise.resolve();
        }

        return originalPayment();
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
      <div class="braintree_venmo"></div>
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
      code: 'braintree_venmo_oope',
      additional_data: [
        {
          key: 'payment_method_nonce',
          value: payload.nonce,
        },
      ],
    }))
    .then(() => orderApi.placeOrder(ctx.cartId))
    .catch((err) => {
      braintreeInstance._mainView.setPrimaryView('venmo');
      errors.addError(err, container);
      orderProcessing.setState(false);
      loader.removeOverlaySpinner();
    });
};

export default {
  handler,
  placeOrder,
};
