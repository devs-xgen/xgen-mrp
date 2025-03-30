// src/components/module/admin/materials/material-detail-view.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, AlertTriangle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MaterialCostDisplay } from "@/components/shared/material";
import { MaterialStatusBadge } from "@/components/shared/material";
import { Material } from "@/types/admin/materials";

interface MaterialUsage {
  productId: string;
  productName: string;
  productSku: string;
  quantityNeeded: number;
  wastePercentage: number;
  pendingProduction: number;
  projectedUsage: number;
}

interface MaterialDetailViewProps {
  material: Material;
  materialUsage: MaterialUsage[];
}

export function MaterialDetailView({
  material,
  materialUsage,
}: MaterialDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"details" | "usage">("details");

  // Calculate total projected usage
  const totalProjectedUsage = materialUsage.reduce(
    (total, usage) => total + usage.projectedUsage,
    0
  );

  // Check if projected usage exceeds available stock
  const hasInsufficientStock = totalProjectedUsage > material.currentStock;

  // Format dates
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
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
        <Link href={`/admin/materials/${material.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Material
          </Button>
        </Link>
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
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Cost per Unit
                  </h3>
                  <p className="font-medium">
                    <MaterialCostDisplay
                      cost={material.costPerUnit}
                      size="md"
                    />
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Status
                  </h3>
                  <Badge variant="outline" className="mt-1">
                    {material.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Notes
                </h3>
                <p className="mt-1">{material.notes || "No notes provided"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Information</CardTitle>
              <CardDescription>
                Current inventory status and levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Current Stock
                  </h3>
                  <p className="text-2xl font-bold">
                    {material.currentStock}{" "}
                    <span className="text-sm font-normal">
                      {material.unitOfMeasure?.symbol}
                    </span>
                  </p>
                </div>
                <MaterialStatusBadge
                  stockStatus={
                    material.currentStock <= 0
                      ? "out"
                      : material.currentStock < material.minimumStockLevel
                      ? "low"
                      : "normal"
                  }
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Minimum Stock Level
                  </h3>
                  <p>
                    {material.minimumStockLevel}{" "}
                    {material.unitOfMeasure?.symbol}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Lead Time
                  </h3>
                  <p>{material.leadTime} days</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Supplier
                </h3>
                <p className="mt-1">
                  {material.supplier ? (
                    <Link
                      href={`/admin/suppliers/${material.supplier.id}`}
                      className="text-primary hover:underline"
                    >
                      {material.supplier.name}
                    </Link>
                  ) : (
                    "No supplier specified"
                  )}
                </p>
              </div>

              {/* Projected Usage Summary */}
              {materialUsage.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Projected Usage (Production)
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <p>
                        <span className="font-medium">
                          {totalProjectedUsage.toFixed(2)}{" "}
                          {material.unitOfMeasure?.symbol}
                        </span>{" "}
                        needed for pending production
                      </p>
                      {hasInsufficientStock && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Insufficient Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Material Usage Tab */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Material Usage in Products</CardTitle>
              <CardDescription>
                {materialUsage.length === 0
                  ? "This material is not used in any products."
                  : `This material is used in ${materialUsage.length} product(s).`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {materialUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto opacity-20 mb-2" />
                  <p>This material is not currently used in any products.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header for total usage */}
                  {hasInsufficientStock && (
                    <div className="bg-destructive/10 border border-destructive rounded-md p-3 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-destructive">
                          Insufficient Stock Warning
                        </h4>
                        <p className="text-sm">
                          Current stock ({material.currentStock}{" "}
                          {material.unitOfMeasure?.symbol}) is less than
                          projected usage ({totalProjectedUsage.toFixed(2)}{" "}
                          {material.unitOfMeasure?.symbol}) for pending
                          production. Consider ordering more material.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Product</th>
                          <th className="text-center py-2 px-4">
                            Quantity per Unit
                          </th>
                          <th className="text-center py-2 px-4">
                            Waste Percentage
                          </th>
                          <th className="text-center py-2 px-4">
                            Pending Production
                          </th>
                          <th className="text-center py-2 px-4">
                            Projected Usage
                          </th>
                          <th className="text-right py-2 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialUsage.map((usage) => (
                          <tr
                            key={usage.productId}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium">
                                {usage.productName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                SKU: {usage.productSku}
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              {usage.quantityNeeded}{" "}
                              {material.unitOfMeasure?.symbol}/unit
                            </td>
                            <td className="text-center py-3 px-4">
                              {usage.wastePercentage}%
                            </td>
                            <td className="text-center py-3 px-4">
                              {usage.pendingProduction > 0 ? (
                                <span>{usage.pendingProduction} units</span>
                              ) : (
                                <span className="text-muted-foreground">
                                  None
                                </span>
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {usage.projectedUsage > 0 ? (
                                <span className="font-medium">
                                  {usage.projectedUsage}{" "}
                                  {material.unitOfMeasure?.symbol}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="text-right py-3 px-4">
                              <Link href={`/admin/products/${usage.productId}`}>
                                <Button variant="outline" size="sm">
                                  View Product
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-medium">
                          <td className="py-3 px-4" colSpan={3}>
                            Total Projected Usage
                          </td>
                          <td className="text-center py-3 px-4">
                            {materialUsage
                              .reduce(
                                (total, usage) =>
                                  total + usage.pendingProduction,
                                0
                              )
                              .toLocaleString()}{" "}
                            units
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-bold">
                              {totalProjectedUsage.toFixed(2)}{" "}
                              {material.unitOfMeasure?.symbol}
                            </span>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
