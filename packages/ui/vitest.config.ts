import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import type { BrowserCommand } from 'vitest/node'

// Changes the system appearance the page sees, as switching it in the operating system does: the page's
// `prefers-color-scheme` changes and its media query lists fire `change`.
const setColorScheme: BrowserCommand<[scheme: 'light' | 'dark']> = async ({ page }, scheme) => {
  await page.emulateMedia({ colorScheme: scheme })
}

export default defineConfig({
  test: {
    projects: [
      {
        // What runs in Node, such as the package as it is published
        test: {
          name: 'package',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
        },
      },
      {
        // What runs in a page — the apply function and the ThemeProvider — in a real browser
        optimizeDeps: { include: ['react', 'react/jsx-dev-runtime', 'react-dom/client'] },
        test: {
          name: 'browser',
          include: ['tests/**/*.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            commands: { setColorScheme },
          },
        },
      },
    ],
  },
})
