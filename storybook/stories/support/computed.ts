// What the browser computes for `value` as `property`, so that one colour written two ways (`#fff`,
// `rgb(255, 255, 255)`) compares equal; `var(--token)` gives the token as an element on the page reads it
export function computed(property: 'color' | 'box-shadow', value: string): string {
  const probe = document.body.appendChild(document.createElement('div'))
  probe.style.setProperty(property, value)
  const result = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return result
}
