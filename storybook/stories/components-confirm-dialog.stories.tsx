// components::REQ-010 and the shared states of components::REQ-001 on the ConfirmDialog, in a consumer of the kit. The
// owner confirms the ConfirmDialog's look on these stories, switching the theme and light/dark with the toolbar
// (components::CON-002); each story opens its dialog in its play function. How it is answered, where keyboard focus
// goes, the box's width in windows of different widths and what the wheel scrolls are checked with a real pointer and
// keyboard in tests/components-confirm-dialog.test.tsx, since a play function's events do not move focus or scroll as
// a person's do.
import { Button, ConfirmDialog, Drawer } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { computed } from './support/computed'
import { opened } from './support/dialog'
import { castShadows } from './support/floating'

const meta = {
  title: 'Components/ConfirmDialog',
} satisfies Meta

export default meta

type Question = { title: ReactNode; body: ReactNode; confirmLabel: ReactNode; destructive?: boolean }

// A confirm dialog as an app uses one: opened by a button on the page, its `open` held in the app's state and cleared
// by `onOpenChange` on cancelling and on confirming; `onConfirm` is the app's action
function WithOpener({ question, onConfirm }: { question: Question; onConfirm: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open the question</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={question.title}
        cancelLabel="Cancel"
        confirmLabel={question.confirmLabel}
        destructive={question.destructive}
        onConfirm={onConfirm}
      >
        {question.body}
      </ConfirmDialog>
    </>
  )
}

const publish: Question = {
  title: 'Publish the release?',
  body: 'Version 2.4 goes out to everyone who uses the app, and its notes appear on the release page.',
  confirmLabel: 'Publish',
}

const remove: Question = {
  title: 'Delete the project?',
  body: 'The project and its 12 files are deleted for good. This cannot be undone.',
  confirmLabel: 'Delete',
  destructive: true,
}

// The look of a button of each variant, read from the button the story marks
function look(element: Element) {
  const style = getComputedStyle(element)
  return { ground: style.backgroundColor, border: style.borderTopColor, text: style.color }
}

const looks = {
  default: () => ({
    ground: computed('color', 'var(--background)'),
    border: computed('color', 'var(--border-strong)'),
    text: computed('color', 'var(--foreground)'),
  }),
  primary: () => ({
    ground: computed('color', 'var(--primary)'),
    border: computed('color', 'var(--primary)'),
    text: computed('color', 'var(--primary-foreground)'),
  }),
  danger: () => ({
    ground: computed('color', 'var(--destructive)'),
    border: computed('color', 'var(--destructive)'),
    text: computed('color', 'var(--destructive-foreground)'),
  }),
}

// The dialog open, for the owner to confirm its look. components::REQ-010/AC-01, AC-03 announced, AC-05 and AC-06, and
// components::REQ-001/AC-03 and AC-04: an alert dialog named by its title and described by its body; the box sits as
// far from the window's left edge as from its right, 7vh below its top, over a scrim in `--overlay` that covers the
// window; it is a floating surface (`--popover` ground, 1px `--border-strong` border, `--shadow-pop`) that nothing
// covers; below the body sit cancel, a `default` button, and then the confirming action, a `primary` button, 8px
// apart, at the bottom right inside the box's padding; nothing moves as it opens. The box's width in windows of two
// widths is checked in tests/components-confirm-dialog.test.tsx.
export const Default: StoryObj<{ onConfirm: () => void }> = {
  args: { onConfirm: fn() },
  render: ({ onConfirm }) => <WithOpener question={publish} onConfirm={onConfirm} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open the question' }))
    const box = await opened('alertdialog')
    const rect = box.getBoundingClientRect()
    const style = getComputedStyle(box)
    const cancel = within(box).getByRole('button', { name: 'Cancel' })
    const confirm = within(box).getByRole('button', { name: 'Publish' })
    const body = within(box).getByText(publish.body as string)
    const [cancelBox, confirmBox, bodyBox] = [cancel, confirm, body].map((element) => element.getBoundingClientRect())
    const scrim = document.elementFromPoint(1, 1)
    if (!(scrim instanceof HTMLElement) || box.contains(scrim)) throw new Error('no scrim beside the box')
    const scrimBox = scrim.getBoundingClientRect()
    await expect({
      named: within(document.body).getByRole('alertdialog', { name: 'Publish the release?', description: publish.body as string }) === box,
      centred: Math.abs(rect.left - (window.innerWidth - rect.right)) < 1,
      top: Math.round(rect.top),
      scrim: {
        box: [scrimBox.left, scrimBox.top, scrimBox.width, scrimBox.height],
        ground: getComputedStyle(scrim).backgroundColor,
      },
      ground: style.backgroundColor,
      border: [style.borderTopWidth, style.borderTopColor],
      shadow: castShadows(style.boxShadow),
      buttons: {
        cancel: look(cancel),
        confirm: look(confirm),
        gap: confirmBox.left - cancelBox.right,
        right: rect.right - confirmBox.right,
        belowBody: cancelBox.top >= bodyBox.bottom && cancelBox.top === confirmBox.top,
      },
      motion: [style.transitionDuration, style.animationName, getComputedStyle(scrim).transitionDuration],
    }).toEqual({
      named: true,
      centred: true,
      top: Math.round(window.innerHeight * 0.07),
      scrim: { box: [0, 0, window.innerWidth, window.innerHeight], ground: computed('color', 'var(--overlay)') },
      ground: computed('color', 'var(--popover)'),
      border: ['1px', computed('color', 'var(--border-strong)')],
      shadow: [computed('box-shadow', 'var(--shadow-pop)')],
      buttons: { cancel: looks.default(), confirm: looks.primary(), gap: 8, right: 27, belowBody: true },
      motion: ['0s', 'none', '0s'],
    })
    // The point at the box's centre hits the box, so nothing covers it
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    await expect(hit ? box.contains(hit) : false).toBe(true)
  },
}

// components::REQ-010/AC-01: an action the caller marks destructive is a `danger` button; cancel stays a `default` one
export const Destructive: StoryObj<{ onConfirm: () => void }> = {
  args: { onConfirm: fn() },
  render: ({ onConfirm }) => <WithOpener question={remove} onConfirm={onConfirm} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open the question' }))
    const box = await opened('alertdialog')
    await expect({
      cancel: look(within(box).getByRole('button', { name: 'Cancel' })),
      confirm: look(within(box).getByRole('button', { name: 'Delete' })),
    }).toEqual({ cancel: looks.default(), confirm: looks.danger() })
  },
}

// Paragraphs enough to run past the bottom of any window
const paragraphs = Array.from({ length: 30 }, (_, index) => (
  <p key={index}>
    Change {index + 1}: the list keeps its scroll position when a filter is cleared, and the selection stays on the
    item it was on.
  </p>
))

// components::REQ-010/AC-07: a body taller than the room left scrolls inside the box, which ends inside the window,
// with the title and both buttons in view. That the wheel scrolls the body to its last line is checked in
// tests/components-confirm-dialog.test.tsx.
export const LongBody: StoryObj<{ onConfirm: () => void }> = {
  args: { onConfirm: fn() },
  render: ({ onConfirm }) => (
    <WithOpener
      question={{ ...publish, body: <div className="flex flex-col gap-2">{paragraphs}</div> }}
      onConfirm={onConfirm}
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open the question' }))
    const box = await opened('alertdialog')
    const title = within(box).getByRole('heading', { name: 'Publish the release?' })
    const body = title.nextElementSibling
    if (!(body instanceof HTMLElement)) throw new Error('no body after the title')
    const inWindow = (element: Element) => {
      const rect = element.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    }
    await expect({
      boxInWindow: inWindow(box),
      title: inWindow(title),
      buttons: within(box).getAllByRole('button').map(inWindow),
    }).toEqual({ boxInWindow: true, title: true, buttons: [true, true] })
  },
}

// A file name with no break opportunity in it, wider than the box: no space, hyphen or slash
const word = `${'VeryLongFileName'.repeat(10)}.md`
const longTitle = `Delete ${word}?`

// components::REQ-001/AC-05 and the long unbroken word: a title longer than the box wraps, and the word in the title and
// in the body breaks onto further lines instead of running past the box
export const LongText: StoryObj<{ onConfirm: () => void }> = {
  args: { onConfirm: fn() },
  render: ({ onConfirm }) => (
    <WithOpener question={{ ...remove, title: longTitle, body: <p data-word>{word}</p> }} onConfirm={onConfirm} />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open the question' }))
    const box = await opened('alertdialog')
    const title = within(box).getByRole('heading', { name: longTitle })
    const text = box.querySelector<HTMLElement>('[data-word]')
    const body = text?.parentElement
    if (!text || !body) throw new Error('no word in the body')
    const lines = (element: HTMLElement) =>
      Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight))
    await expect({
      titleLines: lines(title) > 1,
      titleOverflow: title.scrollWidth > title.clientWidth,
      wordLines: lines(text) > 1,
      bodyOverflow: body.scrollWidth > body.clientWidth,
    }).toEqual({ titleLines: true, titleOverflow: false, wordLines: true, bodyOverflow: false })
  },
}

// A drawer listing files, each with a Delete button that asks first. The dialog is rendered inside the drawer's body,
// so Base UI nests it in the drawer's dialog.
function FilesDrawer({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open details</Button>
      <Drawer open={open} onOpenChange={setOpen} title="Files" closeLabel="Close">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>notes/2026-11-16.md</span>
          <Button size="sm" onClick={() => setAsking(true)}>
            Delete
          </Button>
        </div>
        <ConfirmDialog
          open={asking}
          onOpenChange={setAsking}
          title="Delete the file?"
          cancelLabel="Cancel"
          confirmLabel="Delete"
          destructive
          onConfirm={onConfirm}
        >
          notes/2026-11-16.md is deleted for good.
        </ConfirmDialog>
      </Drawer>
    </>
  )
}

// components::REQ-010/AC-08: opened from inside an open drawer, the dialog sits over a scrim of its own that covers the
// window, so a point on the drawer beside the box lands on it, as does a point beside the drawer, where the drawer's
// own scrim stays under it: the drawer is dimmed once and the page beside it twice. The owner judges the double dimming
// here.
export const InsideDrawer: StoryObj<{ onConfirm: () => void }> = {
  args: { onConfirm: fn() },
  render: ({ onConfirm }) => <FilesDrawer onConfirm={onConfirm} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open details' }))
    const panel = await opened('dialog')
    const drawerScrim = document.elementFromPoint(5, 5)
    await userEvent.click(within(panel).getByRole('button', { name: 'Delete' }))
    const box = await opened('alertdialog')
    const panelBox = panel.getBoundingClientRect()
    const onDrawer = document.elementFromPoint(panelBox.right - 20, panelBox.bottom - 20)
    if (!(onDrawer instanceof HTMLElement) || panel.contains(onDrawer) || box.contains(onDrawer)) {
      throw new Error('nothing over the drawer beside the box')
    }
    const scrimBox = onDrawer.getBoundingClientRect()
    await expect({
      sameBesideDrawer: document.elementFromPoint(5, 5) === onDrawer,
      ownScrim: onDrawer !== drawerScrim,
      drawerScrimUnder: drawerScrim?.isConnected,
      box: [scrimBox.left, scrimBox.top, scrimBox.width, scrimBox.height],
      ground: getComputedStyle(onDrawer).backgroundColor,
    }).toEqual({
      sameBesideDrawer: true,
      ownScrim: true,
      drawerScrimUnder: true,
      box: [0, 0, window.innerWidth, window.innerHeight],
      ground: computed('color', 'var(--overlay)'),
    })
  },
}
