// theming::REQ-007/AC-01: called from a script in a page's <head>, the apply function writes the final theme and
// light/dark on the root element before the body is parsed, so the first frame the browser paints already shows
// them. The page loads the function as a consumer's build bundles it (support/bundle-apply-theme.ts), in a browser
// whose system appearance is dark.
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { bundleApplyTheme } from './support/bundle-apply-theme'

let browser: Browser | undefined
let script = ''

beforeAll(async () => {
  script = (await bundleApplyTheme()).code
  browser = await chromium.launch()
}, 60_000)

afterAll(async () => {
  await browser?.close()
})

test('a head script calling the apply function sets the theme and light/dark before the body is parsed', async () => {
  if (!browser) throw new Error('no browser')
  const context = await browser.newContext({ colorScheme: 'dark' })
  const page = await context.newPage()
  await page.setContent(`<!doctype html>
<html>
  <head>
    <script>${script}</script>
    <script>KitTheme.applyTheme('blue', 'system')</script>
  </head>
  <body>
    <script>
      const root = document.documentElement
      window.rootAtBody = { theme: root.getAttribute('data-theme'), dark: root.classList.contains('dark') }
    </script>
  </body>
</html>`)
  await expect(page.evaluate(() => (window as unknown as { rootAtBody: unknown }).rootAtBody)).resolves.toEqual({
    theme: 'blue',
    dark: true,
  })
  await context.close()
})
