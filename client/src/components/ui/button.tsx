import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
           "bg-primary text-primary-foreground border border-primary-border hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border-destructive-border hover:shadow-lg",
        outline:
          "border border-white/20 bg-white/5 backdrop-blur-sm shadow-sm hover:bg-white/10 hover:border-white/30 hover:shadow-md active:shadow-none",
        secondary:
          "border bg-secondary text-secondary-foreground border-secondary-border hover:shadow-md",
        ghost: "border border-transparent hover:bg-white/10",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "relative bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] hover:-translate-y-0.5 active:translate-y-0 border border-cyan-300/30",
        premium: "relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white border border-white/20 shadow-lg hover:shadow-[0_0_25px_rgba(148,163,184,0.3)] hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm",
        floating: "relative bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-xl hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0",
      },
      size: {
        // Mobile-optimized touch targets (minimum 44px for accessibility)
        default: "min-h-11 px-4 py-2",
        sm: "min-h-10 rounded-lg px-3 text-xs",
        lg: "min-h-12 rounded-xl px-8",
        icon: "min-h-11 min-w-11 h-11 w-11",
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
