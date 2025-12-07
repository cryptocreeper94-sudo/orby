import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionStackItem {
  title: string
  content: React.ReactNode
}

interface AccordionStackProps {
  items: AccordionStackItem[]
  defaultOpen?: number[]
  className?: string
}

const AccordionStack = React.forwardRef<HTMLDivElement, AccordionStackProps>(
  ({ items, defaultOpen = [], className }, ref) => {
    const defaultValue = defaultOpen.map((index) => `item-${index}`)

    return (
      <AccordionPrimitive.Root
        ref={ref}
        type="multiple"
        defaultValue={defaultValue}
        data-testid="accordion-stack"
        className={cn("space-y-1", className)}
      >
        {items.map((item, index) => (
          <AccordionPrimitive.Item
            key={index}
            value={`item-${index}`}
            data-testid={`accordion-stack-item-${index}`}
            className={cn(
              "rounded-lg overflow-hidden",
              "bg-slate-800/40 border border-white/5",
              "data-[state=open]:border-cyan-400/30",
              "transition-colors duration-200"
            )}
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                data-testid={`accordion-stack-trigger-${index}`}
                className={cn(
                  "flex flex-1 items-center justify-between",
                  "px-3 py-2.5 text-sm font-medium text-left",
                  "text-slate-300 hover:text-white",
                  "transition-colors duration-150",
                  "[&[data-state=open]]:text-cyan-400",
                  "[&[data-state=open]>svg]:rotate-180"
                )}
              >
                {item.title}
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content
              data-testid={`accordion-stack-content-${index}`}
              className={cn(
                "overflow-hidden text-sm",
                "data-[state=closed]:animate-accordion-up",
                "data-[state=open]:animate-accordion-down"
              )}
            >
              <div className="px-3 pb-3 pt-0 text-slate-400">{item.content}</div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    )
  }
)
AccordionStack.displayName = "AccordionStack"

export { AccordionStack }
export type { AccordionStackProps, AccordionStackItem }
