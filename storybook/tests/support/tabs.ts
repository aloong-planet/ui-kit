// The tab in `canvas` whose label starts with `label` (a tab's text is its label followed by its count)
export function tab(canvas: HTMLElement, label: string): HTMLElement {
  const element = [...canvas.querySelectorAll<HTMLElement>('[role="tab"]')].find((node) => node.textContent?.startsWith(label))
  if (!element) throw new Error(`no tab ${label}`)
  return element
}

// The selected tab and the panel that shows
export function shown(canvas: HTMLElement) {
  return {
    selected: [...canvas.querySelectorAll<HTMLElement>('[role="tab"][aria-selected="true"]')].map((node) => node.textContent),
    panels: [...canvas.querySelectorAll<HTMLElement>('[role="tabpanel"]')].map((node) => node.textContent),
  }
}
