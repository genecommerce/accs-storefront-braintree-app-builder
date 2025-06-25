import { getConfigValue } from '../../../../../scripts/configs.js';
import { fetchPlaceholders } from '../../../../../scripts/commerce.js';

let request;

/**
 * @returns {Promise<object>}
 */
export default async () => {
  if (request) {
    return request;
  }

  const braintreeEndpoint = await getConfigValue('commerce-braintree-config-endpoint');
  const placeholders = await fetchPlaceholders();

  request = fetch(braintreeEndpoint)
    .then((response) => {
      if (!response.ok) {
        throw new Error(placeholders.Checkout.ServerError.unexpected);
      }

      return response;
    })
    .then((response) => response.json())
    .catch((error) => {
      throw new Error(error.message);
    });

  return request;
};
