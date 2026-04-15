import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['coverage/**', 'infra/**', 'node_modules/**', 'terragrunt/**']
  },
  {
    files: ['**/*.{js,ts}'],
    extends: [
      // Extensions are order dependent - always apply Prettier last
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      jsdoc.configs['flat/recommended-typescript'],
      eslintPluginPrettierRecommended,
      eslintConfigPrettier // Drops conflicting rules
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: { tsdoc },
    rules: {
      '@typescript-eslint/no-require-imports': 'error',
      'eol-last': ['error', 'always'],
      'jsdoc/check-param-names': 'off', // Collides with TSDoc formatting
      'jsdoc/require-param': 'off', // Collides with TSDoc formatting
      'jsdoc/require-throws-type': 'off', // Collides with TSDoc formatting
      'linebreak-style': ['error', 'unix'],
      'max-len': ['warn', { code: 120, comments: 120, ignoreUrls: true }],
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'tsdoc/syntax': 'warn'
    }
  }
);
