import * as React from "react"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-gray-200",
        orientation === "horizontal" ? "h-[1px] w-full my-4" : "h-full w-[1px] mx-4",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
