import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import { Children, type ReactNode } from "react"

// components::REQ-002, restyled from shadcn/ui's Mira button to the kit's look and scale (components::CON-003).
// Shared by every variant: the label stays on one line and is cut with an ellipsis (components::REQ-001/AC-05),
// keyboard focus shows a 2px `--ring` outline 2px outside the button while pointer focus shows none
// (components::REQ-001/AC-01), and a disabled button is muted and ignores the pointer (components::REQ-001/AC-02).
// No colour changes with a transition, so a theme switch recolours the button at once (components::REQ-001/AC-04).
const buttonVariants = cva(
  "inline-flex max-w-full min-w-0 shrink-0 cursor-pointer items-center justify-center gap-1.25 border whitespace-nowrap outline-none select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border-strong bg-background text-foreground hover:border-primary hover:bg-accent",
        primary: "border-primary bg-primary text-primary-foreground",
        danger: "border-destructive bg-destructive text-destructive-foreground",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-primary",
        // Inline text: no box of its own, so it takes the font of the text around it
        link: "rounded-sm border-0 bg-transparent text-inherit underline decoration-border-strong underline-offset-2 hover:text-foreground hover:decoration-current",
      },
      size: {
        default: "",
        sm: "",
        icon: "",
        "icon-sm": "",
      },
    },
    // A size sets the box, so it applies to every variant but `link`
    compoundVariants: [
      {
        variant: ["default", "primary", "danger", "ghost"],
        size: "default",
        class: "h-7 rounded-md px-3.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",
      },
      {
        variant: ["default", "primary", "danger", "ghost"],
        size: "sm",
        class: "h-5.5 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
      },
      {
        variant: ["default", "primary", "danger", "ghost"],
        size: "icon",
        class: "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
      },
      {
        variant: ["default", "primary", "danger", "ghost"],
        size: "icon-sm",
        class: "size-5.5 rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type BaseProps = Omit<ButtonPrimitive.Props, "aria-label" | "children" | "className"> & {
  variant?: "default" | "primary" | "danger" | "ghost" | "link"
  className?: string
}

// components::CON-001: a button writes no text of its own. A text button's label is its children; an icon-only
// button's accessible name is `aria-label`, which its sizes require, so a missing one fails the type check.
type TextButtonProps = BaseProps & {
  size?: "default" | "sm"
  children: ReactNode
  "aria-label"?: string
}
type IconButtonProps = BaseProps & {
  size: "icon" | "icon-sm"
  children: ReactNode
  "aria-label": string
}

export type ButtonProps = TextButtonProps | IconButtonProps

const labelClass = "min-w-0 truncate"
const iconClass = "inline-flex"

function Button({ className, variant = "default", size = "default", children, ...props }: ButtonProps) {
  const iconOnly = size === "icon" || size === "icon-sm"
  return (
    <ButtonPrimitive className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {iconOnly ? (
        // components::REQ-002/AC-03: the name comes from `aria-label`; the icon is hidden from screen readers
        <span aria-hidden className={iconClass}>
          {children}
        </span>
      ) : (
        // A text child goes into a span of its own: the text of a flex container cannot be cut with an ellipsis
        Children.map(children, (child) =>
          typeof child === "string" || typeof child === "number" ? (
            <span className={labelClass}>{child}</span>
          ) : (
            child
          )
        )
      )}
    </ButtonPrimitive>
  )
}

export { Button }
