import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-modern hover:shadow-modern-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-modern hover:shadow-modern-md",
        outline: "border border-input-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-modern-sm hover:shadow-modern",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-modern-sm hover:shadow-modern",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:opacity-90 shadow-modern hover:shadow-modern-md",
        warning: "bg-warning text-warning-foreground hover:opacity-90 shadow-modern hover:shadow-modern-md",
        premium: "bg-gradient-primary text-primary-foreground hover:shadow-modern-lg shadow-modern-md font-semibold",
        minimal: "bg-transparent text-foreground hover:bg-surface border border-transparent hover:border-border",
        elevated: "bg-card text-card-foreground border border-card-border shadow-modern-md hover:shadow-modern-lg",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-modern-sm",
        sm: "h-9 px-4 text-sm rounded-modern",
        default: "h-10 px-6 text-sm rounded-modern",
        lg: "h-12 px-8 text-base rounded-modern-md",
        xl: "h-14 px-10 text-lg rounded-modern-lg",
        icon: "h-10 w-10 rounded-modern",
        "icon-sm": "h-8 w-8 rounded-modern-sm",
        "icon-lg": "h-12 w-12 rounded-modern-md",
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
