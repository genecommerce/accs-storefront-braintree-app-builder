module.exports = {
  extends: 'airbnb-base',
  root: true,
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'import/no-relative-packages': [0],
    'import/no-unresolved': [0],
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    'no-use-before-define': [2, { functions: false }],
    'no-console': [
      'error',
      {
        allow: ['warn', 'error', 'info', 'debug'],
      },
    ],
    'no-underscore-dangle': [0],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
