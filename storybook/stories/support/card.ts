// The parts of a Card that the Card's stories and tests read, and the looks they compare a card with
import { computed } from './computed'
import { castShadows } from './select'

// The card a story marks with `data-card="<name>"`, and a part inside it marked with `data-part="<name>"`
export function card(canvas: HTMLElement, name: string): HTMLElement {
  const element = canvas.querySelector<HTMLElement>(`[data-card="${name}"]`)
  if (!element) throw new Error(`no ${name} card`)
  return element
}

export function part(scope: Element, name: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(`[data-part="${name}"]`)
  if (!element) throw new Error(`no ${name}`)
  return element
}

// The box inside a card's border, unrounded: the parts' text makes a card's height fractional, which `clientHeight`
// rounds
export function inside(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  const [top, right, bottom, left] = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat)
  return { top: rect.top + top, right: rect.right - right, bottom: rect.bottom - bottom, left: rect.left + left, width: rect.width - left - right }
}

// The look of a card and of its title and description: its ground, its border, its text colour and the rings drawn
// inside its box
export function look(element: HTMLElement) {
  const style = getComputedStyle(element)
  return {
    ground: style.backgroundColor,
    border: [style.borderTopWidth, style.borderTopStyle, style.borderTopColor],
    text: style.color,
    ring: style.boxShadow === 'none' ? [] : castShadows(style.boxShadow),
    title: getComputedStyle(part(element, 'title')).color,
    description: getComputedStyle(part(element, 'description')).color,
  }
}

// A `default` card, which an unpressed `selectable` card looks like at rest
export const defaultLook = () => ({
  ground: computed('color', 'var(--card)'),
  border: ['1px', 'solid', computed('color', 'var(--border)')],
  text: computed('color', 'var(--card-foreground)'),
  ring: [],
  title: computed('color', 'var(--card-foreground)'),
  description: computed('color', 'var(--muted-foreground)'),
})

// A `selectable` card under the pointer: a `--primary` border and the wash, and no ring
export const hoveredLook = () => ({
  ...defaultLook(),
  ground: computed('color', 'var(--accent)'),
  border: ['1px', 'solid', computed('color', 'var(--primary)')],
})

// A pressed `selectable` card: also a 1px `--primary` ring inside its box, and its title in `--primary`; its
// description keeps `--muted-foreground`
export const pressedLook = () => ({
  ...hoveredLook(),
  ring: [`${computed('color', 'var(--primary)')} 0px 0px 0px 1px inset`],
  title: computed('color', 'var(--primary)'),
})
