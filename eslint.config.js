// import js from '@eslint/js'
// import { defineConfig } from 'eslint/config'
// import eslintConfigPrettier from 'eslint-config-prettier/flat'
// import simpleImportSort from 'eslint-plugin-simple-import-sort'
// import globals from 'globals'
// import tseslint from 'typescript-eslint'

// export default defineConfig([
//   {
//     files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
//     plugins: { js },
//     extends: ['js/recommended'],
//     languageOptions: {
//       globals: globals.node,
//     },
//     rules: {
//       semi: ['error', 'never'],
//     },
//   },

//   ...tseslint.configs.recommended,

//   {
//     files: ['**/*.{ts,tsx}'],
//     rules: {
//       '@typescript-eslint/semi': ['error', 'never'],
//     },
//   },

//   eslintConfigPrettier,

//   {
//     plugins: {
//       'simple-import-sort': simpleImportSort,
//     },
//     rules: {
//       'simple-import-sort/imports': 'error',
//       'simple-import-sort/exports': 'error',
//     },
//   },
// ])

import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', 'src/generated/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      semi: ['error', 'never'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  eslintConfigPrettier,
])
