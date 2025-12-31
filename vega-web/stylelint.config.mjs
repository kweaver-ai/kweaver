/** @type {import("stylelint").Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-standard-less', 'stylelint-config-recess-order'],
  plugins: ['stylelint-less'],
  rules: {
    'selector-class-pattern': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'no-descending-specificity': null,
    'less/no-duplicate-variables': null,
    'font-family-no-missing-generic-family-keyword': null,
  },
  ignoreFiles: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', 'public/**', 'src/assets/**'],
};
