import { cva } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps, ReactNode } from "react"

// components::REQ-007, restyled from shadcn/ui's Mira badge to the kit's look and scale (components::CON-003): a small
// label that takes no pointer or keyboard input of its own, so it is a plain `<span>` without Mira's `render` prop or
// link looks. Every variant has the same box: 18px tall with a 1px border, transparent where its variant shows none,
// so a badge with a border and one without stand equally tall side by side. Its text is one line of inline content
// that the box cuts with an ellipsis (components::REQ-001/AC-05); the line height fills the box inside its border,
// which centres the text, and a leading icon sits on its middle. No colour changes with a transition
// (components::REQ-001/AC-04). A caller's classes come last, so they replace a variant's ground, border and text
// colours (components::REQ-007/AC-03) and leave its size and border style.
const badgeVariants = cva(
  "inline-block h-4.5 max-w-full min-w-0 truncate rounded-sm border border-transparent px-1.5 align-middle text-xs leading-4 font-normal [&>svg]:pointer-events-none [&>svg]:me-0.75 [&>svg]:inline-block [&>svg]:size-2.5 [&>svg]:align-middle",
  {
    variants: {
      variant: {
        neutral: "border-border-strong text-muted-foreground",
        dashed: "border-dashed border-border-strong text-muted-foreground",
        muted: "bg-border text-muted-foreground",
        primary: "bg-accent font-semibold text-primary",
        "primary-outline": "border-primary text-primary",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        note: "bg-note text-note-foreground",
        risk: "border-dashed border-risk text-risk-foreground",
        // A number: its ends fully rounded, since the largest radius step is more than half its height, and at least
        // as wide as it is tall, its digits all of one width
        count: "min-w-4.5 rounded-xl bg-accent text-center font-bold text-primary tabular-nums",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

// components::CON-001: a badge writes no text of its own; its text is its children, which it requires
export type BadgeProps = Omit<ComponentProps<"span">, "children" | "className"> & {
  // Sets the badge's place in the layout, or its colours from the app's tokens (components::REQ-007/AC-03)
  className?: string
  variant?:
    | "neutral"
    | "dashed"
    | "muted"
    | "primary"
    | "primary-outline"
    | "success"
    | "warning"
    | "note"
    | "risk"
    | "count"
  children: ReactNode
}

function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
