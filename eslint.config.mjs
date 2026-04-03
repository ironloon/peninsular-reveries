import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  {
    ignores: [
      '.dev-client/**',
      '.playwright-build-check/**',
      'dist/**',
      'gen-og-image.cjs',
      'node_modules/**',
      'playwright-report/**',
      'public/sw.js',
      'test-results/**',
      'super-word/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'app/**/*.{ts,tsx}',
      'client/**/*.{ts,tsx}',
      'scripts/**/*.mjs',
      'tests/**/*.ts',
      'build.ts',
      'server.ts',
      'playwright.config.ts',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]