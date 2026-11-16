// The Tabs' stories (stories/components-tabs.stories.tsx) under a real pointer and keyboard: Playwright's, which the
// browser treats as the user's, so it applies `:hover` and `:focus-visible` as it would for a person. Each story is
// rendered as Storybook renders it, inside the toolbar's ThemeProvider.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-tabs.stories'
import { computed } from '../stories/support/computed'
import { mount, unmount } from './support/mount'

const { Page, Disabled } = composeStories(stories, preview)

afterEach(unmount)

function tab(canvas: HTMLElement, label: string): HTMLElement {
  const element = [...canvas.querySelectorAll<HTMLElement>('[role="tab"]')].find((node) => node.textContent?.startsWith(label))
  if (!element) throw new Error(`no tab ${label}`)
  return element
}

// The selected tab and the panel that shows
function shown(canvas: HTMLElement) {
  return {
    selected: [...canvas.querySelectorAll<HTMLElement>('[role="tab"][aria-selected="true"]')].map((node) => node.textContent),
    panels: [...canvas.querySelectorAll<HTMLElement>('[role="tabpanel"]')].map((node) => node.textContent),
  }
}

// The `onValueChange` the Page story reports to, cleared of what earlier tests recorded on it
function reported() {
  const spy = Page.args.onValueChange
  if (!spy) throw new Error('no onValueChange')
  return vi.mocked(spy).mockClear()
}

function look(element: Element) {
  const style = getComputedStyle(element)
  return { ground: style.backgroundColor, text: style.color, weight: style.fontWeight }
}

function outline(element: Element) {
  const style = getComputedStyle(element)
  return { style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset }
}

// components::REQ-013/AC-01 `page` row under the pointer: an unselected tab shows `--foreground` text, while the
// selected one keeps its look
test('an unselected page tab under the pointer shows --foreground text, the selected one keeps its look', async () => {
  const canvas = mount(<Page />)
  const overview = tab(canvas, 'Overview')
  const activity = tab(canvas, 'Activity')
  const selected = look(overview)
  await userEvent.hover(activity)
  expect(look(activity)).toEqual({ ground: computed('color', 'transparent'), text: computed('color', 'var(--foreground)'), weight: '400' })
  expect(look(overview)).toEqual(selected)
  await userEvent.hover(overview)
  expect(look(overview)).toEqual(selected)
})

// components::REQ-013/AC-02 and AC-03: Tab reaches the selected tab, the arrow keys move between the tabs and select
// each one they reach, and the panel below follows; a click selects a tab too, and the tabs report each change
test('the arrow keys and clicks select a tab and show its panel', async () => {
  const onValueChange = reported()
  const canvas = mount(<Page />)
  await userEvent.tab()
  expect(document.activeElement).toBe(tab(canvas, 'Overview'))
  await userEvent.keyboard('{ArrowRight}')
  expect({ focused: document.activeElement?.textContent, ...shown(canvas) }).toEqual({
    focused: 'Activity12',
    selected: ['Activity12'],
    panels: ['Three of them are still open.'],
  })
  await userEvent.keyboard('{ArrowRight}{ArrowLeft}{ArrowLeft}')
  expect({ focused: document.activeElement?.textContent, ...shown(canvas) }).toEqual({
    focused: 'Overview',
    selected: ['Overview'],
    panels: ['Twelve conversations this week.'],
  })
  await userEvent.click(tab(canvas, 'Settings'))
  expect(shown(canvas)).toEqual({ selected: ['Settings'], panels: ['The project is shared with two members.'] })
  expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(['activity', 'settings', 'activity', 'overview', 'settings'])
})

// components::REQ-001/AC-01: keyboard focus shows a 2px `--ring` outline 2px outside the tab, and on the panel when Tab
// moves on to it; focus from the pointer shows none
test('keyboard focus outlines a tab and the panel in --ring 2px outside them, and pointer focus does not', async () => {
  const canvas = mount(<Page />)
  const ring = { style: 'solid', width: '2px', colour: computed('color', 'var(--ring)'), offset: '2px' }
  await userEvent.tab()
  expect(outline(tab(canvas, 'Overview'))).toEqual(ring)
  await userEvent.tab()
  const panel = canvas.querySelector('[role="tabpanel"]')
  expect(document.activeElement).toBe(panel)
  expect(panel && outline(panel)).toEqual(ring)
  const activity = tab(canvas, 'Activity')
  await userEvent.click(activity)
  expect(document.activeElement).toBe(activity)
  expect(getComputedStyle(activity).outlineStyle).toBe('none')
})

// components::REQ-013/AC-04 and components::REQ-001/AC-02: the arrow keys reach a disabled tab without selecting it,
// and it keeps its look under the pointer and takes no click. The pointer is moved onto it whatever lies there, since
// a disabled tab lets the pointer through.
test('a disabled tab is reached by the arrow keys without being selected, and ignores the pointer', async () => {
  const canvas = mount(<Disabled />)
  const { onValueChange } = Disabled.args
  if (!onValueChange) throw new Error('no onValueChange')
  const settings = tab(canvas, 'Settings')
  await userEvent.tab()
  await userEvent.keyboard('{ArrowRight}{ArrowRight}')
  expect({ focused: document.activeElement, ...shown(canvas) }).toEqual({
    focused: settings,
    selected: ['Activity12'],
    panels: ['Three of them are still open.'],
  })
  const atRest = look(settings)
  await userEvent.hover(settings, { force: true })
  expect(look(settings)).toEqual(atRest)
  await userEvent.click(settings, { force: true })
  expect(shown(canvas).selected).toEqual(['Activity12'])
  expect(vi.mocked(onValueChange).mock.calls.map(([value]) => value)).toEqual(['activity'])
})
