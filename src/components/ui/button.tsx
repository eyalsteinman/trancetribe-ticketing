import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass hover:glass-strong text-foreground hover:scale-105 hover:shadow-glow border-white/10 hover:border-white/20",
        primary: "bg-primary/20 backdrop-blur-lg text-primary-foreground hover:bg-primary/30 hover:scale-105 shadow-glow border border-primary/30 hover:border-primary/50",
        secondary: "bg-secondary/20 backdrop-blur-lg text-secondary-foreground hover:bg-secondary/30 hover:scale-105 border border-secondary/30 hover:border-secondary/50",
        destructive: "bg-destructive/20 backdrop-blur-lg text-destructive-foreground hover:bg-destructive/30 hover:scale-105 border border-destructive/30 hover:border-destructive/50",
        outline: "border border-white/20 glass hover:glass-strong text-foreground hover:scale-105 hover:text-primary",
        ghost: "hover:glass text-foreground hover:scale-105 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline hover:scale-105",
        neon: "bg-primary/10 backdrop-blur-lg text-primary border border-primary/30 hover:shadow-neon hover:scale-105 animate-glow-pulse",
        gradient: "bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-lg text-foreground hover:from-primary/30 hover:to-accent/30 hover:scale-105 border border-white/20",
        glass: "glass hover:glass-strong text-foreground hover:scale-105 border-white/10",
        social: "glass hover:glass-strong text-foreground hover:scale-105 border border-white/20 hover:border-primary/30 hover:text-primary",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-lg",
        sm: "h-10 px-4 text-sm rounded-xl",
        default: "h-12 px-6 text-sm rounded-xl",
        lg: "h-14 px-8 text-base rounded-xl",
        xl: "h-16 px-10 text-lg rounded-2xl",
        icon: "h-12 w-12 rounded-xl",
        "icon-sm": "h-10 w-10 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-xl",
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
