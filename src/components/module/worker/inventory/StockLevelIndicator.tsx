"use client";

import { StockLevel } from "@/types/worker/inventory";
import { Badge } from "@/components/ui/badge";
import {
  CircleAlert,
  CheckCircle,
  AlertTriangle,
  PackageX,
} from "lucide-react";

interface StockLevelIndicatorProps {
  level: StockLevel;
}

export function StockLevelIndicator({ level }: StockLevelIndicatorProps) {
  const getVariant = () => {
    switch (level) {
      case "normal":
        return "outline";
      case "low":
        return "secondary";
      case "critical":
        return "destructive";
      case "outOfStock":
        return "default";
      default:
        return "outline";
    }
  };

  const getIcon = () => {
    switch (level) {
      case "normal":
        return <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />;
      case "low":
        return <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />;
      case "critical":
        return <CircleAlert className="h-3.5 w-3.5 mr-1 text-red-500" />;
      case "outOfStock":
        return <PackageX className="h-3.5 w-3.5 mr-1 text-gray-500" />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (level) {
      case "normal":
        return "Normal";
      case "low":
        return "Low";
      case "critical":
        return "Critical";
      case "outOfStock":
        return "Out of Stock";
      default:
        return "Unknown";
    }
  };

  return (
    <Badge variant={getVariant()} className="flex items-center font-normal">
      {getIcon()}
      {getLabel()}
    </Badge>
  );
}
