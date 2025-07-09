// eslint-disable-next-line import/no-unresolved
import 'https://js.braintreegateway.com/web/dropin/1.44.1/js/dropin.min.js';

// Helpers
import { getConfig, loader } from './helpers/index.js';

// Payment methods
import {
  card,
  applepay,
  googlepay,
  paypal,
  venmo,
} from './methods/index.js';

const onPlaceOrder = async (ctx) => {
  await loader.displayOverlaySpinner();
  const paymentMethodCode = ctx.code;

  switch (paymentMethodCode) {
    case 'braintree_oope': {
      await card.placeOrder(ctx);
      loader.removeOverlaySpinner();
      break;
    }

    case 'braintree_applepay_oope': {
      await applepay.placeOrder(ctx);
      loader.removeOverlaySpinner();
      break;
    }

    case 'braintree_googlepay_oope': {
      await googlepay.placeOrder(ctx);
      loader.removeOverlaySpinner();
      break;
    }

    case 'braintree_paypal_oope': {
      await paypal.placeOrder(ctx);
      loader.removeOverlaySpinner();
      break;
    }

    case 'braintree_venmo_oope': {
      await venmo.placeOrder(ctx);
      loader.removeOverlaySpinner();
      break;
    }

    default: {
      loader.removeOverlaySpinner();
    }
  }
};

export default async (handleValidation) => {
  try {
    const config = await getConfig();

    return {
      methods: {
        braintree_oope: {
          enabled: !!config.braintree_oope && !!config.braintree_oope.enable,
          render: card.handler,
          setOnChange: false,
        },
        braintree_applepay_oope: {
          setOnChange: false,
          enabled: (!!config.braintree_applepay_oope && !!config.braintree_applepay_oope.enable)
          && typeof (window.ApplePaySession) !== 'undefined' && window.ApplePaySession.canMakePayments,
          render: (ctx) => applepay.handler(ctx, handleValidation),
        },
        braintree_googlepay_oope: {
          enabled: !!config.braintree_googlepay_oope && !!config.braintree_googlepay_oope.enable,
          render: (ctx) => googlepay.handler(ctx, handleValidation),
          setOnChange: false,
        },
        braintree_paypal_oope: {
          enabled: !!config.braintree_paypal_oope && !!config.braintree_paypal_oope.enable,
          render: (ctx) => paypal.handler(ctx, handleValidation),
          setOnChange: false,
        },
        braintree_venmo_oope: {
          enabled: !!config.braintree_venmo_oope && !!config.braintree_venmo_oope.enable,
          render: (ctx) => venmo.handler(ctx, handleValidation),
          setOnChange: false,
        },
      },
      methodCodes: [
        'braintree_oope',
        'braintree_applepay_oope',
        'braintree_googlepay_oope',
        'braintree_paypal_oope',
        'braintree_venmo_oope',
      ],
      onPlaceOrder,
    };
  } catch (error) {
    console.error(error);
  }

  return {};
};
