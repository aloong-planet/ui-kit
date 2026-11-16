// The Toast's stories (stories/components-toast.stories.tsx) under a real pointer and keyboard, with toasts raised by
// the test itself, which runs outside any React component. Each story is rendered as Storybook renders it, inside the
// toolbar's ThemeProvider.
//
// Gaps: the column scrolled up when the very toast it holds in place leaves in the same change as one arrives; no path
// a user takes reaches it, since a press scrolls the toast it lands on 18px inside the column, with a newer toast in
// view below it, and toasts leave on their timer oldest first. Measured in Chromium only: the toasts in view are held
// in place by the kit's own code in every browser, with the browser's scroll anchoring turned off, so Safari, which has
// none, runs the same code; it has not been run there.
import { Button, ConfirmDialog, Drawer, toast, Toaster } from '@aloong-planet/ui'
import { composeStories } from '@storybook/react-vite'
import { useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-toast.stories'
import { computed } from '../stories/support/computed'
import { opened } from '../stories/support/dialog'
import { inFront } from '../stories/support/floating'
import { frames } from '../stories/support/frames'
import { region, shown, toasts } from '../stories/support/toast'
import { button } from './support/button'
import { mount, unmount } from './support/mount'

const { Success } = composeStories(stories, preview)

const viewport = { width: window.innerWidth, height: window.innerHeight }

afterEach(async () => {
  unmount()
  await page.viewport(viewport.width, viewport.height)
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// How long after `from` the toasts on the page are all gone, checked every frame for up to `within` milliseconds
async function goneAfter(from: number, within: number): Promise<number> {
  while (performance.now() - from < within) {
    if (shown().length === 0) return performance.now() - from
    await frames(1)
  }
  throw new Error(`toasts still shown ${within}ms after`)
}

// components::REQ-011/AC-06 and AC-03: a toast raised by code outside any component appears in the Toaster's region,
// which is on the page, labelled and polite, before the toast arrives, so screen readers announce what lands in it
test('code outside any component raises a toast, which appears in the labelled region', async () => {
  mount(<Success />)
  await frames(2)
  expect([region().getAttribute('aria-label'), region().getAttribute('aria-live'), shown().length]).toEqual([
    'Messages',
    'polite',
    0,
  ])
  toast.success('Raised outside React')
  const [element] = await toasts(1)
  expect({ text: element.textContent, inRegion: region().contains(element) }).toEqual({
    text: 'Raised outside React',
    inRegion: true,
  })
})

// components::REQ-011/AC-01: with the pointer away from it, a toast is still shown 3000ms after it is raised, which is
// when it appears, and is gone about 3200ms after
test('a toast leaves 3200ms after it appears', async () => {
  mount(<Success />)
  const raised = performance.now()
  toast.success('Saved the settings')
  await toasts(1)
  await wait(3000 - (performance.now() - raised))
  expect(shown().length).toBe(1)
  const gone = await goneAfter(raised, 4000)
  expect(gone).toBeGreaterThanOrEqual(3200)
  expect(gone).toBeLessThan(3500)
})

// components::REQ-011/AC-09: a toast raised while no Toaster is mounted is held, appears when one mounts, and leaves
// 3200ms after it appears
test('a toast raised before the Toaster mounts appears when it mounts and leaves 3200ms later', async () => {
  toast.error('Raised before the Toaster')
  await frames(3)
  expect(shown().length).toBe(0)
  const mounted = performance.now()
  mount(<Success />)
  const [element] = await toasts(1)
  expect(element.textContent).toBe('Raised before the Toaster')
  const gone = await goneAfter(mounted, 4000)
  expect(gone).toBeGreaterThanOrEqual(3200)
  expect(gone).toBeLessThan(3500)
})

// components::REQ-011/AC-07: a pointer drag down on a toast, and one to the right, each take it away well before its
// 3200ms. The toast dragged down is the top one of three, so that the drag stays inside the window; each drag moves
// the pointer in steps, as a hand does, since Base UI takes the first move of a drag as its start.
test('a toast can be swiped away down or to the right', async () => {
  mount(<Success />)
  toast.success('Saved the first file')
  toast.success('Saved the second file')
  toast.success('Saved the third file')
  const [first, , third] = await toasts(3)
  const start = performance.now()
  await userEvent.dragAndDrop(first, third, { steps: 10 })
  await vi.waitFor(() => expect(shown().map((element) => element.textContent)).toEqual(['Saved the second file', 'Saved the third file']))
  const [second] = shown()
  const box = second.getBoundingClientRect()
  await userEvent.dragAndDrop(second, document.documentElement, {
    targetPosition: { x: box.right + 80, y: box.top + box.height / 2 },
    steps: 10,
  })
  await vi.waitFor(() => expect(shown().map((element) => element.textContent)).toEqual(['Saved the third file']))
  expect(performance.now() - start).toBeLessThan(2000)
})

// components::REQ-011/AC-10 and components::REQ-001/AC-01 on a toast: F6 moves the keyboard to the toasts' region, and
// Tab from there to the newest toast and on to each older one in turn (Base UI); the toast with keyboard focus shows a
// 2px `--ring` outline 2px outside it
test('the keyboard reaches each toast, newest first, and the toast it is on shows the keyboard focus outline', async () => {
  mount(<Success />)
  toast.success('Saved the first file')
  toast.error('Could not save the second file')
  toast.success('Saved the third file')
  const [first] = await toasts(3)
  await userEvent.keyboard('{F6}')
  await vi.waitFor(() => expect(document.activeElement).toBe(region()))
  const reached: (Element | null)[] = []
  for (let index = 0; index < 3; index++) {
    await userEvent.tab()
    reached.push(document.activeElement)
  }
  expect(reached.map((element) => element?.textContent)).toEqual([
    'Saved the third file',
    'Could not save the second file',
    'Saved the first file',
  ])
  const style = getComputedStyle(first)
  expect({ style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset }).toEqual({
    style: 'solid',
    width: '2px',
    colour: computed('color', 'var(--ring)'),
    offset: '2px',
  })
})

// A window 300px tall and more toasts than it holds: eight, raised oldest first, returned from top to bottom as they
// stand, with whether a toast stands whole inside the window
async function overflowing(): Promise<{ all: HTMLElement[]; whole: (element: HTMLElement) => boolean }> {
  await page.viewport(viewport.width, 300)
  mount(<Success />)
  for (const index of [1, 2, 3, 4, 5, 6, 7, 8]) toast.success(`Saved file ${index}`)
  const all = await toasts(8)
  const whole = (element: HTMLElement) => {
    const box = element.getBoundingClientRect()
    return box.top >= 0 && box.bottom <= window.innerHeight
  }
  return { all, whole }
}
const px = (length: number) => Math.round(length) + 0

// components::REQ-011/AC-08 and the boundary "More toasts than the window holds": the column stays inside the window
// and starts at the newest, 18px above the bottom edge, while the oldest is out of view above; the wheel over the
// toasts scrolls the column, which still takes no pointer, until the oldest stands 18px below the window's top edge
test('more toasts than the window holds stay inside it, and the wheel over them brings the oldest into view', async () => {
  const { all, whole } = await overflowing()
  const [oldest] = all
  const newest = all[all.length - 1]
  expect({
    texts: [oldest.textContent, newest.textContent],
    newest: whole(newest),
    newestBottom: px(window.innerHeight - newest.getBoundingClientRect().bottom),
    oldest: whole(oldest),
    column: [px(region().getBoundingClientRect().top) >= 0, px(region().getBoundingClientRect().bottom) <= window.innerHeight],
  }).toEqual({
    texts: ['Saved file 1', 'Saved file 8'],
    newest: true,
    newestBottom: 18,
    oldest: false,
    column: [true, true],
  })
  await userEvent.wheel(newest, { delta: { y: -2000 } })
  await vi.waitFor(() => expect(px(oldest.getBoundingClientRect().top)).toBe(18))
  expect(getComputedStyle(region()).pointerEvents).toBe('none')
})

// The boundary "More toasts than the window holds": the column, now as tall as the window, takes no pointer beside its
// toasts, so a click on the page beneath it acts there: on the story's button, which raises one more toast
test('a click beside the toasts of a column as tall as the window acts on the page beneath it', async () => {
  await overflowing()
  const save = document.querySelector<HTMLElement>('#storybook-root button, body > div button')
  if (!save) throw new Error('no button')
  const button = save.getBoundingClientRect()
  const column = region().getBoundingClientRect()
  expect(button.top >= column.top && button.bottom <= column.bottom).toBe(true)
  await userEvent.click(save)
  await toasts(9)
})

// The boundary "More toasts than the window holds": a toast raised while the column stands at the newest is shown at
// the bottom, 18px above the window's bottom edge, in the newest's place
test('a toast raised while the column stands at the newest is shown at the bottom', async () => {
  await overflowing()
  toast.success('Saved file 9')
  const all = await toasts(9)
  const newest = all[all.length - 1]
  expect({ text: newest.textContent, bottom: px(window.innerHeight - newest.getBoundingClientRect().bottom) }).toEqual({
    text: 'Saved file 9',
    bottom: 18,
  })
})

// The boundary "More toasts than the window holds": a toast raised while the column is scrolled up from the newest
// leaves the toasts in view where they stand, also with the keyboard in the toasts' region, where Base UI adds its
// focus guards beside the toasts
test.each(['pointer', 'pointer and the keyboard'])('a toast raised while the column is scrolled up leaves the toasts in view where they stand (with the %s on the toasts)', async (on) => {
  const { all, whole } = await overflowing()
  if (on !== 'pointer') {
    await userEvent.keyboard('{F6}')
    await vi.waitFor(() => expect(document.activeElement).toBe(region()))
  }
  await userEvent.wheel(all[all.length - 1], { delta: { y: -60 } })
  await frames(10)
  const watched = all.find((element) => whole(element) && element.getBoundingClientRect().top > 40)
  if (!watched) throw new Error('no toast in view')
  const before = px(watched.getBoundingClientRect().top)
  toast.success('Saved file 9')
  await toasts(9)
  expect(px(watched.getBoundingClientRect().top)).toBe(before)
})

// The boundary "More toasts than the window holds": a toast swiped away while the column is scrolled up from the
// newest lets the older toasts above it move down into its place, while the newer ones stay where they stand. The toast
// swiped stands whole 18px inside the column, so that the focus a press gives it scrolls nothing.
test('a toast swiped away while the column is scrolled up lets the older ones move down into its place', async () => {
  const { all } = await overflowing()
  await userEvent.wheel(all[all.length - 1], { delta: { y: -60 } })
  await frames(10)
  const inside = all.filter((element) => {
    const box = element.getBoundingClientRect()
    return box.top >= 18 && box.bottom <= window.innerHeight - 18
  })
  const swiped = inside[inside.length - 1]
  const [older, newer] = [all[all.indexOf(swiped) - 1], all[all.indexOf(swiped) + 1]]
  const top = (element: HTMLElement) => px(element.getBoundingClientRect().top)
  const before = { swiped: top(swiped), newer: top(newer) }
  const box = swiped.getBoundingClientRect()
  await userEvent.dragAndDrop(swiped, document.documentElement, {
    targetPosition: { x: box.right + 80, y: box.top + box.height / 2 },
    steps: 10,
  })
  await vi.waitFor(() => expect(swiped.isConnected).toBe(false))
  await frames(2)
  expect({ older: top(older), newer: top(newer) }).toEqual({ older: before.swiped, newer: before.newer })
})

// The boundary "More toasts than the window holds" and components::REQ-011/AC-10: after F6, each toast Tab reaches
// stands whole in the window, at least 18px from its top and bottom edges, as it takes the focus, from the newest to
// the oldest
test('Tab after F6 brings each toast into view as it takes the focus', async () => {
  const { all } = await overflowing()
  await userEvent.keyboard('{F6}')
  await vi.waitFor(() => expect(document.activeElement).toBe(region()))
  const reached: { text: string | null; whole: boolean }[] = []
  for (let index = 0; index < all.length; index++) {
    await userEvent.tab()
    await frames(2)
    const element = document.activeElement as HTMLElement
    const box = element.getBoundingClientRect()
    reached.push({ text: element.textContent, whole: px(box.top) >= 18 && px(window.innerHeight - box.bottom) >= 18 })
  }
  expect(reached).toEqual([8, 7, 6, 5, 4, 3, 2, 1].map((index) => ({ text: `Saved file ${index}`, whole: true })))
})

// An app whose one Toaster mounts with it, and which raises a toast from inside its drawer or its confirm dialog, opened
// after the Toaster
function RaisingFrom({ surface }: { surface: 'drawer' | 'confirm dialog' }) {
  const [open, setOpen] = useState(false)
  const raise = <Button onClick={() => toast.success('Copied the link')}>Copy the link</Button>
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      {surface === 'drawer' ? (
        <Drawer open={open} onOpenChange={setOpen} title="Release notes" closeLabel="Close">
          {raise}
        </Drawer>
      ) : (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Publish the release?"
          cancelLabel="Cancel"
          confirmLabel="Publish"
          onConfirm={() => {}}
        >
          {raise}
        </ConfirmDialog>
      )}
      <Toaster aria-label="Messages" />
    </>
  )
}

// components::REQ-001/AC-06: a toast raised from inside an open drawer or confirm dialog stands in front of it, though
// the Toaster mounted first. In a window 1600px wide the toast stands over the scrim, beside the drawer's panel and
// below the dialog's box.
test.each([
  ['drawer', 'dialog'],
  ['confirm dialog', 'alertdialog'],
] as const)('a toast raised from an open %s shows over it', async (surface, role) => {
  await page.viewport(1600, 800)
  const canvas = mount(<RaisingFrom surface={surface} />)
  await userEvent.click(button(canvas, 'Open'))
  await userEvent.click(button(await opened(role), 'Copy the link'))
  const [element] = await toasts(1)
  const box = element.getBoundingClientRect()
  expect(inFront(element, box.left + box.width / 2, box.top + box.height / 2)).toBe(true)
})

// components::REQ-001/AC-06: a press on a toast standing over an open drawer's scrim leaves the drawer open, where a
// press on the scrim closes it (components::REQ-009/AC-01)
test('a press on a toast over an open drawer leaves the drawer open', async () => {
  await page.viewport(1600, 800)
  const canvas = mount(<RaisingFrom surface="drawer" />)
  await userEvent.click(button(canvas, 'Open'))
  const panel = await opened('dialog')
  await userEvent.click(button(panel, 'Copy the link'))
  const [element] = await toasts(1)
  await userEvent.click(element)
  await frames(2)
  expect(panel.isConnected).toBe(true)
})
