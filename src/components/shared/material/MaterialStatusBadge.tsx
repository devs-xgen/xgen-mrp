"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface MaterialStatusBadgeProps {
  stockStatus: "normal" | "low" | "out";
  showLabel?: boolean;
  size?: "sm" | "default";
}

export function MaterialStatusBadge({
  stockStatus,
  showLabel = true,
  size = "default",
}: MaterialStatusBadgeProps) {
  const getVariant = () => {
    switch (stockStatus) {
      case "normal":
        return "outline";
      case "low":
        return "secondary";
      case "out":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getLabel = () => {
    switch (stockStatus) {
      case "normal":
        return "In Stock";
      case "low":
        return "Low Stock";
      case "out":
        return "Out of Stock";
      default:
        return "Unknown";
    }
  };

  const getIcon = () => {
    switch (stockStatus) {
      case "normal":
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case "low":
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case "out":
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge
      variant={getVariant()}
      className={size === "sm" ? "text-xs py-0 px-1" : ""}
    >
      {getIcon()}
      {showLabel && getLabel()}
    </Badge>
  );
}
