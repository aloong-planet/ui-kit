import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import { useState, type ReactNode } from "react"
import { useValueNoneOfOptionsWarning } from "../../hooks/use-value-none-of-options-warning"
import type { AccessibleNameProps, SelectedValueProps } from "../../lib/props"

// components::REQ-005, restyled from shadcn/ui's Mira toggle-group and toggle to the kit's look and scale, on Base UI's
// radio group rather than its toggle group (components::CON-003): one choice among mutually exclusive options that the
// user cannot empty, announced as a radio group, the arrow keys moving between segments and selecting the one they
// reach, and activating the selected segment again leaving it selected.
//
// The container's 1px `--border-strong` border, rounded at 7px, clips the segments at its corners, so a segment's
// keyboard focus outline is drawn 2px inside the segment, where the container cannot clip it (components::REQ-001/AC-01);
// pointer focus shows none. Neighbouring segments are parted by a 1px `--border-strong` line: the wash of the selected
// segment and the `--background` ground of a hovered one are both near grey in some themes, and two such grounds side
// by side would read as one block. The selected segment keeps its look under the pointer. Disabled, the whole control
// is muted and lets the pointer through (components::REQ-001/AC-02); no colour changes with a transition
// (components::REQ-001/AC-04). Labels stay on one line and are cut with an ellipsis (components::REQ-001/AC-05).
const groupClass =
  "inline-flex max-w-full min-w-0 overflow-hidden rounded-md border border-border-strong data-disabled:pointer-events-none data-disabled:opacity-45"

const segmentVariants = cva(
  "block min-w-0 cursor-pointer truncate border-border-strong text-center text-muted-foreground outline-none select-none not-first:border-l focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring data-checked:bg-accent data-checked:font-semibold data-checked:text-accent-foreground data-unchecked:hover:bg-background data-unchecked:hover:text-foreground",
  {
    variants: {
      // The line height fills the box inside the container's border, which centres the label
      size: {
        default: "px-3.25 text-sm leading-6.5",
        sm: "px-2.5 text-xs leading-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

type Option<V extends string> = { value: V; label: ReactNode }

type BaseProps<V extends string> = Omit<
  RadioGroupPrimitive.Props<V>,
  "aria-label" | "aria-labelledby" | "children" | "className" | "defaultValue" | "onValueChange" | "value"
> & {
  // Sets the control's place in the layout
  className?: string
  options: readonly Option<V>[]
  size?: "default" | "sm"
  onValueChange?: (value: V) => void
}

// components::REQ-005/AC-06: a segmented control always has a selected value, so it takes `value` or `defaultValue`
// and fails the type check without either.
//
// components::CON-001: a segmented control writes no text of its own. Its accessible name, an `aria-label` or an
// `aria-labelledby` pointing at a label on the page, is required, so a missing one fails the type check.
export type SegmentedControlProps<V extends string = string> = BaseProps<V> & SelectedValueProps<V> & AccessibleNameProps

function SegmentedControl<V extends string>({
  className,
  options,
  size = "default",
  onValueChange,
  ...props
}: SegmentedControlProps<V>) {
  // The value an uncontrolled control holds, the one it was given or the one the user picked since, for the warning
  // (components::REQ-016/AC-04); Base UI holds it for the control itself
  const [picked, setPicked] = useState(props.defaultValue)
  useValueNoneOfOptionsWarning("SegmentedControl", props.value ?? picked, options.map((option) => option.value))
  return (
    <RadioGroupPrimitive<V>
      className={cn(groupClass, className)}
      onValueChange={(value) => {
        setPicked(value)
        onValueChange?.(value)
      }}
      {...props}
    >
      {options.map((option) => (
        <RadioPrimitive.Root key={option.value} value={option.value} className={segmentVariants({ size })}>
          {option.label}
        </RadioPrimitive.Root>
      ))}
    </RadioGroupPrimitive>
  )
}

export { SegmentedControl }
