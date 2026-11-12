// theming::REQ-010: the scrollbar theme.css draws for every scrolling area, measured in Chromium. The hover shade, the
// macOS scrollbar settings and Firefox's own scrollbar are checked by eye on `OverflowingBothWays`; the stories tagged
// `!dev` are hidden from the sidebar and run only as tests.
import { applyTheme } from '@aloong-planet/ui/apply-theme'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

const meta = {
  title: 'Theming/Scrollbars',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const rows = Array.from({ length: 24 }, (_, i) => `Row ${i + 1}: a line long enough to run past the area's right edge`)

// A scrolling area with no border, so that its offset size less its client size is the scrollbar's size
function Area({ content }: { content: string[] }) {
  return (
    <div className="inline-block rounded-md border border-border-strong bg-card">
      <div data-area className="h-48 w-80 overflow-auto">
        {content.map((row) => (
          <div key={row} className="border-b border-border px-3 py-2 text-sm whitespace-nowrap">
            {row}
          </div>
        ))}
      </div>
    </div>
  )
}

function area(canvas: HTMLElement): HTMLElement {
  const element = canvas.querySelector<HTMLElement>('[data-area]')
  if (!element) throw new Error('no scrolling area')
  return element
}

// theming::REQ-010/AC-01, AC-03: an area overflowing both ways shows a 6px vertical and a 6px horizontal scrollbar
// before anything scrolls, and the thumb has rounded ends
export const OverflowingBothWays: Story = {
  render: () => <Area content={rows} />,
  play: async ({ canvasElement }) => {
    const scroller = area(canvasElement)
    await expect(scroller.scrollTop + scroller.scrollLeft).toBe(0)
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)
    await expect(scroller.offsetWidth - scroller.clientWidth).toBe(6)
    await expect(scroller.offsetHeight - scroller.clientHeight).toBe(6)
    await expect(getComputedStyle(scroller, '::-webkit-scrollbar-thumb').borderRadius).toBe('3px')
  },
}

// theming::REQ-010/AC-03: an area whose content fits shows no scrollbar
export const FittingContent: Story = {
  tags: ['!dev'],
  render: () => <Area content={rows.slice(0, 2).map((row) => row.slice(0, 12))} />,
  play: async ({ canvasElement }) => {
    const scroller = area(canvasElement)
    await expect(scroller.scrollHeight).toBe(scroller.clientHeight)
    await expect(scroller.offsetWidth - scroller.clientWidth).toBe(0)
    await expect(scroller.offsetHeight - scroller.clientHeight).toBe(0)
  },
}

// theming::REQ-010/AC-04: the thumb is a neutral grey that follows light/dark and not the theme
export const ThumbColour: Story = {
  tags: ['!dev'],
  render: () => <Area content={rows} />,
  play: async ({ canvasElement }) => {
    const scroller = area(canvasElement)
    const thumb = () => getComputedStyle(scroller, '::-webkit-scrollbar-thumb').backgroundColor
    for (const theme of ['purple', 'blue', 'amber'] as const) {
      applyTheme(theme, 'light')
      await expect(thumb()).toBe('rgba(0, 0, 0, 0.25)')
      applyTheme(theme, 'dark')
      await expect(thumb()).toBe('rgba(255, 255, 255, 0.22)')
    }
  },
}
