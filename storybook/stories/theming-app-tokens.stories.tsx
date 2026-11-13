// theming::REQ-009/AC-01: a token an app declares on the root contract (the fixture in theming-app-tokens.css) changes
// with the theme and with light/dark as the general tokens do. The root is written here by the apply function; the
// ThemeProvider leaves the root in the same state for every input (packages/ui/tests/theming.test.tsx). The story
// shows no kit component, so it is hidden from the sidebar (`!dev`) and runs only as a test.
import { applyTheme } from '@aloong-planet/ui/apply-theme'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import './theming-app-tokens.css'

const meta = {
  title: 'Theming/App tokens',
  tags: ['!dev'],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const FollowsThemeAndLightDark: Story = {
  render: () => <div data-testid="probe" style={{ color: 'var(--fixture-app-token)' }} />,
  play: async ({ canvas }) => {
    const probe = await canvas.findByTestId('probe')
    const expected = [
      ['purple', 'light', 'rgb(1, 0, 0)'],
      ['blue', 'light', 'rgb(2, 0, 0)'],
      ['amber', 'light', 'rgb(3, 0, 0)'],
      ['purple', 'dark', 'rgb(4, 0, 0)'],
      ['blue', 'dark', 'rgb(5, 0, 0)'],
      ['amber', 'dark', 'rgb(6, 0, 0)'],
    ] as const
    for (const [theme, mode, colour] of expected) {
      applyTheme(theme, mode)
      await expect(getComputedStyle(probe).color, `${theme} ${mode}`).toBe(colour)
    }
  },
}
