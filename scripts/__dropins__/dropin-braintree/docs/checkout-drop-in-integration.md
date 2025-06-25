
## Integrate with checkout drop-in

### Step 1 - Imports

Modify the following file:

```bash
./blocks/commerce-checkout/commerce-checkout.js
```

At the top of this file are all of the imports so add these two additional imports:

```javascript
import Braintree from '@genecommerce/dropin-braintree/src/braintree.js';
import attachPaymentMethodChange from '@genecommerce/dropin-braintree/src/helpers/attachPaymentMethodChange.js';
```

### Step 2 - Validation function

To allow form validation to work when clicking on the payment buttons the `handleValidation` callback function needs to be passed into the Braintree constructor. To do this you need to move the entire anonymous function for the `handleValidation` property of `CheckoutProvider.render(PlaceOrder, {` into a named function.

Define this alongside all of the other variable definitions such as:

```javascript
  ...
  let billingForm;
  let shippingAddresses;
  let billingAddresses;
  ...

  const handleValidation = () => {
    let success = true;
    const { forms } = document;

    const loginForm = forms[LOGIN_FORM_NAME];

    if (loginForm) {
      success = loginForm.checkValidity();
      if (!success) scrollToElement($login);
    }
    ...
```

The content of the `handleValidation` function should be taken directly from the boilerplate as it exists in the latest version.

With that as a named function update the checkout drop-in render of the `PlaceOrder`:

```javascript
    CheckoutProvider.render(PlaceOrder, {
      handleValidation,
      handlePlaceOrder: async ({ cartId, code }) => {
        await displayOverlaySpinner();
        ...
```

### Step 3 - Initialise Braintree

Underneath the definition of the `handleValidation` function initialise Braintree with the following:

```javascript
  const braintree = await Braintree(handleValidation);
```

### Step 4 - Add Braintree to the payment method renderers

The payment method renderers are defined within the following part of the checkout drop-in:

```javascript
    CheckoutProvider.render(PaymentMethods, {
      slots: {
        Methods: {
          [PaymentMethodCode.CREDIT_CARD]: {
            render: (ctx) => {
              const $content = document.createElement('div');

              PaymentServices.render(CreditCard, {
                ...
```

Within the `Methods` object add the following:

```javascript
    CheckoutProvider.render(PaymentMethods, {
      slots: {
        Methods: {
          ... // All other payment method renderers.
          ...braintree.methods,
        },
      },
    })($paymentMethods),
```

### Step 5 - Add Braintree place order handlers

The place order callbacks are handled from the following part of the checkout drop-in:

```javascript
    CheckoutProvider.render(PlaceOrder, {
      handleValidation,
      handlePlaceOrder: async ({ cartId, code }) => {
        await displayOverlaySpinner();
        try {
          // Payment Services credit card
          if (code === PaymentMethodCode.CREDIT_CARD) {
            if (!creditCardFormRef.current) {
              console.error('Credit card form not rendered.');
              return;
            }
          ...
```

Update this to be the following:

```javascript
    CheckoutProvider.render(PlaceOrder, {
      handleValidation,
      handlePlaceOrder: async ({ cartId, code }) => {
        await displayOverlaySpinner();
        try {
          if (braintree.methodCodes.includes(code)) {
            removeOverlaySpinner();
            braintree.onPlaceOrder({ cartId, code });
            return;
          }

          // Payment Services credit card
          if (code === PaymentMethodCode.CREDIT_CARD) {
            if (!creditCardFormRef.current) {
              console.error('Credit card form not rendered.');
              return;
```

### Step 6 - Attach payment method change listener

Inside of the `initializeCheckout` function we need to run a Braintree specific function that handles changing of the payment methods.

Update the `initializeCheckout` function to add the `attachPaymentMethodChange` function that was imported earlier:

```javascript
  const initializeCheckout = async (data) => {
    if (initialized) return;
    removeEmptyCart();
    if (data.isGuest) await displayGuestAddressForms(data);
    else {
      removeOverlaySpinner();
      await displayCustomerAddressForms(data);
    }

    attachPaymentMethodChange($paymentMethods);
  };
```
