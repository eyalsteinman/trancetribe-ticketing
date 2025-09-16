import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-black ring-offset-background transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground hover:from-accent hover:via-primary hover:to-accent shadow-neon hover:shadow-intense rounded-3xl border-2 border-primary/40 hover:border-accent/60 hover:scale-105 backdrop-blur-xl before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
        destructive: "bg-gradient-to-br from-destructive via-red-500 to-destructive text-destructive-foreground hover:from-red-600 hover:via-destructive hover:to-red-500 shadow-glow hover:shadow-intense rounded-3xl border-2 border-destructive/40 hover:border-red-400/60 hover:scale-105 backdrop-blur-xl",
        outline: "border-3 border-primary bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl text-primary hover:bg-gradient-to-br hover:from-primary/20 hover:to-accent/10 hover:text-primary-foreground rounded-3xl shadow-modern hover:shadow-glow hover:scale-105 hover:border-accent/80",
        secondary: "bg-gradient-to-br from-secondary via-primary to-secondary text-secondary-foreground hover:from-primary hover:via-accent hover:to-primary rounded-3xl shadow-modern hover:shadow-glow border-2 border-secondary/40 hover:border-primary/60 hover:scale-105 backdrop-blur-xl",
        ghost: "hover:bg-gradient-to-br hover:from-accent/20 hover:to-primary/10 hover:text-accent-foreground backdrop-blur-md text-foreground rounded-3xl hover:scale-105 hover:backdrop-blur-xl hover:shadow-glow transition-all duration-500",
        link: "text-primary underline-offset-4 hover:underline rounded-3xl hover:text-accent transition-all duration-500 hover:text-shadow-glow",
        premium: "bg-gradient-to-br from-accent via-primary to-accent text-primary-foreground hover:shadow-neon rounded-3xl border-3 border-accent/60 font-black text-base hover:scale-110 animate-pulse-glow backdrop-blur-xl",
        neon: "bg-transparent border-3 border-accent text-accent hover:bg-gradient-to-br hover:from-accent hover:to-primary hover:text-background rounded-3xl shadow-glow hover:shadow-neon hover:scale-105 font-black uppercase tracking-wider backdrop-blur-xl",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-16 px-8 py-4 text-lg",
        icon: "h-12 w-12",
        xs: "h-8 px-3 py-1.5 text-xs",
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
