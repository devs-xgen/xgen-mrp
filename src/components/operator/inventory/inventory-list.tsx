import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInventoryItems } from "./data";
import { InventoryStatusBadge } from "./inventory-status-badge";
import { InventoryAdjustmentDialog } from "./inventory-adjustment-dialog";

type InventoryListProps = {
  search?: string;
};

export async function InventoryList({ search }: InventoryListProps) {
  const items = await getInventoryItems(search);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Items</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No inventory items found</p>
            {search && (
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search term
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Item ID</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Current Stock</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.id}</td>
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3">{item.category}</td>
                    <td className="py-3">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3">
                      <InventoryStatusBadge status={item.status} />
                    </td>
                    <td className="py-3">{item.location}</td>
                    <td className="py-3">
                      <InventoryAdjustmentDialog item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
