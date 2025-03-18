import { Badge } from "@/components/ui/badge";

type InventoryStatusBadgeProps = {
  status: "normal" | "low" | "critical";
};

export function InventoryStatusBadge({ status }: InventoryStatusBadgeProps) {
  switch (status) {
    case "critical":
      return <Badge variant="destructive">Critical</Badge>;
    case "low":
      return <Badge variant="warning">Low Stock</Badge>;
    case "normal":
      return <Badge variant="success">Normal</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
}
