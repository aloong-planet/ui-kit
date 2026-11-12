// theming::REQ-007/AC-01: called before the first render, the apply function writes the final theme and light/dark on
// the root element before anything on the page is parsed past it, so the first frame the browser paints already shows
// them. It is called from a script in the page's <head>, and from a script that runs as the document is created,
// before it has a root element, as an Electron preload script does (Playwright's init scripts run at that point in
// Chromium). The page loads the function as a consumer's build bundles it (support/bundle-apply-theme.ts), in a
// browser whose system appearance is dark. An Electron preload itself is not run here: Electron is not a dependency.
// Not driven: a document that gains another node (a doctype, a comment) in a step of its own before its root element,
// when the function goes on waiting; the parser inserts the doctype and the root element of these pages in one step.
import { chromium, type Browser, type Page } from 'playwright'
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

// A script that records the root element as it is when the parser reaches the script
const recordRoot = `<script>
  const root = document.documentElement
  window.rootSeen = { theme: root.getAttribute('data-theme'), dark: root.classList.contains('dark') }
</script>`

async function darkPage(): Promise<Page> {
  if (!browser) throw new Error('no browser')
  const context = await browser.newContext({ colorScheme: 'dark' })
  return context.newPage()
}

const rootSeen = (page: Page) =>
  page.evaluate(() => (window as unknown as { rootSeen: unknown }).rootSeen)

test('a head script calling the apply function sets the theme and light/dark before the body is parsed', async () => {
  const page = await darkPage()
  await page.setContent(`<!doctype html>
<html>
  <head>
    <script>${script}</script>
    <script>KitTheme.applyTheme('blue', 'system')</script>
  </head>
  <body>
    ${recordRoot}
  </body>
</html>`)
  await expect(rootSeen(page)).resolves.toEqual({ theme: 'blue', dark: true })
  await page.context().close()
})

const beforeTheRoot =
  'called before the document has a root element, the apply function sets the theme and light/dark before the page ' +
  'runs its first script'

test(beforeTheRoot, async () => {
  const page = await darkPage()
  await page.addInitScript(`${script}
window.hadNoRoot = document.documentElement === null
KitTheme.applyTheme('amber', 'system')`)
  await page.route('http://kit.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head>${recordRoot}</head><body></body></html>`,
    }),
  )
  await page.goto('http://kit.test/')
  await expect(page.evaluate(() => (window as unknown as { hadNoRoot: boolean }).hadNoRoot)).resolves.toBe(true)
  await expect(rootSeen(page)).resolves.toEqual({ theme: 'amber', dark: true })
  await page.context().close()
})
