import {
  InLineAlert,
  Icon,
  provider as UI,
} from '@dropins/tools/components.js';
import { fetchPlaceholders } from '../../../../../scripts/commerce.js';

/**
 * Adds an error message within the container provided.
 *
 * @param {Error} error
 * @param {HTMLElement} container
 */
const addError = async (error, container) => {
  /** @type HTMLElement */
  const errorContainer = container.querySelector('.braintree_errors');

  const placeholders = await fetchPlaceholders();

  const inlineAlert = await UI.render(InLineAlert, {
    heading: placeholders.Checkout.ServerError.title,
    description: error.message || placeholders.Checkout.ServerError.unexpected,
    icon: Icon({ source: 'PaymentError' }),
    'aria-live': 'assertive',
    role: 'alert',
    onDismiss: () => {
      inlineAlert.remove();
    },
  })(errorContainer);
};

/**
 * Finds and clears everything out of '.braintree_errors' inside of the container.
 *
 * @param {HTMLElement} container
 */
const removeErrors = (container) => {
  container.querySelector('.braintree_errors').innerHTML = '';
};

export default {
  addError,
  removeErrors,
};
