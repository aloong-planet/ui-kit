import { cva } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

// components::REQ-012, restyled from shadcn/ui's Mira skeleton to the kit's look and scale (components::CON-003): a
// placeholder block that pulses (theme.css holds the pulse), and stays still when the system asks for reduced motion
// (components::REQ-012/AC-01). It stands in for content that is not there yet, so it is hidden from screen readers and
// lets the pointer through to what lies under it (components::REQ-012/AC-02). Its width and height come from the
// caller's classes (components::REQ-012/AC-04).
const skeletonVariants = cva("pointer-events-none animate-skeleton-pulse rounded-sm motion-reduce:animate-none", {
  variants: {
    variant: {
      default: "bg-border",
      deep: "bg-border-strong",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type SkeletonProps = Omit<ComponentProps<"div">, "aria-hidden" | "children"> & {
  variant?: "default" | "deep"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} aria-hidden />
}

export { Skeleton }
