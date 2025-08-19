import { Badge } from "@/components/ui/badge";
import { RecommendedAction } from "@/types/admin/order-analysis";
import { Package, Factory, GitMerge, ShoppingCart, Clock } from "lucide-react";

interface RecommendedActionBadgeProps {
  action: RecommendedAction;
}

export function RecommendedActionBadge({ action }: RecommendedActionBadgeProps) {
  const variants = {
    [RecommendedAction.USE_STOCK]: { 
      variant: "default" as const, 
      className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
      icon: Package
    },
    [RecommendedAction.PRODUCE_ALL]: { 
      variant: "outline" as const, 
      className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
      icon: Factory
    },
    [RecommendedAction.HYBRID]: { 
      variant: "secondary" as const, 
      className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
      icon: GitMerge
    },
    [RecommendedAction.ORDER_MATERIALS]: { 
      variant: "outline" as const, 
      className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
      icon: ShoppingCart
    },
    [RecommendedAction.DELAY_ORDER]: { 
      variant: "destructive" as const, 
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
      icon: Clock
    },
  };

  const config = variants[action] || variants[RecommendedAction.PRODUCE_ALL];
  const Icon = config.icon;

  const actionLabels = {
    [RecommendedAction.USE_STOCK]: "Use Stock",
    [RecommendedAction.PRODUCE_ALL]: "Produce All",
    [RecommendedAction.HYBRID]: "Stock + Production",
    [RecommendedAction.ORDER_MATERIALS]: "Order Materials",
    [RecommendedAction.DELAY_ORDER]: "Delay Order",
  };

  return (
    <Badge variant={config.variant} className={`${config.className} gap-1`}>
      <Icon className="h-3 w-3" />
      {actionLabels[action]}
    </Badge>
  );
}
