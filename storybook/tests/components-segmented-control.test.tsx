// The SegmentedControl's stories (stories/components-segmented-control.stories.tsx) under a real pointer and keyboard:
// Playwright's, which the browser treats as the user's, so it applies `:hover` and `:focus-visible` as it would for a
// person. Each story is rendered as Storybook renders it, inside the toolbar's ThemeProvider. The last test renders a
// segmented control of its own, as an app would, for what no story shows: a segmented control named by a label on the
// page.
import { SegmentedControl } from '@aloong-planet/ui'
import { composeStories } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-segmented-control.stories'
import { computed } from '../stories/support/computed'
import { mount, unmount } from './support/mount'
import { checked, segment } from './support/segmented-control'

const { Default, Disabled } = composeStories(stories, preview)

afterEach(unmount)

// The `onValueChange` the Default story reports to, cleared of what earlier tests recorded on it
function reported() {
  const spy = Default.args.onValueChange
  if (!spy) throw new Error('no onValueChange')
  return vi.mocked(spy).mockClear()
}

function look(element: Element) {
  const style = getComputedStyle(element)
  return { ground: style.backgroundColor, text: style.color, weight: style.fontWeight }
}

// components::REQ-005/AC-01 under the pointer: an unselected segment shows `--foreground` text on the `--background`
// ground, while the selected one keeps its look, so a hovered segment next to the selected one is told apart from it
// by its ground. components::REQ-005/AC-03: neighbouring segments are parted by a 1px `--border-strong` line, so a
// selected and a hovered segment side by side read as two when their grounds are close.
test('an unselected segment under the pointer shows --foreground on --background, the selected one keeps its look', async () => {
  const canvas = mount(<Default />)
  const day = segment(canvas, 'Day')
  const week = segment(canvas, 'Week')
  const selected = look(week)
  await userEvent.hover(day)
  expect(look(day)).toEqual({
    ground: computed('color', 'var(--background)'),
    text: computed('color', 'var(--foreground)'),
    weight: '400',
  })
  expect(look(week)).toEqual(selected)
  await userEvent.hover(week)
  expect(look(week)).toEqual(selected)
  const lines = ['Day', 'Week', 'Month'].map((label) => {
    const style = getComputedStyle(segment(canvas, label))
    return { label, line: style.borderLeftWidth === '0px' ? undefined : [style.borderLeftWidth, style.borderLeftColor] }
  })
  const line = ['1px', computed('color', 'var(--border-strong)')]
  expect(lines).toEqual([
    { label: 'Day', line: undefined },
    { label: 'Week', line },
    { label: 'Month', line },
  ])
})

// components::REQ-005/AC-02 and AC-03: Tab reaches the selected segment, the arrow keys move between segments and
// select the one they reach, and a click selects a segment and deselects the one selected before
test('arrow keys and clicks select a segment and deselect the one before', async () => {
  const onValueChange = reported()
  const canvas = mount(<Default />)
  await userEvent.tab()
  expect(document.activeElement).toBe(segment(canvas, 'Week'))
  await userEvent.keyboard('{ArrowRight}')
  expect({ focused: document.activeElement?.textContent, checked: checked(canvas) }).toEqual({
    focused: 'Month',
    checked: ['Month'],
  })
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
  expect({ focused: document.activeElement?.textContent, checked: checked(canvas) }).toEqual({
    focused: 'Day',
    checked: ['Day'],
  })
  await userEvent.click(segment(canvas, 'Month'))
  expect(checked(canvas)).toEqual(['Month'])
  expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(['month', 'week', 'day', 'month'])
})

// components::REQ-005/AC-05: a click on the selected segment, or Space on it, leaves it selected, and the control
// reports no other value
test('activating the selected segment again leaves it selected', async () => {
  const onValueChange = reported()
  const canvas = mount(<Default />)
  const week = segment(canvas, 'Week')
  await userEvent.click(week)
  expect(checked(canvas)).toEqual(['Week'])
  await userEvent.keyboard(' ')
  expect(checked(canvas)).toEqual(['Week'])
  expect(onValueChange.mock.calls.filter(([value]) => value !== 'week')).toEqual([])
})

// components::REQ-001/AC-01: keyboard focus shows a 2px `--ring` outline 2px inside the segment, so it stays within the
// segment's box, which the container clips; focus from the pointer shows none
test('keyboard focus outlines the segment in --ring 2px inside it, and pointer focus does not', async () => {
  const canvas = mount(<Default />)
  const week = segment(canvas, 'Week')
  await userEvent.tab()
  expect(document.activeElement).toBe(week)
  const style = getComputedStyle(week)
  expect({ style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset }).toEqual({
    style: 'solid',
    width: '2px',
    colour: computed('color', 'var(--ring)'),
    offset: '-2px',
  })
  const day = segment(canvas, 'Day')
  await userEvent.click(day)
  expect(document.activeElement).toBe(day)
  expect(getComputedStyle(day).outlineStyle).toBe('none')
})

// components::REQ-001/AC-02: a disabled segmented control keeps its look under the pointer, and neither a click nor the
// keyboard selects a segment. The pointer is moved onto it whatever lies there, since a disabled control lets the
// pointer through. Tab still reaches its selected segment, announced as disabled: Base UI keeps a disabled radio group
// in the Tab order, so a screen reader user can find it.
test('a disabled segmented control ignores the pointer and cannot be changed by pointer or keyboard', async () => {
  const canvas = mount(<Disabled />)
  const { onValueChange } = Disabled.args
  const day = segment(canvas, 'Day')
  const atRest = look(day)
  await userEvent.hover(day, { force: true })
  expect(look(day)).toEqual(atRest)
  await userEvent.click(day, { force: true })
  await userEvent.tab()
  expect(document.activeElement).toBe(segment(canvas, 'Week'))
  await userEvent.keyboard('{ArrowRight}{ArrowLeft} ')
  expect(checked(canvas)).toEqual(['Week'])
  expect(onValueChange).not.toHaveBeenCalled()
})

// components::REQ-005/AC-02 and components::CON-001: a segmented control named by a label on the page, through
// `aria-labelledby`, is announced as a radio group under that label's text
test('a segmented control named with aria-labelledby is announced under the label it points at', () => {
  const canvas = mount(
    <>
      <h2 id="chart-range">Range</h2>
      <SegmentedControl
        aria-labelledby="chart-range"
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
        ]}
        defaultValue="day"
      />
    </>,
  )
  expect(within(canvas).queryAllByRole('radiogroup', { name: 'Range' }).length).toBe(1)
})
