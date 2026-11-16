// The ConfirmDialog's stories (stories/components-confirm-dialog.stories.tsx) under a real pointer and keyboard:
// Playwright's, which the browser treats as the user's, so keyboard focus moves and `:focus-visible` applies as they
// would for a person. Each story is rendered as Storybook renders it, inside the toolbar's ThemeProvider.
import { Button, ConfirmDialog, Drawer } from '@aloong-planet/ui'
import { composeStories } from '@storybook/react-vite'
import { useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-confirm-dialog.stories'
import { computed } from '../stories/support/computed'
import { isOpen, opened } from '../stories/support/dialog'
import { mount, unmount } from './support/mount'

const { Default, InsideDrawer } = composeStories(stories, preview)

const viewport = { width: window.innerWidth, height: window.innerHeight }

afterEach(async () => {
  unmount()
  window.scrollTo(0, 0)
  await page.viewport(viewport.width, viewport.height)
})

// The button inside `container` whose text is `name`
function button(container: Element, name: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((element) => element.textContent === name)
  if (!found) throw new Error(`no button ${name}`)
  return found
}

// The Default story's spy, cleared of what earlier tests recorded on it
function onConfirm() {
  const spy = Default.args.onConfirm
  if (!spy) throw new Error('no spy')
  return vi.mocked(spy).mockClear()
}

// Opens the dialog of `canvas` from the keyboard: Tab onto its opener, the first element of the page, and Enter
async function openByKeyboard(canvas: HTMLElement): Promise<{ opener: HTMLButtonElement; box: HTMLElement }> {
  const opener = button(canvas, 'Open the question')
  await userEvent.tab()
  expect(document.activeElement).toBe(opener)
  await userEvent.keyboard('{Enter}')
  return { opener, box: await opened('alertdialog') }
}

// Opens the dialog of `canvas` with a click on its opener
async function openByPointer(canvas: HTMLElement): Promise<{ opener: HTMLButtonElement; box: HTMLElement }> {
  const opener = button(canvas, 'Open the question')
  await userEvent.click(opener)
  return { opener, box: await opened('alertdialog') }
}

const cancellings: [string, (box: HTMLElement) => Promise<void>][] = [
  ['Esc', () => userEvent.keyboard('{Escape}')],
  ['the cancel button', (box) => userEvent.click(button(box, 'Cancel'))],
]

// components::REQ-010/AC-02, and AC-03 on closing: Esc and cancel close the dialog without running the action, and
// focus returns to the button that opened it
test.each(cancellings)('%s cancels the dialog and returns focus to its opener', async (_, cancel) => {
  const spy = onConfirm()
  const canvas = mount(<Default />)
  const { opener, box } = await openByKeyboard(canvas)
  await cancel(box)
  await vi.waitFor(() => expect({ open: isOpen('alertdialog'), focus: document.activeElement }).toEqual({ open: false, focus: opener }))
  expect(spy).not.toHaveBeenCalled()
})

// components::REQ-010/AC-02, and AC-03 on keeping focus inside: a click on the scrim leaves the dialog open and runs
// nothing. The click puts focus on the page, as a press on anything that takes no focus does, and the next Tab brings
// it back into the dialog rather than onto the page behind it: the browser moves on from cancel, where focus was.
test('a click on the scrim leaves the dialog open', async () => {
  const spy = onConfirm()
  const canvas = mount(<Default />)
  const { box } = await openByKeyboard(canvas)
  const scrim = document.elementFromPoint(5, 5)
  if (!(scrim instanceof HTMLElement) || box.contains(scrim)) throw new Error('no scrim beside the box')
  await userEvent.click(scrim, { position: { x: 5, y: 5 } })
  await new Promise((resolve) => setTimeout(resolve, 100))
  const afterClick = document.activeElement
  await userEvent.tab()
  expect({
    open: isOpen('alertdialog'),
    afterClick: afterClick?.tagName,
    afterTab: box.contains(document.activeElement),
    called: spy.mock.calls.length,
  }).toEqual({ open: true, afterClick: 'BODY', afterTab: true, called: 0 })
})

// components::REQ-010/AC-03: opened from the keyboard, focus moves onto cancel, and Tab and Shift+Tab cycle between
// cancel and the confirming action without leaving the dialog
test('keyboard focus moves onto cancel and Tab and Shift+Tab stay inside the dialog', async () => {
  const canvas = mount(<Default />)
  const { box } = await openByKeyboard(canvas)
  const cancel = button(box, 'Cancel')
  const confirm = button(box, 'Publish')
  expect(document.activeElement).toBe(cancel)
  const forward = []
  for (let step = 0; step < 3; step++) {
    await userEvent.tab()
    forward.push(document.activeElement)
  }
  expect(forward).toEqual([confirm, cancel, confirm])
  const backward = []
  for (let step = 0; step < 3; step++) {
    await userEvent.tab({ shift: true })
    backward.push(document.activeElement)
  }
  expect(backward).toEqual([cancel, confirm, cancel])
})

// An app that writes down, in order, what the dialog reports to it
function Recorder({ log }: { log: string[] }) {
  const [open, setOpen] = useState(true)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        log.push(`open ${next}`)
        setOpen(next)
      }}
      title="Publish the release?"
      cancelLabel="Cancel"
      confirmLabel="Publish"
      onConfirm={() => log.push('confirm')}
    >
      Version 2.4 goes out to everyone who uses the app.
    </ConfirmDialog>
  )
}

// components::REQ-010/AC-04: activating the confirming action from the keyboard runs the action once and closes the
// dialog, which reports the action before it reports closing; focus returns to the opener
test('the confirming action runs once, is reported before the dialog closes, and returns focus', async () => {
  const spy = onConfirm()
  const canvas = mount(<Default />)
  const { opener } = await openByKeyboard(canvas)
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  await vi.waitFor(() => expect({ open: isOpen('alertdialog'), focus: document.activeElement }).toEqual({ open: false, focus: opener }))
  expect(spy).toHaveBeenCalledTimes(1)
  unmount()
  const log: string[] = []
  mount(<Recorder log={log} />)
  const box = await opened('alertdialog')
  await userEvent.click(button(box, 'Publish'))
  await vi.waitFor(() => expect(isOpen('alertdialog')).toBe(false))
  expect(log).toEqual(['confirm', 'open false'])
})

// components::REQ-010/AC-05: the box is `min(520px, 88vw)` wide, centred on the window, 7vh below its top: 520px in a
// window wide enough for it, and 88% of a narrower one
test.each([
  [1200, { width: 520, left: 340, top: 56 }],
  [400, { width: 352, left: 24, top: 56 }],
])('in a window %ipx wide the box sits as it should', async (width, expected) => {
  await page.viewport(width, 800)
  const canvas = mount(<Default />)
  const { box } = await openByKeyboard(canvas)
  const rect = box.getBoundingClientRect()
  expect({ width: rect.width, left: rect.left, top: rect.top }).toEqual(expected)
})

// components::REQ-010/AC-09: Esc in a dialog opened from inside an open drawer closes only the dialog, returning focus
// to the drawer's button that opened it; the next Esc closes the drawer
test('Esc closes a dialog opened inside a drawer and leaves the drawer open', async () => {
  const canvas = mount(<InsideDrawer />)
  const opener = button(canvas, 'Open details')
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  const panel = await opened('dialog')
  const remove = button(panel, 'Delete')
  await userEvent.tab()
  expect(document.activeElement).toBe(remove)
  await userEvent.keyboard('{Enter}')
  await opened('alertdialog')
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() =>
    expect({ dialog: isOpen('alertdialog'), drawer: isOpen('dialog'), focus: document.activeElement }).toEqual({
      dialog: false,
      drawer: true,
      focus: remove,
    }),
  )
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect({ drawer: isOpen('dialog'), focus: document.activeElement }).toEqual({ drawer: false, focus: opener }))
})

// components::REQ-001/AC-01 on the dialog: opened from the keyboard, cancel takes focus with the 2px `--ring` outline
// 2px outside it; opened by the pointer, without one. Each opens a dialog on a fresh page: Chromium carries a focus
// ring over from an element that showed one to the next element focused by script.
test.each([
  ['the keyboard', openByKeyboard, { focused: true, style: 'solid', width: '2px', ring: true, offset: '2px' }],
  ['the pointer', openByPointer, { focused: true, style: 'none' }],
])('opened by %s, cancel takes focus with the outline keyboard focus shows, or without it', async (_, open, expected) => {
  const canvas = mount(<Default />)
  const { box } = await open(canvas)
  const cancel = button(box, 'Cancel')
  const style = getComputedStyle(cancel)
  expect({
    focused: document.activeElement === cancel,
    style: style.outlineStyle,
    width: style.outlineWidth,
    ring: style.outlineColor === computed('color', 'var(--ring)'),
    offset: style.outlineOffset,
  }).toMatchObject(expected)
})

// A page whose confirm dialog sits in a view that a link in the dialog's body leaves, as an app leaves the view holding
// an open dialog: the dialog goes off the page while the app still says it is open. Its opener stays on the page.
function LeavingTheView() {
  const [open, setOpen] = useState(false)
  const [inView, setInView] = useState(true)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open the question</Button>
      {inView && (
        <section>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Publish the release?"
            cancelLabel="Cancel"
            confirmLabel="Publish"
            onConfirm={() => {}}
          >
            Its notes appear on the{' '}
            <a
              href="#release"
              onClick={(event) => {
                event.preventDefault()
                setInView(false)
              }}
            >
              release page
            </a>
            .
          </ConfirmDialog>
        </section>
      )}
      <div style={{ height: 3 * window.innerHeight }} />
    </>
  )
}

// The boundary of an open confirm dialog removed from the page: the page behind it scrolls again, and focus returns to
// the element that had it when the dialog opened, as on closing
test('a confirm dialog removed from the page while open lets the page scroll again and returns focus', async () => {
  const canvas = mount(<LeavingTheView />)
  const { opener, box } = await openByKeyboard(canvas)
  const link = box.querySelector('a')
  if (!link) throw new Error('no link in the body')
  await userEvent.click(link)
  await vi.waitFor(() => expect({ open: isOpen('alertdialog'), focus: document.activeElement }).toEqual({ open: false, focus: opener }))
  await userEvent.wheel(opener, { delta: { y: 400 } })
  await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0))
})

// Files, each on a row with a Delete button that asks first and, confirmed, removes the row and its button
function Files() {
  const [files, setFiles] = useState(['a.md', 'b.md', 'c.md'])
  const [asking, setAsking] = useState<string | null>(null)
  return (
    <>
      {files.map((file) => (
        <div key={file}>
          {file} <Button onClick={() => setAsking(file)}>{`Delete ${file}`}</Button>
        </div>
      ))}
      <ConfirmDialog
        open={asking !== null}
        onOpenChange={(open) => {
          if (!open) setAsking(null)
        }}
        title="Delete the file?"
        cancelLabel="Cancel"
        confirmLabel="Delete"
        destructive
        onConfirm={() => setFiles((current) => current.filter((file) => file !== asking))}
      >
        The file is deleted for good.
      </ConfirmDialog>
    </>
  )
}

// Asks to delete the file of the focused Delete button, from the keyboard, and answers with the button named `answer`
async function ask(answer: 'Cancel' | 'Delete') {
  await userEvent.keyboard('{Enter}')
  const box = await opened('alertdialog')
  if (answer === 'Delete') await userEvent.tab()
  expect(document.activeElement?.textContent).toBe(answer)
  await userEvent.keyboard('{Enter}')
  await vi.waitFor(() => expect(isOpen('alertdialog')).toBe(false))
  return box
}

// The boundary of the element that had focus being gone, on a page: the confirmed action removed the Delete button
// that opened the dialog, so focus is left on the page for the app to move on, rather than sent to the Delete button of
// another row, which had focus when an earlier dialog opened
test('on a page, focus is left on the page when the confirmed action removed the button that opened the dialog', async () => {
  const canvas = mount(<Files />)
  await userEvent.tab()
  expect(document.activeElement).toBe(button(canvas, 'Delete a.md'))
  await ask('Cancel')
  expect(document.activeElement).toBe(button(canvas, 'Delete a.md'))
  await userEvent.tab()
  expect(document.activeElement).toBe(button(canvas, 'Delete b.md'))
  await ask('Delete')
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect({ rows: [...canvas.querySelectorAll('button')].map((element) => element.textContent), focus: document.activeElement }).toEqual({
    rows: ['Delete a.md', 'Delete c.md'],
    focus: document.body,
  })
})

// The boundary of the element that had focus being gone, inside a drawer: the confirmed action removed the Delete
// button inside the open drawer that opened the dialog, so focus moves into the drawer, onto its close button, rather
// than onto the button behind the drawer that opened the drawer
test('inside a drawer, focus moves into the drawer when the confirmed action removed the button that opened the dialog', async () => {
  function FilesDrawer() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open details</Button>
        <Drawer open={open} onOpenChange={setOpen} title="Files" closeLabel="Close">
          <Files />
        </Drawer>
      </>
    )
  }
  mount(<FilesDrawer />)
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  const panel = await opened('dialog')
  await userEvent.tab()
  await userEvent.tab()
  expect(document.activeElement).toBe(button(panel, 'Delete b.md'))
  await ask('Delete')
  const close = panel.querySelector('[aria-label="Close"]')
  await vi.waitFor(() =>
    expect({ drawer: isOpen('dialog'), deleted: panel.textContent?.includes('b.md'), focus: document.activeElement }).toEqual({
      drawer: true,
      deleted: false,
      focus: close,
    }),
  )
})
