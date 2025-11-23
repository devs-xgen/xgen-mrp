// src/components/module/admin/materials/materialDashboard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, Factory, Users } from "lucide-react";
import type { MaterialType, UnitOfMeasure, Supplier } from "@/types/admin/materials";

interface MaterialsDashboardProps {
  stats: {
    totalMaterials: number;
    activeMaterials: number;
    inactiveMaterials: number;
    lowStockCount: number;
  };
  materialTypes: MaterialType[];
  unitOfMeasures: UnitOfMeasure[];
  suppliers: Supplier[];
}

export default function MaterialsDashboard({
  stats,
  materialTypes,
  unitOfMeasures,
  suppliers,
}: MaterialsDashboardProps) {
  const { totalMaterials, activeMaterials, inactiveMaterials, lowStockCount } = stats;
  const totalTypes = materialTypes.length;
  const totalUnits = unitOfMeasures.length;
  const totalSuppliers = suppliers.length;

  const statCards = [
    {
      title: "Total Materials",
      value: totalMaterials.toString(),
      icon: Package,
      footer: `${activeMaterials} active • ${inactiveMaterials} inactive`,
    },
    {
      title: "Low Stock Items",
      value: lowStockCount.toString(),
      icon: AlertTriangle,
      footer: lowStockCount > 0 ? "Review reorder levels" : "All good",
    },
    {
      title: "Types & Units",
      value: `${totalTypes} types`,
      icon: Factory,
      footer: `${totalUnits} units of measure`,
    },
    {
      title: "Suppliers",
      value: totalSuppliers.toString(),
      icon: Users,
      footer: "Linked to materials",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.footer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
