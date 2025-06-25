
## Integrate with head.html

### Step 1 - Import map

The [AEM Boilerplate Commerce](https://github.com/hlxsites/aem-boilerplate-commerce) provides a default [head.html](https://github.com/hlxsites/aem-boilerplate-commerce/blob/main/head.html) file that will need to be modified to be able to import the compiled Braintree extension.

The `head.html` file contains a script tag containing all of the import maps.

Search through the `head.html` file for the following:

```js
<script type="importmap">
```

This will be an object and add the following key/value pair to the `"imports"` property:

```js
 "@dropins/tools/": "/scripts/__dropins__/tools/"
```

As an example the full import map script should look similar to the following:

```js
<script type="importmap">
    {
        "imports": {
            "@dropins/storefront-account/": "/scripts/__dropins__/storefront-account/",
            "@dropins/storefront-auth/": "/scripts/__dropins__/storefront-auth/",
            "@dropins/storefront-cart/": "/scripts/__dropins__/storefront-cart/",
            "@dropins/storefront-checkout/": "/scripts/__dropins__/storefront-checkout/",
            "@dropins/storefront-order/": "/scripts/__dropins__/storefront-order/",
            "@dropins/storefront-payment-services/": "/scripts/__dropins__/storefront-payment-services/",
            "@dropins/storefront-pdp/": "/scripts/__dropins__/storefront-pdp/",
            "@dropins/tools/": "/scripts/__dropins__/tools/",
            "@genecommerce/dropin-braintree/": "/scripts/__dropins__/dropin-braintree/"
        }
    }
</script>
```

Save the file and this step will be complete.
