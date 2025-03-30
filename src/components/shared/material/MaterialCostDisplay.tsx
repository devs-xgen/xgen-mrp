// src/components/shared/material/MaterialCostDisplay.tsx
import { cn } from "@/lib/utils";

interface MaterialCostDisplayProps {
  cost: number;
  quantity?: number;
  className?: string;
  showCurrency?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  showPerUnit?: boolean;
  bold?: boolean;
}

export function MaterialCostDisplay({
  cost,
  quantity = 1,
  className,
  showCurrency = true,
  size = "sm",
  showPerUnit = false,
  bold = false,
}: MaterialCostDisplayProps) {
  const totalCost = cost * quantity;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: showCurrency ? "currency" : "decimal",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <span className={cn(sizeClasses[size], bold && "font-bold", className)}>
      {formatCurrency(totalCost)}
      {showPerUnit && quantity > 1 && (
        <span className="text-muted-foreground ml-1">
          ({formatCurrency(cost)}/unit)
        </span>
      )}
    </span>
  );
}
