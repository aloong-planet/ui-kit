// The Tooltip's stories (stories/components-tooltip.stories.tsx) under a real pointer and keyboard: Playwright's, which
// the browser treats as the user's. Each story is rendered as Storybook renders it, inside the toolbar's ThemeProvider.
//
// Gaps, untested because a test cannot land in the frame they need: a tooltip opened by the pointer alone closes on a
// scroll in the very frame it opens (no scroll there is taken as a focus's), and one that closes in the frame it opens
// stops waiting for that frame. Untested because no spec states it: a render on a server, where the description element
// waits for the browser.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-tooltip.stories'
import { frames } from '../stories/support/frames'
import { isOpen, tooltip } from '../stories/support/tooltip'
import { mount, unmount } from './support/mount'

const { Default, InScrollingArea } = composeStories(stories, preview)

const viewport = { width: window.innerWidth, height: window.innerHeight }

afterEach(async () => {
  unmount()
  document.documentElement.style.scrollBehavior = ''
  window.scrollTo(0, 0)
  await page.viewport(viewport.width, viewport.height)
})


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

// components::REQ-008/AC-01 and AC-03: with the pointer resting on the trigger, or on the tooltip, moving the keyboard
// focus away leaves the tooltip open, since the pointer still holds it, also while the pointer moves on to the other
// of the two; it closes once the pointer has left both
test.each([
  { rest: 'trigger', then: [] },
  { rest: 'tooltip', then: [] },
  { rest: 'trigger', then: ['tooltip'] },
  { rest: 'tooltip', then: ['trigger'] },
] as const)('the pointer resting on the $rest holds the tooltip open when the keyboard focus moves away, and on the way through $then', async ({ rest, then }) => {
  const canvas = mount(<Default />)
  const refresh = button(canvas, 'Refresh')
  await userEvent.hover(refresh)
  const popup = await tooltip()
  const on = { trigger: refresh, tooltip: popup }
  await userEvent.tab()
  expect(document.activeElement).toBe(refresh)
  await userEvent.hover(on[rest])
  await userEvent.tab()
  expect(document.activeElement).toBe(button(canvas, 'Elsewhere'))
  await frames(3)
  expect(isOpen()).toBe(true)
  for (const next of then) {
    await userEvent.hover(on[next])
    await frames(3)
    expect(isOpen()).toBe(true)
  }
  await userEvent.hover(button(canvas, 'Elsewhere'))
  await vi.waitFor(() => expect(isOpen()).toBe(false))
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
// open
test('the text describes the trigger, open or closed', async () => {
  const canvas = mount(<Default />)
  const refresh = button(canvas, 'Refresh')
  await expect.element(page.elementLocator(refresh)).toHaveAccessibleDescription('Reload the list from disk')
  await userEvent.tab()
  await tooltip()
  await expect.element(page.elementLocator(refresh)).toHaveAccessibleDescription('Reload the list from disk')
})

// The tooltip adds no element beside its trigger, closed or open, so rules on the children of the trigger's container
// (Tailwind's `space-x-*`, `divide-*` and `last:`) see the caller's elements alone (components::REQ-008, Failure modes)
test('the tooltip adds nothing to its trigger\'s container', async () => {
  const canvas = mount(<Default />)
  const refresh = button(canvas, 'Refresh')
  const children = () => [...(refresh.parentElement?.children ?? [])]
  expect(children()).toEqual([refresh, button(canvas, 'Elsewhere')])
  await userEvent.hover(refresh)
  await tooltip()
  expect(children()).toEqual([refresh, button(canvas, 'Elsewhere')])
})

// components::REQ-008/AC-03: the tooltip takes no focus: held open by the pointer on its trigger, it is passed over by
// Tab after the last control before it on the page, and a click on it leaves the focus outside it
test('the tooltip takes no focus, from the keyboard or from a click', async () => {
  const canvas = mount(<Default />)
  const refresh = button(canvas, 'Refresh')
  await userEvent.hover(refresh)
  const popup = await tooltip()
  await userEvent.tab()
  await userEvent.tab()
  expect(document.activeElement).toBe(button(canvas, 'Elsewhere'))
  expect(popup.compareDocumentPosition(button(canvas, 'Elsewhere')) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
  await userEvent.tab()
  expect({ open: isOpen(), focusInTooltip: popup.contains(document.activeElement) }).toEqual({
    open: true,
    focusInTooltip: false,
  })
  await userEvent.click(popup)
  expect({ open: isOpen(), focusInTooltip: popup.contains(document.activeElement) }).toEqual({
    open: true,
    focusInTooltip: false,
  })
})

// components::REQ-014/AC-01: while the tooltip is open, a scroll of an area on the page closes it, and so does a scroll
// of the page, whether the pointer or the keyboard focus opened it on a trigger in view. To open it again, the pointer
// or the focus leaves the trigger and comes back, since it stays on the trigger.
test.each(['pointer', 'keyboard'])('a scroll of an area or of the page closes the tooltip the %s opened', async (opener) => {
  const canvas = mount(<InScrollingArea />)
  const area = canvas.querySelector<HTMLElement>('[data-area]')
  if (!area) throw new Error('no scrolling area')
  const reopen = async () => {
    if (opener === 'pointer') {
      await userEvent.hover(button(canvas, 'Elsewhere'))
      await userEvent.hover(button(canvas, 'Refresh'))
    } else {
      await userEvent.click(button(canvas, 'Elsewhere'))
      await userEvent.tab({ shift: true })
      expect(document.activeElement).toBe(button(canvas, 'Refresh'))
    }
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

// components::REQ-008/AC-01 and components::REQ-014/AC-01: keyboard focus on a trigger out of view opens the tooltip,
// and the scroll the browser makes to bring the trigger into view leaves it open, at once or, where the scrolling
// area scrolls smoothly, over many frames; a scroll after that closes it. The trigger is out of view on the page,
// which is scrolled down, or inside an area at the end of its content, and the keyboard reaches it from the button
// beside it, clicked before.
test.each([
  ['page', 'auto'],
  ['page', 'smooth'],
  ['area', 'auto'],
  ['area', 'smooth'],
])('keyboard focus on a trigger out of view in the %s opens the tooltip, which the scroll bringing the trigger into view leaves open (scroll-behavior: %s)', async (where, behavior) => {
  const canvas = mount(<InScrollingArea />)
  const area = canvas.querySelector<HTMLElement>('[data-area]')
  if (!area) throw new Error('no scrolling area')
  const [trigger, scroller] =
    where === 'page' ? [button(canvas, 'Refresh'), document.documentElement] : [button(canvas, 'In the area'), area]
  await userEvent.click(button(canvas, 'Elsewhere'))
  const box = () => trigger.getBoundingClientRect()
  const view = () => (where === 'page' ? { top: 0, bottom: window.innerHeight } : area.getBoundingClientRect())
  // the page scrolled to its end; the area scrolled so that the trigger stands 40px below its visible part, still
  // inside the window, where only the area hides it
  if (where === 'page') window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
  else area.scrollTop += box().top - view().bottom - 40
  await frames(2)
  expect(box().bottom < view().top || box().top > view().bottom).toBe(true)
  if (where === 'area') expect(box().bottom).toBeLessThan(window.innerHeight)
  scroller.style.scrollBehavior = behavior
  await userEvent.tab({ shift: where === 'page' })
  expect(document.activeElement).toBe(trigger)
  await tooltip()
  for (let frame = 0; frame < 60 && isOpen(); frame++) await frames(1)
  expect({ open: isOpen(), inView: box().top >= view().top && box().bottom <= view().bottom }).toEqual({
    open: true,
    inView: true,
  })
  // the page now stands at its top and the area at the end of its content, so each can scroll back by 40px
  scroller.scrollTop += where === 'page' ? 40 : -40
  await vi.waitFor(() => expect(isOpen()).toBe(false))
})

// components::REQ-014/AC-02: a resize of the window closes the open tooltip
test('a resize of the window closes the open tooltip', async () => {
  const canvas = mount(<Default />)
  await userEvent.hover(button(canvas, 'Refresh'))
  await tooltip()
  await page.viewport(viewport.width - 60, viewport.height + 200)
  await vi.waitFor(() => expect(isOpen()).toBe(false))
})
