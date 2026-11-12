import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globalSetup: ['./tests/build-kit.ts'],
    projects: [
      {
        // Package checks that run in Node, against the built kit as a consumer installs it
        test: {
          name: 'consumer',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
        },
      },
      {
        // Every story runs as a test in a real browser
        extends: true,
        plugins: [storybookTest({ configDir: `${import.meta.dirname}/.storybook` })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
