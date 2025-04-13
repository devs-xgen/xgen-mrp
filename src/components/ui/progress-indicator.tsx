import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  tooltipText?: string;
}

/**
 * Battery-like progress indicator component with tooltip
 */
export function ProgressIndicator({
  value,
  max = 100,
  showLabel = true,
  size = "md",
  variant = "default",
  tooltipText,
  className,
  ...props
}: ProgressIndicatorProps) {
  // Ensure value is between 0 and max
  const clampedValue = Math.max(0, Math.min(value, max));
  const percentage = (clampedValue / max) * 100;

  // Determine color based on percentage and variant
  const getColor = () => {
    if (variant === "success") return "bg-green-500 dark:bg-green-600";
    if (variant === "warning") return "bg-yellow-500 dark:bg-yellow-600";
    if (variant === "danger") return "bg-red-500 dark:bg-red-600";

    // Default variant uses a color based on percentage
    if (percentage >= 66) return "bg-green-500 dark:bg-green-600";
    if (percentage >= 33) return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-red-500 dark:bg-red-600";
  };

  // Get animation for progress bar based on completion
  const getAnimation = () => {
    if (percentage === 100) {
      return ""; // No animation for completed items
    }
    if (percentage < 30) {
      return "animate-[pulse_3s_ease-in-out_infinite]"; // Slower pulse for low progress
    }
    return "animate-[pulse_2s_ease-in-out_infinite]"; // Standard pulse for in-progress
  };

  // Size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          container: "h-6 w-16",
          textSize: "text-xs",
          cap: "w-1 h-3",
        };
      case "lg":
        return {
          container: "h-10 w-32",
          textSize: "text-base",
          cap: "w-2 h-5",
        };
      default: // md
        return {
          container: "h-8 w-24",
          textSize: "text-sm",
          cap: "w-1.5 h-4",
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const tooltipContent = tooltipText || `Progress: ${Math.round(percentage)}%`;

  const progressBar = (
    <div
      className={cn(
        "group relative flex items-center rounded-full border-2 border-border overflow-hidden transition-all duration-300 hover:border-primary shadow-sm hover:shadow",
        sizeStyles.container,
        className
      )}
    >
      {/* Battery cap */}
      <div
        className={cn(
          "absolute -right-2 rounded-full bg-border transition-colors group-hover:bg-primary",
          sizeStyles.cap
        )}
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />

      {/* Progress fill */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 rounded-l-full transition-all duration-300",
          getColor(),
          getAnimation()
        )}
        style={{ width: `${percentage}%` }}
      />

      {/* Segmented lines for visual effect */}
      <div className="absolute inset-0 flex">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 border-r border-border/20 last:border-r-0"
          />
        ))}
      </div>

      {/* Percentage text */}
      {showLabel && (
        <div
          className={cn(
            "relative z-10 w-full text-center font-semibold transition-colors group-hover:text-foreground drop-shadow-sm",
            sizeStyles.textSize,
            percentage > 50 ? "text-background" : "text-foreground"
          )}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );

  // Wrap in tooltip for more information on hover
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2" {...props}>
            {progressBar}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
