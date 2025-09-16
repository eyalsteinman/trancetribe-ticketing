import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 relative overflow-hidden group modern-radius",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-105 shadow-button border border-primary/30 backdrop-blur-sm before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-glow hover:scale-105 shadow-button",
        outline: "border-2 border-primary/50 bg-background/50 backdrop-blur-md text-foreground hover:bg-primary/10 hover:border-primary hover:text-primary hover:shadow-glow hover:scale-105",
        secondary: "bg-gradient-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-modern hover:scale-105 border border-secondary/20 backdrop-blur-sm",
        ghost: "hover:bg-primary/10 hover:text-primary text-foreground hover:shadow-glow backdrop-blur-md",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        premium: "bg-gradient-accent text-primary-foreground hover:shadow-glow hover:scale-110 shadow-button border border-accent/30 font-bold animate-glow-pulse",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-glow hover:scale-105 shadow-button",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-glow hover:scale-105 shadow-button",
        glass: "bg-white/5 backdrop-blur-xl border border-white/10 text-foreground hover:bg-white/10 hover:border-primary/50 hover:shadow-glow",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-10 px-4 text-sm",
        lg: "h-16 px-8 text-lg",
        icon: "h-12 w-12",
        xs: "h-8 px-3 text-xs",
        xl: "h-20 px-12 text-xl",
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
