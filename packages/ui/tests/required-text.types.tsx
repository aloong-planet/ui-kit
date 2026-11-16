// The uses of a component its props reject. components::CON-001: every text a component needs is a required prop, so a
// component used without it fails the type check; components::REQ-002: a link takes no size; components::REQ-004/AC-09,
// REQ-005/AC-06 and REQ-013/AC-05: a select, a segmented control and tabs take a selected value, one of their options.
// Each use marked `@ts-expect-error` breaks one of these, and typecheck fails if one of them compiles, since its
// directive then has no error to expect; the unmarked use next to it differs only in keeping the rule, so that the marked one fails for
// breaking it and not for something else. This file is type-checked by `pnpm typecheck`, never run.
import { X } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  SearchBox,
  SegmentedControl,
  Select,
  Tabs,
  toast,
  Toaster,
  Tooltip,
} from '../src'

declare const name: string
declare const setOpen: (open: boolean) => void
declare const confirm: () => void

export const badges = [
  // @ts-expect-error a badge needs its text
  <Badge key="no text" variant="primary" />,
  <Badge key="text" variant="primary">
    {name}
  </Badge>,
]

// A selectable card is a button, announced by its content, so it needs its content
export const cards = [
  // @ts-expect-error a selectable card needs its content
  <Card key="no content" variant="selectable" />,
  <Card key="content" variant="selectable">
    {name}
  </Card>,
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
  // @ts-expect-error a controlled selected value is one of its options too
  <SegmentedControl key="other controlled value" options={ranges} value="month" aria-labelledby={name} />,
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
  // @ts-expect-error a controlled selected value is one of their tabs too
  <Tabs key="other controlled value" tabs={sections} value="month" aria-label={name} />,
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
  // @ts-expect-error a controlled selected value is one of its options too
  <Select key="other controlled value" groups={[ranges]} value="month" aria-labelledby={name} />,
]

// A tooltip needs its text
export const tooltips = [
  // @ts-expect-error a tooltip needs its text
  <Tooltip key="no text" warning={name}>
    <Button>{name}</Button>
  </Tooltip>,
  <Tooltip key="text" text={name} warning={name}>
    <Button>{name}</Button>
  </Tooltip>,
]

// A Toaster needs the label of its region, and a toast its text
export const toasters = [
  // @ts-expect-error a Toaster needs the label of its region
  <Toaster key="no label" />,
  <Toaster key="label" aria-label={name} />,
]

export function raiseToasts() {
  // @ts-expect-error a toast needs its text
  toast.success()
  toast.success(name)
  // @ts-expect-error an error toast needs it too
  toast.error()
  toast.error(name)
}

// A drawer needs its title, the close button's accessible name and its content
export const drawers = [
  // @ts-expect-error a drawer needs its title
  <Drawer key="no title" open onOpenChange={setOpen} closeLabel={name}>
    {name}
  </Drawer>,
  // @ts-expect-error a drawer needs the close button's accessible name
  <Drawer key="no close label" open onOpenChange={setOpen} title={name}>
    {name}
  </Drawer>,
  // @ts-expect-error a drawer needs its content
  <Drawer key="no content" open onOpenChange={setOpen} title={name} closeLabel={name} />,
  <Drawer key="drawer" open onOpenChange={setOpen} title={name} closeLabel={name}>
    {name}
  </Drawer>,
]

// A confirm dialog needs its title, its body and the labels of its two buttons
export const confirmDialogs = [
  // @ts-expect-error a confirm dialog needs its title
  <ConfirmDialog key="no title" open onOpenChange={setOpen} cancelLabel={name} confirmLabel={name} onConfirm={confirm}>
    {name}
  </ConfirmDialog>,
  // @ts-expect-error a confirm dialog needs its body
  <ConfirmDialog key="no body" open onOpenChange={setOpen} title={name} cancelLabel={name} confirmLabel={name} onConfirm={confirm} />,
  // @ts-expect-error a confirm dialog needs its cancel button's label
  <ConfirmDialog key="no cancel label" open onOpenChange={setOpen} title={name} confirmLabel={name} onConfirm={confirm}>
    {name}
  </ConfirmDialog>,
  // @ts-expect-error a confirm dialog needs its confirming action's label
  <ConfirmDialog key="no confirm label" open onOpenChange={setOpen} title={name} cancelLabel={name} onConfirm={confirm}>
    {name}
  </ConfirmDialog>,
  <ConfirmDialog key="dialog" open onOpenChange={setOpen} title={name} cancelLabel={name} confirmLabel={name} onConfirm={confirm}>
    {name}
  </ConfirmDialog>,
  <ConfirmDialog
    key="destructive"
    open
    onOpenChange={setOpen}
    title={name}
    cancelLabel={name}
    confirmLabel={name}
    destructive
    onConfirm={confirm}
  >
    {name}
  </ConfirmDialog>,
]
