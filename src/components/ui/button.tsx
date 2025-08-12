import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-normal break-words text-center leading-tight rounded-lg text-sm font-medium backdrop-blur-md border shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-black hover:bg-white/20 border-white/20 focus-visible:ring-white/30",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 border-red-600 focus-visible:ring-red-600/30",
        outline:
          "border border-border bg-background/80 hover:bg-accent text-black focus-visible:ring-ring",
        secondary:
          "bg-secondary text-black hover:bg-secondary/80 border-border focus-visible:ring-ring",
        ghost: "bg-transparent border-transparent hover:bg-accent text-black focus-visible:ring-ring",
        link: "text-black underline-offset-4 hover:underline bg-transparent border-transparent focus-visible:ring-ring",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
