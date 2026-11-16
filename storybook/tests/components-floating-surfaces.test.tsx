// The kit's floating surfaces together, as an app holds them: the select popup, the tooltip, a toast, the drawer and the
// confirm dialog, under a real pointer and keyboard (Playwright's). Each test renders an app of its own, styled by
// Storybook's stylesheet, which is written as a consumer app's; the first puts it under a ThemeProvider of its own, in
// a theme and a light/dark other than the toolbar's default.
import { Button, ConfirmDialog, Drawer, Select, ThemeProvider, toast, Toaster, Tooltip } from '@aloong-planet/ui'
import { useState } from 'react'
import '../src/styles.css'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { computed } from '../stories/support/computed'
import { isOpen as isDialogOpen, opened } from '../stories/support/dialog'
import { castShadows, inFront } from '../stories/support/floating'
import { isOpen as isSelectOpen, popup } from '../stories/support/select'
import { toasts } from '../stories/support/toast'
import { isOpen as isTooltipOpen, tooltip } from '../stories/support/tooltip'
import { button } from './support/button'
import { mount, unmount } from './support/mount'
import { trigger } from './support/select'

afterEach(() => {
  unmount()
})

const sorts = [
  { value: 'updated', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Date created' },
] as const

// An app with every floating surface of the kit: a tooltip on a button, a select, a drawer and a confirm dialog each
// opened by a button, and its one Toaster, with a button that raises a toast. The controls stand in a column 48px
// apart, so that the tooltip open below its button covers none of the others.
function EverySurface() {
  const [drawer, setDrawer] = useState(false)
  const [dialog, setDialog] = useState(false)
  return (
    <div className="flex flex-col items-start gap-12">
      <Tooltip text="Reload the list from disk">
        <Button>Refresh</Button>
      </Tooltip>
      <Select aria-label="Sort by" options={sorts} defaultValue="name" />
      <Button onClick={() => setDrawer(true)}>Open the drawer</Button>
      <Button onClick={() => setDialog(true)}>Open the dialog</Button>
      <Button onClick={() => toast.success('Saved the settings')}>Save</Button>
      <Drawer open={drawer} onOpenChange={setDrawer} title="Release notes" closeLabel="Close">
        The list keeps its scroll position when a filter is cleared.
      </Drawer>
      <ConfirmDialog
        open={dialog}
        onOpenChange={setDialog}
        title="Publish the release?"
        cancelLabel="Cancel"
        confirmLabel="Publish"
        onConfirm={() => {}}
      >
        Everyone with the link can read it.
      </ConfirmDialog>
      <Toaster aria-label="Messages" />
    </div>
  )
}

// The ground, the border on each of its edges (top, right, bottom and left) and the layers of shadow an open surface
// draws. An edge with a border is read as its width, style and colour; an edge with none as its width alone, since a
// border of no width draws nothing.
function look(surface: HTMLElement) {
  const style = getComputedStyle(surface)
  return {
    ground: style.backgroundColor,
    border: ['top', 'right', 'bottom', 'left'].map((edge) => {
      const width = style.getPropertyValue(`border-${edge}-width`)
      return width === '0px'
        ? width
        : [width, style.getPropertyValue(`border-${edge}-style`), style.getPropertyValue(`border-${edge}-color`)]
    }),
    shadow: castShadows(style.boxShadow),
  }
}

// A 1px solid border in a colour, on an edge
const line = (color: string) => ['1px', 'solid', color]

// components::REQ-001/AC-03: the select popup, the drawer and the confirm dialog stand on the `--popover` ground with a
// 1px `--border-strong` border, the drawer's on its left edge alone (components::REQ-009); the tooltip stands on the
// `--tooltip` ground with no border (components::REQ-008/AC-04); a `success` toast stands on the `--success` ground
// with a 1px `--success-foreground` border (components::REQ-011/AC-05); and all five cast the one `--shadow-pop` shadow.
// Purple light and amber dark: the components' own stories check their surface in the toolbar's default, purple and the
// system's dark, which the tests run under; purple light shows a surface fixed to dark values, amber dark one fixed to
// purple's.
test.each([
  ['purple', 'light'],
  ['amber', 'dark'],
] as const)('every floating surface stands on its ground with its border and casts the --shadow-pop shadow in %s %s', async (theme, mode) => {
  const canvas = mount(
    <ThemeProvider theme={theme} mode={mode}>
      <EverySurface />
    </ThemeProvider>,
  )
  const root = document.documentElement
  const state = [root.getAttribute('data-theme'), root.classList.contains('dark')]

  await userEvent.hover(button(canvas, 'Refresh'))
  const tip = look(await tooltip())
  await userEvent.hover(button(canvas, 'Save'))
  await vi.waitFor(() => expect(isTooltipOpen()).toBe(false))

  await userEvent.click(trigger(canvas))
  const select = look(await popup())
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect(isSelectOpen()).toBe(false))

  await userEvent.click(button(canvas, 'Open the drawer'))
  const drawer = look(await opened('dialog'))
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect(isDialogOpen('dialog')).toBe(false))

  await userEvent.click(button(canvas, 'Open the dialog'))
  const dialog = look(await opened('alertdialog'))
  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect(isDialogOpen('alertdialog')).toBe(false))

  // Raised last: a toast is announced as a `dialog` too, and would be taken for the drawer
  await userEvent.click(button(canvas, 'Save'))
  const [raised] = await toasts(1)
  const message = look(raised)

  const popover = computed('color', 'var(--popover)')
  const strong = line(computed('color', 'var(--border-strong)'))
  const success = line(computed('color', 'var(--success-foreground)'))
  const shadow = [computed('box-shadow', 'var(--shadow-pop)')]
  expect({ state, select, tooltip: tip, toast: message, drawer, dialog }).toEqual({
    state: [theme, mode === 'dark'],
    select: { ground: popover, border: [strong, strong, strong, strong], shadow },
    tooltip: { ground: computed('color', 'var(--tooltip)'), border: ['0px', '0px', '0px', '0px'], shadow },
    toast: { ground: computed('color', 'var(--success)'), border: [success, success, success, success], shadow },
    drawer: { ground: popover, border: ['0px', '0px', '0px', strong], shadow },
    dialog: { ground: popover, border: [strong, strong, strong, strong], shadow },
  })
})

// An app with a select inside its drawer, or inside its confirm dialog, opened by a button
function SelectInside({ surface }: { surface: 'drawer' | 'confirm dialog' }) {
  const [open, setOpen] = useState(false)
  const select = <Select aria-label="Sort by" options={sorts} defaultValue="name" />
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      {surface === 'drawer' ? (
        <Drawer open={open} onOpenChange={setOpen} title="Release notes" closeLabel="Close">
          {select}
        </Drawer>
      ) : (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Publish the release?"
          cancelLabel="Cancel"
          confirmLabel="Publish"
          onConfirm={() => {}}
        >
          {select}
        </ConfirmDialog>
      )}
    </>
  )
}

// components::REQ-001/AC-06, "the one opened last in front": a select popup opened inside an open drawer or confirm
// dialog stands in front of it, so what the pointer meets at the popup's centre is the popup, and a click on one of its
// options selects that option
test.each([
  ['drawer', 'dialog'],
  ['confirm dialog', 'alertdialog'],
] as const)('a select popup opened inside an open %s shows over it and takes a click on an option', async (surface, role) => {
  const canvas = mount(<SelectInside surface={surface} />)
  await userEvent.click(button(canvas, 'Open'))
  const opener = trigger(await opened(role))
  await userEvent.click(opener)
  const list = await popup()
  const box = list.getBoundingClientRect()
  expect(inFront(list, box.left + box.width / 2, box.top + box.height / 2)).toBe(true)
  const option = [...list.querySelectorAll<HTMLElement>('[role="option"]')].find((element) => element.textContent === 'Date created')
  if (!option) throw new Error('no option Date created')
  await userEvent.click(option)
  await vi.waitFor(() => expect(isSelectOpen()).toBe(false))
  expect(opener.textContent).toBe('Date created')
})
