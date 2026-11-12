// components::REQ-015/AC-02: each value of the toolbar's theme and mode reaches the root element through the
// ThemeProvider every story renders in. A story's `globals` set the toolbar values it opens with. These stories show
// no kit component, so they are hidden from the sidebar (`!dev`) and run only as tests.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import preview from '../.storybook/preview'

const meta = {
  title: 'Storybook/Toolbar',
  tags: ['!dev'],
  render: () => <div />,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const root = document.documentElement

export const OffersEveryThemeAndMode: Story = {
  play: async () => {
    const values = (name: string) =>
      (preview.globalTypes?.[name]?.toolbar?.items as { value: string }[] | undefined)?.map((item) => item.value)
    await expect(values('theme')).toEqual(['purple', 'blue', 'amber'])
    await expect(values('mode')).toEqual(['system', 'light', 'dark'])
  },
}

export const BlueAndDark: Story = {
  globals: { theme: 'blue', mode: 'dark' },
  play: async () => {
    await expect(root.getAttribute('data-theme')).toBe('blue')
    await expect(root.classList.contains('dark')).toBe(true)
  },
}

export const AmberAndLight: Story = {
  globals: { theme: 'amber', mode: 'light' },
  play: async () => {
    await expect(root.getAttribute('data-theme')).toBe('amber')
    await expect(root.classList.contains('dark')).toBe(false)
  },
}

export const PurpleAndSystem: Story = {
  globals: { theme: 'purple', mode: 'system' },
  play: async () => {
    await expect(root.getAttribute('data-theme')).toBe('purple')
    await expect(root.classList.contains('dark')).toBe(window.matchMedia('(prefers-color-scheme: dark)').matches)
  },
}
