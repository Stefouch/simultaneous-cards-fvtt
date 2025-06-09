import { defineConfig } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([{
  ignores: [
    '.github',
    'dist/**',
    'node_modules',
    'static/lib',
    'foundry.js',
    'eslint.config.mjs',
  ],

  extends: compat.extends(
    'eslint:recommended',
    'jquery',
    '@typhonjs-fvtt/eslint-config-foundry.js/0.8.0',
    'prettier',
  ),

  plugins: {
    prettier,
  },

  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.jquery,
      ...globals.node,
    },

    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  rules: {
    'arrow-parens': ['error', 'as-needed'],

    'brace-style': ['error', 'stroustrup', {
      allowSingleLine: true,
    }],

    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': 'error',
    'comma-style': 'error',
    curly: ['error', 'multi-line'],
    'dot-location': ['error', 'property'],
    eqeqeq: 0,
    'handle-callback-err': 'off',

    indent: ['error', 2, {
      SwitchCase: 1,
    }],

    'linebreak-style': ['error', 'unix'],

    'max-len': ['error', {
      code: 120,
      ignoreUrls: true,
    }],

    'max-nested-callbacks': ['error', {
      max: 4,
    }],

    'max-statements-per-line': ['error', {
      max: 2,
    }],

    'no-console': 'off',
    'no-empty-function': 'warn',
    'no-floating-decimal': 'error',
    'no-inline-comments': 'off',
    'no-lonely-if': 'error',
    'no-multi-spaces': 'error',

    'no-multiple-empty-lines': ['error', {
      max: 2,
      maxEOF: 1,
      maxBOF: 0,
    }],

    'no-prototype-builtins': 'off',

    'no-shadow': ['error', {
      builtinGlobals: true,
      hoist: 'all',
      allow: ['event'],
    }],

    'no-trailing-spaces': ['error', {
      ignoreComments: true,
    }],

    'no-unreachable': 'warn',
    'no-unused-labels': 0,
    'no-unused-vars': 'warn',
    'no-var': 'error',
    'object-curly-spacing': ['error', 'always'],
    'prefer-const': 'warn',
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'space-before-blocks': 'error',

    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always',
    }],

    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'error',
    yoda: 'error',
  },
}]);
