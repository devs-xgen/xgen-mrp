// src/components/module/admin/materials/materialDashboard.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialType, Status, UnitOfMeasure } from "@prisma/client";
import { Material } from "@/types/admin/materials";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface MaterialsDashboardProps {
  materials: Material[];
  materialTypes: { id: string; name: string }[];
  unitOfMeasures: { id: string; name: string; symbol?: string }[];
  suppliers: { id: string; name: string }[];
}

export default function MaterialsDashboard({
  materials,
  materialTypes,
  unitOfMeasures,
  suppliers,
}: MaterialsDashboardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalMaterials = materials.length;

    const activeMaterials = materials.filter(
      (m) => m.status === Status.ACTIVE
    ).length;

    const lowStockMaterials = materials.filter((m) => {
      // Handle potentially undefined values with nullish coalescing
      const currentStock = m.currentStock ?? 0;
      const minimumStockLevel = m.minimumStockLevel ?? 0;
      return currentStock <= minimumStockLevel;
    });

    const totalValue = materials.reduce((acc, material) => {
      // Convert any potential non-numeric values to numbers
      const cost =
        typeof material.costPerUnit === "number" ? material.costPerUnit : 0;
      const stock =
        typeof material.currentStock === "number" ? material.currentStock : 0;
      return acc + cost * stock;
    }, 0);

    return {
      totalMaterials,
      activeMaterials,
      lowStockMaterials,
      totalValue,
    };
  }, [materials]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Materials */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeMaterials} active materials
            </p>
          </CardContent>
        </Card>

        {/* Material Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Material Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materialTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Categories for materials
            </p>
          </CardContent>
        </Card>

        {/* Units of Measure */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Units of Measure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitOfMeasures.length}</div>
            <p className="text-xs text-muted-foreground">Available units</p>
          </CardContent>
        </Card>

        {/* Total Inventory Value */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PHP",
              }).format(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockMaterials.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            You have {stats.lowStockMaterials.length} materials below minimum
            stock level.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
