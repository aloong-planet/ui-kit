// components::REQ-008, the tooltip's part of components::REQ-014 and the shared states of components::REQ-001 on the
// Tooltip, in a consumer of the kit. The owner confirms the Tooltip's look on these stories, switching the theme and
// light/dark with the toolbar (components::CON-002): hovering the trigger of `Default` shows it open and close with
// no motion, and `Open` shows it open with no arrow. What the pointer, the keyboard, scrolls and resizes do to it is
// checked with a real pointer and keyboard in tests/components-tooltip.test.tsx.
import { Button, Tooltip, type TooltipProps } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RefreshCw } from 'lucide-react'
import { expect, userEvent, waitFor } from 'storybook/test'
import { computed } from './support/computed'
import { castShadows, positionerAncestorsWith } from './support/floating'
import { isOpen, tooltip } from './support/tooltip'

const meta = {
  title: 'Components/Tooltip',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const refresh = (
  <Button size="icon" variant="ghost" aria-label="Refresh">
    <RefreshCw />
  </Button>
)

// The gap between a tooltip and its trigger, to the nearest pixel: Base UI places a tooltip on whole pixels, so one of
// a fractional size, or beside a trigger at a fractional place, stands up to half a pixel off its gap
const gap = (from: number, to: number) => Math.round(to - from)

// Opens the tooltip of the trigger named `name` with the pointer and returns the trigger and the open tooltip
async function open(canvasElement: HTMLElement, name: string) {
  const trigger = [...canvasElement.querySelectorAll<HTMLElement>('button')].find(
    (candidate) => (candidate.getAttribute('aria-label') ?? candidate.textContent) === name,
  )
  if (!trigger) throw new Error(`no trigger ${name}`)
  await userEvent.hover(trigger)
  return { trigger, popup: await tooltip() }
}

// A tooltip on an icon-only button, as an app uses one, beside a button without one, which the tests move the pointer
// and the keyboard to
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Tooltip text="Reload the list from disk">{refresh}</Tooltip>
      <Button>Elsewhere</Button>
    </div>
  ),
}

// The tooltip open, for the owner to confirm its look. components::REQ-008/AC-02 and AC-04, components::REQ-001/AC-03
// and package::REQ-002/AC-01: 6px below its trigger, the `--tooltip` ground, `--tooltip-foreground` text, no border and
// the `--shadow-pop` shadow; nothing clips or covers it; it holds only its text, so it draws no arrow, and it plays no
// animation or transition as it opens
export const Open: Story = {
  render: () => <Tooltip text="Reload the list from disk">{refresh}</Tooltip>,
  play: async ({ canvasElement }) => {
    const { trigger, popup } = await open(canvasElement, 'Refresh')
    const box = popup.getBoundingClientRect()
    const style = getComputedStyle(popup)
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    await expect({
      top: gap(trigger.getBoundingClientRect().bottom, box.top),
      ground: style.backgroundColor,
      text: style.color,
      border: style.borderTopWidth,
      shadow: castShadows(style.boxShadow),
      hitsTooltip: hit ? popup.contains(hit) : false,
      clippingAncestors: positionerAncestorsWith(popup),
      elements: popup.children.length,
      animations: popup.getAnimations({ subtree: true }).length,
      transition: style.transitionDuration,
    }).toEqual({
      top: 6,
      ground: computed('color', 'var(--tooltip)'),
      text: computed('color', 'var(--tooltip-foreground)'),
      border: '0px',
      shadow: [computed('box-shadow', 'var(--shadow-pop)')],
      hitsTooltip: true,
      clippingAncestors: [],
      elements: 0,
      animations: 0,
      transition: '0s',
    })
  },
}

// components::REQ-008/AC-04: a warning line the caller passes shows on its own line after the text, in
// `--tooltip-warning`, while the text keeps `--tooltip-foreground`; components::REQ-008/AC-03: the trigger's description
// is the text followed by the warning line
export const Warning: Story = {
  render: () => (
    <Tooltip text="Delete the selected files" warning="This cannot be undone">
      <Button variant="danger">Delete</Button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const { trigger, popup } = await open(canvasElement, 'Delete')
    await expect(trigger).toHaveAccessibleDescription('Delete the selected files This cannot be undone')
    const warning = popup.lastElementChild
    if (!(warning instanceof HTMLElement)) throw new Error('no warning line')
    const text = document.createRange()
    text.selectNodeContents(popup.firstChild ?? popup)
    await expect({
      text: popup.firstChild?.textContent,
      textColour: getComputedStyle(popup).color,
      warning: warning.textContent,
      warningColour: getComputedStyle(warning).color,
      below: warning.getBoundingClientRect().top >= text.getBoundingClientRect().bottom,
    }).toEqual({
      text: 'Delete the selected files',
      textColour: computed('color', 'var(--tooltip-foreground)'),
      warning: 'This cannot be undone',
      warningColour: computed('color', 'var(--tooltip-warning)'),
      below: true,
    })
  },
}

const sides = ['top', 'right', 'bottom', 'left'] as const satisfies readonly NonNullable<TooltipProps['side']>[]

// components::REQ-008/AC-02: each side the caller can choose, 6px from the trigger on that side
export const Sides: Story = {
  render: () => (
    <div className="flex items-center gap-24 p-16">
      {sides.map((side) => (
        <Tooltip key={side} side={side} text={`On the ${side}`}>
          <Button>{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gaps = []
    for (const side of sides) {
      const { trigger, popup } = await open(canvasElement, side)
      const box = popup.getBoundingClientRect()
      const anchor = trigger.getBoundingClientRect()
      const apart = {
        top: gap(box.bottom, anchor.top),
        right: gap(anchor.right, box.left),
        bottom: gap(anchor.bottom, box.top),
        left: gap(box.right, anchor.left),
      }
      gaps.push({ side, gap: apart[side] })
      await userEvent.unhover(trigger)
      await waitFor(() => expect(isOpen()).toBe(false))
    }
    await expect(gaps).toEqual(sides.map((side) => ({ side, gap: 6 })))
  },
}

// components::REQ-008/AC-02: a trigger with no room below it shows its tooltip 6px above it
export const NearBottom: Story = {
  render: () => (
    <div className="fixed bottom-3 left-3">
      <Tooltip text="Reload the list from disk">{refresh}</Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { trigger, popup } = await open(canvasElement, 'Refresh')
    await expect(gap(popup.getBoundingClientRect().bottom, trigger.getBoundingClientRect().top)).toBe(6)
  },
}

// components::REQ-001/AC-05: text longer than the tooltip's 440px wraps onto more lines and is not cut
export const LongText: Story = {
  render: () => (
    <Tooltip text="Reload every list in this window from disk, including the lists of projects that are closed, which can take a while on a slow disk">
      {refresh}
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const { popup } = await open(canvasElement, 'Refresh')
    const style = getComputedStyle(popup)
    const lines = (popup.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / parseFloat(style.lineHeight)
    await expect({ width: popup.getBoundingClientRect().width, lines: Math.round(lines), cut: popup.scrollWidth > popup.clientWidth }).toEqual({
      width: 440,
      lines: 2,
      cut: false,
    })
  },
}

// components::REQ-001/AC-01 with the tooltip: keyboard focus on the trigger shows the keyboard's outline and opens the
// tooltip, for the owner to confirm; focus moved by a script shows it when no pointer has been used on the page
export const KeyboardFocus: Story = {
  render: () => <Tooltip text="Reload the list from disk">{refresh}</Tooltip>,
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>('button')?.focus()
    await tooltip()
  },
}

// components::REQ-014/AC-01 and AC-02: a tooltip above an area that scrolls, on a page that scrolls, for the tests
export const InScrollingArea: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-6">
        <Tooltip text="Reload the list from disk">{refresh}</Tooltip>
        <Button>Elsewhere</Button>
      </div>
      <div data-area className="h-[40vh] overflow-y-auto border border-dashed border-border-strong p-2">
        <p className="h-[1600px] text-muted-foreground">An area that scrolls</p>
      </div>
      <div className="h-[150vh]" />
    </div>
  ),
}
