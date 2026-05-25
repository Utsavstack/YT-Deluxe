/**
 * ESLint Configuration for YT-Deluxe Frontend
 *
 * This config tells ESLint how to properly parse JSX files in a Vite + React
 * project. Without it, ESLint defaults to plain JS parsing and flags every
 * JSX angle bracket as "Unexpected token <".
 *
 * It also declares the browser environment so that globals like localStorage,
 * sessionStorage, FormData, Notification, IntersectionObserver etc. are
 * recognized as valid built-in APIs.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Allow unused vars that start with _ (common pattern for intentionally ignored values)
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Vite handles React imports via automatic JSX transform
    'react/react-in-jsx-scope': 'off',
  },
  // Ignore build output and dependencies
  ignorePatterns: ['build/**', 'node_modules/**', 'public/**'],
};
