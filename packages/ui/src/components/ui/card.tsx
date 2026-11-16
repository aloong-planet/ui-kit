import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import { createContext, useContext, type ComponentProps, type ReactNode } from "react"

// components::REQ-006, restyled from shadcn/ui's Mira card to the kit's look and scale (components::CON-003): a card
// and the parts it stacks, each optional — a header (a title, a description under it and an action at its top-right
// corner), the content and a footer. The parts stand apart from each other and from the card's top and bottom edges by
// the spacing of the card's size, and keep it from its side edges. Mira passes that spacing to the parts in a CSS
// variable of its own; the kit's components read no variable but the tokens and Tailwind's (components::CON-004), so
// the parts read the size of the card they are in from React instead, which a card inside another card's content
// sets for its own parts.
type Size = "default" | "sm"
const CardSize = createContext<Size>("default")

const slot = {
  header: "card-header",
  title: "card-title",
  description: "card-description",
  action: "card-action",
  content: "card-content",
  footer: "card-footer",
}

// An image placed directly in the card spans its full width; as the card's first child it runs to the top edge and as
// its last child to the bottom edge (components::REQ-006/AC-05). The card clips it, so its corners follow the card's
// inside its border. A `selectable` card is a toggle button: under the pointer it shows a `--primary` border and the
// wash, and pressed it keeps them and adds a 1px `--primary` ring drawn inside the card's own box, which a hovered
// card next to it does not have, so a pressed card and a hovered one beside it are told apart (components::REQ-006
// `selectable`). The ring is drawn on a layer over the card's children, since an inset shadow on the card itself is
// painted under them and an image at the card's edge would hide it: the layer covers the card's border box with the
// card's corners and draws a 2px inset ring, and the card clips it to the inside of its border, which leaves the
// ring's inner 1px. Keyboard focus shows a 2px `--ring` outline 2px outside the card, pointer focus none
// (components::REQ-001/AC-01); disabled, the card is muted and lets the pointer through (components::REQ-001/AC-02).
// No colour changes with a transition (components::REQ-001/AC-04).
const cardVariants = cva(
  "group/card flex flex-col overflow-hidden rounded-lg border text-sm has-[>img:first-child]:pt-0 has-[>img:last-child]:pb-0",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        selectable:
          "cursor-pointer border-border bg-card text-card-foreground outline-none select-none hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-disabled:pointer-events-none data-disabled:opacity-45 relative after:pointer-events-none after:absolute after:-inset-px after:rounded-lg data-pressed:border-primary data-pressed:bg-accent data-pressed:after:inset-ring-2 data-pressed:after:inset-ring-primary",
        dashed: "border-dashed border-border-strong bg-background text-muted-foreground",
      },
      size: {
        default: "gap-3.5 py-3.5",
        sm: "gap-2.5 py-2.5",
      },
    },
  }
)

type CardBase = {
  // Sets the card's place in the layout
  className?: string
  size?: Size
}
type StaticCardProps = CardBase & Omit<ComponentProps<"div">, "className"> & { variant?: "default" | "dashed" }
// components::REQ-006/AC-02: a `selectable` card is a button that reports whether it is pressed. It starts unpressed
// unless the caller passes `pressed` or `defaultPressed`. It renders a `<div>` with the button role, so the parts
// inside it stay valid markup and it takes the same place in a layout as a card of any other variant. Screen readers
// announce the button by its content, so a selectable card without content fails the type check (components::CON-001).
type SelectableCardProps = CardBase &
  Omit<TogglePrimitive.Props, "children" | "className" | "nativeButton" | "render" | "value"> & {
    variant: "selectable"
    children: ReactNode
  }

export type CardProps = StaticCardProps | SelectableCardProps

function Card(props: CardProps) {
  if (props.variant === "selectable") {
    const { className, variant, size = "default", ...toggleProps } = props
    return (
      <CardSize.Provider value={size}>
        <TogglePrimitive
          className={cn(cardVariants({ variant, size }), className)}
          nativeButton={false}
          render={<div />}
          {...toggleProps}
        />
      </CardSize.Provider>
    )
  }
  const { className, variant = "default", size = "default", ...divProps } = props
  return (
    <CardSize.Provider value={size}>
      <div className={cn(cardVariants({ variant, size }), className)} {...divProps} />
    </CardSize.Provider>
  )
}

// The spacing of the card's size from its side edges, and between the part's own text and a `border-b` the caller
// gives a header or a `border-t` it gives a footer, as shadcn/ui's card has it; a border given with another class gets
// none
const partVariants = cva("", {
  variants: {
    part: {
      header: "",
      content: "",
      footer: "",
    },
    size: {
      default: "px-3.5",
      sm: "px-2.5",
    },
  },
  compoundVariants: [
    { part: "header", size: "default", class: "[.border-b]:pb-3.5" },
    { part: "header", size: "sm", class: "[.border-b]:pb-2.5" },
    { part: "footer", size: "default", class: "[.border-t]:pt-3.5" },
    { part: "footer", size: "sm", class: "[.border-t]:pt-2.5" },
  ],
})

// The title in column one with the description under it, and the action at the top-right corner beside both
// (components::REQ-006/AC-04)
function CardHeader({ className, ...props }: ComponentProps<"div">) {
  const size = useContext(CardSize)
  return (
    <div
      data-slot={slot.header}
      className={cn(
        "grid auto-rows-min items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        partVariants({ part: "header", size }),
        className
      )}
      {...props}
    />
  )
}

// Pressed, a `selectable` card shows its title in `--primary`
function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot={slot.title}
      className={cn("text-sm font-semibold group-data-pressed/card:text-primary", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot={slot.description} className={cn("text-xs text-muted-foreground", className)} {...props} />
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot={slot.action}
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  const size = useContext(CardSize)
  return <div data-slot={slot.content} className={cn(partVariants({ part: "content", size }), className)} {...props} />
}

// Its items in a row
function CardFooter({ className, ...props }: ComponentProps<"div">) {
  const size = useContext(CardSize)
  return (
    <div
      data-slot={slot.footer}
      className={cn("flex items-center", partVariants({ part: "footer", size }), className)}
      {...props}
    />
  )
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
