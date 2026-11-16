// The trigger of the select in `canvas`
export function trigger(canvas: HTMLElement): HTMLElement {
  const element = canvas.querySelector<HTMLElement>('[role="combobox"]')
  if (!element) throw new Error('no select trigger')
  return element
}
