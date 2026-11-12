// Vitest global setup: builds the kit once before any test of this consumer runs. The tests read the kit's build
// output through its `exports`, so without this they could pass or fail against an earlier build.
import { execFileSync } from 'node:child_process'

export default function buildKit(): void {
  execFileSync('pnpm', ['--filter', '@aloong-planet/ui', 'build'], { stdio: 'pipe' })
}
