// The segment of the segmented control in `canvas` labelled `label`
export function segment(canvas: HTMLElement, label: string): HTMLElement {
  const element = [...canvas.querySelectorAll<HTMLElement>('[role="radio"]')].find((node) => node.textContent === label)
  if (!element) throw new Error(`no segment ${label}`)
  return element
}

// The labels of the segments that show as selected
export function checked(canvas: HTMLElement): string[] {
  return [...canvas.querySelectorAll<HTMLElement>('[role="radio"][aria-checked="true"]')].map((node) => node.textContent ?? '')
}
