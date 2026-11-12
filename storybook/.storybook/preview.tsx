import { ThemeProvider, type Mode, type Theme } from '@aloong-planet/ui'
import type { Preview } from '@storybook/react-vite'

import '../src/styles.css'

const preview: Preview = {
  // components::REQ-015/AC-02: the toolbar switches the theme and the mode, and every story renders inside the
  // ThemeProvider they select, as the pages of an app do
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        dynamicTitle: true,
        items: [
          { value: 'purple', title: 'Purple' },
          { value: 'blue', title: 'Blue' },
          { value: 'amber', title: 'Amber' },
        ],
      },
    },
    mode: {
      description: 'Light or dark',
      toolbar: {
        title: 'Mode',
        dynamicTitle: true,
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  initialGlobals: { theme: 'purple', mode: 'system' },
  decorators: [
    (Story, { globals }) => (
      <ThemeProvider theme={globals.theme as Theme} mode={globals.mode as Mode}>
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default preview
