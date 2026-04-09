import globals from 'globals';
import jsPlugin from '@eslint/js';
import tsPlugin from 'typescript-eslint';
import prettierOverrides from 'eslint-config-prettier/flat';
import prettierRules from 'eslint-plugin-prettier/recommended';
import angularPlugin from '@angular-eslint/eslint-plugin';

export default tsPlugin.config(
  {
    name: 'globally/ignored',
    ignores: [
      '**/dist/',
      '**/coverage/',
      '**/node_modules/',
      '**/build/',
      '**/.angular/',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
    ],
  },
  jsPlugin.configs.recommended,
  ...tsPlugin.configs.recommended,
  prettierOverrides,
  prettierRules,
  {
    name: 'api/source',
    files: ['packages/api/src/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    name: 'web/source',
    files: ['packages/web/src/**/*.ts'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      '@angular-eslint': angularPlugin,
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    name: 'tests/all',
    files: ['**/*.spec.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  }
);
