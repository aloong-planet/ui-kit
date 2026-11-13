// The button a story marks with `data-button="<name>"`
export function button(canvas: HTMLElement, name: string): HTMLButtonElement {
  const element = canvas.querySelector<HTMLButtonElement>(`[data-button="${name}"]`)
  if (!element) throw new Error(`no button ${name}`)
  return element
}
