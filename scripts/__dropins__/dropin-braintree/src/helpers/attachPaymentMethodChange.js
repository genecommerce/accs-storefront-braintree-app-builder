/**
 * Adds the current selected method code to the payment methods DOM wrapper.
 *
 * @param {HTMLElement} $paymentMethods The DOM element wrapping all of the payment methods.
 * @param {string} method The method code for the selected payment method
 */
const setSelectedPaymentMethod = ($paymentMethods, method) => {
  $paymentMethods.dataset.selectedPaymentMethod = method;
};

/**
 * Attaches a change event handler to all of the elements that match input[name="payment-method"]'
 * found within the document.
 *
 * @param {HTMLElement} $paymentMethods The DOM element wrapping all of the payment methods.
 */
export default ($paymentMethods) => {
  /**
   * Get the current payment method selected.
   *
   * @type {string|undefined}
   */
  const selectedMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

  // If we do have a value then set the method to the data attribute of the payments container.
  if (selectedMethod) {
    setSelectedPaymentMethod($paymentMethods, selectedMethod);
  }

  // Get all of the available payment methods on the page and attach a change handler to them
  // so that we add the most recent selected payment method code to the data attribute of the
  // container.
  document.querySelectorAll('input[name="payment-method"]').forEach((paymentMethod) => {
    paymentMethod.addEventListener('change', (event) => {
      setSelectedPaymentMethod($paymentMethods, event.currentTarget.value);
    });
  });
};
