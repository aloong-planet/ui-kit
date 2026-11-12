// The package as it is published. The package's own build (its tsdown config) runs once, into a fresh directory
// that holds a copy of package.json beside the build output in `dist`, as the package directory does; so these
// tests never read an earlier build.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'postcss'
import { afterAll, beforeAll, expect, test } from 'vitest'

const packageDir = fileURLToPath(new URL('..', import.meta.url))
let workDir = ''
let publishedDir = ''
let distDir = ''

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'ui-kit-package-'))
  publishedDir = join(workDir, 'package')
  distDir = join(publishedDir, 'dist')
  mkdirSync(publishedDir)
  copyFileSync(join(packageDir, 'package.json'), join(publishedDir, 'package.json'))
  execFileSync('pnpm', ['exec', 'tsdown', '--out-dir', distDir], { cwd: packageDir, stdio: 'pipe' })
}, 60_000)

afterAll(() => {
  if (workDir) rmSync(workDir, { recursive: true, force: true })
})

// Every string an `exports` entry maps to, under any condition, without its leading `./`
function exportTargets(exports: unknown): string[] {
  if (typeof exports === 'string') return [exports.replace(/^\.\//, '')]
  if (exports && typeof exports === 'object') return Object.values(exports).flatMap(exportTargets)
  return []
}

// package::REQ-001/AC-01 for a consumer that installs the package: it receives only the files the package
// publishes (`files` in package.json), so every file an entry point resolves to, its types included, must be
// among them.
test('the published package carries every file its entry points resolve to', () => {
  execFileSync('pnpm', ['pack', '--pack-destination', workDir], { cwd: publishedDir, stdio: 'pipe' })
  const tarballs = readdirSync(workDir).filter((file) => file.endsWith('.tgz'))
  expect(tarballs).toHaveLength(1)
  const published = execFileSync('tar', ['-tzf', join(workDir, tarballs[0])], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//, ''))
  const manifest = JSON.parse(readFileSync(join(publishedDir, 'package.json'), 'utf8')) as { exports: unknown }
  const targets = exportTargets(manifest.exports)
  expect(targets.length).toBeGreaterThan(0)
  expect(targets.filter((target) => !published.includes(target))).toEqual([])
})

// package::CON-003: the package ships no precompiled CSS for the components; their styles exist only once the
// consumer's Tailwind CSS v4 compiles them.
test('the only stylesheet in the build output is theme.css', () => {
  const files = readdirSync(distDir, { recursive: true, encoding: 'utf8' })
  expect(files.length).toBeGreaterThan(0)
  expect(files.filter((file) => file.endsWith('.css'))).toEqual(['theme.css'])
})

test('theme.css ships exactly as written, uncompiled', () => {
  const shipped = readFileSync(join(distDir, 'theme.css'), 'utf8')
  const written = readFileSync(join(packageDir, 'src', 'theme.css'), 'utf8')
  expect(shipped).toBe(written)
})

// A rule for a class is a utility or a component style, except for the class that switches light/dark
// (theming::REQ-003). Attribute selectors and quoted strings are removed first, so that a dot inside them
// (`[data-x="a.b"]`) is not read as a class.
const themeClasses = ['dark']

test('theme.css holds no rule for a utility or component class', () => {
  const classes: string[] = []
  parse(readFileSync(join(distDir, 'theme.css'), 'utf8')).walkRules((rule) => {
    const selector = rule.selector.replace(/(["']).*?\1/g, '').replace(/\[[^\]]*\]/g, '')
    for (const [, name] of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.push(name)
  })
  expect(classes.filter((name) => !themeClasses.includes(name))).toEqual([])
})
export const gateProbe: number = 'not a number'
