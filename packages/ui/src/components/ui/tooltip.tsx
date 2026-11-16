import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { useEffect, useId, useRef, useState, type ReactElement } from "react"

// components::REQ-008, restyled from shadcn/ui's Mira tooltip to the kit's look and scale (components::CON-003).
//
// It opens as soon as the pointer is over its trigger, with no delay, and on keyboard focus; it closes when neither
// holds, when its trigger is clicked, and on Esc (Base UI). After a click it stays closed until the pointer leaves the
// trigger and comes back, since Base UI's hover listens only to the pointer entering and leaving the trigger. The
// pointer can move from the trigger onto the tooltip without it closing (components::REQ-008/AC-01, AC-03, AC-05,
// AC-06).
const openDelay = 0
// Base UI closes the tooltip when the pointer leaves, even while keyboard focus on the trigger still holds it open; a
// close for that reason is ignored while the trigger shows keyboard focus, so the tooltip closes only when neither holds
const hoverClose = "trigger-hover"

// It sits 6px from its trigger on the side the caller chooses, below by default, and moves to the opposite side when
// there is not room, never to a side on the other axis; along its side it shifts to stay in the window
// (components::REQ-008/AC-02). Base UI renders it in a portal at the end of the page, out of any ancestor of the
// trigger that clips.
const sideOffset = 6
const collisionAvoidance = { side: "flip", align: "shift", fallbackAxisSide: "none" } as const
const positionerClass = "z-50"

// A floating surface with its own ground: `--tooltip`, `--tooltip-foreground` text, no border, and `--shadow-pop`
// (components::REQ-008/AC-04, components::REQ-001/AC-03). Its text wraps within 440px (components::REQ-001/AC-05). It
// has no arrow and does not move as it opens or closes, like the select popup.
const popupClass =
  "max-w-[440px] rounded-lg bg-tooltip px-2.5 py-1.5 text-sm text-tooltip-foreground shadow-pop outline-none"
const warningClass = "mt-1 block text-tooltip-warning"

export type TooltipProps = {
  // components::CON-001: a tooltip writes no text of its own, so its text is required
  text: string
  // A warning line shown after the text, in `--tooltip-warning` (components::REQ-008/AC-04)
  warning?: string
  side?: "top" | "bottom" | "left" | "right"
  // The trigger: one element that takes a ref and the props it is given, such as a kit Button
  children: ReactElement
}

function Tooltip({ text, warning, side = "bottom", children }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // components::REQ-008/AC-03: the text, and the warning line, are the trigger's description for screen readers. It
  // is read from an element that stays in the page while the tooltip is closed, so the trigger is described from the
  // moment it takes focus; Base UI's tooltip sets no description itself. The element is not inside the trigger, where
  // its text would join a text button's name.
  const descriptionId = useId()
  const description = warning === undefined ? text : `${text} ${warning}`

  // components::REQ-014/AC-01 and AC-02: while it is open, a scroll anywhere or a resize of the window closes it. A
  // tooltip does not scroll itself, so every scroll is one outside it.
  useEffect(() => {
    if (!open) return undefined
    const close = () => setOpen(false)
    window.addEventListener("resize", close)
    document.addEventListener("scroll", close, true)
    return () => {
      window.removeEventListener("resize", close)
      document.removeEventListener("scroll", close, true)
    }
  }, [open])

  return (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={(next, { reason }) => {
        if (!next && reason === hoverClose && triggerRef.current?.matches(":focus-visible")) return
        setOpen(next)
      }}
    >
      <TooltipPrimitive.Trigger ref={triggerRef} delay={openDelay} aria-describedby={descriptionId} render={children} />
      <span id={descriptionId} hidden>
        {description}
      </span>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          collisionAvoidance={collisionAvoidance}
          className={positionerClass}
        >
          <TooltipPrimitive.Popup className={popupClass}>
            {text}
            {warning !== undefined && <span className={warningClass}>{warning}</span>}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip }
