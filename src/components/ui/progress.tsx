
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "warning" | "danger"
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", ...props }, ref) => {
  // Get color based on variant or progress value
  const getProgressColor = () => {
    if (variant === "success") return "bg-green-600";
    if (variant === "warning") return "bg-yellow-500";
    if (variant === "danger") return "bg-red-600";
    
    // Default color logic based on progress
    if (value !== undefined) {
      if (value >= 80) return "bg-green-600";
      if (value >= 40) return "bg-yellow-500";
      if (value >= 1) return "bg-blue-600";
    }
    return "bg-primary";
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", getProgressColor())}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
