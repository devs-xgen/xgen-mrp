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
<<<<<<< HEAD
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/materials">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Materials
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{material.name}</h1>
          <Badge variant="outline">{material.sku}</Badge>
        </div>
        {/* <Link href={`/admin/materials/${material.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Material
          </Button>
        </Link> */}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === "details"
              ? "border-b-2 border-primary font-medium"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("details")}
        >
          Material Details
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "usage"
              ? "border-b-2 border-primary font-medium"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("usage")}
        >
          Usage in Products
        </button>
      </div>

      {/* Material Details Tab */}
      {activeTab === "details" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Material Information</CardTitle>
              <CardDescription>
                Basic information about this material
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Name
                  </h3>
                  <p>{material.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    SKU
                  </h3>
                  <p>{material.sku}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Type
                  </h3>
                  <p>{material.type?.name || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Unit of Measure
                  </h3>
                  <p>
                    {material.unitOfMeasure
                      ? `${material.unitOfMeasure.name} (${material.unitOfMeasure.symbol})`
                      : "Not specified"}
                  </p>
                </div>
=======
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
>>>>>>> 21843c7 (feat: add billing statements and delivery receipts data tables with actions)
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
