// components::REQ-013 and the shared states of components::REQ-001 on the Tabs, in a consumer of the kit. The owner
// confirms the Tabs' look on these stories, switching the theme and light/dark with the toolbar (components::CON-002).
// Their look under the pointer and under keyboard focus, and their keys, are checked with a real pointer and keyboard in
// tests/components-tabs.test.tsx, since a play function's events do not make the browser apply `:hover` or
// `:focus-visible`.
import { Tabs, type TabsProps } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'
import { computed } from './support/computed'

const meta = {
  title: 'Components/Tabs',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

type Section = 'overview' | 'activity' | 'settings'

// A page's sections, as an app switches them; each panel brings its own padding, as the content of a page does
function sections(disabled?: Section) {
  return [
    { value: 'overview', label: 'Overview', panel: <p className="py-3">Twelve conversations this week.</p> },
    { value: 'activity', label: 'Activity', count: 12, panel: <p className="py-3">Three of them are still open.</p> },
    { value: 'settings', label: 'Settings', panel: <p className="py-3">The project is shared with two members.</p> },
  ].map((section) => ({ ...section, disabled: section.value === disabled })) as TabsProps<Section>['tabs']
}

// Tabs as an app uses them: the selected tab held in the app's state and changed by `onValueChange`, which the tests
// also read to see what the tabs reported
function Controlled({ onValueChange, disabled }: { onValueChange: (value: Section) => void; disabled?: Section }) {
  const [value, setValue] = useState<Section>('overview')
  return (
    <Tabs
      aria-label="Project"
      tabs={sections(disabled)}
      value={value}
      onValueChange={(next) => {
        onValueChange(next)
        setValue(next)
      }}
    />
  )
}

function look(tab: HTMLElement) {
  const style = getComputedStyle(tab)
  return {
    ground: style.backgroundColor,
    border: [style.borderTopColor, style.borderLeftColor, style.borderRightColor, style.borderBottomColor],
    text: style.color,
    weight: style.fontWeight,
  }
}

// Each tab's box: its height, its text size, the space between its sides and its label, and its corners
function box(tab: HTMLElement) {
  const style = getComputedStyle(tab)
  return {
    height: tab.getBoundingClientRect().height,
    fontSize: style.fontSize,
    padding: [style.paddingLeft, style.paddingRight],
    radius: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius],
  }
}

const round = (value: number) => Math.round(value * 100) / 100

// The gaps between neighbouring tabs
function gaps(tabs: HTMLElement[]) {
  return tabs.slice(1).map((tab, i) => round(tab.getBoundingClientRect().left - tabs[i].getBoundingClientRect().right))
}

// A tab's count: the space between the end of the label and the count, and the count's tone
function count(tab: HTMLElement) {
  const [label] = tab.childNodes
  const number = tab.querySelector('span')
  if (!label || label.nodeType !== Node.TEXT_NODE || !number) throw new Error('no label and count in the tab')
  const range = document.createRange()
  range.selectNodeContents(label)
  return { gap: round(number.getBoundingClientRect().left - range.getBoundingClientRect().right), opacity: getComputedStyle(number).opacity }
}

// components::REQ-013/AC-03: the selected tab's panel, and only it, shows below the row, announced as a tab panel
// under its tab's label, with no ground and no padding of its own
async function checkPanel(canvasElement: HTMLElement, selected: HTMLElement) {
  const panels = [...canvasElement.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
  await expect(panels.length).toBe(1)
  const style = getComputedStyle(panels[0])
  await expect({
    labelledBy: panels[0].getAttribute('aria-labelledby'),
    ground: style.backgroundColor,
    padding: style.padding,
  }).toEqual({ labelledBy: selected.id, ground: computed('color', 'transparent'), padding: '0px' })
  return panels[0]
}

// components::REQ-013/AC-01 `page` row, AC-02's name, AC-03, AC-06, and package::REQ-002/AC-01: folder tabs above a
// 1px `--border` rule, the tab row announced as a tab list under the name passed. The selected tab takes the
// `--background` ground, a 1px `--border` border on its top and sides and `--primary` text in a heavier weight, and
// covers the rule under it, joining the panel, which starts directly under the rule; the others show
// `--muted-foreground` text. Each tab is 28px tall, in `text-sm` (12.5px), 13px from its sides to its label, with
// `rounded-md` top corners (7px); the tabs stand 2px apart, and a count shows 4px after its label in a lighter tone.
export const Page: StoryObj<{ onValueChange: (value: Section) => void }> = {
  args: { onValueChange: fn() },
  render: ({ onValueChange }) => <Controlled onValueChange={onValueChange} />,
  play: async ({ canvas, canvasElement }) => {
    const list = canvas.getByRole('tablist', { name: 'Project' })
    const tabs = canvas.getAllByRole('tab')
    await expect({
      inList: tabs.every((tab) => list.contains(tab)),
      labels: tabs.map((tab) => tab.textContent),
      selected: tabs.map((tab) => tab.getAttribute('aria-selected')),
    }).toEqual({ inList: true, labels: ['Overview', 'Activity12', 'Settings'], selected: ['true', 'false', 'false'] })
    const border = computed('color', 'var(--border)')
    const transparent = computed('color', 'transparent')
    const unselected = {
      ground: transparent,
      border: [transparent, transparent, transparent, transparent],
      text: computed('color', 'var(--muted-foreground)'),
      weight: '400',
    }
    await expect(tabs.map(look)).toEqual([
      {
        ground: computed('color', 'var(--background)'),
        border: [border, border, border, computed('color', 'var(--background)')],
        text: computed('color', 'var(--primary)'),
        weight: '600',
      },
      unselected,
      unselected,
    ])
    await expect(tabs.map(box)).toEqual(
      Array(3).fill({ height: 28, fontSize: '12.5px', padding: ['13px', '13px'], radius: ['7px', '7px', '0px', '0px'] }),
    )
    await expect(gaps(tabs)).toEqual([2, 2])
    const listStyle = getComputedStyle(list)
    const rule = list.getBoundingClientRect()
    await expect({
      rule: [listStyle.borderBottomWidth, listStyle.borderBottomColor],
      selectedCoversRule: tabs[0].getBoundingClientRect().bottom === rule.bottom,
    }).toEqual({ rule: ['1px', border], selectedCoversRule: true })
    const panel = await checkPanel(canvasElement, tabs[0])
    await expect(panel.getBoundingClientRect().top).toBe(rule.bottom)
    await expect(count(tabs[1])).toEqual({ gap: 4, opacity: '0.75' })
  },
}

const categories = [
  { value: 'all', label: 'All', count: 24, panel: <p>Every conversation in the project.</p> },
  { value: 'open', label: 'Open', count: 3, panel: <p>The conversations still open.</p> },
  { value: 'closed', label: 'Closed', panel: <p>The conversations closed this week.</p> },
] as const

// components::REQ-013/AC-01 `pill` row, AC-03 and AC-06: separate pills on a `--card` ground with a 1px
// `--border-strong` border and `--muted-foreground` text; the selected one shows the wash, `--primary-strong` text and
// a `--primary` border. Each pill is 22px tall, in `text-xs` (11px) semibold, 10px from its sides to its label, with
// `rounded-md` corners (7px); the pills stand 4px apart, the panel starts 8px under the row, and a count shows 4px
// after its label in a lighter tone.
export const Pill: Story = {
  render: () => <Tabs aria-label="Conversations" variant="pill" tabs={categories} defaultValue="all" />,
  play: async ({ canvas, canvasElement }) => {
    const list = canvas.getByRole('tablist', { name: 'Conversations' })
    const tabs = canvas.getAllByRole('tab')
    await expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
    const strong = computed('color', 'var(--border-strong)')
    const primary = computed('color', 'var(--primary)')
    const unselected = {
      ground: computed('color', 'var(--card)'),
      border: [strong, strong, strong, strong],
      text: computed('color', 'var(--muted-foreground)'),
      weight: '600',
    }
    await expect(tabs.map(look)).toEqual([
      {
        ground: computed('color', 'var(--accent)'),
        border: [primary, primary, primary, primary],
        text: computed('color', 'var(--primary-strong)'),
        weight: '600',
      },
      unselected,
      unselected,
    ])
    await expect(tabs.map(box)).toEqual(
      Array(3).fill({ height: 22, fontSize: '11px', padding: ['10px', '10px'], radius: ['7px', '7px', '7px', '7px'] }),
    )
    await expect(gaps(tabs)).toEqual([4, 4])
    const panel = await checkPanel(canvasElement, tabs[0])
    await expect(round(panel.getBoundingClientRect().top - list.getBoundingClientRect().bottom)).toBe(8)
    await expect(count(tabs[0])).toEqual({ gap: 4, opacity: '0.75' })
  },
}

// components::REQ-013/AC-04 and components::REQ-001/AC-02: a single disabled tab shows its muted look and is announced
// as disabled; `onValueChange` is read by the tests to see that the keys and the pointer do not select it
export const Disabled: StoryObj<{ onValueChange: (value: Section) => void }> = {
  args: { onValueChange: fn() },
  render: ({ onValueChange }) => <Controlled onValueChange={onValueChange} disabled="settings" />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByRole('tab').map((tab) => [getComputedStyle(tab).opacity, tab.getAttribute('aria-disabled')]),
    ).toEqual([
      ['1', 'false'],
      ['1', 'false'],
      ['0.45', 'true'],
    ])
  },
}

// components::REQ-001/AC-01: the look of keyboard focus on a tab, for the owner to confirm. Focus moved by a script shows
// the keyboard's outline when no pointer has been used on the page.
export const KeyboardFocus: Story = {
  render: () => <Controlled onValueChange={() => {}} />,
  play: ({ canvas }) => {
    canvas.getAllByRole('tab')[0].focus()
  },
}

// components::REQ-001/AC-05: labels longer than the space stay on one line and are cut with an ellipsis, and the tabs
// keep their height and stay inside their column
export const LongLabel: Story = {
  render: () => (
    <div data-column className="w-56 border border-dashed border-border-strong p-2">
      <Tabs
        aria-label="Conversation list"
        tabs={[
          { value: 'all', label: 'Every conversation in this project', panel: <p className="py-3">All of them.</p> },
          { value: 'mine', label: 'Conversations I started on this machine', panel: <p className="py-3">Mine.</p> },
        ]}
        defaultValue="all"
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const column = canvasElement.querySelector('[data-column]')?.getBoundingClientRect()
    if (!column) throw new Error('no column')
    const tabs = canvas.getAllByRole('tab')
    await expect(tabs.length).toBe(2)
    for (const tab of tabs) {
      const style = getComputedStyle(tab)
      const rect = tab.getBoundingClientRect()
      await expect({
        label: tab.textContent,
        cut: style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap' && tab.scrollWidth > tab.clientWidth,
        height: rect.height,
        inside: rect.right <= column.right,
      }).toEqual({ label: tab.textContent, cut: true, height: 28, inside: true })
    }
  },
}
