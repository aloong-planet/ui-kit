// The parts of an open Select's popup that the Select's stories and tests read. The popup is rendered in a portal, at
// the end of the page, so it is looked up in the document rather than in the story's canvas.

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))

// The surface around a list of options that is open. Base UI keeps a popup in the page once it has opened, marked
// `data-closed` while closed and `data-open` while open.
function openSurface(): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[role="listbox"]')]
    .map((list) => list.parentElement)
    .find((surface): surface is HTMLElement => surface?.hasAttribute('data-open') ?? false)
}

// The open popup, once it is laid out and placed. Base UI places it in the frame after it opens, so it is read two
// frames after it first has a size.
export async function popup(): Promise<HTMLElement> {
  for (let frames = 0; frames < 60; frames++) {
    const surface = openSurface()
    if (surface && surface.getBoundingClientRect().height > 0) {
      await frame()
      await frame()
      return surface
    }
    await frame()
  }
  throw new Error('no open select popup')
}

// Whether a popup is open
export function isOpen(): boolean {
  return openSurface() !== undefined
}

// The label of an option, and the slot after it that holds the check of the selected option
export function optionLabel(option: HTMLElement): HTMLElement {
  const label = option.firstElementChild
  if (!(label instanceof HTMLElement)) throw new Error('no label in the option')
  return label
}

export function checkSlot(option: HTMLElement): HTMLElement {
  const slot = option.lastElementChild
  if (!(slot instanceof HTMLElement) || slot === option.firstElementChild) throw new Error('no check slot in the option')
  return slot
}

// The ancestors of the popup's positioner that would set up a box clipping it: any with a transform, a filter or a
// perspective, which would also become the box it is placed in
export function positionerAncestorsWith(surface: HTMLElement): string[] {
  const found: string[] = []
  for (let node = surface.parentElement?.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node)
    if (style.transform !== 'none' || style.filter !== 'none' || style.perspective !== 'none') found.push(node.tagName)
  }
  return found
}

// The layers of a computed `box-shadow` that cast a shadow: Tailwind writes a shadow utility after empty layers for its
// rings and inset shadows, which the browser computes as transparent layers of no size
export function castShadows(value: string): string[] {
  return value.split(/,(?![^(]*\))/).map((layer) => layer.trim()).filter((layer) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/.test(layer))
}
