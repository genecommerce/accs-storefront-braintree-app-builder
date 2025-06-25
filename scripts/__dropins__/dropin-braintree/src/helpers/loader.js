import {
  ProgressSpinner,
  provider as UI,
} from '@dropins/tools/components.js';

let loader;

/**
 * Displays the loading spinner over the checkout.
 */
const displayOverlaySpinner = async () => {
  if (loader) return;
  /** @type HTMLElement */
  const $loader = document.querySelector('.checkout__loader');

  loader = await UI.render(ProgressSpinner, {
    className: '.checkout__overlay-spinner',
  })($loader);
};

/**
 * Removes any loading spinners from the checkout.
 */
const removeOverlaySpinner = () => {
  if (!loader) return;
  const $loader = document.querySelector('.checkout__loader');

  loader.remove();
  loader = null;
  $loader.innerHTML = '';
};

export default {
  displayOverlaySpinner,
  removeOverlaySpinner,
};
