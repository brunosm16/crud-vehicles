import globals from 'globals';
import jsPlugin from '@eslint/js';
import tsPlugin from 'typescript-eslint';
import prettierOverrides from 'eslint-config-prettier/flat';
import prettierRules from 'eslint-plugin-prettier/recommended';
import allowedDepsPlugin from 'eslint-plugin-allowed-dependencies';

export default tsPlugin.config(
  {
    languageOptions: { globals: globals.node },
    plugins: {
      allowed: allowedDepsPlugin,
    },
  },
  jsPlugin.configs.recommended,
  tsPlugin.configs.recommended,
  prettierOverrides,
  prettierRules,
  {
    name: 'globally/ignored',
    ignores: [
      '**/dist/',
      '**/coverage/',
      '**/node_modules/',
      '**/build/',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
    ],
  },
  {
    name: 'source/all',
    files: ['**/src/*.ts'],
  },
  {
    name: 'tests/all',
    files: ['**/tests/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  }
);
