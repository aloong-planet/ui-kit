// The uses of a component its props reject. components::CON-001: every text a component needs is a required prop, so a
// component used without it fails the type check; components::REQ-002: a link takes no size; components::REQ-004/AC-09,
// REQ-005/AC-06 and REQ-013/AC-05: a select, a segmented control and tabs take a selected value, one of their options.
// Each use marked `@ts-expect-error` breaks one of these, and typecheck fails if one of them compiles, since its
// directive then has no error to expect; the unmarked use next to it differs only in keeping the rule, so that the marked one fails for
// breaking it and not for something else. This file is type-checked by `pnpm typecheck`, never run.
import { X } from 'lucide-react'
import { Badge, Button, SearchBox, SegmentedControl, Select, Tabs } from '../src'

declare const name: string

export const badges = [
  // @ts-expect-error a badge needs its text
  <Badge key="no text" variant="primary" />,
  <Badge key="text" variant="primary">
    {name}
  </Badge>,
]

export const iconButtons = [
  // @ts-expect-error an icon-only button needs the accessible name the caller passes
  <Button key="icon" size="icon">
    <X />
  </Button>,
  <Button key="icon named" size="icon" aria-label={name}>
    <X />
  </Button>,
  // @ts-expect-error a small icon-only button needs it too
  <Button key="icon-sm" size="icon-sm" variant="ghost">
    <X />
  </Button>,
  <Button key="icon-sm named" size="icon-sm" variant="ghost" aria-label={name}>
    <X />
  </Button>,
]

export const textButtons = [
  // @ts-expect-error a text button needs its label
  <Button key="no label" variant="primary" />,
  <Button key="label" variant="primary">
    {name}
  </Button>,
]

// components::REQ-002: a link is inline text in the size of the text around it, so it takes no size
export const links = [
  // @ts-expect-error a link takes no size
  <Button key="link sized" variant="link" size="icon" aria-label={name}>
    <X />
  </Button>,
  <Button key="link" variant="link">
    {name}
  </Button>,
]

// A search box needs its placeholder and its accessible name, an `aria-label` or an `aria-labelledby`
export const searchBoxes = [
  // @ts-expect-error a search box needs its accessible name
  <SearchBox key="no name" placeholder={name} />,
  <SearchBox key="label" placeholder={name} aria-label={name} />,
  <SearchBox key="labelled by" placeholder={name} aria-labelledby={name} />,
  // @ts-expect-error a search box needs its placeholder
  <SearchBox key="no placeholder" aria-label={name} />,
]

const ranges = [
  { value: 'day', label: name },
  { value: 'week', label: name },
] as const

// A segmented control needs its accessible name, and a selected value (components::REQ-005/AC-06)
export const segmentedControls = [
  // @ts-expect-error a segmented control needs its accessible name
  <SegmentedControl key="no name" options={ranges} defaultValue="day" />,
  <SegmentedControl key="label" options={ranges} defaultValue="day" aria-label={name} />,
  <SegmentedControl key="labelled by" options={ranges} value="week" aria-labelledby={name} />,
  // @ts-expect-error a segmented control needs a selected value
  <SegmentedControl key="no value" options={ranges} aria-label={name} />,
  // @ts-expect-error the selected value is one of its options
  <SegmentedControl key="other value" options={ranges} defaultValue="month" aria-label={name} />,
]

const sections = [
  { value: 'day', label: name, panel: name },
  { value: 'week', label: name, panel: name },
] as const

// Tabs need the accessible name of their row, and a selected value (components::REQ-013/AC-05)
export const tabs = [
  // @ts-expect-error tabs need the accessible name of their row
  <Tabs key="no name" tabs={sections} defaultValue="day" />,
  <Tabs key="label" tabs={sections} defaultValue="day" aria-label={name} />,
  <Tabs key="labelled by" tabs={sections} value="week" aria-labelledby={name} />,
  // @ts-expect-error tabs need a selected value
  <Tabs key="no value" tabs={sections} aria-label={name} />,
  // @ts-expect-error the selected value is one of their tabs
  <Tabs key="other value" tabs={sections} defaultValue="month" aria-label={name} />,
]

// A select needs its accessible name, and a selected value (components::REQ-004/AC-09)
export const selects = [
  // @ts-expect-error a select needs its accessible name
  <Select key="no name" options={ranges} defaultValue="day" />,
  <Select key="label" options={ranges} defaultValue="day" aria-label={name} />,
  <Select key="labelled by" groups={[ranges]} value="week" aria-labelledby={name} />,
  // @ts-expect-error a select needs a selected value
  <Select key="no value" options={ranges} aria-label={name} />,
  // @ts-expect-error the selected value is one of its options
  <Select key="other value" options={ranges} defaultValue="month" aria-label={name} />,
]
