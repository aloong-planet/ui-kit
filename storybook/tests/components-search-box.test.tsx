// The SearchBox's stories (stories/components-search-box.stories.tsx) under a real pointer and keyboard: Playwright's,
// which the browser treats as the user's, so it applies `:focus` as it would for a person and lets a click reach the
// controls the browser draws inside a field. Each story is rendered as Storybook renders it, inside the toolbar's
// ThemeProvider.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-search-box.stories'
import { computed } from '../stories/support/computed'
import { mount, unmount } from './support/mount'

const { Default, Disabled } = composeStories(stories, preview)

afterEach(unmount)

function field(canvas: HTMLElement): HTMLInputElement {
  const element = canvas.querySelector<HTMLInputElement>('[role="searchbox"]')
  if (!element) throw new Error('no search field')
  return element
}

// components::REQ-003/AC-02 and the search box's exception in components::REQ-001/AC-01: focus from the keyboard and
// focus from the pointer each turn the border `--ring` and show no outline
test('focus from the keyboard or the pointer turns the border --ring, with no outline', async () => {
  const canvas = mount(<Default />)
  const element = field(canvas)
  const ring = computed('color', 'var(--ring)')
  expect(getComputedStyle(element).borderTopColor).not.toBe(ring)
  await userEvent.tab()
  expect(document.activeElement).toBe(element)
  expect({ border: getComputedStyle(element).borderTopColor, outline: getComputedStyle(element).outlineStyle }).toEqual({
    border: ring,
    outline: 'none',
  })
  element.blur()
  expect(getComputedStyle(element).borderTopColor).not.toBe(ring)
  await userEvent.click(element)
  expect(document.activeElement).toBe(element)
  expect({ border: getComputedStyle(element).borderTopColor, outline: getComputedStyle(element).outlineStyle }).toEqual({
    border: ring,
    outline: 'none',
  })
})

// components::REQ-003/AC-03: with text typed, clicks along the trailing 40px of the field, where a browser draws the
// clear button of a search-type field (Chromium about 19px in from the edge), leave the text as it is
test('the field shows no clear button for the text typed', async () => {
  const canvas = mount(<Default />)
  const element = field(canvas)
  await userEvent.type(element, 'agent')
  const { width, height } = element.getBoundingClientRect()
  for (let x = width - 2; x >= width - 40; x -= 2) {
    await userEvent.click(element, { position: { x, y: height / 2 } })
    expect({ x: x - width, value: element.value }).toEqual({ x: x - width, value: 'agent' })
  }
})

// components::REQ-001/AC-02: a disabled search box takes no focus from a click or the keyboard, so nothing typed
// reaches it. The click is made wherever the field lies, since a disabled box lets the pointer through.
test('a disabled search box cannot be focused or typed into', async () => {
  const canvas = mount(<Disabled />)
  const element = field(canvas)
  await userEvent.click(element, { force: true })
  await userEvent.keyboard('x')
  await userEvent.tab()
  await userEvent.keyboard('y')
  expect({ focused: document.activeElement === element, value: element.value }).toEqual({
    focused: false,
    value: 'agent',
  })
})
