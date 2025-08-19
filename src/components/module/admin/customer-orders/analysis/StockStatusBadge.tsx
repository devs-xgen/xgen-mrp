import { Badge } from "@/components/ui/badge";
import { StockStatus } from "@/types/admin/order-analysis";

interface StockStatusBadgeProps {
  status: StockStatus;
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const variants = {
    [StockStatus.SUFFICIENT]: { 
      variant: "default" as const, 
      className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
    },
    [StockStatus.LOW_STOCK]: { 
      variant: "secondary" as const, 
      className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" 
    },
    [StockStatus.INSUFFICIENT]: { 
      variant: "destructive" as const, 
      className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200" 
    },
    [StockStatus.OUT_OF_STOCK]: { 
      variant: "destructive" as const, 
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" 
    },
    [StockStatus.NEEDS_RESTOCK]: { 
      variant: "outline" as const, 
      className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200" 
    },
  };

  const config = variants[status] || variants[StockStatus.INSUFFICIENT];

  const statusLabels = {
    [StockStatus.SUFFICIENT]: "Sufficient",
    [StockStatus.LOW_STOCK]: "Low Stock",
    [StockStatus.INSUFFICIENT]: "Insufficient",
    [StockStatus.OUT_OF_STOCK]: "Out of Stock",
    [StockStatus.NEEDS_RESTOCK]: "Needs Restock",
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {statusLabels[status]}
    </Badge>
  );
}
