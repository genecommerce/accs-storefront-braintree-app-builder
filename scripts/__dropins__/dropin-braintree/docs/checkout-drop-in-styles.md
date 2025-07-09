
## Integrate with checkout drop-in styles

### Step 1 - Styles

Modify the following file:

```bash
./blocks/commerce-checkout/commerce-checkout.css
```

Add the following at the top of the file:

```css
@import url('/scripts/__dropins__/dropin-braintree/src/braintree.css');
```
