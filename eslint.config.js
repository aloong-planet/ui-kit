// @ts-check
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  // ESLint does not read .gitignore itself; what git ignores (dependencies, build output) is not linted
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url)), { gitignoreResolution: true }),
  // Documentation only
  { ignores: ['docs/**'] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['packages/ui/src/**/*.{ts,tsx}', 'storybook/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
  // components::CON-001: a component writes no text of its own; what it shows or announces comes from its props. The rule
  // rejects text written as a JSX child and any string written as an attribute value, so a value that is not text (a
  // class list, a slot name) is written as an expression.
  {
    files: ['packages/ui/src/components/**/*.tsx'],
    plugins: { react },
    rules: { 'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: false, noAttributeStrings: true }] },
  },
  // Plain JavaScript that belongs to no tsconfig: no type information, so no type-aware rules
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  // These two files are the github-ops skill's CI routing assets, which must stay identical to the skill's copies
  // except for comments, so their code cannot be changed here. Retire each entry once the skill's asset passes the
  // rule and is copied in again.
  {
    files: ['.github/ci/ci-gate.mjs'],
    rules: { 'preserve-caught-error': 'off' },
  },
  {
    files: ['.github/ci/ci-routing.test.mjs'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
)
