// The Button's stories (stories/components-button.stories.tsx) under a real pointer and keyboard: Playwright's, which
// the browser treats as the user's, so it applies `:hover` and `:focus-visible` as it would for a person. Each story is
// rendered as Storybook renders it, inside the toolbar's ThemeProvider.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-button.stories'
import { button } from '../stories/support/button'
import { computed } from '../stories/support/computed'
import { mount, unmount } from './support/mount'

const { Variants, Disabled } = composeStories(stories, preview)

afterEach(unmount)

// The colours a button shows; the border's and the underline's only where it has them (`link` has no border and is
// the only one underlined)
function look(element: Element) {
  const style = getComputedStyle(element)
  return {
    ground: style.backgroundColor,
    border: style.borderTopWidth === '0px' ? undefined : style.borderTopColor,
    text: style.color,
    underline: style.textDecorationLine === 'none' ? undefined : style.textDecorationColor,
  }
}

const variants = ['default', 'primary', 'danger', 'ghost', 'link']

// components::REQ-002/AC-01: under the pointer, `default` takes a `--primary` border and the wash, `ghost` the wash and
// `--primary` text, and `link` `--foreground` text with an underline in the text colour; `primary` and `danger`, whose
// rows describe no change, keep their look at rest
test('each variant under the pointer shows the look its row describes', async () => {
  const canvas = mount(<Variants />)
  const atRest = Object.fromEntries(variants.map((name) => [name, look(button(canvas, name))]))
  const underPointer = {
    default: { ...atRest.default, ground: computed('color', 'var(--accent)'), border: computed('color', 'var(--primary)') },
    primary: atRest.primary,
    danger: atRest.danger,
    ghost: { ...atRest.ghost, ground: computed('color', 'var(--accent)'), text: computed('color', 'var(--primary)') },
    link: {
      ...atRest.link,
      text: computed('color', 'var(--foreground)'),
      underline: computed('color', 'var(--foreground)'),
    },
  }
  expect(atRest.default.border).not.toBe(underPointer.default.border)
  for (const name of variants) {
    const element = button(canvas, name)
    await userEvent.hover(element)
    expect({ name, ...look(element) }).toEqual({ name, ...underPointer[name as keyof typeof underPointer] })
  }
})

// components::REQ-001/AC-01: keyboard focus shows a 2px `--ring` outline 2px outside each variant; focus from the
// pointer shows none
test('keyboard focus outlines every variant in --ring 2px outside it, and pointer focus does not', async () => {
  const canvas = mount(<Variants />)
  const ring = computed('color', 'var(--ring)')
  for (const name of variants) {
    const element = button(canvas, name)
    await userEvent.tab()
    expect(document.activeElement).toBe(element)
    const style = getComputedStyle(element)
    expect({ name, style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset }).toEqual({
      name,
      style: 'solid',
      width: '2px',
      colour: ring,
      offset: '2px',
    })
  }
  for (const name of variants) {
    const element = button(canvas, name)
    await userEvent.click(element)
    expect(document.activeElement).toBe(element)
    expect({ name, style: getComputedStyle(element).outlineStyle }).toEqual({ name, style: 'none' })
  }
})

// components::REQ-001/AC-02: a disabled button keeps its look under the pointer, and neither a click nor the keyboard
// activates it. The pointer is moved onto it whatever lies there, since a disabled button lets the pointer through.
test('a disabled button ignores the pointer and cannot be activated by pointer or keyboard', async () => {
  const canvas = mount(<Disabled />)
  const { onClick } = Disabled.args
  const names = ['default', 'primary', 'danger', 'ghost', 'icon', 'link']
  for (const name of names) {
    const element = button(canvas, name)
    const atRest = look(element)
    await userEvent.hover(element, { force: true })
    expect({ name, ...look(element) }).toEqual({ name, ...atRest })
    await userEvent.click(element, { force: true })
  }
  await userEvent.tab()
  expect(names.map((name) => button(canvas, name)).includes(document.activeElement as HTMLButtonElement)).toBe(
    false,
  )
  await userEvent.keyboard('{Enter} ')
  expect(onClick).not.toHaveBeenCalled()
})
