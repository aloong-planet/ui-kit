// components::REQ-016: the select, the segmented control and the tabs given a value none of their options holds, as an
// app gives one through options typed only as `string`, or through options that changed under a value it stored. Each
// is rendered as an app renders it, under Playwright's pointer and keyboard, which the browser treats as the user's.
import { SegmentedControl, Select, Tabs } from '@aloong-planet/ui'
import { StrictMode, useState, type ReactElement } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { frames } from '../stories/support/frames'
import { isOpen, popup } from '../stories/support/select'
import { button } from './support/button'
import { mount, rerender, unmount } from './support/mount'
import { checked, segment } from './support/segmented-control'
import { trigger } from './support/select'
import { shown, tab } from './support/tabs'

afterEach(unmount)

// Options typed only as `string`, so a value none of them holds passes the type check, as it does in an app
type Fruit = { value: string; label: string }
const fruits: readonly Fruit[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
]

type Given = { value: string; defaultValue?: never } | { value?: never; defaultValue: string }
type Props = Given & { options: readonly Fruit[]; onValueChange?: (value: string) => void }

function given(as: 'value' | 'defaultValue', value: string): Given {
  return as === 'value' ? { value } : { defaultValue: value }
}

// Each component, rendered with the given options and value as an app renders it, the user picking an option with the
// pointer, what it shows as selected, what that is with nothing selected and with Banana selected, and the warnings it
// logs in development for the values x, y and b
const subjects = {
  Select: {
    render: (props: Props) => <Select aria-label="Fruit" {...props} />,
    async pick(canvas: HTMLElement, label: string) {
      await userEvent.click(trigger(canvas))
      const surface = await popup()
      const option = [...surface.querySelectorAll<HTMLElement>('[role="option"]')].find((node) => node.textContent === label)
      if (!option) throw new Error(`no option ${label}`)
      await userEvent.click(option)
      await vi.waitFor(() => expect(isOpen()).toBe(false))
    },
    // The trigger's text, and the options marked selected in the open popup, which is closed again after
    async selection(canvas: HTMLElement) {
      const element = trigger(canvas)
      const text = element.textContent
      await userEvent.click(element)
      const surface = await popup()
      const selected = [...surface.querySelectorAll('[role="option"][aria-selected="true"]')].map((node) => node.textContent)
      await userEvent.keyboard('{Escape}')
      await vi.waitFor(() => expect(isOpen()).toBe(false))
      return { text, selected }
    },
    none: { text: '', selected: [] },
    banana: { text: 'Banana', selected: ['Banana'] },
    warnings: {
      x: 'Select: the value "x" is none of its options, so no option shows as selected.',
      y: 'Select: the value "y" is none of its options, so no option shows as selected.',
      b: 'Select: the value "b" is none of its options, so no option shows as selected.',
    },
  },
  SegmentedControl: {
    render: (props: Props) => <SegmentedControl aria-label="Fruit" {...props} />,
    item: segment,
    pick: (canvas: HTMLElement, label: string) => userEvent.click(segment(canvas, label)),
    selection: (canvas: HTMLElement) => Promise.resolve({ selected: checked(canvas) }),
    none: { selected: [] },
    banana: { selected: ['Banana'] },
    warnings: {
      x: 'SegmentedControl: the value "x" is none of its options, so no segment shows as selected.',
      y: 'SegmentedControl: the value "y" is none of its options, so no segment shows as selected.',
      b: 'SegmentedControl: the value "b" is none of its options, so no segment shows as selected.',
    },
  },
  Tabs: {
    render: ({ options, ...props }: Props) => (
      <Tabs aria-label="Fruit" tabs={options.map((option) => ({ ...option, panel: `${option.label} panel` }))} {...props} />
    ),
    item: tab,
    pick: (canvas: HTMLElement, label: string) => userEvent.click(tab(canvas, label)),
    // Base UI keeps a panel that stops showing in the page until its exit has run, a frame later
    async selection(canvas: HTMLElement) {
      await frames(2)
      return shown(canvas)
    },
    none: { selected: [], panels: [] },
    banana: { selected: ['Banana'], panels: ['Banana panel'] },
    warnings: {
      x: 'Tabs: the value "x" is none of its tabs, so no tab shows as selected and no panel shows.',
      y: 'Tabs: the value "y" is none of its tabs, so no tab shows as selected and no panel shows.',
      b: 'Tabs: the value "b" is none of its tabs, so no tab shows as selected and no panel shows.',
    },
  },
}

const names = ['Select', 'SegmentedControl', 'Tabs'] as const
const ways = ['value', 'defaultValue'] as const
const everyWay = names.flatMap((name) => ways.map((way) => [name, way] as const))
// The two whose segments or tabs the keyboard focus moves through
const rows = ['SegmentedControl', 'Tabs'] as const
const everyRowWay = rows.flatMap((name) => ways.map((way) => [name, way] as const))

// An app that passes as `value` what the component last reported
function Controlled({ render, initial, onValueChange }: { render: (props: Props) => ReactElement; initial: string; onValueChange: (value: string) => void }) {
  const [value, setValue] = useState(initial)
  return render({
    options: fruits,
    value,
    onValueChange: (next) => {
      setValue(next)
      onValueChange(next)
    },
  })
}

// The component given `value` as an app gives it: as `value` by an app that passes on what it reports, or as
// `defaultValue`, after a button the keyboard focus can start from
function app(name: (typeof names)[number], way: (typeof ways)[number], value: string, onValueChange: (value: string) => void) {
  const { render } = subjects[name]
  return (
    <>
      <button type="button">Before</button>
      {way === 'value' ? (
        <Controlled render={render} initial={value} onValueChange={onValueChange} />
      ) : (
        render({ options: fruits, defaultValue: value, onValueChange })
      )}
    </>
  )
}

// components::REQ-016/AC-01, AC-02: a value none of the options stays as the app passed it, with no change reported, and
// nothing shows as selected: no option, segment or tab, no tab's panel, and no text in the select's trigger
test.for(everyWay)('%s given as %s a value none of its options keeps it and shows nothing selected', async ([name, way]) => {
  const subject = subjects[name]
  const onValueChange = vi.fn()
  const canvas = mount(subject.render({ options: fruits, ...given(way, 'nope'), onValueChange }))
  expect(await subject.selection(canvas)).toEqual(subject.none)
  expect(onValueChange).not.toHaveBeenCalled()
})

// components::REQ-016/AC-01, AC-02: options that change under the selected value, which the app passed or the user
// picked, leave the value as it is, with no change reported, and nothing shows as selected. The value is first Apple
// and then Banana: Base UI's select, once its popup has been open, puts back the value it was first given when the
// options change without the selected one.
test.for(everyWay)('%s given as %s keeps its value when the options change without it', async ([name, way]) => {
  const subject = subjects[name]
  const onValueChange = vi.fn()
  const render = (options: readonly Fruit[], value: string) =>
    subject.render({ options, ...given(way, value), onValueChange })
  const canvas = mount(render(fruits, 'a'))
  if (way === 'value') rerender(render(fruits, 'b'))
  else await subject.pick(canvas, 'Banana')
  expect({ selection: await subject.selection(canvas), reported: onValueChange.mock.calls }).toEqual({
    selection: subject.banana,
    reported: way === 'value' ? [] : [['b']],
  })
  onValueChange.mockClear()
  rerender(render(fruits.filter((fruit) => fruit.value !== 'b'), way === 'value' ? 'b' : 'a'))
  expect(await subject.selection(canvas)).toEqual(subject.none)
  expect(onValueChange).not.toHaveBeenCalled()
})

// components::REQ-016/AC-04: in development, one console warning naming the component and the value when it is rendered
// with a value none of its options, and once more each time its value or options change to leave it such a value; none
// for a render with the same value and options, which an app passes as new arrays, and none for one of its options.
// Rendered in Strict Mode, which runs each effect twice on mounting, as apps do in development.
test.for(names)('%s warns in development once for each value none of its options it is given', (name) => {
  const subject = subjects[name]
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  try {
    const render = (options: readonly Fruit[], value: string) => <StrictMode>{subject.render({ options, value })}</StrictMode>
    mount(render(fruits, 'x'))
    rerender(render(fruits.map((fruit) => ({ ...fruit })), 'x'))
    rerender(render(fruits, 'y'))
    rerender(render(fruits, 'b'))
    rerender(render(fruits.filter((fruit) => fruit.value !== 'b'), 'b'))
    expect(warn.mock.calls).toEqual([[subject.warnings.x], [subject.warnings.y], [subject.warnings.b]])
  } finally {
    warn.mockRestore()
  }
})

// components::REQ-016/AC-04: an uncontrolled component warns for the value it holds, which the user picked, and not for
// the value it was first given
test.for(names)('%s given a defaultValue warns for the value the user picked once the options leave it', async (name) => {
  const subject = subjects[name]
  const render = (options: readonly Fruit[]) => subject.render({ options, defaultValue: 'a' })
  const canvas = mount(render(fruits))
  await subject.pick(canvas, 'Banana')
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  try {
    rerender(render(fruits.filter((fruit) => fruit.value !== 'a')))
    expect(warn.mock.calls).toEqual([])
    rerender(render(fruits.filter((fruit) => fruit.value !== 'b')))
    expect(warn.mock.calls).toEqual([[subject.warnings.b]])
  } finally {
    warn.mockRestore()
  }
})

// components::REQ-016/AC-03, AC-05: with a value none of its options, Tab from before the control moves the focus to its
// first segment or tab, selecting nothing and reporting nothing; ArrowRight then moves the focus to the second and
// selects and reports it, as it does with a selected value
test.for(everyRowWay)('%s given as %s a value none of its options lets Tab reach its first without selecting it', async ([name, way]) => {
  const subject = subjects[name]
  const onValueChange = vi.fn()
  const canvas = mount(app(name, way, 'nope', onValueChange))
  await userEvent.click(button(canvas, 'Before'))
  await userEvent.keyboard('{Tab}')
  expect({
    focused: document.activeElement === subject.item(canvas, 'Apple'),
    selection: await subject.selection(canvas),
    reported: onValueChange.mock.calls,
  }).toEqual({ focused: true, selection: subject.none, reported: [] })
  await userEvent.keyboard('{ArrowRight}')
  expect({
    focused: document.activeElement === subject.item(canvas, 'Banana'),
    selection: await subject.selection(canvas),
    reported: onValueChange.mock.calls,
  }).toEqual({ focused: true, selection: subject.banana, reported: [['b']] })
})

// components::REQ-016/AC-05: with a value none of its options, a click on a segment or tab selects it and reports it once
test.for(everyRowWay)('%s given as %s a value none of its options selects the one clicked', async ([name, way]) => {
  const subject = subjects[name]
  const onValueChange = vi.fn()
  const canvas = mount(app(name, way, 'nope', onValueChange))
  await subject.pick(canvas, 'Banana')
  expect({ selection: await subject.selection(canvas), reported: onValueChange.mock.calls }).toEqual({
    selection: subject.banana,
    reported: [['b']],
  })
})

// components::REQ-016/AC-06: a segmented control in a form, given a value none of its options, leaves the form's data
// with nothing under its name, as a native radio group with no radio checked does; given one of its options, it holds
// that option
test.for([
  ['nope', []],
  ['b', ['b']],
] as const)('a segmented control in a form given the value %s holds %j under its name', ([value, entries]) => {
  const canvas = mount(
    <form>
      <SegmentedControl aria-label="Fruit" name="fruit" options={fruits} value={value} />
    </form>,
  )
  const form = canvas.querySelector('form')
  if (!form) throw new Error('no form')
  expect(new FormData(form).getAll('fruit')).toEqual(entries)
})
