// components::REQ-009 and the shared states of components::REQ-001 on the Drawer, in a consumer of the kit. The owner
// confirms the Drawer's look on these stories, switching the theme and light/dark with the toolbar
// (components::CON-002); each story opens its drawer in its play function. How it closes, where keyboard focus goes and
// what scrolls while it is open are checked with a real pointer and keyboard in tests/components-drawer.test.tsx, since
// a play function's events do not move focus or scroll the page as a person's do.
import { Button, Drawer } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { computed } from './support/computed'
import { opened } from './support/dialog'
import { castShadows } from './support/floating'

const meta = {
  title: 'Components/Drawer',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

// A drawer as an app uses one: opened by a button on the page, its `open` held in the app's state and cleared by
// `onOpenChange` on each way of closing it
function WithOpener({ title, children }: { title: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open details</Button>
      <Drawer open={open} onOpenChange={setOpen} title={title} closeLabel="Close">
        {children}
      </Drawer>
    </>
  )
}

// The details of a release, with a link and a button in the body
function ReleaseNotes() {
  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <p>Version 2.4 brings light and dark to every theme and keeps the scroll position of long lists.</p>
      <a className="text-primary underline" href="#changelog">
        Read the changelog
      </a>
      <Button>Copy the link</Button>
    </div>
  )
}

// The drawer open, for the owner to confirm its look. components::REQ-009/AC-02 announced, AC-03 and AC-04, and
// components::REQ-001/AC-03 and AC-04: a dialog named by its title, whose close button is named by the label passed,
// over a scrim in `--overlay` that covers the window; it is a floating surface (`--popover` ground, 1px
// `--border-strong` border on its left edge, `--shadow-pop`) that nothing covers; the title shows in `--primary` and
// the close button sits 12px from the panel's top and right edges, inside the header; nothing moves as it opens. The
// panel's width and its place on the window's right edge are checked in windows of two widths in
// tests/components-drawer.test.tsx.
export const Default: Story = {
  render: () => (
    <WithOpener title="Release notes">
      <ReleaseNotes />
    </WithOpener>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open details' }))
    const panel = await opened('dialog')
    const page = within(document.body)
    const box = panel.getBoundingClientRect()
    const style = getComputedStyle(panel)
    const title = within(panel).getByRole('heading', { name: 'Release notes' })
    const close = within(panel).getByRole('button', { name: 'Close' })
    const closeBox = close.getBoundingClientRect()
    const header = title.parentElement
    if (!header || !header.contains(close)) throw new Error('the close button is not in the header')
    const scrim = document.elementFromPoint(1, 1)
    if (!(scrim instanceof HTMLElement) || panel.contains(scrim)) throw new Error('no scrim beside the panel')
    const scrimBox = scrim.getBoundingClientRect()
    await expect({
      named: page.getByRole('dialog', { name: 'Release notes' }) === panel,
      scrim: {
        box: [scrimBox.left, scrimBox.top, scrimBox.width, scrimBox.height],
        ground: getComputedStyle(scrim).backgroundColor,
      },
      ground: style.backgroundColor,
      border: [style.borderLeftWidth, style.borderLeftColor, style.borderTopWidth],
      shadow: castShadows(style.boxShadow),
      title: getComputedStyle(title).color,
      close: {
        right: box.right - closeBox.right,
        top: closeBox.top - box.top,
        inHeader: closeBox.bottom <= header.getBoundingClientRect().bottom,
      },
      motion: [style.transitionDuration, style.animationName, getComputedStyle(scrim).transitionDuration],
    }).toEqual({
      named: true,
      scrim: { box: [0, 0, window.innerWidth, window.innerHeight], ground: computed('color', 'var(--overlay)') },
      ground: computed('color', 'var(--popover)'),
      border: ['1px', computed('color', 'var(--border-strong)'), '0px'],
      shadow: [computed('box-shadow', 'var(--shadow-pop)')],
      title: computed('color', 'var(--primary)'),
      close: { right: 12, top: 12, inHeader: true },
      motion: ['0s', 'none', '0s'],
    })
    // The point at the panel's centre hits the panel, so nothing covers it
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    await expect(hit ? panel.contains(hit) : false).toBe(true)
  },
}

// Paragraphs enough to run past the bottom of any window
const paragraphs = Array.from({ length: 40 }, (_, index) => (
  <p key={index}>
    Change {index + 1}: the list keeps its scroll position when a filter is cleared, and the selection stays on the
    item it was on.
  </p>
))

// components::REQ-009/AC-05: content taller than the panel scrolls inside the body; scrolled to its end, the header and
// the close button stay where they were and the panel still fills the window's height. That the wheel scrolls the body
// to its last line is checked in tests/components-drawer.test.tsx.
export const LongContent: Story = {
  render: () => (
    <WithOpener title="Release notes">
      <div className="flex flex-col gap-3 text-sm">{paragraphs}</div>
    </WithOpener>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open details' }))
    const panel = await opened('dialog')
    const title = within(panel).getByRole('heading', { name: 'Release notes' })
    const close = within(panel).getByRole('button', { name: 'Close' })
    const header = title.parentElement
    const body = header?.nextElementSibling
    if (!header || !(body instanceof HTMLElement)) throw new Error('no body after the header')
    const before = [header.getBoundingClientRect().toJSON(), close.getBoundingClientRect().toJSON()]
    body.scrollTop = body.scrollHeight
    await expect({
      header: [header.getBoundingClientRect().toJSON(), close.getBoundingClientRect().toJSON()],
      panelBottom: panel.getBoundingClientRect().bottom,
    }).toEqual({ header: before, panelBottom: window.innerHeight })
  },
}

// A file name with no break opportunity in it, wider than the panel: no space, hyphen or slash
const word = `${'VeryLongFileName'.repeat(10)}.md`
const longTitle = `Release notes for ${word}`

// components::REQ-001/AC-05 and the long unbroken word: a title longer than the header wraps, staying clear of the
// close button, and the word in the title and in the body breaks onto further lines instead of running past the panel
export const LongText: Story = {
  render: () => (
    <WithOpener title={longTitle}>
      <p className="text-sm" data-word>
        {word}
      </p>
    </WithOpener>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open details' }))
    const panel = await opened('dialog')
    const title = within(panel).getByRole('heading', { name: longTitle })
    const close = within(panel).getByRole('button', { name: 'Close' })
    const text = panel.querySelector<HTMLElement>('[data-word]')
    const body = text?.parentElement
    if (!text || !body) throw new Error('no word in the body')
    const lineHeight = (element: HTMLElement) => parseFloat(getComputedStyle(element).lineHeight)
    await expect({
      titleLines: Math.round(title.getBoundingClientRect().height / lineHeight(title)) > 1,
      titleOverflow: title.scrollWidth > title.clientWidth,
      titleClearOfClose: title.getBoundingClientRect().right <= close.getBoundingClientRect().left,
      wordLines: Math.round(text.getBoundingClientRect().height / lineHeight(text)) > 1,
      bodyOverflow: body.scrollWidth > body.clientWidth,
    }).toEqual({ titleLines: true, titleOverflow: false, titleClearOfClose: true, wordLines: true, bodyOverflow: false })
  },
}
