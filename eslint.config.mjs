import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
  },
  // Backend: CommonJS Node.js
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
    },
  },
  // Backend test files: add Jest globals
  {
    files: ['backend/tests/**/*.test.js', 'backend/tests/**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  // Frontend: ESM + JSX + React
  {
    files: ['frontend/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Frontend test files: add Vitest globals
  {
    files: [
      'frontend/**/*.test.{js,jsx}',
      'frontend/**/*.spec.{js,jsx}',
      'frontend/tests/**/*.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
];
