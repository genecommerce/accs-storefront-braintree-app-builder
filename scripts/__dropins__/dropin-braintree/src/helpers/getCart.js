import { events } from '@dropins/tools/event-bus.js';

/**
 * @returns {import('@dropins/storefront-cart/data/models').CartModel}
 */
export default () => (
  events.lastPayload('cart/data') || events.lastPayload('cart/initialized')
);
