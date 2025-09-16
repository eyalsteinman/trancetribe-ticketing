import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:from-primary-hover hover:to-primary shadow-glow hover:shadow-intense rounded-2xl border border-primary/30 hover:scale-105 backdrop-blur-sm",
        destructive: "bg-gradient-to-r from-destructive to-red-500 text-destructive-foreground hover:from-red-600 hover:to-red-400 shadow-glow hover:shadow-intense rounded-2xl border border-destructive/30 hover:scale-105",
        outline: "border-2 border-primary bg-card/50 backdrop-blur-xl text-primary hover:bg-primary hover:text-primary-foreground rounded-2xl shadow-modern hover:shadow-glow hover:scale-105 hover:border-primary-glow",
        secondary: "bg-gradient-to-r from-secondary to-accent text-secondary-foreground hover:from-secondary-hover hover:to-secondary rounded-2xl shadow-modern hover:shadow-glow border border-secondary/30 hover:scale-105",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground backdrop-blur-md text-foreground rounded-2xl hover:scale-105 hover:backdrop-blur-xl",
        link: "text-primary underline-offset-4 hover:underline rounded-2xl hover:text-primary-glow transition-all duration-300",
        premium: "bg-gradient-accent text-primary-foreground hover:shadow-intense rounded-2xl border-2 border-accent/50 font-black text-base hover:scale-110 pulse-glow",
        neon: "bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-background rounded-2xl shadow-glow hover:shadow-intense hover:scale-105 font-black uppercase tracking-wider",
      },
      size: {
        default: "h-14 px-8 py-4 text-base",
        sm: "h-11 px-6 py-3",
        lg: "h-16 px-10 py-5 text-lg",
        icon: "h-14 w-14",
        xs: "h-9 px-4 py-2 text-sm",
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
