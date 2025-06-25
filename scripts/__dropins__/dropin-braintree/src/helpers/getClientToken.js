import getConfig from './getConfig.js';
import { fetchPlaceholders } from '../../../../../scripts/commerce.js';

/**
 * @returns {Promise<string>}
 */
export default async () => {
  const config = await getConfig();

  if (!config.clientToken) {
    const placeholders = await fetchPlaceholders();

    throw new Error(placeholders.Checkout.ServerError.unexpected);
  }

  return config.clientToken;
};
