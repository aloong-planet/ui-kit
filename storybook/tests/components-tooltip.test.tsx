// The Tooltip's stories (stories/components-tooltip.stories.tsx) under a real pointer and keyboard: Playwright's, which
// the browser treats as the user's. Each story is rendered as Storybook renders it, inside the toolbar's ThemeProvider.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-tooltip.stories'
import { isOpen, tooltip } from '../stories/support/tooltip'
import { mount, unmount } from './support/mount'

const { Default, InScrollingArea } = composeStories(stories, preview)

const viewport = { width: window.innerWidth, height: window.innerHeight }

afterEach(async () => {
  unmount()
  window.scrollTo(0, 0)
  await page.viewport(viewport.width, viewport.height)
})

const frames = async (count: number) => {
  for (let index = 0; index < count; index++) await new Promise((resolve) => requestAnimationFrame(resolve))
}

function button(canvas: HTMLElement, name: string): HTMLElement {
  const element = [...canvas.querySelectorAll<HTMLElement>('button')].find(
    (candidate) => (candidate.getAttribute('aria-label') ?? candidate.textContent) === name,
  )
  if (!element) throw new Error(`no button ${name}`)
  return element
}

// components::REQ-008/AC-01 and AC-05: the tooltip is open within two frames of the pointer reaching its trigger, so
// it has no delay, and closes once the pointer has left
test('the tooltip opens as soon as the pointer is over its trigger and closes when it leaves', async () => {
  const canvas = mount(<Default />)
  expect(isOpen()).toBe(false)
  await userEvent.hover(button(canvas, 'Refresh'))
  await frames(2)
  expect(isOpen()).toBe(true)
  await userEvent.hover(button(canvas, 'Elsewhere'))
  await vi.waitFor(() => expect(isOpen()).toBe(false))
})

// components::REQ-008/AC-01: keyboard focus opens the tooltip and holds it open while the pointer comes and goes, and
// moving the focus away closes it; Esc closes it and leaves the focus on the trigger (Base UI)
test('keyboard focus opens the tooltip and holds it open, and moving the focus away or Esc closes it', async () => {
  const canvas = mount(<Default />)
  const refresh = button(canvas, 'Refresh')
  await userEvent.tab()
  expect(document.activeElement).toBe(refresh)
  await tooltip()
  await userEvent.hover(refresh)
  await userEvent.hover(button(canvas, 'Elsewhere'))
  await frames(3)
  expect(isOpen()).toBe(true)
  await userEvent.tab()
  expect(document.activeElement).toBe(button(canvas, 'Elsewhere'))
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  await userEvent.tab({ shift: true })
  expect(document.activeElement).toBe(refresh)
  await tooltip()
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  expect(document.activeElement).toBe(refresh)
})

// components::REQ-008/AC-01 and AC-06: a click on the trigger closes the tooltip, which stays closed while the pointer
// moves on the trigger, and opens again once the pointer has left the trigger and come back
test('a click on the trigger closes the tooltip until the pointer leaves the trigger and comes back', async () => {
  const canvas = mount(<Default />)
  const refresh = button(canvas, 'Refresh')
  await userEvent.hover(refresh)
  await tooltip()
  await userEvent.click(refresh)
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  for (const position of [{ x: 4, y: 4 }, { x: 24, y: 24 }, { x: 14, y: 14 }]) await userEvent.hover(refresh, { position })
  await frames(3)
  expect(isOpen()).toBe(false)
  await userEvent.hover(button(canvas, 'Elsewhere'))
  await userEvent.hover(refresh)
  await tooltip()
})

// components::REQ-008/AC-03: the pointer can move from the trigger onto the open tooltip without it closing, and it
// closes once the pointer has left both
test('the pointer can move onto the open tooltip, which closes once the pointer has left it and its trigger', async () => {
  const canvas = mount(<Default />)
  await userEvent.hover(button(canvas, 'Refresh'))
  const popup = await tooltip()
  await userEvent.hover(popup)
  await frames(3)
  expect(isOpen()).toBe(true)
  await userEvent.hover(button(canvas, 'Elsewhere'))
  await vi.waitFor(() => expect(isOpen()).toBe(false))
})

// components::REQ-008/AC-03: the tooltip's text is the trigger's description while the tooltip is closed as well as
// open, and the keyboard passes over the tooltip from its trigger to the next control
test('the text describes the trigger, open or closed, and the keyboard passes over the tooltip', async () => {
  const canvas = mount(<Default />)
  const refresh = button(canvas, 'Refresh')
  await expect.element(page.elementLocator(refresh)).toHaveAccessibleDescription('Reload the list from disk')
  await userEvent.tab()
  await tooltip()
  await expect.element(page.elementLocator(refresh)).toHaveAccessibleDescription('Reload the list from disk')
  await userEvent.tab()
  expect(document.activeElement).toBe(button(canvas, 'Elsewhere'))
})

// components::REQ-014/AC-01: while the tooltip is open, a scroll of an area on the page closes it, and so does a scroll
// of the page. The pointer leaves the trigger and comes back to open it again, since it stays on the trigger.
test('a scroll of an area or of the page closes the open tooltip', async () => {
  const canvas = mount(<InScrollingArea />)
  const area = canvas.querySelector<HTMLElement>('[data-area]')
  if (!area) throw new Error('no scrolling area')
  const reopen = async () => {
    await userEvent.hover(button(canvas, 'Elsewhere'))
    await userEvent.hover(button(canvas, 'Refresh'))
    await tooltip()
  }
  await reopen()
  area.scrollTop = 80
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  await reopen()
  window.scrollTo(0, 60)
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  expect({ area: area.scrollTop, page: window.scrollY }).toEqual({ area: 80, page: 60 })
})

// components::REQ-014/AC-02: a resize of the window closes the open tooltip
test('a resize of the window closes the open tooltip', async () => {
  const canvas = mount(<Default />)
  await userEvent.hover(button(canvas, 'Refresh'))
  await tooltip()
  await page.viewport(viewport.width - 60, viewport.height + 200)
  await vi.waitFor(() => expect(isOpen()).toBe(false))
})
