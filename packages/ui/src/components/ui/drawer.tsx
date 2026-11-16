import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "./button"

// components::REQ-009, restyled from shadcn/ui's Mira sheet to the kit's look and scale (components::CON-003).
//
// A panel along the right edge of the window for its full height, `min(720px, 80vw)` wide, over a scrim in
// `--overlay` (components::REQ-009/AC-04). It is a floating surface: `--popover` ground, a 1px `--border-strong`
// border on its left edge and `--shadow-pop` (components::REQ-001/AC-03). Its header holds the title, `text-lg` bold
// in `--primary`, and leaves room at its right for the close button, an `icon` button 12px from the panel's top and
// right edges. The body below holds the caller's content and scrolls inside its own height, so the header and the
// close button stay in view (components::REQ-009/AC-05). The title and the body wrap, a long unbroken word included
// (components::REQ-001/AC-05).
//
// Base UI makes it a modal dialog named by its title: keyboard focus moves into it, onto the close button, the first
// element in it that takes focus, and stays inside; the page behind it does not scroll; Esc, a click on the scrim and
// the close button close it; and focus returns to the element that had it when it opened (components::REQ-009/AC-01,
// AC-02). It does not move as it opens or closes, and no colour changes with a transition
// (components::REQ-001/AC-04).
const scrimClass = "fixed inset-0 z-50 bg-overlay"

const panelClass =
  "fixed inset-y-0 right-0 z-50 flex w-[min(720px,80vw)] flex-col border-l border-border-strong bg-popover text-popover-foreground shadow-pop outline-none"

const headerClass = "border-b border-border pt-4 pe-12 pb-3 ps-4.5"

const titleClass = "mb-1 text-lg font-bold wrap-break-word text-primary"

const closeSize = "icon"
const closeClass = "absolute top-3 right-3"

const bodyClass = "min-h-0 flex-1 overflow-y-auto p-2.5 wrap-break-word"

// components::CON-001: a drawer writes no text of its own. Its title and the close button's accessible name are
// required, so a missing one fails the type check. The app opens and closes it: it shows while `open` is set, and
// reports each way of closing it through `onOpenChange(false)`.
export type DrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  closeLabel: string
  children: ReactNode
}

function Drawer({ open, onOpenChange, title, closeLabel, children }: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={scrimClass} />
        <DialogPrimitive.Popup className={panelClass}>
          <div className={headerClass}>
            <DialogPrimitive.Title className={titleClass}>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button size={closeSize} aria-label={closeLabel} className={closeClass}>
                  <X />
                </Button>
              }
            />
          </div>
          <div className={bodyClass}>{children}</div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { Drawer }
