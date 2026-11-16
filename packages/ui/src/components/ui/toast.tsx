import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { cn } from "cn"
import { useEffect, useLayoutEffect, useRef } from "react"

// components::REQ-011, restyled from shadcn/ui's Mira toast to the kit's look and scale (components::CON-003).
//
// Any code raises a toast through `toast`, inside React or outside it (components::REQ-011/AC-06), and the app's one
// Toaster shows it (components::CON-005). Base UI's manager hands a toast only to the Toasters mounted when it is
// raised, so a toast raised while none is mounted is held here and handed over when one mounts; it then leaves 3200ms
// later. Held toasts are never shown if no Toaster ever mounts (components::REQ-011/AC-09).
const manager = ToastPrimitive.createToastManager()
type Variant = "success" | "error"
type Raised = { title: string; type: Variant }
const held: Raised[] = []
let toasters = 0

function raise(raised: Raised) {
  if (toasters > 0) manager.add(raised)
  else held.push(raised)
}

// components::CON-001: a toast writes no text of its own, so its text is required
export const toast = {
  success: (text: string) => raise({ title: text, type: "success" }),
  error: (text: string) => raise({ title: text, type: "error" }),
}

// A toast leaves 3200ms after it appears while no pointer is over it and the window is in the foreground; Base UI pauses
// it otherwise (components::REQ-011/AC-01). No toast is hidden to make room for another: Base UI's limit, three by
// default, only marks the toasts beyond it, so it is lifted (components::REQ-011/AC-08).
const timeout = 3200
const limit = Number.POSITIVE_INFINITY

// The toasts stand in a column at the bottom centre of the window, 18px above its bottom edge and 8px apart, the newest
// at the bottom; the column takes the pointer only where a toast is (components::REQ-011/AC-04). Base UI lists the
// toasts newest first and sends Tab from the region to the newest, so they stay in that order in the page, where Tab
// goes on from the newest to the older ones (components::REQ-011/AC-10), and the column is drawn from the bottom up.
// The column is the region screen readers announce the toasts in, under the label the app passes
// (components::REQ-011/AC-03).
//
// More toasts than the window holds (components::REQ-011/AC-08): the column is at most as tall as the window, keeps
// 18px above its top toast as below its bottom one, and scrolls once they overflow it. Drawn from the bottom up, it
// starts at the newest. The wheel over a toast scrolls it, while the column itself still takes no pointer, and a toast
// the keyboard reaches is scrolled into view 18px inside it. The 18px also leave room for the toasts' shadows and focus
// outline, which the scrolling column clips. The browser's own scroll anchoring is off: Safari has none, so `Column`
// holds the toasts in view in place itself, the same way in every browser, Chromium included, where the tests run.
const viewportClass =
  "pointer-events-none fixed inset-x-4 bottom-0 z-50 flex max-h-dvh scroll-py-[18px] flex-col-reverse items-center gap-2 overflow-y-auto py-[18px] outline-none [overflow-anchor:none]"

// A floating surface in its variant's ground and text with a 1px border in the text's colour, and `--shadow-pop`
// (components::REQ-011/AC-05, components::REQ-001/AC-03). Its text wraps within 440px (components::REQ-001/AC-05). It
// has no close button (components::REQ-011/AC-02) and does not move as it appears or leaves; it follows the pointer
// while it is swiped, down or to the right, Base UI's directions (components::REQ-011/AC-07). Base UI makes a toast
// focusable, so it shows the keyboard focus outline of components::REQ-001/AC-01, which needs `outline-solid` besides
// `outline-2` after `outline-none`.
const toastClass =
  "pointer-events-auto max-w-[440px] translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) rounded-lg border px-4 py-2.5 text-sm shadow-pop outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
const variantClass: Record<Variant, string> = {
  success: "border-success-foreground bg-success text-success-foreground",
  error: "border-error-foreground bg-error text-error-foreground",
}

// The newest toast the column shows, and where it stands, while the column is scrolled up from the newest: a column
// drawn from the bottom up then has a negative scroll offset, and lists its toasts newest first, among Base UI's focus
// guards
function newestInView(column: HTMLElement, toasts: Set<Element>): { element: Element; top: number } | undefined {
  if (column.scrollTop >= 0) return undefined
  const bottom = column.getBoundingClientRect().bottom
  for (const element of column.children) {
    if (!toasts.has(element)) continue
    const top = element.getBoundingClientRect().top
    if (top < bottom) return { element, top }
  }
  return undefined
}

// The column and its toasts, newest first. While the column is scrolled up from the newest, a toast that arrives leaves
// the toasts in view where they stand: the newest toast in view is put back where it stood before. One that leaves
// lets the older toasts above it move down into its place, as in a column that fits the window: the newest toast in
// view is then one below it, or it is one the browser has scrolled 18px inside the column as it took the focus on a
// press, with the next newer one in view below it. Scrolled to the newest, the column stays there, and shows the toast
// that arrives.
function Column({ label }: { label: string }) {
  const { toasts } = ToastPrimitive.useToastManager()
  const column = useRef<HTMLDivElement>(null)
  const elements = useRef(new Set<Element>())
  const standing = useRef<{ element: Element; top: number } | undefined>(undefined)

  useLayoutEffect(() => {
    const view = column.current
    if (!view) return
    const noted = standing.current
    if (noted?.element.isConnected) view.scrollTop += noted.element.getBoundingClientRect().top - noted.top
    standing.current = newestInView(view, elements.current)
  }, [toasts])

  useEffect(() => {
    const view = column.current
    if (!view) return undefined
    const note = () => {
      standing.current = newestInView(view, elements.current)
    }
    view.addEventListener("scroll", note)
    return () => view.removeEventListener("scroll", note)
  }, [])

  return (
    <ToastPrimitive.Viewport ref={column} aria-label={label} className={viewportClass}>
      {toasts.map((item) => (
        <ToastPrimitive.Root
          key={item.id}
          ref={(element: HTMLDivElement | null) => {
            if (!element) return undefined
            elements.current.add(element)
            return () => {
              elements.current.delete(element)
            }
          }}
          toast={item}
          className={cn(toastClass, variantClass[item.type as Variant])}
        >
          <ToastPrimitive.Title />
        </ToastPrimitive.Root>
      ))}
    </ToastPrimitive.Viewport>
  )
}

export type ToasterProps = {
  // components::CON-001: the label screen readers announce for the region the toasts appear in, in place of Base UI's
  // built-in English one
  "aria-label": string
}

function Toaster({ "aria-label": label }: ToasterProps) {
  // Base UI's provider, a child of this component, subscribes to the manager in its own effect, which runs before this
  // one: the toasts held until now are handed to it here
  useEffect(() => {
    toasters += 1
    for (const raised of held.splice(0)) manager.add(raised)
    return () => {
      toasters -= 1
    }
  }, [])

  return (
    <ToastPrimitive.Provider toastManager={manager} timeout={timeout} limit={limit}>
      <ToastPrimitive.Portal>
        <Column label={label} />
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

export { Toaster }
