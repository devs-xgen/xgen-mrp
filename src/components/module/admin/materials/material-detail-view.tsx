// src/components/module/admin/materials/material-detail-view.tsx
"use client";

import { Material, MaterialType, UnitOfMeasure, Supplier } from "@/types/admin/materials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/components/global/table/table-utils";

interface MaterialDetailViewProps {
  material: Material;
  materialTypes: MaterialType[];
  unitOfMeasures: UnitOfMeasure[];
  suppliers: Supplier[];
  usage?: any[];
}

export function MaterialDetailView({
  material,
  materialTypes,
  unitOfMeasures,
  suppliers,
  usage = [],
}: MaterialDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Material Information */}
      <Card>
        <CardHeader>
          <CardTitle>Material Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Basic Information</h3>
              <div className="space-y-2 mt-2">
                <div><span className="font-medium">Name:</span> {material.name}</div>
                <div><span className="font-medium">SKU:</span> {material.sku}</div>
                <div><span className="font-medium">Type:</span> {material.type?.name || "-"}</div>
                <div><span className="font-medium">Unit:</span> {material.unitOfMeasure ? `${material.unitOfMeasure.name} (${material.unitOfMeasure.symbol})` : "-"}</div>
                <div><span className="font-medium">Status:</span> <Badge variant={material.status === "ACTIVE" ? "default" : "secondary"}>{material.status}</Badge></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Stock & Pricing</h3>
              <div className="space-y-2 mt-2">
                <div><span className="font-medium">Current Stock:</span> {material.currentStock}</div>
                <div><span className="font-medium">Minimum Level:</span> {material.minimumStockLevel}</div>
                <div><span className="font-medium">Cost per Unit:</span> {formatCurrency(Number(material.costPerUnit))}</div>
                <div><span className="font-medium">Lead Time:</span> {material.leadTime} days</div>
                <div><span className="font-medium">Supplier:</span> {material.supplier?.name || "-"}</div>
              </div>
            </div>
          </div>
          {material.notes && (
            <div className="mt-4">
              <h3 className="font-semibold">Notes</h3>
              <p className="mt-2 text-sm text-muted-foreground">{material.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      {usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Material Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              This material is used in {usage.length} product(s).
            </div>
            {/* TODO: Add detailed usage table */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}