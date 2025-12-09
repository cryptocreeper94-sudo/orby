import * as React from "react"
import { cn } from "@/lib/utils"

type ColSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
type RowSpan = 1 | 2 | 3

interface BentoCardProps {
  children: React.ReactNode
  span?: ColSpan
  rowSpan?: RowSpan
  className?: string
  title?: string
}

const colSpanClasses: Record<ColSpan, string> = {
  1: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-1",
  2: "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2",
  3: "col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-3",
  4: "col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-4",
  5: "col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-5",
  6: "col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6",
  7: "col-span-12 sm:col-span-12 md:col-span-8 lg:col-span-7",
  8: "col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-8",
  9: "col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-9",
  10: "col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-10",
  11: "col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-11",
  12: "col-span-12",
}

const rowSpanClasses: Record<RowSpan, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
}

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ children, span = 1, rowSpan = 1, className, title }, ref) => {
    return (
      <div
        ref={ref}
        data-testid={`bento-card-${span}x${rowSpan}`}
        className={cn(
          "p-3 rounded-xl",
          "bg-slate-800/60 backdrop-blur-md",
          "border border-white/10",
          "transition-all duration-200",
          "hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10",
          colSpanClasses[span],
          rowSpanClasses[rowSpan],
          className
        )}
      >
        {title && (
          <div
            data-testid="bento-card-title"
            className="text-sm font-medium text-slate-300 mb-2"
          >
            {title}
          </div>
        )}
        {children}
      </div>
    )
  }
)
BentoCard.displayName = "BentoCard"

export { BentoCard }
export type { BentoCardProps, ColSpan, RowSpan }
