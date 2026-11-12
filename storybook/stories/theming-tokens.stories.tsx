// theming::REQ-001, REQ-003 and REQ-004 in a consumer of the kit: the general tokens in every theme and light/dark,
// and the utilities Tailwind compiles for them in a consumer that has set the kit up (package::REQ-002/AC-01).
// `Tokens` is the sheet the owner switches with the toolbar; the stories tagged `!dev` are hidden from the sidebar and
// run only as tests. They write the root element with the apply function: what they check is how the stylesheet
// answers the root contract, whoever wrote the root (the ThemeProvider writes it through the same function).
import { applyTheme } from '@aloong-planet/ui/apply-theme'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { tokenValues } from './theming-token-values'

// Every general token with a colour, then its background, text and border utilities, written out in full so that
// Tailwind finds and compiles them
const colourTokens = [
  '--background bg-background text-background border-background',
  '--foreground bg-foreground text-foreground border-foreground',
  '--card bg-card text-card border-card',
  '--card-foreground bg-card-foreground text-card-foreground border-card-foreground',
  '--popover bg-popover text-popover border-popover',
  '--popover-foreground bg-popover-foreground text-popover-foreground border-popover-foreground',
  '--primary bg-primary text-primary border-primary',
  '--primary-foreground bg-primary-foreground text-primary-foreground border-primary-foreground',
  '--primary-strong bg-primary-strong text-primary-strong border-primary-strong',
  '--muted bg-muted text-muted border-muted',
  '--muted-foreground bg-muted-foreground text-muted-foreground border-muted-foreground',
  '--accent bg-accent text-accent border-accent',
  '--accent-foreground bg-accent-foreground text-accent-foreground border-accent-foreground',
  '--accent-strong bg-accent-strong text-accent-strong border-accent-strong',
  '--destructive bg-destructive text-destructive border-destructive',
  '--destructive-foreground bg-destructive-foreground text-destructive-foreground border-destructive-foreground',
  '--border bg-border text-border border-border',
  '--border-strong bg-border-strong text-border-strong border-border-strong',
  '--input bg-input text-input border-input',
  '--ring bg-ring text-ring border-ring',
  '--success bg-success text-success border-success',
  '--success-foreground bg-success-foreground text-success-foreground border-success-foreground',
  '--warning bg-warning text-warning border-warning',
  '--warning-foreground bg-warning-foreground text-warning-foreground border-warning-foreground',
  '--error bg-error text-error border-error',
  '--error-foreground bg-error-foreground text-error-foreground border-error-foreground',
  '--note bg-note text-note border-note',
  '--note-foreground bg-note-foreground text-note-foreground border-note-foreground',
  '--risk bg-risk text-risk border-risk',
  '--risk-foreground bg-risk-foreground text-risk-foreground border-risk-foreground',
  '--tooltip bg-tooltip text-tooltip border-tooltip',
  '--tooltip-foreground bg-tooltip-foreground text-tooltip-foreground border-tooltip-foreground',
  '--tooltip-warning bg-tooltip-warning text-tooltip-warning border-tooltip-warning',
  '--overlay bg-overlay text-overlay border-overlay',
  '--scrollbar-thumb bg-scrollbar-thumb text-scrollbar-thumb border-scrollbar-thumb',
  '--scrollbar-thumb-hover bg-scrollbar-thumb-hover text-scrollbar-thumb-hover border-scrollbar-thumb-hover',
].map((entry) => {
  const [token, bg, text, border] = entry.split(' ')
  return { token, bg, text, border }
})

const meta = {
  title: 'Theming/Tokens',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const root = document.documentElement

// What the browser computes for `value` as `property`, so that one colour written two ways (`#fff`,
// `rgb(255, 255, 255)`) compares equal; `var(--token)` gives the token as an element on the page reads it
function computed(property: 'color' | 'box-shadow', value: string): string {
  const probe = document.body.appendChild(document.createElement('div'))
  probe.style.setProperty(property, value)
  const result = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return result
}

function propertyOf(token: string): 'color' | 'box-shadow' {
  return token === '--shadow-pop' ? 'box-shadow' : 'color'
}

function utility(canvas: HTMLElement, name: string): Element {
  const element = canvas.querySelector(`[data-utility="${name}"]`)
  if (!element) throw new Error(`no element for ${name}`)
  return element
}

export const Tokens: Story = {
  render: () => (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-6 gap-y-2">
      {colourTokens.map(({ token, bg, text, border }) => (
        <li key={token} className="flex items-center gap-3">
          <span data-utility={`${token} bg`} className={`size-8 shrink-0 rounded-md border border-border ${bg}`} />
          <span data-utility={`${token} text`} className={`w-6 font-semibold ${text}`}>
            Aa
          </span>
          <span data-utility={`${token} border`} className={`h-8 w-10 shrink-0 rounded-md border-2 ${border}`} />
          <code className="text-sm">{token}</code>
        </li>
      ))}
      <li className="flex items-center gap-3">
        <span data-utility="--shadow-pop shadow" className="size-8 shrink-0 rounded-md bg-popover shadow-pop" />
        <code className="text-sm">--shadow-pop</code>
      </li>
    </ul>
  ),
  // theming::REQ-004/AC-02 and package::REQ-002/AC-01: each token's background, text and border utilities render the
  // token, in the toolbar's state and again in another theme and light/dark, so a utility fixed to one state fails
  play: async ({ canvasElement }) => {
    for (const write of [() => undefined, () => applyTheme('amber', 'dark')]) {
      write()
      const state = `${root.getAttribute('data-theme')}${root.classList.contains('dark') ? ' dark' : ''}`
      const mismatches: string[] = []
      for (const { token } of colourTokens) {
        if (getComputedStyle(root).getPropertyValue(token) === '') mismatches.push(`${state}: ${token} is not defined`)
        const expected = computed('color', `var(${token})`)
        for (const [name, property] of [
          ['bg', 'background-color'],
          ['text', 'color'],
          ['border', 'border-top-color'],
        ] as const) {
          const actual = getComputedStyle(utility(canvasElement, `${token} ${name}`)).getPropertyValue(property)
          if (actual !== expected) mismatches.push(`${state}: ${name}-${token.slice(2)} is ${actual}, not ${expected}`)
        }
      }
      // Tailwind's shadow utilities put empty ring and inset layers before the shadow itself
      const shadow = getComputedStyle(utility(canvasElement, '--shadow-pop shadow')).boxShadow
      if (!shadow.endsWith(`, ${computed('box-shadow', 'var(--shadow-pop)')}`))
        mismatches.push(`${state}: shadow-pop is ${shadow}`)
      await expect(colourTokens).toHaveLength(36)
      await expect(mismatches).toEqual([])
    }
  },
}

// The states of the root contract (theming::REQ-003) and the values each must give
const states = [
  { name: 'no data-theme', values: tokenValues['purple-light'], write: () => root.removeAttribute('data-theme') },
  { name: 'purple light', values: tokenValues['purple-light'], write: () => applyTheme('purple', 'light') },
  { name: 'purple dark', values: tokenValues['purple-dark'], write: () => applyTheme('purple', 'dark') },
  { name: 'blue light', values: tokenValues['blue-light'], write: () => applyTheme('blue', 'light') },
  { name: 'blue dark', values: tokenValues['blue-dark'], write: () => applyTheme('blue', 'dark') },
  { name: 'amber light', values: tokenValues['amber-light'], write: () => applyTheme('amber', 'light') },
  { name: 'amber dark', values: tokenValues['amber-dark'], write: () => applyTheme('amber', 'dark') },
]

// theming::REQ-001 and REQ-003/AC-01, AC-02: a root without `data-theme` gets the purple values, and with `dark` every
// token takes the dark value of the theme in force
export const ValuesInEveryThemeAndLightDark: Story = {
  tags: ['!dev'],
  render: () => <div />,
  play: async () => {
    const mismatches: string[] = []
    for (const { name, values, write } of states) {
      applyTheme('purple', 'light')
      write()
      for (const [token, value] of Object.entries(values)) {
        const actual = computed(propertyOf(token), `var(${token})`)
        const expected = computed(propertyOf(token), value)
        if (actual !== expected) mismatches.push(`${name}: ${token} is ${actual}, not ${expected}`)
      }
    }
    await expect(Object.keys(tokenValues['purple-light'])).toHaveLength(37)
    await expect(mismatches).toEqual([])
  },
}

const colourProperty = /^(all|.*color|background|border.*|outline|fill|stroke|box-shadow)$/

// The properties of the element's transitions that animate a colour; CSS repeats the shorter of the two lists to the
// length of the longer
function colourTransitions(element: Element): string[] {
  const style = getComputedStyle(element)
  const properties = style.transitionProperty.split(',').map((value) => value.trim())
  const durations = style.transitionDuration.split(',').map((value) => parseFloat(value))
  const count = Math.max(properties.length, durations.length)
  return Array.from({ length: count }, (_, i) => ({
    property: properties[i % properties.length],
    duration: durations[i % durations.length],
  }))
    .filter(({ property, duration }) => duration > 0 && colourProperty.test(property))
    .map(({ property }) => property)
}

// theming::REQ-003/AC-03: switching the theme or light/dark recolours the page at once: nothing on it, the page
// itself included, animates a colour
export const RecoloursWithNoTransition: Story = {
  ...Tokens,
  tags: ['!dev'],
  play: async ({ canvasElement }) => {
    const elements = [root, document.body, ...canvasElement.querySelectorAll('*')]
    await expect(elements.length).toBeGreaterThan(36 * 4)
    const transitions = elements.flatMap((element) =>
      colourTransitions(element).map((property) => `${element.tagName.toLowerCase()} ${property}`),
    )
    await expect(transitions).toEqual([])
  },
}

// The `dark:` variant follows the root's `dark` class (theming::REQ-003), not the system's `prefers-color-scheme`:
// with dark locked while the system is light, a `dark:` utility applies
export const DarkVariantFollowsTheRoot: Story = {
  tags: ['!dev'],
  render: () => <div data-utility="variant" className="size-4 bg-card dark:bg-primary" />,
  play: async ({ canvasElement }) => {
    await expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false)
    const background = () => getComputedStyle(utility(canvasElement, 'variant')).backgroundColor
    applyTheme('purple', 'dark')
    await expect(background()).toBe(computed('color', 'var(--primary)'))
    applyTheme('purple', 'light')
    await expect(background()).toBe(computed('color', 'var(--card)'))
  },
}
