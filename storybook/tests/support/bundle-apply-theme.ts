// Bundles apply-theme-entry.ts the way a consumer's build does: from this consumer project, through the kit's
// `exports`, with nothing left external, into one classic script that sets the global `KitTheme`. Shared by
// package.test.ts and theming.test.ts.
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

export interface Bundle {
  code: string
  moduleIds: string[]
}

export async function bundleApplyTheme(): Promise<Bundle> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    root: fileURLToPath(new URL('../..', import.meta.url)),
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('apply-theme-entry.ts', import.meta.url)),
        formats: ['iife'],
        name: 'KitTheme',
      },
    },
  })
  const outputs = Array.isArray(result) ? result : [result]
  const chunks = outputs
    .flatMap((output) => ('output' in output ? output.output : []))
    .filter((file) => file.type === 'chunk')
  if (chunks.length !== 1) throw new Error(`expected one chunk, got ${chunks.length}`)
  return { code: chunks[0].code, moduleIds: chunks[0].moduleIds }
}
