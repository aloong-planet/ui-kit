import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactElement } from "react"
import { createPortal } from "react-dom"

// components::REQ-008, restyled from shadcn/ui's Mira tooltip to the kit's look and scale (components::CON-003).
//
// It opens as soon as the pointer is over its trigger, with no delay, and on keyboard focus; it closes when neither
// holds, when its trigger is clicked, and on Esc (Base UI). After a click it stays closed until the pointer leaves the
// trigger and comes back, since Base UI's hover listens only to the pointer entering and leaving the trigger. The
// pointer can move from the trigger onto the tooltip without it closing (components::REQ-008/AC-01, AC-03, AC-05,
// AC-06).
const openDelay = 0
// Base UI closes the tooltip when the pointer leaves, even while keyboard focus on the trigger still holds it open, and
// when the keyboard focus leaves, even while the pointer on the trigger or on the tooltip still holds it open. A close
// for either reason is ignored while the other still holds, so the tooltip closes only when neither does. Once a close
// on the focus leaving has been ignored, Base UI no longer closes the tooltip when the pointer leaves it (it still does
// when the pointer leaves the trigger), so that close is made here.
const hoverClose = "trigger-hover"
const focusClose = "trigger-focus"

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

// How long the page stays without a scroll once the browser's scroll that brings a focused trigger into view has
// stopped; a smooth scroll fires one every frame while it runs
const focusScrollSettle = 100

// Whether the component renders in a browser rather than on a server, which never changes while it is mounted
const subscribeToNothing = () => () => {}
const inBrowserSnapshot = () => true
const onServerSnapshot = () => false

// Whether all of `element` shows in the window and inside every ancestor that clips it, where the browser does not
// scroll to bring it into view as it takes focus
function wholeInView(element: Element): boolean {
  const box = element.getBoundingClientRect()
  const root = document.documentElement
  const inside = (area: { top: number; left: number; bottom: number; right: number }) =>
    box.top >= area.top && box.left >= area.left && box.bottom <= area.bottom && box.right <= area.right
  for (let area = element.parentElement; area && area !== root; area = area.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(area)
    if ((overflowX !== "visible" || overflowY !== "visible") && !inside(area.getBoundingClientRect())) return false
  }
  return inside({ top: 0, left: 0, bottom: root.clientHeight, right: root.clientWidth })
}

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
  const popupRef = useRef<HTMLDivElement>(null)
  const heldByPointer = useRef(false)
  // components::REQ-008/AC-03: the text, and the warning line, are the trigger's description for screen readers. It
  // is read from an element that stays in the page while the tooltip is closed, so the trigger is described from the
  // moment it takes focus; Base UI's tooltip sets no description itself. The element stands at the end of the page:
  // not inside the trigger, where its text would join a text button's name, and not beside it, where rules on the
  // children of the trigger's container would count it. A render on a server has no page to put it in, so it is put
  // there once the page is in a browser.
  const descriptionId = useId()
  const description = warning === undefined ? text : `${text} ${warning}`
  const inBrowser = useSyncExternalStore(subscribeToNothing, inBrowserSnapshot, onServerSnapshot)

  // components::REQ-014/AC-01 and AC-02: while it is open, a scroll anywhere or a resize of the window closes it. A
  // tooltip does not scroll itself, so every scroll is one outside it. The scroll the browser makes to bring a trigger
  // into view as it takes keyboard focus belongs to the focus and leaves it open; a tooltip opened by the pointer alone
  // has no such scroll. An instant one has already moved the page when the tooltip opens, and the browser fires its
  // event in the next frame, before the frame's animation callbacks, so a scroll before the first of them is taken as
  // the focus's. A smooth one has not started yet, and the trigger is still not wholly in view; it then fires frame
  // after frame. After either, scrolls are taken as the focus's until none has come for `focusScrollSettle`.
  useEffect(() => {
    if (!open) return undefined
    const close = () => setOpen(false)
    const trigger = triggerRef.current
    const focused = trigger?.matches(":focus-visible") === true
    let phase: "opening" | "focus-scroll" | "open" = focused ? "opening" : "open"
    let settle: ReturnType<typeof setTimeout> | undefined
    const following = () => {
      phase = "focus-scroll"
      clearTimeout(settle)
      settle = setTimeout(() => (phase = "open"), focusScrollSettle)
    }
    if (focused && trigger && !wholeInView(trigger)) following()
    const scrolled = () => {
      if (phase === "open") close()
      else following()
    }
    const opened = requestAnimationFrame(() => {
      if (phase === "opening") phase = "open"
    })
    window.addEventListener("resize", close)
    document.addEventListener("scroll", scrolled, true)
    return () => {
      cancelAnimationFrame(opened)
      clearTimeout(settle)
      window.removeEventListener("resize", close)
      document.removeEventListener("scroll", scrolled, true)
    }
  }, [open])

  return (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={(next, { reason }) => {
        if (!next && reason === hoverClose && triggerRef.current?.matches(":focus-visible")) return
        if (!next && reason === focusClose && (triggerRef.current?.matches(":hover") || popupRef.current?.matches(":hover"))) {
          heldByPointer.current = true
          return
        }
        heldByPointer.current = false
        setOpen(next)
      }}
    >
      <TooltipPrimitive.Trigger ref={triggerRef} delay={openDelay} aria-describedby={descriptionId} render={children} />
      {inBrowser &&
        createPortal(
          <span id={descriptionId} hidden>
            {description}
          </span>,
          document.body,
        )}
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          collisionAvoidance={collisionAvoidance}
          className={positionerClass}
        >
          <TooltipPrimitive.Popup
            ref={popupRef}
            className={popupClass}
            // components::REQ-008/AC-03: the tooltip takes no focus, while Base UI makes its popup focusable
            // (`tabindex="-1"`), so that a click on it would take the focus off the trigger and onto it
            tabIndex={undefined}
            onMouseLeave={(event) => {
              if (!heldByPointer.current || triggerRef.current?.contains(event.relatedTarget as Node | null)) return
              heldByPointer.current = false
              setOpen(false)
            }}
          >
            {text}
            {warning !== undefined && <span className={warningClass}>{warning}</span>}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip }
