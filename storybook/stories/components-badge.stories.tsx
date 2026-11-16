// components::REQ-007 on the Badge, in a consumer of the kit. The owner confirms the Badge's look on these stories,
// switching the theme and light/dark with the toolbar (components::CON-002).
import { Badge, type BadgeProps } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check } from 'lucide-react'
import { expect } from 'storybook/test'
import { computed } from './support/computed'
import './theming-app-tokens.css'

const meta = {
  title: 'Components/Badge',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

type Variant = NonNullable<BadgeProps['variant']>

// What each variant's row describes: its ground, its border's style and colour, its text colour and its weight
const looks: Record<Variant, { ground: string; border: [string, string]; text: string; weight: string }> = {
  neutral: { ground: 'transparent', border: ['solid', 'var(--border-strong)'], text: 'var(--muted-foreground)', weight: '400' },
  dashed: { ground: 'transparent', border: ['dashed', 'var(--border-strong)'], text: 'var(--muted-foreground)', weight: '400' },
  muted: { ground: 'var(--border)', border: ['solid', 'transparent'], text: 'var(--muted-foreground)', weight: '400' },
  primary: { ground: 'var(--accent)', border: ['solid', 'transparent'], text: 'var(--primary)', weight: '600' },
  'primary-outline': { ground: 'transparent', border: ['solid', 'var(--primary)'], text: 'var(--primary)', weight: '400' },
  success: { ground: 'var(--success)', border: ['solid', 'transparent'], text: 'var(--success-foreground)', weight: '400' },
  warning: { ground: 'var(--warning)', border: ['solid', 'transparent'], text: 'var(--warning-foreground)', weight: '400' },
  note: { ground: 'var(--note)', border: ['solid', 'transparent'], text: 'var(--note-foreground)', weight: '400' },
  risk: { ground: 'transparent', border: ['dashed', 'var(--risk)'], text: 'var(--risk-foreground)', weight: '400' },
  count: { ground: 'var(--accent)', border: ['solid', 'transparent'], text: 'var(--primary)', weight: '700' },
}

const labels: Record<Variant, string> = {
  neutral: 'Draft',
  dashed: 'Optional',
  muted: 'Archived',
  primary: 'Default',
  'primary-outline': 'Beta',
  success: 'Passed',
  warning: 'Stale',
  note: 'Pinned',
  risk: 'Unverified',
  count: '3',
}

function look(element: HTMLElement) {
  const style = getComputedStyle(element)
  return {
    ground: style.backgroundColor,
    border: [style.borderTopStyle, style.borderTopColor],
    text: style.color,
    weight: style.fontWeight,
  }
}

// The box every badge shares: 18px tall with a 1px border, its text in `text-xs` (11px), 6px from its sides
function box(element: HTMLElement) {
  const style = getComputedStyle(element)
  return {
    height: element.getBoundingClientRect().height,
    borderWidth: style.borderTopWidth,
    fontSize: style.fontSize,
    padding: [style.paddingLeft, style.paddingRight],
  }
}
const sharedBox = { height: 18, borderWidth: '1px', fontSize: '11px', padding: ['6px', '6px'] }

function badge(canvasElement: HTMLElement, variant: string): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(`[data-variant="${variant}"]`)
  if (!element) throw new Error(`no ${variant} badge`)
  return element
}

// components::REQ-007/AC-01 and AC-04: every variant in a row, each as its row describes, in the same 18px box with
// `rounded-sm` corners (5.25px), except `count`, whose ends are fully rounded and which is at least as wide as tall.
// The `neutral` badge is given no variant, as a badge without one is `neutral`.
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(labels) as Variant[]).map((variant) => (
        <Badge key={variant} data-variant={variant} {...(variant === 'neutral' ? {} : { variant })}>
          {labels[variant]}
        </Badge>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const variants = Object.keys(looks) as Variant[]
    await expect(variants.length).toBe(10)
    for (const variant of variants) {
      const element = badge(canvasElement, variant)
      const expected = looks[variant]
      await expect({ variant, text: element.textContent, look: look(element), box: box(element) }).toEqual({
        variant,
        text: labels[variant],
        look: {
          ground: computed('color', expected.ground),
          border: [expected.border[0], computed('color', expected.border[1])],
          text: computed('color', expected.text),
          weight: expected.weight,
        },
        box: sharedBox,
      })
      const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius)
      const { width, height } = element.getBoundingClientRect()
      if (variant === 'count')
        await expect({ variant, fullyRounded: radius >= height / 2, wideEnough: width >= height }).toEqual({
          variant,
          fullyRounded: true,
          wideEnough: true,
        })
      else await expect({ variant, radius }).toEqual({ variant, radius: 5.25 })
    }
  },
}

// components::REQ-007/AC-02 and AC-04: a leading icon before the text, 10px, 3px before the text, the badge keeping its
// box. The icon is the story's own; the kit draws whatever icon the caller passes.
export const WithIcon: Story = {
  render: () => (
    <Badge data-variant="success" variant="success">
      <Check />
      Passed
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const element = badge(canvasElement, 'success')
    const icon = element.querySelector('svg')
    const text = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)
    if (!icon || !text) throw new Error('no icon or text in the badge')
    const range = document.createRange()
    range.selectNodeContents(text)
    const iconRect = icon.getBoundingClientRect()
    await expect({
      icon: { width: iconRect.width, height: iconRect.height },
      gap: Math.round((range.getBoundingClientRect().left - iconRect.right) * 100) / 100,
      box: box(element),
    }).toEqual({ icon: { width: 10, height: 10 }, gap: 3, box: sharedBox })
  },
}

// components::REQ-007/AC-03: an app colours a badge with its own tokens through its classes, which replace the
// variant's ground, border and text colours and keep its box and border style. The `risk` badge has colours of its own
// for all three and a dashed border; the app token is a fixture (theming-app-tokens.css).
export const AppColours: Story = {
  render: () => (
    <Badge
      data-variant="risk"
      variant="risk"
      className="border-(--fixture-app-token) bg-(--fixture-app-token) text-(--fixture-app-token)"
    >
      Skill
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const element = badge(canvasElement, 'risk')
    const app = computed('color', 'var(--fixture-app-token)')
    await expect({ look: look(element), box: box(element) }).toEqual({
      look: { ground: app, border: ['dashed', app], text: app, weight: '400' },
      box: sharedBox,
    })
  },
}

// components::REQ-001/AC-05: a label longer than the space stays on one line, cut with an ellipsis, and the badge keeps
// its height and stays inside its column
export const LongLabel: Story = {
  render: () => (
    <div data-column className="w-32 border border-dashed border-border-strong p-2">
      <Badge data-variant="primary" variant="primary">
        Every conversation in this project
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('[data-column]')?.getBoundingClientRect()
    if (!column) throw new Error('no column')
    const element = badge(canvasElement, 'primary')
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    await expect({
      cut: style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap' && element.scrollWidth > element.clientWidth,
      height: rect.height,
      inside: rect.right <= column.right,
    }).toEqual({ cut: true, height: 18, inside: true })
  },
}
