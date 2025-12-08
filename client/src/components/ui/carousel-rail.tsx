import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CarouselRailProps {
  items: React.ReactNode[]
  title?: string
  showDots?: boolean
  autoplay?: boolean
  className?: string
}

const CarouselRail = React.forwardRef<HTMLDivElement, CarouselRailProps>(
  ({ items, title, showDots = false, autoplay = false, className }, ref) => {
    const plugins = React.useMemo(
      () => (autoplay ? [Autoplay({ delay: 4000, stopOnInteraction: true })] : []),
      [autoplay]
    )

    const [emblaRef, emblaApi] = useEmblaCarousel(
      { loop: true, align: "start", skipSnaps: false },
      plugins
    )

    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(0)

    const scrollPrev = React.useCallback(() => {
      emblaApi?.scrollPrev()
    }, [emblaApi])

    const scrollNext = React.useCallback(() => {
      emblaApi?.scrollNext()
    }, [emblaApi])

    const scrollTo = React.useCallback(
      (index: number) => {
        emblaApi?.scrollTo(index)
      },
      [emblaApi]
    )

    const onSelect = React.useCallback(() => {
      if (!emblaApi) return
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    React.useEffect(() => {
      if (!emblaApi) return
      onSelect()
      emblaApi.on("select", onSelect)
      emblaApi.on("reInit", onSelect)
      return () => {
        emblaApi.off("select", onSelect)
      }
    }, [emblaApi, onSelect])

    return (
      <div ref={ref} data-testid="carousel-rail" className={cn("relative", className)}>
        {title && (
          <div
            data-testid="carousel-rail-title"
            className="text-sm font-medium text-slate-300 mb-2"
          >
            {title}
          </div>
        )}

        <div className="relative group">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex touch-pan-y -mx-1.5">
              {items.map((item, index) => (
                <div
                  key={index}
                  data-testid={`carousel-rail-item-${index}`}
                  className="flex-none min-w-0 px-1.5"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Button
            data-testid="carousel-rail-prev"
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10",
              "h-8 w-8 rounded-full",
              "bg-slate-800/80 backdrop-blur-sm border border-white/10",
              "text-slate-300 hover:text-cyan-400 hover:border-cyan-400/50",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "disabled:opacity-0"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>

          <Button
            data-testid="carousel-rail-next"
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10",
              "h-8 w-8 rounded-full",
              "bg-slate-800/80 backdrop-blur-sm border border-white/10",
              "text-slate-300 hover:text-cyan-400 hover:border-cyan-400/50",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "disabled:opacity-0"
            )}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>

        {showDots && items.length > 1 && (
          <div
            data-testid="carousel-rail-dots"
            className="flex justify-center gap-1.5 mt-3"
          >
            {items.map((_, index) => (
              <button
                key={index}
                data-testid={`carousel-rail-dot-${index}`}
                onClick={() => scrollTo(index)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  selectedIndex === index
                    ? "bg-cyan-400 w-4"
                    : "bg-slate-600 hover:bg-slate-500"
                )}
              >
                <span className="sr-only">Go to slide {index + 1}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)
CarouselRail.displayName = "CarouselRail"

export { CarouselRail }
export type { CarouselRailProps }
