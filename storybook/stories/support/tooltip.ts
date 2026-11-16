// The open Tooltip that the Tooltip's stories and tests read. Base UI renders it in a portal at the end of the page, as
// a popup inside a positioner, so it is looked up in the document rather than in the story's canvas.

import { frame } from './frames'

function openPopups(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-base-ui-portal] > [role="presentation"] > [data-open]')]
}

// The open tooltip, once it is laid out and placed: Base UI places it in the frame after it opens, so it is read two
// frames after it first has a size
export async function tooltip(): Promise<HTMLElement> {
  for (let frames = 0; frames < 60; frames++) {
    const [popup, ...others] = openPopups()
    if (others.length > 0) throw new Error('more than one tooltip open')
    if (popup && popup.getBoundingClientRect().height > 0) {
      await frame()
      await frame()
      return popup
    }
    await frame()
  }
  throw new Error('no open tooltip')
}

// Whether a tooltip is open
export function isOpen(): boolean {
  return openPopups().length > 0
}
