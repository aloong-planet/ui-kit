import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"
import { Check, ChevronDown } from "lucide-react"
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import type { AccessibleNameProps, SelectedValueProps } from "../../lib/props"

// components::REQ-004, restyled from shadcn/ui's Mira select to the kit's look and scale (components::CON-003).
//
// The trigger is 28px tall, as tall as a `default` button, and shows the selected option's label, cut with an
// ellipsis when it does not fit (components::REQ-001/AC-05), in a `--background` ground with a 1px `--border-strong`
// border; under the pointer and while open, a `--primary` border and the wash, and its chevron turns 180° while open.
// Keyboard focus draws a 2px `--ring` outline 2px outside it, pointer focus none (components::REQ-001/AC-01); disabled,
// it is muted and lets the pointer through (components::REQ-001/AC-02). No colour changes with a transition
// (components::REQ-001/AC-04).
const triggerClass =
  "group inline-flex h-7 max-w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground outline-none select-none hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring data-disabled:pointer-events-none data-disabled:opacity-45 data-popup-open:border-primary data-popup-open:bg-accent"
const valueClass = "min-w-0 flex-1 truncate text-left font-semibold"
const chevronClass = "size-3.5 shrink-0 text-muted-foreground group-data-popup-open:rotate-180"

// The popup opens 6px below the trigger, or above it when there is not room below (Base UI flips it), with its left
// edge on the trigger's. It is at least as wide as the trigger and as wide as its longest option, within the room
// from the trigger's left edge to the window's right edge, and scrolls inside its own height when its options do not
// fit (components::REQ-004/AC-02, AC-07). It is a floating surface: `--popover` ground, 1px `--border-strong` border,
// `--shadow-pop` (components::REQ-001/AC-03). Base UI renders it in a portal at the end of the page, out of any
// ancestor of the trigger that clips, and moves it with its trigger when the window is resized
// (components::REQ-014/AC-02).
const popupSide = "bottom"
const popupAlign = "start"
const popupOffset = 6
// Base UI flips a select popup to the other side when there is not room on its own, and by default also shifts it
// along the trigger to fit the window, which moves a popup wider than the room to the trigger's right off the
// trigger's left edge. The shift is turned off, so the room to the right is what `--available-width` measures and a
// longer option is cut instead.
const popupCollisionAvoidance = { side: "flip", align: "none", fallbackAxisSide: "none" } as const
const positionerClass = "z-50"
const popupClass =
  "max-h-(--available-height) w-max max-w-(--available-width) min-w-(--anchor-width) overflow-y-auto rounded-lg border border-border-strong bg-popover p-1 text-popover-foreground shadow-pop outline-none"

// An option under the pointer or the keyboard highlight shows the wash; the selected one shows its label in
// `--primary-strong` and a check in `--primary`. Every option keeps the check's room after its label, so labels stay
// aligned, and a label longer than the popup is cut with an ellipsis (components::REQ-004/AC-03, AC-07).
const itemClass =
  "flex h-8 min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm font-semibold outline-none select-none data-highlighted:bg-accent data-selected:text-primary-strong"
const itemTextClass = "min-w-0 flex-1 truncate"
const checkSlotClass = "inline-flex size-3.5 shrink-0"
const checkClass = "size-3.5 text-primary"
const separatorClass = "mx-2 my-1 h-px bg-border"

// components::REQ-014/AC-01: while the popup is open, a scroll anywhere outside it closes it; a scroll of its own list
// does not. A resize of the window moves the popup instead (Base UI), and the browser fires a scroll when a resize
// clamps a scrolled area to its new size, which is not the user scrolling: scrolls within this many milliseconds of a
// resize are taken as the resize's.
const resizeScrollWindow = 150

type Option<V extends string> = { value: V; label: ReactNode }

type BaseProps<V extends string> = {
  // Sets the trigger's width and place in the layout
  className?: string
  disabled?: boolean
  onValueChange?: (value: V) => void
}

// The options, in one list or in groups parted by a 1px `--border` divider (components::REQ-004/AC-04)
type OptionsProps<V extends string> =
  | { options: readonly Option<V>[]; groups?: never }
  | { options?: never; groups: readonly (readonly Option<V>[])[] }

// components::REQ-004/AC-09: a select always has a selected option, so it takes `value` or `defaultValue`, one of its
// options, and fails the type check without either.
//
// components::CON-001: a select writes no text of its own. Its accessible name, an `aria-label` or an
// `aria-labelledby` pointing at a label on the page, is required, so a missing one fails the type check.
export type SelectProps<V extends string = string> = BaseProps<V> & OptionsProps<V> & SelectedValueProps<V> & AccessibleNameProps

function Select<V extends string>({
  className,
  disabled,
  onValueChange,
  options,
  groups,
  value,
  defaultValue,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectProps<V>) {
  const lists = groups ?? (options ? [options] : [])
  const [open, setOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    let resizedAt = Number.NEGATIVE_INFINITY
    const onResize = () => {
      resizedAt = performance.now()
    }
    const onScroll = (event: Event) => {
      if (performance.now() - resizedAt < resizeScrollWindow) return
      if (event.target instanceof Node && popupRef.current?.contains(event.target)) return
      setOpen(false)
    }
    window.addEventListener("resize", onResize)
    document.addEventListener("scroll", onScroll, true)
    return () => {
      window.removeEventListener("resize", onResize)
      document.removeEventListener("scroll", onScroll, true)
    }
  }, [open])

  return (
    <SelectPrimitive.Root<V>
      items={lists.flat()}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => {
        if (next !== null) onValueChange?.(next)
      }}
      open={open}
      onOpenChange={setOpen}
      // Not modal: the page stays scrollable while the popup is open, and a click outside closes it and acts on what it
      // lands on (components::REQ-004/AC-08)
      modal={false}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} className={cn(triggerClass, className)}>
        <SelectPrimitive.Value className={valueClass} />
        <ChevronDown aria-hidden className={chevronClass} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side={popupSide}
          sideOffset={popupOffset}
          align={popupAlign}
          alignItemWithTrigger={false}
          collisionAvoidance={popupCollisionAvoidance}
          className={positionerClass}
        >
          <SelectPrimitive.Popup ref={popupRef} className={popupClass}>
            <SelectPrimitive.List>
              {lists.map((list, index) => (
                <Fragment key={list[0]?.value ?? index}>
                  {index > 0 && <SelectPrimitive.Separator className={separatorClass} />}
                  <SelectPrimitive.Group>
                    {list.map((option) => (
                      <SelectPrimitive.Item key={option.value} value={option.value} className={itemClass}>
                        <SelectPrimitive.ItemText className={itemTextClass}>{option.label}</SelectPrimitive.ItemText>
                        <span className={checkSlotClass}>
                          <SelectPrimitive.ItemIndicator>
                            <Check aria-hidden className={checkClass} />
                          </SelectPrimitive.ItemIndicator>
                        </span>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Group>
                </Fragment>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { Select }
