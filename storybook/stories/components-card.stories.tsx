// components::REQ-006 and the shared states of components::REQ-001 on the Card, in a consumer of the kit. The owner
// confirms the Card's look on these stories, switching the theme and light/dark with the toolbar (components::CON-002).
// A selectable card's look under the pointer and under keyboard focus, and its keys, are checked with a real pointer
// and keyboard in tests/components-card.test.tsx, since a play function's events do not make the browser apply
// `:hover` or `:focus-visible`.
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { card, defaultLook, inside, look, part, pressedLook } from './support/card'
import { computed } from './support/computed'

const meta = {
  title: 'Components/Card',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

// A card with every part, as an app lays out a summary: a header with its title, its description and a badge as its
// action, the content, and a footer with two buttons
function Full(props: CardProps & { 'data-card': string }) {
  return (
    <Card {...props}>
      <CardHeader data-part="header">
        <CardTitle data-part="title">Weekly report</CardTitle>
        <CardDescription data-part="description">Generated every Monday morning</CardDescription>
        <CardAction data-part="action">
          <Badge variant="primary">New</Badge>
        </CardAction>
      </CardHeader>
      <CardContent data-part="content">Twelve conversations this week, three of them still open.</CardContent>
      <CardFooter data-part="footer" className="gap-2">
        <Button data-part="open" size="sm" variant="primary">
          Open
        </Button>
        <Button data-part="dismiss" size="sm">
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  )
}

// components::REQ-006/AC-01 `default` row on a card given no variant, AC-04, and package::REQ-002/AC-01: the `--card`
// ground, a 1px `--border` border, `--card-foreground` text in `text-sm` (12.5px) and `rounded-lg` corners (8.75px);
// the title in `text-sm` semibold, the description under it in `text-xs` (11px) and `--muted-foreground`, the action
// at the header's top-right corner beside them, and the footer's items in a row
export const Default: Story = {
  render: () => <Full data-card="default" className="w-80" />,
  play: async ({ canvasElement }) => {
    const element = card(canvasElement, 'default')
    const style = getComputedStyle(element)
    await expect({ look: look(element), fontSize: style.fontSize, radius: style.borderTopLeftRadius }).toEqual({
      look: defaultLook(),
      fontSize: '12.5px',
      radius: '8.75px',
    })
    const title = part(element, 'title')
    const description = part(element, 'description')
    await expect({
      title: [getComputedStyle(title).fontSize, getComputedStyle(title).fontWeight],
      description: getComputedStyle(description).fontSize,
    }).toEqual({ title: ['12.5px', '600'], description: '11px' })
    const header = part(element, 'header')
    const headerStyle = getComputedStyle(header)
    const box = header.getBoundingClientRect()
    const inner = {
      left: box.left + parseFloat(headerStyle.paddingLeft),
      right: box.right - parseFloat(headerStyle.paddingRight),
      top: box.top,
    }
    const titleRect = title.getBoundingClientRect()
    const descriptionRect = description.getBoundingClientRect()
    const actionRect = part(element, 'action').getBoundingClientRect()
    await expect({
      titleAtLeft: titleRect.left === inner.left && titleRect.top === inner.top,
      descriptionUnderTitle: descriptionRect.left === inner.left && descriptionRect.top >= titleRect.bottom,
      actionAtTopRight: actionRect.right === inner.right && actionRect.top === inner.top,
      actionBesideBoth: actionRect.left >= Math.max(titleRect.right, descriptionRect.right),
    }).toEqual({ titleAtLeft: true, descriptionUnderTitle: true, actionAtTopRight: true, actionBesideBoth: true })
    const open = part(element, 'open').getBoundingClientRect()
    const dismiss = part(element, 'dismiss').getBoundingClientRect()
    await expect({ sameRow: open.top === dismiss.top, inOrder: dismiss.left > open.right }).toEqual({
      sameRow: true,
      inOrder: true,
    })
  },
}

// components::REQ-006/AC-03: each size spaces the parts apart, and from the card's top, bottom and side edges, by its
// spacing (14px `default`, 10px `sm`); a header or footer the caller gives a border towards the content keeps that
// spacing between the border and its own text
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-3">
      <Full data-card="default" className="w-72" />
      <Full data-card="sm" size="sm" className="w-72" />
      <Card data-card="default-bordered" className="w-72">
        <CardHeader data-part="header" className="border-b border-border">
          <CardTitle data-part="title">Settings</CardTitle>
        </CardHeader>
        <CardContent data-part="content">The header and the footer have a border towards the content.</CardContent>
        <CardFooter data-part="footer" className="border-t border-border">
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>
      <Card data-card="sm-bordered" size="sm" className="w-72">
        <CardHeader data-part="header" className="border-b border-border">
          <CardTitle data-part="title">Settings</CardTitle>
        </CardHeader>
        <CardContent data-part="content">The header and the footer have a border towards the content.</CardContent>
        <CardFooter data-part="footer" className="border-t border-border">
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = [
      { name: 'default', spacing: 14, bordered: false },
      { name: 'sm', spacing: 10, bordered: false },
      { name: 'default-bordered', spacing: 14, bordered: true },
      { name: 'sm-bordered', spacing: 10, bordered: true },
    ]
    for (const { name, spacing, bordered } of cards) {
      const element = card(canvasElement, name)
      const { top, bottom, width } = inside(element)
      const [header, content, footer] = ['header', 'content', 'footer'].map((each) => part(element, each))
      const [h, c, f] = [header, content, footer].map((each) => each.getBoundingClientRect())
      const sides = [header, content, footer].map((each) => {
        const style = getComputedStyle(each)
        return [style.paddingLeft, style.paddingRight, each.getBoundingClientRect().width === width]
      })
      const gap = (from: number, to: number) => Math.round((to - from) * 100) / 100
      await expect({
        name,
        apart: [gap(top, h.top), gap(h.bottom, c.top), gap(c.bottom, f.top), gap(f.bottom, bottom)],
        sides,
        insideBorders: [getComputedStyle(header).paddingBottom, getComputedStyle(footer).paddingTop],
      }).toEqual({
        name,
        apart: [spacing, spacing, spacing, spacing],
        sides: Array(3).fill([`${spacing}px`, `${spacing}px`, true]),
        insideBorders: bordered ? [`${spacing}px`, `${spacing}px`] : ['0px', '0px'],
      })
    }
  },
}

// components::REQ-006/AC-01 `dashed` row: the `--background` ground, a 1px dashed `--border-strong` border and
// `--muted-foreground` text, for an empty state or a note
export const Dashed: Story = {
  render: () => (
    <Card data-card="dashed" variant="dashed" className="w-80">
      <CardHeader>
        <CardTitle data-part="title">No reports yet</CardTitle>
        <CardDescription data-part="description">The first one is generated next Monday</CardDescription>
      </CardHeader>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    await expect(look(card(canvasElement, 'dashed'))).toEqual({
      ground: computed('color', 'var(--background)'),
      border: ['1px', 'dashed', computed('color', 'var(--border-strong)')],
      text: computed('color', 'var(--muted-foreground)'),
      ring: [],
      title: computed('color', 'var(--muted-foreground)'),
      description: computed('color', 'var(--muted-foreground)'),
    })
  },
}

// Two selectable cards side by side, as an app offers a choice of plans; the second starts pressed. `onPressedChange`
// is read by the tests to see what the cards reported.
function Choice({ onPressedChange, disabled }: { onPressedChange: (pressed: boolean) => void; disabled?: boolean }) {
  return (
    <div className="grid w-[30rem] grid-cols-2 gap-3">
      <Card data-card="plain" variant="selectable" onPressedChange={onPressedChange} disabled={disabled}>
        <CardHeader>
          <CardTitle data-part="title">Personal</CardTitle>
          <CardDescription data-part="description">One workspace, one member</CardDescription>
        </CardHeader>
        <CardContent>Everything you need to work alone.</CardContent>
      </Card>
      <Card data-card="pressed" variant="selectable" defaultPressed onPressedChange={onPressedChange} disabled={disabled}>
        <CardHeader>
          <CardTitle data-part="title">Team</CardTitle>
          <CardDescription data-part="description">Shared workspaces, up to twenty members</CardDescription>
        </CardHeader>
        <CardContent>Everything a small team needs.</CardContent>
      </Card>
    </div>
  )
}

// components::REQ-006/AC-01 `selectable` row at rest and pressed, and AC-02: each card is a button that reports whether
// it is pressed and is in the Tab order; unpressed it looks as a `default` card does
export const Selectable: StoryObj<{ onPressedChange: (pressed: boolean) => void }> = {
  args: { onPressedChange: fn() },
  render: ({ onPressedChange }) => <Choice onPressedChange={onPressedChange} />,
  play: async ({ canvasElement }) => {
    const plain = card(canvasElement, 'plain')
    const pressed = card(canvasElement, 'pressed')
    await expect(
      [plain, pressed].map((element) => ({
        role: element.getAttribute('role'),
        pressed: element.getAttribute('aria-pressed'),
        tabIndex: element.tabIndex,
      })),
    ).toEqual([
      { role: 'button', pressed: 'false', tabIndex: 0 },
      { role: 'button', pressed: 'true', tabIndex: 0 },
    ])
    await expect([look(plain), look(pressed)]).toEqual([defaultLook(), pressedLook()])
  },
}

// components::REQ-001/AC-02: disabled selectable cards show their muted look; `onPressedChange` is read by the tests to
// see that neither changes
export const Disabled: StoryObj<{ onPressedChange: (pressed: boolean) => void }> = {
  args: { onPressedChange: fn() },
  render: ({ onPressedChange }) => <Choice onPressedChange={onPressedChange} disabled />,
  play: async ({ canvasElement }) => {
    await expect(
      ['plain', 'pressed'].map((name) => {
        const element = card(canvasElement, name)
        return [getComputedStyle(element).opacity, element.getAttribute('aria-disabled')]
      }),
    ).toEqual([
      ['0.45', 'true'],
      ['0.45', 'true'],
    ])
  },
}

// components::REQ-001/AC-01: the look of keyboard focus on a selectable card, for the owner to confirm. Focus moved by a
// script shows the keyboard's outline when no pointer has been used on the page.
export const KeyboardFocus: Story = {
  render: () => <Choice onPressedChange={() => {}} />,
  play: ({ canvasElement }) => {
    card(canvasElement, 'plain').focus()
  },
}

// A grey picture standing in for an app's image
const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='96'%3E%3Crect width='320' height='96' fill='%23a3a3a3'/%3E%3C/svg%3E"

// components::REQ-006/AC-05: an image placed directly in a card spans its full width; as its first child it runs to
// the card's top edge, as its last child to its bottom edge, and the card clips its corners to its own
export const Image: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-3">
      <Card data-card="top" className="w-72">
        <img data-part="image" alt="" src={picture} className="h-24 object-cover" />
        <CardHeader>
          <CardTitle>Image first</CardTitle>
          <CardDescription>The image runs to the top edge</CardDescription>
        </CardHeader>
      </Card>
      <Card data-card="bottom" className="w-72">
        <CardHeader>
          <CardTitle>Image last</CardTitle>
          <CardDescription>The image runs to the bottom edge</CardDescription>
        </CardHeader>
        <img data-part="image" alt="" src={picture} className="h-24 object-cover" />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const name of ['top', 'bottom']) {
      const element = card(canvasElement, name)
      const inner = inside(element)
      const image = part(element, 'image').getBoundingClientRect()
      const style = getComputedStyle(element)
      await expect({
        name,
        fullWidth: image.left === inner.left && image.width === inner.width,
        edge: name === 'top' ? image.top === inner.top : image.bottom === inner.bottom,
        clipped: [style.overflow, style.borderTopLeftRadius],
      }).toEqual({ name, fullWidth: true, edge: true, clipped: ['hidden', '8.75px'] })
    }
  },
}
