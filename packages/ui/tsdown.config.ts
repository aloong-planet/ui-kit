import { defineConfig } from 'tsdown'

// The three entry points of package::REQ-001. theme.css is copied as written: the consumer's Tailwind CSS v4
// compiles it (package::CON-003).
export default defineConfig({
  entry: ['src/index.ts', 'src/apply-theme.ts'],
  dts: true,
  copy: ['src/theme.css'],
})
