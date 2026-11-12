// A check on this Storybook itself, not a kit component, so it is hidden from the sidebar (`!dev`) and runs only as
// a test. It passes when a story renders with the consumer stylesheet (../src/styles.css) in effect: Tailwind CSS
// compiled the utilities, and the stylesheet's import of `@aloong-planet/ui/theme.css` resolved, without which the
// stylesheet fails to compile (package::REQ-001/AC-01 for the stylesheet entry point).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

const meta = {
  title: 'Setup/Consumer stylesheet',
  tags: ['!dev'],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CompilesTailwindUtilities: Story = {
  render: () => <div data-testid="probe" className="w-[123px]" />,
  play: async ({ canvas }) => {
    const probe = await canvas.findByTestId('probe')
    await expect(getComputedStyle(probe).width).toBe('123px')
  },
}
