// components::REQ-011 and the shared states of components::REQ-001 on the toast, in a consumer of the kit. Each story
// renders the app's one Toaster and a button that raises its toasts; the owner confirms the toasts' look on these
// stories, switching the theme and light/dark with the toolbar (components::CON-002). A toast leaves after 3200ms, and
// stays while the pointer is over it. How long toasts stay, swiping them away, raising them from outside React and
// before the Toaster mounts, and the keyboard's focus on them are checked in tests/components-toast.test.tsx.
import { Button, toast, Toaster } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { computed } from './support/computed'
import { castShadows } from './support/floating'
import { region, toasts } from './support/toast'

const meta = {
  title: 'Components/Toast',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

// The app's one Toaster, labelled otherwise than Base UI's built-in English label, "Notifications", so that the label
// read back is the one passed, and a button that runs `raise` when clicked
function App({ label, raise }: { label: string; raise: () => void }) {
  return (
    <>
      <Toaster aria-label="Messages" />
      <Button onClick={raise}>{label}</Button>
    </>
  )
}

// A length to the nearest pixel, with `-0` read as 0: Base UI and the layout place toasts on fractional pixels
const px = (length: number) => Math.round(length) + 0

async function raise(canvasElement: HTMLElement, count: number) {
  await userEvent.click(within(canvasElement).getByRole('button'))
  return toasts(count)
}

// The look of a toast of `variant` (components::REQ-011/AC-05, components::REQ-001/AC-03, package::REQ-002/AC-01): its
// ground and text, a 1px border in its text's colour, the `--shadow-pop` shadow; components::REQ-011/AC-02: it holds no
// button; components::REQ-011/AC-03: it appears in the region labelled by the Toaster, which screen readers announce
function look(element: HTMLElement) {
  const style = getComputedStyle(element)
  return {
    ground: style.backgroundColor,
    textColour: style.color,
    border: [style.borderTopWidth, style.borderTopColor],
    shadow: castShadows(style.boxShadow),
    buttons: element.querySelectorAll('button, [role="button"]').length,
    region: [region().getAttribute('aria-label'), region().getAttribute('aria-live'), region().contains(element)],
  }
}

const expected = (variant: 'success' | 'error') => ({
  ground: computed('color', `var(--${variant})`),
  textColour: computed('color', `var(--${variant}-foreground)`),
  border: ['1px', computed('color', `var(--${variant}-foreground)`)],
  shadow: [computed('box-shadow', 'var(--shadow-pop)')],
  buttons: 0,
  region: ['Messages', 'polite', true],
})

export const Success: Story = {
  render: () => <App label="Save" raise={() => toast.success('Saved the settings')} />,
  play: async ({ canvasElement }) => {
    const [shown] = await raise(canvasElement, 1)
    await expect({ text: shown.textContent, ...look(shown) }).toEqual({ text: 'Saved the settings', ...expected('success') })
  },
}

export const Error: Story = {
  render: () => <App label="Save" raise={() => toast.error('Could not save the settings')} />,
  play: async ({ canvasElement }) => {
    const [shown] = await raise(canvasElement, 1)
    await expect({ text: shown.textContent, ...look(shown) }).toEqual({ text: 'Could not save the settings', ...expected('error') })
  },
}

// components::REQ-011/AC-04: three toasts at the bottom centre of the window, the lowest 18px above its bottom edge,
// 8px apart, the newest at the bottom
export const Stack: Story = {
  render: () => (
    <App
      label="Save three"
      raise={() => {
        toast.success('Saved the first file')
        toast.error('Could not save the second file')
        toast.success('Saved the third file')
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const shown = await raise(canvasElement, 3)
    const boxes = shown.map((element) => element.getBoundingClientRect())
    await expect({
      texts: shown.map((element) => element.textContent),
      bottom: px(window.innerHeight - boxes[2].bottom),
      centres: boxes.map((box) => px(box.left + box.width / 2 - document.documentElement.clientWidth / 2)),
      gaps: [px(boxes[1].top - boxes[0].bottom), px(boxes[2].top - boxes[1].bottom)],
    }).toEqual({
      texts: ['Saved the first file', 'Could not save the second file', 'Saved the third file'],
      bottom: 18,
      centres: [0, 0, 0],
      gaps: [8, 8],
    })
  },
}

// components::REQ-011/AC-08: five toasts raised at once all stand in the column, none hidden for another: each is
// shown, and none is inert, which is how Base UI keeps toasts beyond its limit from the keyboard, the pointer and
// screen readers
export const Many: Story = {
  render: () => (
    <App
      label="Save five"
      raise={() => {
        for (const index of [1, 2, 3, 4, 5]) toast.success(`Saved file ${index}`)
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const shown = await raise(canvasElement, 5)
    await expect(
      shown.map((element) => ({
        text: element.textContent,
        visible: getComputedStyle(element).opacity === '1' && getComputedStyle(element).visibility === 'visible',
        inert: element.inert,
        inWindow: element.getBoundingClientRect().top >= 0,
      })),
    ).toEqual([1, 2, 3, 4, 5].map((index) => ({ text: `Saved file ${index}`, visible: true, inert: false, inWindow: true })))
  },
}

// components::REQ-011/AC-08 and the boundary "More toasts than the window holds", for the owner to confirm: thirty
// toasts, more than the window holds, raised at once. The column stays inside the window and shows the newest, 18px
// above the window's bottom edge, while the oldest are out of view above it, reached with the wheel over the toasts.
export const MoreThanTheWindowHolds: Story = {
  render: () => (
    <App
      label="Save thirty"
      raise={() => {
        for (let index = 1; index <= 30; index++) toast.success(`Saved file ${index}`)
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const shown = await raise(canvasElement, 30)
    const [oldest] = shown
    const newest = shown[shown.length - 1]
    const column = region().getBoundingClientRect()
    await expect({
      newest: newest.textContent,
      newestBottom: px(window.innerHeight - newest.getBoundingClientRect().bottom),
      oldestOutOfView: oldest.getBoundingClientRect().bottom <= column.top,
      columnInWindow: column.top >= 0 && column.bottom <= window.innerHeight,
    }).toEqual({ newest: 'Saved file 30', newestBottom: 18, oldestOutOfView: true, columnInWindow: true })
  },
}

// components::REQ-001/AC-05: text longer than the toast's 440px wraps onto more lines and is not cut
export const LongText: Story = {
  render: () => (
    <App
      label="Save"
      raise={() =>
        toast.error('Could not save the settings, since the disk is full; free some space on it and save them again from the settings page')
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const [shown] = await raise(canvasElement, 1)
    const style = getComputedStyle(shown)
    const content = shown.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    await expect({
      width: px(shown.getBoundingClientRect().width),
      lines: px(content / parseFloat(style.lineHeight)),
      cut: shown.scrollWidth > shown.clientWidth,
    }).toEqual({ width: 440, lines: 2, cut: false })
  },
}

// components::REQ-001/AC-01 on a toast: keyboard focus on a toast shows the keyboard's outline, for the owner to
// confirm; focus moved by a script shows it when no pointer has been used on the page, so the toast is raised here
// rather than by a click
export const KeyboardFocus: Story = {
  render: () => <App label="Save" raise={() => toast.success('Saved the settings')} />,
  play: async () => {
    toast.success('Saved the settings')
    const [shown] = await toasts(1)
    shown.focus()
  },
}
