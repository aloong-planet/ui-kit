// package::CON-003: the package ships no precompiled CSS for the components; their styles exist only once the
// consumer's Tailwind CSS v4 compiles them. The build under test is the package's own (its tsdown config), run
// into a fresh directory, so these tests never read an earlier build's output.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, expect, test } from 'vitest'

const packageDir = fileURLToPath(new URL('..', import.meta.url))
let outDir = ''

beforeAll(() => {
  outDir = mkdtempSync(join(tmpdir(), 'ui-kit-build-'))
  execFileSync('pnpm', ['exec', 'tsdown', '--out-dir', outDir], { cwd: packageDir, stdio: 'pipe' })
}, 60_000)

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true })
})

test('the only stylesheet in the build output is theme.css', () => {
  const files = readdirSync(outDir, { recursive: true, encoding: 'utf8' })
  expect(files.length).toBeGreaterThan(0)
  expect(files.filter((file) => file.endsWith('.css'))).toEqual(['theme.css'])
})

test('theme.css ships exactly as written, uncompiled', () => {
  const shipped = readFileSync(join(outDir, 'theme.css'), 'utf8')
  const written = readFileSync(join(packageDir, 'src', 'theme.css'), 'utf8')
  expect(shipped).toBe(written)
})
