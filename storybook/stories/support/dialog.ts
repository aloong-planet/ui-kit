// The open drawer or confirm dialog that their stories and tests read. Base UI renders each in a portal at the end of
// the page, so it is looked up in the document rather than in the story's canvas, and takes it off the page once it
// has closed. The drawer is announced as a `dialog`, the confirm dialog as an `alertdialog`.
import { frame } from './frames'

type Role = 'dialog' | 'alertdialog'

// The open surface of `role`, once it is laid out
export async function opened(role: Role): Promise<HTMLElement> {
  for (let frames = 0; frames < 60; frames++) {
    const surface = document.querySelector<HTMLElement>(`[role="${role}"]`)
    if (surface && surface.getBoundingClientRect().height > 0) {
      await frame()
      return surface
    }
    await frame()
  }
  throw new Error(`no open ${role}`)
}

// Whether a surface of `role` is on the page
export function isOpen(role: Role): boolean {
  return document.querySelector(`[role="${role}"]`) !== null
}
