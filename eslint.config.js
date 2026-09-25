// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  // Unit-Tests: Jest stellt describe, test und expect global zur Verfügung
  {
    files: ["**/__tests__/**/*.js"],
    languageOptions: {
      globals: { describe: "readonly", test: "readonly", expect: "readonly" },
    },
  },
]);
