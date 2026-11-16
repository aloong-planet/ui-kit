import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { useRef, type ReactNode } from "react"

import { useReturnFocus } from "../../hooks/use-return-focus"
import { Button } from "./button"

// components::REQ-010, restyled from shadcn/ui's Mira alert dialog to the kit's look and scale (components::CON-003).
//
// A box `min(520px, 88vw)` wide, centred across the window 7vh below its top, over a scrim in `--overlay`
// (components::REQ-010/AC-05). It is a floating surface: `--popover` ground, a 1px `--border-strong` border and
// `--shadow-pop`, with `rounded-xl` corners (components::REQ-001/AC-03). It shows its title, `text-lg` bold; the
// caller's body in `text-sm` `--muted-foreground`; and its two buttons at the bottom right, 8px apart, cancel first: a
// `default` button, and the confirming action as a `danger` button when the caller marks it destructive and a
// `primary` button otherwise (components::REQ-010/AC-01). The box is at most 82vh tall, so it never runs past the
// window: a body taller than the room left scrolls inside its own height while the title and the buttons stay in view
// (components::REQ-010/AC-07). The title and the body wrap, a long unbroken word included
// (components::REQ-001/AC-05). The box is centred by its margins rather than moved by a transform, so it sets up no
// box that would hold the fixed elements inside it.
//
// Base UI makes it a modal alert dialog, named by its title and described by its body (components::REQ-010/AC-03,
// AC-06): keyboard focus moves onto cancel, the least destructive choice, and stays inside; Esc and cancel cancel, and
// a click on the scrim does nothing (components::REQ-010/AC-02); focus returns to the element that had it when it
// opened, or, when that element is gone, where `useReturnFocus` says. The confirming action runs the caller's
// `onConfirm` and then closes the dialog like cancel does (components::REQ-010/AC-04): a button's own click handler
// runs before the one Base UI's close part adds, so `onConfirm` is called before `onOpenChange(false)`. Rendered
// inside an open drawer, it is a dialog nested in the drawer's, and Esc closes it alone (components::REQ-010/AC-09);
// Base UI leaves out a nested dialog's scrim, which this one renders all the same, so it dims the drawer as well as the
// page (components::REQ-010/AC-08). It does not move as it opens or closes, and no colour changes with a transition
// (components::REQ-001/AC-04).
const scrimClass = "fixed inset-0 z-50 bg-overlay"

const boxClass =
  "fixed inset-x-0 top-[7vh] z-50 mx-auto flex max-h-[82vh] w-[min(520px,88vw)] flex-col rounded-xl border border-border-strong bg-popover px-6.5 py-5.5 text-popover-foreground shadow-pop outline-none"

const titleClass = "mb-1 shrink-0 text-lg font-bold wrap-break-word"

const bodyClass = "mt-2 mb-3.5 min-h-0 overflow-y-auto text-sm leading-[1.7] wrap-break-word text-muted-foreground"

const buttonsClass = "flex shrink-0 justify-end gap-2"

// components::CON-001: a confirm dialog writes no text of its own. Its title, its body and the labels of its two
// buttons are required, so a missing one fails the type check. The app opens and closes it as it does the drawer: it
// shows while `open` is set, and reports Esc and cancel through `onOpenChange(false)`; the confirming action is
// reported through `onConfirm`, once, before the dialog reports closing.
export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  cancelLabel: ReactNode
  confirmLabel: ReactNode
  destructive?: boolean
  onConfirm: () => void
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  cancelLabel,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const { initialFocus, finalFocus } = useReturnFocus(() => cancelRef.current)
  const confirmVariant = destructive ? "danger" : "primary"
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop forceRender className={scrimClass} />
        <AlertDialogPrimitive.Popup initialFocus={initialFocus} finalFocus={finalFocus} className={boxClass}>
          <AlertDialogPrimitive.Title className={titleClass}>{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description render={<div />} className={bodyClass}>
            {children}
          </AlertDialogPrimitive.Description>
          <div className={buttonsClass}>
            <AlertDialogPrimitive.Close ref={cancelRef} render={<Button>{cancelLabel}</Button>} />
            <AlertDialogPrimitive.Close
              render={
                <Button variant={confirmVariant} onClick={() => onConfirm()}>
                  {confirmLabel}
                </Button>
              }
            />
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { ConfirmDialog }
