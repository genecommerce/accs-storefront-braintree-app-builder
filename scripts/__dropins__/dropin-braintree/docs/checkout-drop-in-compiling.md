
## Compilation

Currently the EDS Storefront only allows for drop-ins that use the `@dropins` namespace which this Braintree drop-in does not so by default you will not get any of the Braintree files to load.

#### Step 1 - Compilation

Modify the following file:

```bash
./postinstall.js
```

Within this file you will see that it loads files from `node_modules/@dropins` to move them across to the `scripts` folder:

```javascript
// Copy specified files from node_modules/@dropins to scripts/__dropins__
fs.readdirSync('node_modules/@dropins', { withFileTypes: true }).forEach((file) => {
  // Skip if package is not in package.json dependencies / skip devDependencies
  if (!dependencies[`@dropins/${file.name}`]) {
    return;
  }

  // Skip if is not folder
  if (!file.isDirectory()) {
    return;
  }
  fs.cpSync(path.join('node_modules', '@dropins', file.name), path.join(dropinsDir, file.name), {
    recursive: true,
    filter: (src) => (!src.endsWith('package.json')),
  });
});
```

Directly below this section add the following:

```javascript
// Copy specified files from node_modules/@dropins to scripts/__dropins__
fs.readdirSync('node_modules/@genecommerce', { withFileTypes: true }).forEach((file) => {
  // Skip if package is not in package.json dependencies / skip devDependencies
  if (!dependencies[`@genecommerce/${file.name}`]) {
    return;
  }

  // Skip if is not folder
  if (!file.isDirectory()) {
    return;
  }
  fs.cpSync(path.join('node_modules', '@genecommerce', file.name), path.join(dropinsDir, file.name), {
    recursive: true,
    filter: (src) => (!src.endsWith('package.json')),
  });
});
```

