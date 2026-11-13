// components::REQ-002 and the shared states of components::REQ-001 on the Button, in a consumer of the kit. The owner
// confirms the Button's look on these stories, switching the theme and light/dark with the toolbar
// (components::CON-002). The look under the pointer and under keyboard focus is shown by pointing at or tabbing to a
// button; it is checked with a real pointer and keyboard in tests/components-button.test.tsx, since a play function's
// events do not make the browser apply `:hover` or `:focus-visible`.
import { Button } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, Plus, X } from 'lucide-react'
import { expect, fn } from 'storybook/test'
import { button } from './support/button'
import { computed } from './support/computed'

const meta = {
  title: 'Components/Button',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const boxVariants = ['default', 'primary', 'danger', 'ghost'] as const

// A link in a line of secondary text, so that its text colour at rest, inherited, differs from its colour under the
// pointer
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button data-button="default">Cancel</Button>
        <Button data-button="primary" variant="primary">
          Save changes
        </Button>
        <Button data-button="danger" variant="danger">
          Delete project
        </Button>
        <Button data-button="ghost" variant="ghost">
          Back to projects
        </Button>
      </div>
      <p className="text-muted-foreground">
        3 projects on this side,{' '}
        <Button data-button="link" variant="link">
          open the list
        </Button>
        .
      </p>
    </div>
  ),
  // components::REQ-002/AC-01 at rest, and package::REQ-002/AC-01: each variant shows the tokens its row names, so
  // the consumer has compiled the Button's classes from the package
  play: async ({ canvasElement }) => {
    const looks = {
      default: ['var(--background)', 'var(--border-strong)', 'var(--foreground)'],
      primary: ['var(--primary)', 'var(--primary)', 'var(--primary-foreground)'],
      danger: ['var(--destructive)', 'var(--destructive)', 'var(--destructive-foreground)'],
      ghost: ['transparent', 'transparent', 'var(--muted-foreground)'],
    }
    for (const [name, [ground, border, text]] of Object.entries(looks)) {
      const style = getComputedStyle(button(canvasElement, name))
      await expect({ name, ground: style.backgroundColor, border: style.borderTopColor, text: style.color }).toEqual({
        name,
        ground: computed('color', ground),
        border: computed('color', border),
        text: computed('color', text),
      })
    }
    const link = getComputedStyle(button(canvasElement, 'link'))
    await expect(link.color).toBe(computed('color', 'var(--muted-foreground)'))
    await expect(link.textDecorationLine).toBe('underline')
    await expect(link.textDecorationColor).toBe(computed('color', 'var(--border-strong)'))
    await expect(link.backgroundColor).toBe(computed('color', 'transparent'))
  },
}

// Every size of every variant with a box; `link` has none, so it has no sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {boxVariants.map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <Button data-button={`${variant} default`} variant={variant}>
            <Plus />
            New project
          </Button>
          <Button data-button={`${variant} sm`} variant={variant} size="sm">
            Install
          </Button>
          <Button data-button={`${variant} icon`} variant={variant} size="icon" aria-label="Close drawer">
            <X />
          </Button>
          <Button data-button={`${variant} icon-sm`} variant={variant} size="icon-sm" aria-label="Copy path">
            <Copy />
          </Button>
        </div>
      ))}
    </div>
  ),
  // components::REQ-002/AC-02: each size's box, font size and radius come from the scale, the same in every variant,
  // and the two icon sizes are square
  play: async ({ canvasElement }) => {
    const sizes = {
      default: { width: undefined, height: 28, fontSize: '12.5px', radius: '7px' },
      sm: { width: undefined, height: 22, fontSize: '11px', radius: '7px' },
      icon: { width: 28, height: 28, fontSize: undefined, radius: '7px' },
      'icon-sm': { width: 22, height: 22, fontSize: undefined, radius: '5.25px' },
    }
    for (const variant of boxVariants) {
      for (const [size, expected] of Object.entries(sizes)) {
        const element = button(canvasElement, `${variant} ${size}`)
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        await expect({ variant, size, width: rect.width, height: rect.height, fontSize: style.fontSize, radius: style.borderTopLeftRadius }).toEqual({
          variant,
          size,
          width: expected.width ?? rect.width,
          height: expected.height,
          fontSize: expected.fontSize ?? style.fontSize,
          radius: expected.radius,
        })
      }
    }
  },
}

// components::REQ-002/AC-03: an icon-only button is named by the text the caller passes, and the button hides its
// icon from screen readers, whatever the icon: lucide-react hides its own icons, so the last button holds an icon of
// the caller's own that does not
export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="icon" aria-label="Close drawer">
        <X />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Copy path">
        <Copy />
      </Button>
      <Button variant="primary" size="icon" aria-label="Record">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="5" />
        </svg>
      </Button>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Close drawer', 'Copy path', 'Record']) {
      const element = canvas.getByRole('button', { name })
      const icon = element.querySelector('svg')
      // The element that hides the icon lies between the icon and the button
      const hidden = icon?.parentElement?.closest('[aria-hidden="true"]')
      await expect({ name, hiddenInsideTheButton: hidden ? element.contains(hidden) : false }).toEqual({
        name,
        hiddenInsideTheButton: true,
      })
    }
    await expect(canvas.getByRole('button', { name: 'Record' }).querySelector('svg')?.hasAttribute('aria-hidden')).toBe(
      false,
    )
  },
}

// components::REQ-001/AC-02: every variant disabled shows its muted look. Each button reports an activation to
// `onClick`, which the tests read to see that none happens.
export const Disabled: StoryObj<{ onClick: () => void }> = {
  args: { onClick: fn() },
  render: ({ onClick }) => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button data-button="default" disabled onClick={onClick}>
          Cancel
        </Button>
        <Button data-button="primary" variant="primary" disabled onClick={onClick}>
          Save changes
        </Button>
        <Button data-button="danger" variant="danger" disabled onClick={onClick}>
          Delete project
        </Button>
        <Button data-button="ghost" variant="ghost" disabled onClick={onClick}>
          Back to projects
        </Button>
        <Button data-button="icon" size="icon" aria-label="Close drawer" disabled onClick={onClick}>
          <X />
        </Button>
      </div>
      <p className="text-muted-foreground">
        3 projects on this side,{' '}
        <Button data-button="link" variant="link" disabled onClick={onClick}>
          open the list
        </Button>
        .
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const name of ['default', 'primary', 'danger', 'ghost', 'icon', 'link']) {
      const element = button(canvasElement, name)
      await expect({ name, disabled: element.disabled, opacity: getComputedStyle(element).opacity }).toEqual({
        name,
        disabled: true,
        opacity: '0.45',
      })
    }
  },
}

// components::REQ-001/AC-01: the look of keyboard focus, for the owner to confirm; focus moved by a script shows the
// keyboard's outline when no pointer has been used on the page
export const KeyboardFocus: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button data-button="default">Cancel</Button>
      <Button variant="primary">Save changes</Button>
    </div>
  ),
  play: ({ canvasElement }) => {
    button(canvasElement, 'default').focus()
  },
}

// components::REQ-001/AC-05: a label longer than the space stays on one line and is cut with an ellipsis, whatever
// shape it is passed in: a string, an icon and a string, an element (as a translation component renders), or text
// with a value in it
export const LongLabel: Story = {
  render: () => (
    <div className="flex w-36 flex-col items-start gap-3 border border-dashed border-border-strong p-2">
      <Button data-button="string">Remove every conversation from this project</Button>
      <Button data-button="icon and string" size="sm" variant="ghost">
        <Plus />
        Install to every agent on this machine
      </Button>
      <Button data-button="element" variant="primary">
        <span>Rename every project on this side</span>
      </Button>
      <Button data-button="value in text">{3} conversations to remove from this project</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('div')?.getBoundingClientRect()
    if (!column) throw new Error('no column')
    const labels = {
      string: ['Remove every conversation from this project', 28],
      'icon and string': ['Install to every agent on this machine', 22],
      element: ['Rename every project on this side', 28],
      'value in text': ['3 conversations to remove from this project', 28],
    } as const
    for (const [name, [label, height]] of Object.entries(labels)) {
      const element = button(canvasElement, name)
      const rect = element.getBoundingClientRect()
      // The element that cuts the label holds the whole of it, and cuts it with an ellipsis
      const cut = [element, ...element.querySelectorAll('*')].filter((node) => {
        const style = getComputedStyle(node)
        return style.textOverflow === 'ellipsis' && style.overflowX === 'hidden' && node.scrollWidth > node.clientWidth
      })
      await expect({ name, cutLabels: cut.map((node) => node.textContent), height: rect.height }).toEqual({
        name,
        cutLabels: [label],
        height,
      })
      await expect(rect.right).toBeLessThanOrEqual(column.right)
    }
  },
}
