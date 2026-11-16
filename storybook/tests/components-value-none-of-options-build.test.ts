// components::REQ-016/AC-04: the development warnings of the select, the segmented control and the tabs for a value none
// of their options are left out of an app's production build. The kit is bundled from support/value-warning-entry.ts as
// an app's build bundles it: from this consumer project, through the kit's `exports`, with Vite's app build, since its
// library mode leaves `process.env` for its own consumers. `process.env.NODE_ENV` is defined as an app's build defines
// it: Vitest sets it to `test` in this process, which Vite's build would otherwise take. The same app built in
// development mode, which holds the warnings, shows that the search reads the code the warnings would be in.
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { expect, test } from 'vitest'

// The text of the three warnings
const warnings = [
  'is none of its',
  'so no option shows as selected',
  'so no segment shows as selected',
  'so no tab shows as selected and no panel shows',
]

async function bundleApp(mode: 'production' | 'development'): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    root: fileURLToPath(new URL('..', import.meta.url)),
    mode,
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    build: {
      write: false,
      rolldownOptions: { input: fileURLToPath(new URL('support/value-warning-entry.ts', import.meta.url)) },
    },
  })
  const outputs = Array.isArray(result) ? result : [result]
  const chunks = outputs
    .flatMap((output) => ('output' in output ? output.output : []))
    .filter((file) => file.type === 'chunk')
  if (chunks.length === 0) throw new Error('no chunk')
  return chunks.map((chunk) => chunk.code).join('\n')
}

test("an app's production build holds none of the warnings' text, which its development build holds", async () => {
  const [production, development] = await Promise.all([bundleApp('production'), bundleApp('development')])
  const found = (code: string) => warnings.filter((warning) => code.includes(warning))
  expect({ production: found(production), development: found(development) }).toEqual({
    production: [],
    development: warnings,
  })
})
