import * as React from "react"
import { cn } from "@/lib/utils"

interface LayoutShellProps {
  children: React.ReactNode
  className?: string
}

const LayoutShell = React.forwardRef<HTMLDivElement, LayoutShellProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="layout-shell"
        className={cn(
          "grid gap-3",
          "grid-cols-4 md:grid-cols-6 lg:grid-cols-12",
          className
        )}
      >
        {children}
      </div>
    )
  }
)
LayoutShell.displayName = "LayoutShell"

export { LayoutShell }
