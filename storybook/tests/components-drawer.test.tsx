// The Drawer's stories (stories/components-drawer.stories.tsx) under a real pointer and keyboard: Playwright's, which
// the browser treats as the user's, so keyboard focus moves, `:focus-visible` applies and the page scrolls as they would
// for a person. Each story is rendered as Storybook renders it, inside the toolbar's ThemeProvider.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Button, Drawer } from '@aloong-planet/ui'
import { useState } from 'react'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-drawer.stories'
import { computed } from '../stories/support/computed'
import { isOpen, opened } from '../stories/support/dialog'
import { mount, unmount } from './support/mount'

const { Default } = composeStories(stories, preview)

const viewport = { width: window.innerWidth, height: window.innerHeight }

afterEach(async () => {
  unmount()
  window.scrollTo(0, 0)
  await page.viewport(viewport.width, viewport.height)
})

// The button of `canvas` whose text is `name`
function button(canvas: HTMLElement, name: string): HTMLButtonElement {
  const found = [...canvas.querySelectorAll('button')].find((element) => element.textContent === name)
  if (!found) throw new Error(`no button ${name}`)
  return found
}

// Opens the drawer of `canvas` from the keyboard: Tab onto its opener, the first element of the page, and Enter
async function openByKeyboard(canvas: HTMLElement): Promise<{ opener: HTMLButtonElement; panel: HTMLElement }> {
  const opener = button(canvas, 'Open details')
  await userEvent.tab()
  expect(document.activeElement).toBe(opener)
  await userEvent.keyboard('{Enter}')
  return { opener, panel: await opened('dialog') }
}

// The scrim at the window's top-left corner, beside the panel
function scrim(panel: HTMLElement): HTMLElement {
  const hit = document.elementFromPoint(5, 5)
  if (!(hit instanceof HTMLElement) || panel.contains(hit)) throw new Error('no scrim beside the panel')
  return hit
}

function closeButton(panel: HTMLElement): HTMLElement {
  const found = panel.querySelector<HTMLElement>('[aria-label="Close"]')
  if (!found) throw new Error('no close button')
  return found
}

const closings: [string, (panel: HTMLElement) => Promise<void>][] = [
  ['Esc', () => userEvent.keyboard('{Escape}')],
  ['a click on the scrim', (panel) => userEvent.click(scrim(panel), { position: { x: 5, y: 5 } })],
  ['the close button', (panel) => userEvent.click(closeButton(panel))],
]

// components::REQ-009/AC-01, and AC-02 on closing: Esc, a click on the scrim and the close button each close the drawer,
// and focus returns to the button that opened it
test.each(closings)('%s closes the drawer and returns focus to its opener', async (_, close) => {
  const canvas = mount(<Default />)
  const { opener, panel } = await openByKeyboard(canvas)
  await close(panel)
  await vi.waitFor(() => expect({ open: isOpen('dialog'), focus: document.activeElement }).toEqual({ open: false, focus: opener }))
})

// components::REQ-009/AC-02: opened from the keyboard, focus moves onto the close button, the first element in the
// drawer that takes focus, and Tab and Shift+Tab cycle through the close button, the body's link and its button without
// leaving the drawer
test('keyboard focus moves into the drawer and Tab and Shift+Tab stay inside it', async () => {
  const canvas = mount(<Default />)
  const { panel } = await openByKeyboard(canvas)
  const close = closeButton(panel)
  const link = panel.querySelector('a')
  const action = button(panel, 'Copy the link')
  expect(document.activeElement).toBe(close)
  const forward = []
  for (let step = 0; step < 4; step++) {
    await userEvent.tab()
    forward.push(document.activeElement)
  }
  expect(forward).toEqual([link, action, close, link])
  const backward = []
  for (let step = 0; step < 4; step++) {
    await userEvent.tab({ shift: true })
    backward.push(document.activeElement)
  }
  expect(backward).toEqual([close, action, link, close])
})

// components::REQ-009/AC-02: while the drawer is open, the page behind it does not scroll, under the wheel or the
// keyboard; once it has closed, the same wheel scrolls the page. The page is made taller than the window.
test('the page behind an open drawer does not scroll', async () => {
  const canvas = mount(
    <>
      <Default />
      <div style={{ height: 3 * window.innerHeight }} />
    </>,
  )
  const { opener, panel } = await openByKeyboard(canvas)
  const title = panel.querySelector('h2')
  if (!title) throw new Error('no title')
  await userEvent.wheel(title, { delta: { y: 400 } })
  await userEvent.keyboard('{PageDown}{End}')
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(window.scrollY).toBe(0)
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect(isOpen('dialog')).toBe(false))
  await userEvent.wheel(opener, { delta: { y: 400 } })
  await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0))
})

// components::REQ-009/AC-04: the panel is `min(720px, 80vw)` wide: 720px in a window wide enough for it, and 80% of a
// narrower one, always on the window's right edge for its full height
test.each([
  [1200, 720],
  [600, 480],
])('in a window %ipx wide the panel is %ipx wide', async (width, expected) => {
  await page.viewport(width, 800)
  const canvas = mount(<Default />)
  const { panel } = await openByKeyboard(canvas)
  const box = panel.getBoundingClientRect()
  expect({ width: box.width, right: box.right, top: box.top, bottom: box.bottom }).toEqual({
    width: expected,
    right: width,
    top: 0,
    bottom: 800,
  })
})

// Opens the drawer of `canvas` with a click on its opener
async function openByPointer(canvas: HTMLElement): Promise<{ opener: HTMLButtonElement; panel: HTMLElement }> {
  const opener = button(canvas, 'Open details')
  await userEvent.click(opener)
  return { opener, panel: await opened('dialog') }
}

// components::REQ-001/AC-01 on the drawer: opened from the keyboard, the close button that takes focus shows the 2px
// `--ring` outline 2px outside it; opened by the pointer, it takes focus without one. Each opens a drawer on a fresh
// page: Chromium carries a focus ring over from an element that showed one to the next element focused by script.
test.each([
  ['the keyboard', openByKeyboard, { focused: true, style: 'solid', width: '2px', ring: true, offset: '2px' }],
  ['the pointer', openByPointer, { focused: true, style: 'none' }],
])('opened by %s, the close button takes focus with the outline keyboard focus shows, or without it', async (_, open, expected) => {
  const canvas = mount(<Default />)
  const { panel } = await open(canvas)
  const close = closeButton(panel)
  const style = getComputedStyle(close)
  expect({
    focused: document.activeElement === close,
    style: style.outlineStyle,
    width: style.outlineWidth,
    ring: style.outlineColor === computed('color', 'var(--ring)'),
    offset: style.outlineOffset,
  }).toMatchObject(expected)
})

// A page whose drawer sits in a view that a button in the drawer leaves, as an app leaves the view holding an open
// drawer: the drawer goes off the page while the app still says it is open. Its opener stays on the page.
function LeavingTheView() {
  const [open, setOpen] = useState(false)
  const [inView, setInView] = useState(true)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open details</Button>
      {inView && (
        <section>
          <Drawer open={open} onOpenChange={setOpen} title="Release notes" closeLabel="Close">
            <Button onClick={() => setInView(false)}>Leave the view</Button>
          </Drawer>
        </section>
      )}
      <div style={{ height: 3 * window.innerHeight }} />
    </>
  )
}

// The boundary of an open drawer removed from the page: the page behind it scrolls again, and focus returns to the
// element that had it when the drawer opened, as on closing
test('a drawer removed from the page while open lets the page scroll again and returns focus', async () => {
  const canvas = mount(<LeavingTheView />)
  const { opener, panel } = await openByKeyboard(canvas)
  await userEvent.click(button(panel, 'Leave the view'))
  await vi.waitFor(() => expect({ open: isOpen('dialog'), focus: document.activeElement }).toEqual({ open: false, focus: opener }))
  await userEvent.wheel(opener, { delta: { y: 400 } })
  await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0))
})
