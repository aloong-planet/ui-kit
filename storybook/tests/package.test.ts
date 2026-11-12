// package::REQ-001: the package's entry points, imported by a consumer project. This package is that consumer: it
// installs the kit as a workspace dependency, so `@aloong-planet/ui` resolves through the kit's built `exports`.
// Each import runs in its own Node process started in this directory, so it resolves as Node does for an app.
// The stylesheet entry is imported by Tailwind CSS, not by Node: stories/package.stories.tsx covers it, through
// src/styles.css. The workspace link points at the kit's directory, so whether the published package carries the
// files the entry points resolve to is tested in the kit's own tests (packages/ui/tests/package.test.ts).
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { bundleApplyTheme } from './support/bundle-apply-theme'

const consumerDir = fileURLToPath(new URL('..', import.meta.url))

function importInConsumer(specifier: string): string {
  const source = `await import(${JSON.stringify(specifier)}); console.log('imported')`
  return execFileSync(process.execPath, ['--input-type=module', '--eval', source], {
    cwd: consumerDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

test.each(['@aloong-planet/ui', '@aloong-planet/ui/apply-theme'])(
  'a consumer imports the %s entry point',
  (specifier) => {
    expect(importInConsumer(specifier)).toBe('imported')
  },
)

test('a consumer cannot import a path the entry point table does not list', () => {
  expect(() => importInConsumer('@aloong-planet/ui/dist/index.mjs')).toThrow(/ERR_PACKAGE_PATH_NOT_EXPORTED/)
})

// package::REQ-001/AC-02: the bundle a consumer builds from the apply-theme entry point alone holds the kit's function
// and no React, so it can run before React loads
test('a bundle that imports only the apply-theme entry point holds no React code', async () => {
  const { code, moduleIds } = await bundleApplyTheme()
  expect(code).toContain('function applyTheme')
  expect(moduleIds.filter((id) => /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))).toEqual([])
})
