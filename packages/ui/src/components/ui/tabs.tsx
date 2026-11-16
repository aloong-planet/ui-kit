import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import type { ReactNode } from "react"

// components::REQ-013, restyled from shadcn/ui's Mira tabs to the kit's look and scale (components::CON-003), and taking
// its tabs as data, as the segmented control takes its options: a row of tabs over their panels, each tab carrying its
// label and its panel, announced as a tab list and linked to the panel it shows (components::REQ-013/AC-02, AC-03).
// The arrow keys move between the tabs and select each enabled tab they reach, as the WAI-ARIA tabs pattern recommends
// for panels that show at once; Base UI's default would leave the selection to Enter or Space. A disabled tab is muted
// and lets the pointer through (components::REQ-001/AC-02); the arrow keys still reach it, without selecting it
// (components::REQ-013/AC-04). Keyboard focus shows a 2px `--ring` outline 2px outside a tab or the panel, pointer
// focus none (components::REQ-001/AC-01). Labels stay on one line and are cut with an ellipsis
// (components::REQ-001/AC-05); no colour changes with a transition (components::REQ-001/AC-04).
const rootVariants = cva("flex min-w-0 flex-col", {
  variants: {
    variant: {
      // The panel starts directly under the rule
      page: "",
      // The panel starts 8px under the row
      pill: "gap-2",
    },
  },
})

const listVariants = cva("flex min-w-0", {
  variants: {
    variant: {
      page: "gap-0.5 border-b border-border",
      pill: "gap-1",
    },
  },
})

// A tab is one line of inline content that its box cuts with an ellipsis; the line height fills the box inside its
// border, which centres the label. A `page` tab reaches 1px below the row onto the rule, so the selected one, whose
// bottom border takes the `--background` ground, covers the rule under it and joins the panel below it.
const tabVariants = cva(
  "block min-w-0 cursor-pointer truncate border outline-none select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-disabled:pointer-events-none data-disabled:opacity-45",
  {
    variants: {
      variant: {
        page: "-mb-px h-7 rounded-t-md border-transparent px-3.25 text-sm leading-6.5 text-muted-foreground not-data-active:hover:text-foreground data-active:border-border data-active:border-b-background data-active:bg-background data-active:font-semibold data-active:text-primary",
        pill: "h-5.5 rounded-md border-border-strong bg-card px-2.5 text-xs leading-5 font-semibold text-muted-foreground data-active:border-primary data-active:bg-accent data-active:text-primary-strong",
      },
    },
  }
)

// A count after the label, in a lighter tone
const countClass = "ms-1 opacity-75"

// The panel has no ground and no padding of its own: its content brings its own
const panelClass =
  "min-w-0 outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"

type Tab<V extends string> = {
  value: V
  label: ReactNode
  panel: ReactNode
  count?: ReactNode
  disabled?: boolean
}

type BaseProps<V extends string> = Omit<
  TabsPrimitive.Root.Props,
  | "aria-label"
  | "aria-labelledby"
  | "children"
  | "className"
  | "defaultValue"
  | "onValueChange"
  | "orientation"
  | "value"
> & {
  // Sets the tabs' place in the layout
  className?: string
  tabs: readonly Tab<V>[]
  variant?: "page" | "pill"
  onValueChange?: (value: V) => void
}

// components::REQ-013/AC-05: tabs always have a selected tab, so they take `value` or `defaultValue`, one of their
// tabs, and fail the type check without either
type ValueProps<V extends string> = { value: NoInfer<V>; defaultValue?: never } | { value?: never; defaultValue: NoInfer<V> }

// components::CON-001: tabs write no text of their own. The tab row's accessible name, an `aria-label` or an
// `aria-labelledby` pointing at a label on the page, is required, so a missing one fails the type check.
type NameProps = { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string }

export type TabsProps<V extends string = string> = BaseProps<V> & ValueProps<V> & NameProps

function Tabs<V extends string>({
  className,
  tabs,
  variant = "page",
  onValueChange,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: TabsProps<V>) {
  return (
    <TabsPrimitive.Root
      className={cn(rootVariants({ variant }), className)}
      // Base UI also reports a selection it moves by itself, to `null` when no enabled tab is left to move it to
      onValueChange={(value: V | null) => {
        if (value !== null) onValueChange?.(value)
      }}
      {...props}
    >
      <TabsPrimitive.List
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        activateOnFocus
        className={listVariants({ variant })}
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Tab key={tab.value} value={tab.value} disabled={tab.disabled} className={tabVariants({ variant })}>
            {tab.label}
            {tab.count === undefined ? null : <span className={countClass}>{tab.count}</span>}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Panel key={tab.value} value={tab.value} className={panelClass}>
          {tab.panel}
        </TabsPrimitive.Panel>
      ))}
    </TabsPrimitive.Root>
  )
}

export { Tabs }
