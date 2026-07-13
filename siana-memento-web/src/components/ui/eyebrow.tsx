import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const eyebrowVariants = cva(
  "font-body text-sm font-medium uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        accent: "text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Eyebrow({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"p"> &
  VariantProps<typeof eyebrowVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "p"

  return (
    <Comp
      data-slot="eyebrow"
      data-variant={variant}
      className={cn(eyebrowVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Eyebrow, eyebrowVariants }
