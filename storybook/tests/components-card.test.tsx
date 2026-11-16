// The Card's stories (stories/components-card.stories.tsx) under a real pointer and keyboard: Playwright's, which the
// browser treats as the user's, so it applies `:hover` and `:focus-visible` as it would for a person. Each story is
// rendered as Storybook renders it, inside the toolbar's ThemeProvider.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-card.stories'
import { card, defaultLook, hoveredLook, look, pressedLook } from '../stories/support/card'
import { computed } from '../stories/support/computed'
import { mount, unmount } from './support/mount'

const { Selectable, Disabled } = composeStories(stories, preview)

afterEach(unmount)

// The `onPressedChange` the Selectable story reports to, cleared of what earlier tests recorded on it
function reported() {
  const spy = Selectable.args.onPressedChange
  if (!spy) throw new Error('no onPressedChange')
  return vi.mocked(spy).mockClear()
}

const pressedStates = (canvas: HTMLElement) =>
  ['plain', 'pressed'].map((name) => card(canvas, name).getAttribute('aria-pressed'))

// components::REQ-006/AC-01 `selectable` under the pointer: an unpressed card shows a `--primary` border and the wash,
// while the pressed one beside it keeps its ring and its `--primary` title, which the hovered one does not have, so
// the two are told apart; the pressed card keeps its look under the pointer too. AC-02: a click presses a card and
// another releases it, and the card reports each change.
test('a selectable card under the pointer shows a --primary border and the wash, and a click presses and releases it', async () => {
  const onPressedChange = reported()
  const canvas = mount(<Selectable />)
  const plain = card(canvas, 'plain')
  const pressed = card(canvas, 'pressed')
  await userEvent.hover(plain)
  expect([look(plain), look(pressed)]).toEqual([hoveredLook(), pressedLook()])
  await userEvent.hover(pressed)
  expect(look(pressed)).toEqual(pressedLook())
  await userEvent.click(plain)
  expect(pressedStates(canvas)).toEqual(['true', 'true'])
  await userEvent.click(plain)
  expect(pressedStates(canvas)).toEqual(['false', 'true'])
  await userEvent.unhover(plain)
  expect(look(plain)).toEqual(defaultLook())
  expect(onPressedChange.mock.calls.map(([value]) => value)).toEqual([true, false])
})

// components::REQ-006/AC-02 and components::REQ-001/AC-01: Tab reaches a selectable card, where keyboard focus shows a
// 2px `--ring` outline 2px outside the card; Space and Enter press and release it as they do a button; focus from the
// pointer shows no outline
test('keyboard focus outlines a selectable card in --ring 2px outside it, and Space and Enter press it', async () => {
  const onPressedChange = reported()
  const canvas = mount(<Selectable />)
  const plain = card(canvas, 'plain')
  await userEvent.tab()
  expect(document.activeElement).toBe(plain)
  const style = getComputedStyle(plain)
  expect({ style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset }).toEqual({
    style: 'solid',
    width: '2px',
    colour: computed('color', 'var(--ring)'),
    offset: '2px',
  })
  await userEvent.keyboard(' ')
  expect(pressedStates(canvas)).toEqual(['true', 'true'])
  await userEvent.keyboard('{Enter}')
  expect(pressedStates(canvas)).toEqual(['false', 'true'])
  expect(onPressedChange.mock.calls.map(([value]) => value)).toEqual([true, false])
  const pressed = card(canvas, 'pressed')
  await userEvent.click(pressed)
  expect(document.activeElement).toBe(pressed)
  expect(getComputedStyle(pressed).outlineStyle).toBe('none')
})

// components::REQ-001/AC-02: disabled selectable cards keep their look under the pointer, and neither a click, Space nor
// Enter changes them. The pointer is moved onto a card whatever lies there, since a disabled card lets the pointer
// through.
test('a disabled selectable card ignores the pointer and cannot be pressed by pointer or keyboard', async () => {
  const canvas = mount(<Disabled />)
  const { onPressedChange } = Disabled.args
  const plain = card(canvas, 'plain')
  const atRest = look(plain)
  await userEvent.hover(plain, { force: true })
  expect(look(plain)).toEqual(atRest)
  await userEvent.click(plain, { force: true })
  plain.focus()
  expect(document.activeElement).toBe(plain)
  await userEvent.keyboard(' {Enter}')
  expect(pressedStates(canvas)).toEqual(['false', 'true'])
  expect(onPressedChange).not.toHaveBeenCalled()
})
