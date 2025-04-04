import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['**/*.{js,ts}'],
  extends: [
    // Order dependent - apply ESLint, then TSLint and then Prettier rules
    eslint.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.stylistic,
    jsdoc.configs['flat/recommended-typescript'],
    eslintPluginPrettierRecommended,
    eslintConfigPrettier // Drops conflicting rules
  ],
  rules: {
    '@typescript-eslint/no-require-imports': 'error',
    'eol-last': ['error', 'always'],
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    'max-len': ['warn', { code: 120, comments: 120, ignoreUrls: true }],
    'no-console': 'warn',
    'no-debugger': 'warn',
    quotes: ['error', 'single'],
    semi: ['error', 'always']
  }
  // TODO Check if Jest test overrides are still required
});
