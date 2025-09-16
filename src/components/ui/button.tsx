import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass border border-white/10 text-foreground hover:bg-white/10 hover:border-primary/30 shadow-premium hover:shadow-neon hover:scale-105",
        destructive: "glass border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 shadow-premium hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]",
        outline: "glass border border-white/20 text-foreground hover:bg-white/5 hover:border-accent/40 hover:text-accent",
        secondary: "glass border border-white/10 text-foreground hover:bg-white/5 hover:border-primary/20",
        ghost: "bg-transparent hover:bg-white/5 text-foreground hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
        premium: "gradient-primary border border-white/20 text-white hover:scale-105 shadow-premium hover:shadow-neon font-bold",
        electric: "gradient-electric border border-white/20 text-white hover:scale-105 shadow-electric hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]",
        cyber: "gradient-cyber border border-white/20 text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(251,146,60,0.6)]",
        circle: "circle-button text-white hover:text-white aspect-square p-0 border-2 border-white/20",
        glass: "btn-glass text-foreground hover:text-primary"
      },
      size: {
        default: "h-12 px-6 py-3 rounded-2xl",
        sm: "h-10 px-4 rounded-xl",
        lg: "h-16 px-8 text-base rounded-2xl",
        icon: "h-12 w-12 rounded-2xl",
        xs: "h-8 px-3 text-xs rounded-lg",
        circle: "h-16 w-16 rounded-full"
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
