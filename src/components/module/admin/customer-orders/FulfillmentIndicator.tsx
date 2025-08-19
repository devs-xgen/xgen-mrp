"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Factory, CheckCircle, Clock } from "lucide-react";

interface FulfillmentIndicatorProps {
  fulfillmentOverview?: {
    overallCompletion: number;
    totalAllocated: number;
    fromStock: number;
    fromProduction: number;
    pendingItems: number;
    fulfilledItems: number;
    estimatedFulfillmentDate?: Date;
  };
}

export function FulfillmentIndicator({ fulfillmentOverview }: FulfillmentIndicatorProps) {
  if (!fulfillmentOverview) {
    return (
      <div className="space-y-1">
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          No tracking
        </Badge>
      </div>
    );
  }

  const {
    overallCompletion,
    fromStock,
    fromProduction,
    fulfilledItems,
    pendingItems,
  } = fulfillmentOverview;

  const getCompletionColor = (completion: number) => {
    if (completion >= 100) return "text-green-600";
    if (completion >= 75) return "text-blue-600";
    if (completion >= 50) return "text-yellow-600";
    return "text-gray-600";
  };

  const getCompletionBadgeVariant = (completion: number) => {
    if (completion >= 100) return "default" as const;
    if (completion >= 50) return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-2">
      {/* Main Progress Indicator */}
      <div className="flex items-center gap-2">
        <Progress value={overallCompletion} className="flex-1 h-2" />
        <Badge variant={getCompletionBadgeVariant(overallCompletion)} className="text-xs">
          {overallCompletion}%
        </Badge>
      </div>

      {/* Fulfillment Method Breakdown */}
      <div className="flex flex-wrap gap-1">
        {fromStock > 0 && (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
            <Package className="h-3 w-3 mr-1" />
            {fromStock}
          </Badge>
        )}
        {fromProduction > 0 && (
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
            <Factory className="h-3 w-3 mr-1" />
            {fromProduction}
          </Badge>
        )}
        {fulfilledItems > 0 && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {fulfilledItems} done
          </Badge>
        )}
        {pendingItems > 0 && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {pendingItems} pending
          </Badge>
        )}
      </div>
    </div>
  );
}
