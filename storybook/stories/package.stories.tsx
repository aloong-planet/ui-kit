// package::REQ-001/AC-01 for the stylesheet entry point: the consumer stylesheet (../src/styles.css) imports
// `@aloong-planet/ui/theme.css`, and without that entry point it fails to compile, so this file fails to load. The
// width checks that the compiled stylesheet is in effect. It shows no kit component, so it is hidden from the
// sidebar (`!dev`) and runs only as a test.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

const meta = {
  title: 'Package/Stylesheet entry point',
  tags: ['!dev'],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CompilesWithTheEntryPointImported: Story = {
  render: () => <div data-testid="probe" className="w-[123px]" />,
  play: async ({ canvas }) => {
    const probe = await canvas.findByTestId('probe')
    await expect(getComputedStyle(probe).width).toBe('123px')
  },
}
