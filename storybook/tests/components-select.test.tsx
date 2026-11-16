// The Select's stories (stories/components-select.stories.tsx) under a real pointer and keyboard: Playwright's, which
// the browser treats as the user's, so it applies `:hover` and `:focus-visible` as it would for a person. Each story is
// rendered as Storybook renders it, inside the toolbar's ThemeProvider. The last test renders a select of its own, as an
// app would, for what no story shows: a select named by a label on the page.
import { Select } from '@aloong-planet/ui'
import { composeStories } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-select.stories'
import { computed } from '../stories/support/computed'
import { frames } from '../stories/support/frames'
import { isOpen, optionLabel, popup } from '../stories/support/select'
import { mount, unmount } from './support/mount'
import { trigger } from './support/select'

const { Default, InScrollingArea, Disabled } = composeStories(stories, preview)

const viewport = { width: window.innerWidth, height: window.innerHeight }

afterEach(async () => {
  unmount()
  window.scrollTo(0, 0)
  await page.viewport(viewport.width, viewport.height)
})

// The Default story's spies, cleared of what earlier tests recorded on them
function spies() {
  const { onValueChange, onClick } = Default.args
  if (!onValueChange || !onClick) throw new Error('no spies')
  return { onValueChange: vi.mocked(onValueChange).mockClear(), onClick: vi.mocked(onClick).mockClear() }
}

function look(element: Element) {
  const style = getComputedStyle(element)
  const chevron = element.querySelector('svg')
  return {
    ground: style.backgroundColor,
    border: style.borderTopColor,
    chevron: chevron ? getComputedStyle(chevron).rotate : undefined,
  }
}

// components::REQ-004/AC-01: under the pointer and while open, the trigger shows a `--primary` border and the wash,
// and its chevron is turned 180° only while open
test('the trigger shows a --primary border and the wash under the pointer and while open, its chevron turned while open', async () => {
  const canvas = mount(<Default />)
  const element = trigger(canvas)
  const atRest = look(element)
  const marked = { ground: computed('color', 'var(--accent)'), border: computed('color', 'var(--primary)') }
  expect(atRest).not.toEqual({ ...atRest, ...marked })
  await userEvent.hover(element)
  expect(look(element)).toEqual({ ...marked, chevron: 'none' })
  await userEvent.click(element)
  await popup()
  // The pointer is moved off the trigger, so the look is the open one and not the hovered one
  await userEvent.hover(canvas.querySelector('button:not([role])') ?? document.body)
  expect(look(element)).toEqual({ ...marked, chevron: '180deg' })
})

// components::REQ-004/AC-03: an option under the pointer shows the wash, the selected one included, which keeps its
// `--primary-strong` label and its check, so the selected option and the one under the pointer stay told apart
test('an option under the pointer shows the wash', async () => {
  const canvas = mount(<Default />)
  await userEvent.click(trigger(canvas))
  const surface = await popup()
  const options = [...surface.querySelectorAll<HTMLElement>('[role="option"]')]
  expect(options.length).toBe(3)
  const wash = computed('color', 'var(--accent)')
  for (const [index, option] of options.entries()) {
    await userEvent.hover(option)
    expect({
      index,
      grounds: options.map((other) => getComputedStyle(other).backgroundColor === wash),
      selectedLabel: getComputedStyle(optionLabel(options[0])).color,
      check: options[0].querySelector('svg') !== null,
    }).toEqual({
      index,
      grounds: options.map((other) => other === option),
      selectedLabel: computed('color', 'var(--primary-strong)'),
      check: true,
    })
  }
})

// components::REQ-004/AC-05 and AC-03: Enter opens the popup, the arrow keys move the highlight, which shows the wash on
// one option at a time, Enter selects and closes, and Esc closes and returns focus to the trigger
test('the keyboard opens the popup, moves the highlight, selects, and closes it with focus back on the trigger', async () => {
  const { onValueChange } = spies()
  const canvas = mount(<Default />)
  const element = trigger(canvas)
  await userEvent.tab()
  expect(document.activeElement).toBe(element)
  await userEvent.keyboard('{Enter}')
  const surface = await popup()
  const wash = computed('color', 'var(--accent)')
  const washed = () =>
    [...surface.querySelectorAll<HTMLElement>('[role="option"]')]
      .filter((option) => getComputedStyle(option).backgroundColor === wash)
      .map((option) => option.textContent)
  expect(washed()).toEqual(['Last updated'])
  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  expect(washed()).toEqual(['Date created'])
  await userEvent.keyboard('{ArrowUp}')
  expect(washed()).toEqual(['Name'])
  await userEvent.keyboard('{Enter}')
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  expect({ label: element.textContent, reported: onValueChange.mock.calls.map(([value]) => value) }).toEqual({
    label: 'Name',
    reported: ['name'],
  })
  await userEvent.keyboard('{Enter}')
  await popup()
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  expect({ focused: document.activeElement === element, label: element.textContent }).toEqual({
    focused: true,
    label: 'Name',
  })
})

// components::REQ-004/AC-05 and AC-08: a click outside the open popup closes it and acts on what it lands on, once, as
// it would with the popup closed
test('a click outside the open popup closes it and reaches what it lands on', async () => {
  const { onClick, onValueChange } = spies()
  const canvas = mount(<Default />)
  await userEvent.click(trigger(canvas))
  await popup()
  const refresh = [...canvas.querySelectorAll('button')].find((button) => button.textContent === 'Refresh')
  if (!refresh) throw new Error('no button beside the select')
  await userEvent.click(refresh)
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  expect({ clicks: onClick.mock.calls.length, reported: onValueChange.mock.calls.length }).toEqual({ clicks: 1, reported: 0 })
})

// components::REQ-014/AC-01: scrolling the popup's own list leaves it open; scrolling an area outside it, or the page,
// closes it
test('a scroll outside the open popup closes it, a scroll of its own list does not', async () => {
  const canvas = mount(<InScrollingArea />)
  const area = canvas.querySelector<HTMLElement>('[data-area]')
  if (!area) throw new Error('no scrolling area')
  const open = async () => {
    await userEvent.click(trigger(canvas))
    return popup()
  }
  const surface = await open()
  const place = () => {
    const { top, left, width, height } = surface.getBoundingClientRect()
    return { top, left, width, height }
  }
  const before = place()
  expect(surface.scrollHeight).toBeGreaterThan(surface.clientHeight)
  surface.scrollTop = 120
  await frames(3)
  expect({ open: isOpen(), scrolled: surface.scrollTop, place: place() }).toEqual({
    open: true,
    scrolled: 120,
    place: before,
  })
  area.scrollTop = 80
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  await open()
  window.scrollTo(0, 60)
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  expect(window.scrollY).toBe(60)
})

// components::REQ-014/AC-02: a resize of the window keeps the popup open and moves it with its trigger, 6px below it on
// its left edge. The resize also shrinks the scrolled area's range, so the browser clamps its scroll and fires a
// scroll, which is the resize's and leaves the popup open.
test('a resize of the window moves the open popup with its trigger and leaves it open', async () => {
  const canvas = mount(<InScrollingArea />)
  const area = canvas.querySelector<HTMLElement>('[data-area]')
  if (!area) throw new Error('no scrolling area')
  area.scrollTop = area.scrollHeight
  await frames(2)
  const scrolled = area.scrollTop
  const element = trigger(canvas)
  await userEvent.click(element)
  const before = (await popup()).getBoundingClientRect()
  await page.viewport(viewport.width - 60, viewport.height + 200)
  await frames(3)
  const anchor = element.getBoundingClientRect()
  expect({ clamped: area.scrollTop < scrolled, moved: anchor.left !== before.left }).toEqual({ clamped: true, moved: true })
  await vi.waitFor(() => {
    const box = document.querySelector('[role="listbox"]')?.parentElement?.getBoundingClientRect()
    expect({ open: isOpen(), top: box && box.top - anchor.bottom, left: box && box.left - anchor.left }).toEqual({
      open: true,
      top: 6,
      left: 0,
    })
  })
})

// components::REQ-001/AC-01: keyboard focus shows a 2px `--ring` outline 2px outside the trigger; focus that comes back
// to the trigger after the pointer picked an option shows none
test('keyboard focus outlines the trigger in --ring 2px outside it, and pointer focus does not', async () => {
  const canvas = mount(<Default />)
  const element = trigger(canvas)
  await userEvent.tab()
  expect(document.activeElement).toBe(element)
  const style = getComputedStyle(element)
  expect({ style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset }).toEqual({
    style: 'solid',
    width: '2px',
    colour: computed('color', 'var(--ring)'),
    offset: '2px',
  })
  element.blur()
  await userEvent.click(element)
  const surface = await popup()
  const name = [...surface.querySelectorAll<HTMLElement>('[role="option"]')].find((option) => option.textContent === 'Name')
  if (!name) throw new Error('no option Name')
  await userEvent.click(name)
  await vi.waitFor(() => expect(isOpen()).toBe(false))
  expect({ focused: document.activeElement === element, outline: getComputedStyle(element).outlineStyle }).toEqual({
    focused: true,
    outline: 'none',
  })
})

// components::REQ-001/AC-02: a disabled select keeps its look under the pointer, and neither a click nor the keyboard
// opens it. The pointer is moved onto it whatever lies there, since a disabled select lets the pointer through.
test('a disabled select ignores the pointer and cannot be opened by pointer or keyboard', async () => {
  const canvas = mount(<Disabled />)
  const element = trigger(canvas)
  const atRest = look(element)
  await userEvent.hover(element, { force: true })
  expect(look(element)).toEqual(atRest)
  await userEvent.click(element, { force: true })
  await userEvent.tab()
  await userEvent.keyboard('{Enter}{ArrowDown} ')
  await frames(3)
  expect({ open: isOpen(), label: element.textContent }).toEqual({ open: false, label: 'Last updated' })
  expect(Disabled.args.onValueChange).not.toHaveBeenCalled()
})

// components::CON-001: a select named by a label on the page, through `aria-labelledby`, has its trigger announced under
// that label's text
test('a select named with aria-labelledby is announced under the label it points at', () => {
  const canvas = mount(
    <>
      <h2 id="project-order">Order</h2>
      <Select
        aria-labelledby="project-order"
        options={[
          { value: 'name', label: 'Name' },
          { value: 'updated', label: 'Last updated' },
        ]}
        defaultValue="name"
      />
    </>,
  )
  expect(within(canvas).queryAllByRole('combobox', { name: 'Order' }).length).toBe(1)
})
