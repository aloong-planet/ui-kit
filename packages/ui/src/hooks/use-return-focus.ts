import { useRef } from "react"

type Opener = { element: Element | null; container: Element | null }

// Where focus goes when a drawer or a confirm dialog closes (components::REQ-009/AC-02, REQ-010/AC-03, and the boundary
// of the element that had focus being gone). The element that had focus as it opened is read in Base UI's
// `initialFocus` callback, which runs as the dialog opens, before focus moves into it; with it, the open dialog that
// element sat in, as a confirm dialog opened from a button inside an open drawer.
//
// On closing, focus returns to that element. When it is gone (the confirmed action removed it), focus moves into the
// dialog it sat in, if that is still open, and is otherwise left on the page for the app to move on, as the WAI-ARIA
// APG modal dialog pattern asks of an invoking element that no longer exists: "focus is set on another element that
// provides logical work flow", which only the app knows. Base UI's own fallback, the element focused before some
// earlier popup opened, could land behind an open drawer or on an element unrelated to the dialog.
export function useReturnFocus(initialFocus: () => HTMLElement | true | null) {
  const opener = useRef<Opener>({ element: null, container: null })
  return {
    initialFocus: () => {
      const element = document.activeElement
      opener.current = {
        element: element === document.body ? null : element,
        container: element?.closest('[role="dialog"], [role="alertdialog"]') ?? null,
      }
      return initialFocus()
    },
    finalFocus: (): HTMLElement | false => {
      const { element, container } = opener.current
      if (element instanceof HTMLElement && element.isConnected) return element
      if (container instanceof HTMLElement && container.isConnected) return container
      return false
    },
  }
}
