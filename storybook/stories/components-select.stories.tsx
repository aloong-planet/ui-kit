// components::REQ-004, the select's part of components::REQ-014 and the shared states of components::REQ-001 on the
// Select, in a consumer of the kit. The owner confirms the Select's look on these stories, the popup included,
// switching the theme and light/dark with the toolbar (components::CON-002). Its look under the pointer and under
// keyboard focus, its keys, and what scrolls and resizes do to an open popup are checked with a real pointer and
// keyboard in tests/components-select.test.tsx, since a play function's events do not make the browser apply `:hover`
// or `:focus-visible`.
import { Button, Select } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { computed } from './support/computed'
import { castShadows, positionerAncestorsWith } from './support/floating'
import { checkSlot, isOpen, optionLabel, popup } from './support/select'

const meta = {
  title: 'Components/Select',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

type Sort = 'updated' | 'name' | 'created'

const sorts = [
  { value: 'updated', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Date created' },
] as const

const many = Array.from({ length: 40 }, (_, index) => ({ value: `${index + 1}`, label: `Project ${index + 1}` }))

// A select as an app uses one: its value held in the app's state and changed by `onValueChange`, beside a button of
// its height. The tests read `onValueChange` to see what the select reported, and the button's `onClick` to see that a
// click outside the open popup reaches it.
export const Default: StoryObj<{ onValueChange: (value: Sort) => void; onClick: () => void }> = {
  args: { onValueChange: fn(), onClick: fn() },
  render: function Render({ onValueChange, onClick }) {
    const [value, setValue] = useState<Sort>('updated')
    return (
      <div className="flex items-center gap-3">
        <Select
          className="w-40"
          aria-label="Sort by"
          options={sorts}
          value={value}
          onValueChange={(next) => {
            onValueChange(next)
            setValue(next)
          }}
        />
        <Button onClick={onClick}>Refresh</Button>
      </div>
    )
  },
  // components::REQ-004/AC-01 at rest and AC-06, and package::REQ-002/AC-01: the trigger, named by the label passed,
  // shows the selected option's label, not its value, in a `--background` ground with a 1px `--border-strong` border,
  // 28px tall like the button beside it, and its chevron unturned
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Sort by' })
    const style = getComputedStyle(trigger)
    const chevron = trigger.querySelector('svg')
    if (!chevron) throw new Error('no chevron')
    await expect({
      label: trigger.textContent,
      ground: style.backgroundColor,
      border: [style.borderTopWidth, style.borderTopColor],
      height: trigger.getBoundingClientRect().height,
      buttonHeight: canvas.getByRole('button', { name: 'Refresh' }).getBoundingClientRect().height,
      chevron: getComputedStyle(chevron).rotate,
    }).toEqual({
      label: 'Last updated',
      ground: computed('color', 'var(--background)'),
      border: ['1px', computed('color', 'var(--border-strong)')],
      height: 28,
      buttonHeight: 28,
      chevron: 'none',
    })
  },
}

// The popup open, for the owner to confirm its look. components::REQ-004/AC-02 below the trigger, AC-03 and AC-07, and
// components::REQ-001/AC-03: the popup opens 6px below the trigger with its left edge on the trigger's and as wide as
// the trigger, since its options are shorter; it is a floating surface (`--popover` ground, 1px `--border-strong`
// border, `--shadow-pop`) that nothing clips (components::REQ-014's floating surfaces); the selected option shows its
// label in `--primary-strong` and the check in `--primary`, and every option keeps room for the check, so the labels
// share their left and right edges.
export const Open: Story = {
  render: () => <Select className="w-40" aria-label="Sort by" options={sorts} defaultValue="name" />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Sort by' })
    await userEvent.click(trigger)
    const surface = await popup()
    const box = surface.getBoundingClientRect()
    const anchor = trigger.getBoundingClientRect()
    const style = getComputedStyle(surface)
    await expect({
      top: box.top - anchor.bottom,
      left: box.left - anchor.left,
      width: box.width,
      ground: style.backgroundColor,
      border: [style.borderTopWidth, style.borderTopColor],
      shadow: castShadows(style.boxShadow),
    }).toEqual({
      top: 6,
      left: 0,
      width: anchor.width,
      ground: computed('color', 'var(--popover)'),
      border: ['1px', computed('color', 'var(--border-strong)')],
      shadow: [computed('box-shadow', 'var(--shadow-pop)')],
    })
    // The point at the popup's centre hits the popup, so nothing clips or covers it, and no ancestor of its
    // positioner sets up a box that would clip a fixed element
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    await expect({ hitsPopup: hit ? surface.contains(hit) : false, clippingAncestors: positionerAncestorsWith(surface) }).toEqual({
      hitsPopup: true,
      clippingAncestors: [],
    })
    const options = within(surface).getAllByRole('option')
    await expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
    const labels = options.map((option) => optionLabel(option).getBoundingClientRect())
    await expect({
      selectedLabel: getComputedStyle(optionLabel(options[1])).color,
      check: getComputedStyle(checkSlot(options[1]).querySelector('svg') ?? options[1]).color,
      checks: options.map((option) => checkSlot(option).querySelector('svg') !== null),
      lefts: labels.map((label) => label.left - labels[0].left),
      rights: labels.map((label) => label.right - labels[0].right),
    }).toEqual({
      selectedLabel: computed('color', 'var(--primary-strong)'),
      check: computed('color', 'var(--primary)'),
      checks: [false, true, false],
      lefts: [0, 0, 0],
      rights: [0, 0, 0],
    })
  },
}

// components::REQ-004/AC-04: options in groups, parted by a 1px `--border` divider. The divider is drawn, not announced,
// so it is found as the element between the two groups.
export const Groups: Story = {
  render: () => (
    <Select
      className="w-44"
      aria-label="Language"
      groups={[
        [{ value: 'system', label: 'Follow system' }],
        [
          { value: 'en', label: 'English' },
          { value: 'zh', label: '简体中文' },
        ],
      ]}
      defaultValue="system"
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Language' }))
    const surface = await popup()
    const [first, second] = within(surface).getAllByRole('group')
    const divider = first.nextElementSibling
    if (!divider || divider.nextElementSibling !== second) throw new Error('no single element between the groups')
    const rect = divider.getBoundingClientRect()
    await expect({
      height: rect.height,
      colour: getComputedStyle(divider).backgroundColor,
      between: first.getBoundingClientRect().bottom <= rect.top && rect.bottom <= second.getBoundingClientRect().top,
      groups: [within(first).getAllByRole('option').length, within(second).getAllByRole('option').length],
    }).toEqual({ height: 1, colour: computed('color', 'var(--border)'), between: true, groups: [1, 2] })
  },
}

// components::REQ-004/AC-02: a trigger with no room below it opens its popup 6px above it
export const NearBottom: Story = {
  render: () => (
    <div className="fixed bottom-3 left-3">
      <Select className="w-40" aria-label="Sort by" options={sorts} defaultValue="updated" />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Sort by' })
    await userEvent.click(trigger)
    const surface = await popup()
    await expect(trigger.getBoundingClientRect().top - surface.getBoundingClientRect().bottom).toBe(6)
  },
}

// components::REQ-004/AC-02: options that do not fit the window scroll inside the popup, which stays in the window
export const LongList: Story = {
  render: () => <Select className="w-40" aria-label="Project" options={many} defaultValue="1" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Project' }))
    const surface = await popup()
    const box = surface.getBoundingClientRect()
    await expect({
      options: within(surface).getAllByRole('option').length,
      scrolls: surface.scrollHeight > surface.clientHeight,
      inWindow: box.top >= 0 && box.bottom <= window.innerHeight,
    }).toEqual({ options: 40, scrolls: true, inWindow: true })
  },
}

// components::REQ-004/AC-07: a popup at least as wide as its trigger and as wide as its longest option within the room
// from the trigger's left edge to the window's right edge, on the trigger's left edge, cutting with an ellipsis an
// option longer than that room. The triggers stand 40% of the window's width in from its left edge, so a popup that
// moved left to fit its longest option would leave the trigger's left edge.
export const Widths: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3 ps-[40vw]">
      <Select className="w-24" aria-label="Sort by" options={sorts} defaultValue="name" />
      <Select
        className="w-24"
        aria-label="Path"
        options={[
          { value: 'short', label: 'Home' },
          {
            value: 'long',
            // Longer than any window the stories are seen in
            label: `Every conversation in every project on this machine, ${'and in every project on every other machine signed in to this account, '.repeat(6)}newest first`,
          },
        ]}
        defaultValue="short"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const widths = []
    for (const name of ['Sort by', 'Path']) {
      const trigger = canvas.getByRole('combobox', { name })
      await userEvent.click(trigger)
      const surface = await popup()
      const box = surface.getBoundingClientRect()
      const anchor = trigger.getBoundingClientRect()
      const cut = within(surface)
        .getAllByRole('option')
        .map(optionLabel)
        .filter((label) => getComputedStyle(label).textOverflow === 'ellipsis' && label.scrollWidth > label.clientWidth)
      widths.push({
        name,
        left: box.left - anchor.left,
        wider: box.width > anchor.width,
        inWindow: box.right <= window.innerWidth,
        cut: cut.length,
      })
      await userEvent.click(trigger)
      await waitFor(() => expect(isOpen()).toBe(false))
    }
    // `Sort by`: the longest option, `Date created`, is wider than the 96px trigger; `Path`: its long option is wider
    // than the window and is cut
    await expect(widths).toEqual([
      { name: 'Sort by', left: 0, wider: true, inWindow: true, cut: 0 },
      { name: 'Path', left: 0, wider: true, inWindow: true, cut: 1 },
    ])
  },
}

// components::REQ-014/AC-01 and AC-02: a select above an area that scrolls, on a page that scrolls, with more options
// than its popup shows. The area is 40% of the window's height around content of a fixed height, so a taller window
// shortens how far it scrolls, and the trigger is centred, so a narrower window moves it.
export const InScrollingArea: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center">
        <Select className="w-40" aria-label="Project" options={many} defaultValue="1" />
      </div>
      <div data-area className="h-[40vh] overflow-y-auto border border-dashed border-border-strong p-2">
        <p className="h-[1600px] text-muted-foreground">An area that scrolls</p>
      </div>
      <div className="h-[150vh]" />
    </div>
  ),
}

// components::REQ-001/AC-02: a disabled select shows its muted look; `onValueChange` is read by the tests to see that
// no option gets selected
export const Disabled: StoryObj<{ onValueChange: (value: Sort) => void }> = {
  args: { onValueChange: fn() },
  render: ({ onValueChange }) => (
    <Select className="w-40" aria-label="Sort by" options={sorts} defaultValue="updated" onValueChange={onValueChange} disabled />
  ),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByRole('combobox', { name: 'Sort by' })).opacity).toBe('0.45')
  },
}

// components::REQ-001/AC-01: the look of keyboard focus, for the owner to confirm; focus moved by a script shows the
// keyboard's outline when no pointer has been used on the page
export const KeyboardFocus: Story = {
  render: () => <Select className="w-40" aria-label="Sort by" options={sorts} defaultValue="updated" />,
  play: ({ canvas }) => {
    canvas.getByRole('combobox', { name: 'Sort by' }).focus()
  },
}

// components::REQ-001/AC-05: a selected label longer than the trigger stays on one line and is cut with an ellipsis,
// and the trigger keeps its height inside its column
export const LongLabel: Story = {
  render: () => (
    <div className="w-36 border border-dashed border-border-strong p-2">
      <Select
        className="w-full"
        aria-label="Project"
        options={[{ value: 'long', label: 'Every conversation in this project' }]}
        defaultValue="long"
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const column = canvasElement.querySelector('div')?.getBoundingClientRect()
    if (!column) throw new Error('no column')
    const trigger = canvas.getByRole('combobox', { name: 'Project' })
    const cut = [...trigger.querySelectorAll<HTMLElement>('*')].filter((node) => {
      const style = getComputedStyle(node)
      return style.textOverflow === 'ellipsis' && node.scrollWidth > node.clientWidth
    })
    const rect = trigger.getBoundingClientRect()
    await expect({ cut: cut.map((node) => node.textContent), height: rect.height, inside: rect.right <= column.right }).toEqual({
      cut: ['Every conversation in this project'],
      height: 28,
      inside: true,
    })
  },
}
