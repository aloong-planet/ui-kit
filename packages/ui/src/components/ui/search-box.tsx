import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import { Search } from "lucide-react"
import type { AccessibleNameProps } from "../../lib/props"

// components::REQ-003, restyled from shadcn/ui's Mira input-group, its inline-start addon and its input to the kit's
// look and scale (components::CON-003). The field is 28px tall, as tall as a `default` button, with a `--card` ground
// and a 1px `--input` border; focus from the keyboard or the pointer turns the border `--ring` and shows no outline
// (components::REQ-001/AC-01, components::REQ-003/AC-02). The icon lies over the field's leading padding and lets the
// pointer through to the field, and typed text starts after it. The field is a text field announced as a search
// field rather than a search-type field, so the browser draws no clear button in it. Disabled, the whole box, icon
// included, is muted and lets the pointer through (components::REQ-001/AC-02); no colour changes with a transition
// (components::REQ-001/AC-04).
const rootClass = "relative has-disabled:pointer-events-none has-disabled:opacity-45"
const iconClass = "pointer-events-none absolute inset-y-0 left-2.25 my-auto size-3.25 text-muted-foreground"
const fieldClass =
  "h-7 w-full min-w-0 rounded-md border border-input bg-card ps-6.75 pe-2.75 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"

type BaseProps = Omit<
  InputPrimitive.Props,
  "aria-label" | "aria-labelledby" | "className" | "placeholder" | "role" | "type"
> & {
  // Sets the box's width and place in the layout
  className?: string
  placeholder: string
}

// components::CON-001: a search box writes no text of its own. Its placeholder and its accessible name, an
// `aria-label` or an `aria-labelledby` pointing at a label on the page, are required, so a missing one fails the type
// check.
export type SearchBoxProps = BaseProps & AccessibleNameProps

const fieldType = "text"
const fieldRole = "searchbox"

function SearchBox({ className, ...props }: SearchBoxProps) {
  return (
    <div className={cn(rootClass, className)}>
      <Search aria-hidden className={iconClass} />
      <InputPrimitive type={fieldType} role={fieldRole} className={fieldClass} {...props} />
    </div>
  )
}

export { SearchBox }
