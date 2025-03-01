// src/app/worker/(protected)/inventory/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Check inventory levels",
};

export default function InventoryPage() {
  // Sample inventory data
  const inventoryItems = [
    {
      id: "MAT-001",
      name: "Cotton Fabric",
      category: "Raw Materials",
      currentStock: 240,
      unit: "yards",
      minStock: 200,
      location: "Warehouse A, Shelf B12",
    },
    {
      id: "MAT-002",
      name: "Buttons (Small)",
      category: "Components",
      currentStock: 1250,
      unit: "pcs",
      minStock: 1000,
      location: "Warehouse A, Bin C45",
    },
    {
      id: "MAT-003",
      name: "Zippers (20cm)",
      category: "Components",
      currentStock: 50,
      unit: "pcs",
      minStock: 100,
      location: "Warehouse A, Bin D12",
    },
    {
      id: "MAT-004",
      name: "Thread (Black)",
      category: "Consumables",
      currentStock: 30,
      unit: "spools",
      minStock: 50,
      location: "Warehouse B, Shelf A3",
    },
    {
      id: "PRD-001",
      name: "T-Shirt (Medium)",
      category: "Finished Goods",
      currentStock: 120,
      unit: "pcs",
      minStock: 80,
      location: "Warehouse C, Section F",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">
          Check inventory levels and item locations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">350</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Below minimum levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Inventory Items</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => {
                  const isLowStock = item.currentStock < item.minStock;
                  const isCritical = item.currentStock < item.minStock / 2;

                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">{item.id}</td>
                      <td className="py-3 font-medium">{item.name}</td>
                      <td className="py-3">{item.category}</td>
                      <td className="py-3">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3">
                        {isCritical ? (
                          <Badge variant="destructive">Critical</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </td>
                      <td className="py-3">{item.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
