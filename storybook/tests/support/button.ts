// The button in `container` named `name`: its `aria-label`, or its text when it has none
export function button(container: Element, name: string): HTMLButtonElement {
  const element = [...container.querySelectorAll('button')].find(
    (candidate) => (candidate.getAttribute('aria-label') ?? candidate.textContent) === name,
  )
  if (!element) throw new Error(`no button ${name}`)
  return element
}
