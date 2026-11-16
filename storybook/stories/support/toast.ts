// The toasts that the Toast's stories and tests read. Base UI renders the Toaster's region in a portal at the end of
// the page, so the toasts are looked up in the document rather than in the story's canvas.

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))

// The region the toasts appear in
export function region(): HTMLElement {
  const element = document.querySelector<HTMLElement>('[data-base-ui-portal] [role="region"]')
  if (!element) throw new Error('no toast region')
  return element
}

// The toasts on the page, from top to bottom
export function shown(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-base-ui-portal] [role="region"] [role="dialog"]')]
}

// The toasts once `count` of them are on the page and laid out, read two frames after
export async function toasts(count: number): Promise<HTMLElement[]> {
  for (let frames = 0; frames < 120; frames++) {
    const found = shown()
    if (found.length === count && found.every((element) => element.getBoundingClientRect().height > 0)) {
      await frame()
      await frame()
      return found
    }
    await frame()
  }
  throw new Error(`not ${count} toasts, but ${shown().length}`)
}
