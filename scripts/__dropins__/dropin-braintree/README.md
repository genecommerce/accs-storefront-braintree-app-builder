# Braintree Payments

Integration of Braintree Payments with [Adobe EDS Storefront](https://github.com/hlxsites/aem-boilerplate-commerce/).

## Payment methods

* Card
* Apple Pay
* Google Pay
* PayPal (including credit)
* Venmo

Currently no express payment methods are available.

## Intregation

The current version of the [checkout drop-in component](https://experienceleague.adobe.com/developer/commerce/storefront/dropins/checkout/) doesn't support the ability to add payment methods without modification so this guide will cover what changes you need to make to integration Braintree Payments.

### Prerequisites

This guide assumes knowledge of EDS Storefront and that you have followed these guides:

* [Create your storefront](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/)
* [Explore the Structure](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/storefront-structure/)

### Install

At the root of your EDS Storefront install this package:

```bash
npm i @genecommerce/dropin-braintree
```

### Building

Once installed you will need to make modifications to the checkout drop-in component files directly as payment methods aren't currently extensible.

Please refer to the following three documents on how to do this.
Note that these documents are available within the package inside of the 'docs' folder. The links may not function if being viewed from the NPM package homepage.

* [Checkout drop-in integration](./docs/checkout-drop-in-integration.md)
* [Checkout drop-in styles](./docs/checkout-drop-in-styles.md)
* [Integration with head.html](./docs/checkout-drop-in-head.md)
* [Compilation](./docs/checkout-drop-in-compiling.md)

You will need to complete all four of these documents before being able to compile the Braintree payment methods.

```bash
npm run postinstall
```
