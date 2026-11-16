// The Toast's stories (stories/components-toast.stories.tsx) under a real pointer and keyboard, with toasts raised by
// the test itself, which runs outside any React component. Each story is rendered as Storybook renders it, inside the
// toolbar's ThemeProvider.
import { toast } from '@aloong-planet/ui'
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-toast.stories'
import { computed } from '../stories/support/computed'
import { region, shown, toasts } from '../stories/support/toast'
import { mount, unmount } from './support/mount'

const { Success } = composeStories(stories, preview)

afterEach(() => unmount())

const frames = async (count: number) => {
  for (let index = 0; index < count; index++) await new Promise((resolve) => requestAnimationFrame(resolve))
}
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

// components::REQ-001/AC-01 on a toast: F6 moves the keyboard to the toasts' region and Tab onto a toast (Base UI), and
// the toast with keyboard focus shows a 2px `--ring` outline 2px outside it
test('the keyboard reaches a toast, which shows the keyboard focus outline', async () => {
  mount(<Success />)
  toast.success('Saved the settings')
  const [element] = await toasts(1)
  await userEvent.keyboard('{F6}')
  await vi.waitFor(() => expect(document.activeElement).toBe(region()))
  await userEvent.tab()
  expect(document.activeElement).toBe(element)
  const style = getComputedStyle(element)
  expect({ style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset }).toEqual({
    style: 'solid',
    width: '2px',
    colour: computed('color', 'var(--ring)'),
    offset: '2px',
  })
})
