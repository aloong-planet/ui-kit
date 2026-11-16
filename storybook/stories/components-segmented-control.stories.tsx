// components::REQ-005 and the shared states of components::REQ-001 on the SegmentedControl, in a consumer of the kit.
// The owner confirms the SegmentedControl's look on these stories, switching the theme and light/dark with the toolbar
// (components::CON-002). Its look under the pointer and under keyboard focus, and its keys, are checked with a real
// pointer and keyboard in tests/components-segmented-control.test.tsx, since a play function's events do not make the
// browser apply `:hover` or `:focus-visible`.
import { SegmentedControl } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'
import { computed } from './support/computed'

const meta = {
  title: 'Components/Segmented control',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

type Range = 'day' | 'week' | 'month'

const ranges = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const

// A segmented control as an app uses one: its value held in the app's state and changed by `onValueChange`, which the
// tests also read to see what the control reported
export const Default: StoryObj<{ onValueChange: (value: Range) => void }> = {
  args: { onValueChange: fn() },
  render: function Render({ onValueChange }) {
    const [value, setValue] = useState<Range>('week')
    return (
      <SegmentedControl
        aria-label="Range"
        options={ranges}
        value={value}
        onValueChange={(next) => {
          onValueChange(next)
          setValue(next)
        }}
      />
    )
  },
  // components::REQ-005/AC-01 at rest and AC-02, and package::REQ-002/AC-01: one group of mutually exclusive options
  // under the name passed; the selected segment shows the wash, `--accent-foreground` text and a heavier weight, the
  // others `--muted-foreground` text on no ground of their own
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Range' })
    const segments = canvas.getAllByRole('radio')
    await expect({
      inGroup: segments.every((segment) => group.contains(segment)),
      labels: segments.map((segment) => segment.textContent),
      checked: segments.map((segment) => segment.getAttribute('aria-checked')),
    }).toEqual({ inGroup: true, labels: ['Day', 'Week', 'Month'], checked: ['false', 'true', 'false'] })
    const look = (segment: HTMLElement) => {
      const style = getComputedStyle(segment)
      return { ground: style.backgroundColor, text: style.color, weight: style.fontWeight }
    }
    const unselected = { ground: computed('color', 'transparent'), text: computed('color', 'var(--muted-foreground)'), weight: '400' }
    await expect(segments.map(look)).toEqual([
      unselected,
      { ground: computed('color', 'var(--accent)'), text: computed('color', 'var(--accent-foreground)'), weight: '600' },
      unselected,
    ])
  },
}

// components::REQ-005/AC-04 and AC-03: each size is as tall as the button of its size, inside one container whose 1px
// `--border-strong` border, rounded at 7px, clips the segments at its corners
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl data-size="default" aria-label="Range" options={ranges} defaultValue="day" />
      <SegmentedControl data-size="sm" aria-label="Range" options={ranges} defaultValue="day" size="sm" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const sizes = { default: { height: 28, fontSize: '12.5px' }, sm: { height: 22, fontSize: '11px' } }
    for (const [size, expected] of Object.entries(sizes)) {
      const group = canvasElement.querySelector<HTMLElement>(`[data-size="${size}"]`)
      if (!group) throw new Error(`no ${size} control`)
      const style = getComputedStyle(group)
      const segment = group.querySelector<HTMLElement>('[role="radio"]')
      if (!segment) throw new Error(`no segment in ${size}`)
      await expect({
        size,
        height: group.getBoundingClientRect().height,
        fontSize: getComputedStyle(segment).fontSize,
        border: [style.borderTopWidth, style.borderTopColor],
        radius: style.borderTopLeftRadius,
        clips: style.overflow,
      }).toEqual({
        size,
        height: expected.height,
        fontSize: expected.fontSize,
        border: ['1px', computed('color', 'var(--border-strong)')],
        radius: '7px',
        clips: 'hidden',
      })
    }
  },
}

// components::REQ-001/AC-02: a disabled segmented control shows its muted look; `onValueChange` is read by the tests
// to see that no segment gets selected
export const Disabled: StoryObj<{ onValueChange: (value: Range) => void }> = {
  args: { onValueChange: fn() },
  render: ({ onValueChange }) => (
    <SegmentedControl aria-label="Range" options={ranges} defaultValue="week" onValueChange={onValueChange} disabled />
  ),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByRole('radiogroup')).opacity).toBe('0.45')
  },
}

// components::REQ-001/AC-01: the look of keyboard focus, for the owner to confirm: the outline inside the segment, since
// the container clips anything outside it. Focus moved by a script shows the keyboard's outline when no pointer has
// been used on the page.
export const KeyboardFocus: Story = {
  render: () => <SegmentedControl aria-label="Range" options={ranges} defaultValue="week" />,
  play: ({ canvas }) => {
    canvas.getByRole('radio', { name: 'Week' }).focus()
  },
}

// components::REQ-001/AC-05: labels longer than the space stay on one line and are cut with an ellipsis, and the
// control keeps its height and stays inside its column
export const LongLabel: Story = {
  render: () => (
    <div className="w-56 border border-dashed border-border-strong p-2">
      <SegmentedControl
        aria-label="Conversation list"
        options={[
          { value: 'all', label: 'Every conversation in this project' },
          { value: 'mine', label: 'Conversations I started on this machine' },
        ]}
        defaultValue="all"
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const column = canvasElement.querySelector('div')?.getBoundingClientRect()
    const group = canvas.getByRole('radiogroup')
    if (!column) throw new Error('no column')
    const segments = canvas.getAllByRole('radio')
    await expect(segments.length).toBe(2)
    for (const segment of segments) {
      const style = getComputedStyle(segment)
      await expect({
        label: segment.textContent,
        cut: style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap' && segment.scrollWidth > segment.clientWidth,
      }).toEqual({ label: segment.textContent, cut: true })
    }
    const rect = group.getBoundingClientRect()
    await expect({ height: rect.height, inside: rect.right <= column.right }).toEqual({ height: 28, inside: true })
  },
}

// components::REQ-016/AC-02, for the owner to confirm the look: a segmented control given a value none of its options,
// here a range the app stored that its options no longer hold, shows no segment selected, in each size. The options
// are typed only as `string`, as options built from data fetched at run time are, which lets such a value through the
// type check.
export const ValueNoneOfOptions: Story = {
  render: () => {
    const options: readonly { value: string; label: string }[] = ranges
    return (
      <div className="flex flex-col items-start gap-3">
        <SegmentedControl aria-label="Range" options={options} defaultValue="year" />
        <SegmentedControl aria-label="Range" options={options} defaultValue="year" size="sm" />
      </div>
    )
  },
}
