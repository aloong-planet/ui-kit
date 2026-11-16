// components::REQ-003 and the shared states of components::REQ-001 on the SearchBox, in a consumer of the kit. The owner
// confirms the SearchBox's look on these stories, switching the theme and light/dark with the toolbar
// (components::CON-002). Its focus and the absence of a clear button under a real pointer are checked in
// tests/components-search-box.test.tsx, since a play function's events do not make the browser apply `:focus` the way
// a person's do, nor reach the controls the browser draws inside a field.
import { SearchBox } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { computed } from './support/computed'

const meta = {
  title: 'Components/Search box',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

// The placeholder and the accessible name differ, so that the name read is the one passed as the name and not the
// placeholder, which a browser falls back to for a field without a name
export const Default: Story = {
  render: () => <SearchBox className="w-64" placeholder="Name or path" aria-label="Search projects" />,
  // components::REQ-003/AC-03, AC-04 and package::REQ-002/AC-01: a `--card` ground, a 1px `--input` border, the
  // placeholder passed, 28px tall, so the consumer has compiled the SearchBox's classes from the package; announced as
  // a search field under the name passed
  play: async ({ canvas }) => {
    const field = canvas.getByRole('searchbox', { name: 'Search projects' })
    const style = getComputedStyle(field)
    await expect({
      ground: style.backgroundColor,
      border: [style.borderTopWidth, style.borderTopColor],
      placeholder: field.getAttribute('placeholder'),
      height: field.getBoundingClientRect().height,
    }).toEqual({
      ground: computed('color', 'var(--card)'),
      border: ['1px', computed('color', 'var(--input)')],
      placeholder: 'Name or path',
      height: 28,
    })
    // components::REQ-003/AC-01: the 13px icon sits inside the field, 9px from its leading edge and centred on its
    // height, and the text typed starts at the field's content box, 28px from its leading edge, after the icon
    const icon = canvas.getByRole('searchbox').parentElement?.querySelector('svg')
    if (!icon) throw new Error('no icon')
    const box = field.getBoundingClientRect()
    const iconRect = icon.getBoundingClientRect()
    await expect({
      icon: {
        left: iconRect.left - box.left,
        width: iconRect.width,
        height: iconRect.height,
        middle: iconRect.top + iconRect.height / 2 - (box.top + box.height / 2),
      },
      textStart: parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
    }).toEqual({ icon: { left: 9, width: 13, height: 13, middle: 0 }, textStart: 28 })
  },
}

// components::REQ-001/AC-02: a disabled search box, holding a value, shows its muted look, its icon included
export const Disabled: Story = {
  render: () => (
    <SearchBox className="w-64" placeholder="Name or path" aria-label="Search projects" defaultValue="agent" disabled />
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('searchbox', { name: 'Search projects' })
    const box = field.parentElement
    if (!box?.contains(field.parentElement?.querySelector('svg') ?? null)) throw new Error('no box around the icon')
    await expect({ disabled: (field as HTMLInputElement).disabled, opacity: getComputedStyle(box).opacity }).toEqual({
      disabled: true,
      opacity: '0.45',
    })
  },
}
