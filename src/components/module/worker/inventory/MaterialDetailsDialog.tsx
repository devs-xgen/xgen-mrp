"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Truck,
  Box,
  Clock,
  FileText,
  X,
} from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";
import { format } from "date-fns";
import type { MaterialInventoryItem } from "@/lib/actions/worker/inventory";
import { getMaterialWithProducts, type MaterialWithProducts } from "@/lib/actions/worker/inventory";

interface MaterialDetailsDialogProps {
  material: MaterialInventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to get stock level badge
function getStockLevelBadge(stockLevel: string) {
  switch (stockLevel) {
    case "normal":
      return <Badge className="bg-green-100 text-green-800">Normal Stock</Badge>;
    case "low":
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    case "critical":
      return <Badge className="bg-orange-100 text-orange-800">Critical Stock</Badge>;
    case "outOfStock":
      return <Badge variant="destructive">Out of Stock</Badge>;
    default:
      return <Badge variant="outline">{stockLevel}</Badge>;
  }
}

export function MaterialDetailsDialog({
  material,
  open,
  onOpenChange,
}: MaterialDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [materialWithProducts, setMaterialWithProducts] = useState<MaterialWithProducts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && material) {
      loadMaterialDetails();
    } else {
      setMaterialWithProducts(null);
      setError(null);
    }
  }, [open, material]);

  async function loadMaterialDetails() {
    if (!material) return;

    setLoading(true);
    setError(null);

    try {
      const details = await getMaterialWithProducts(material.id);
      setMaterialWithProducts(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load material details");
    } finally {
      setLoading(false);
    }
  }

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {material.name}
          </DialogTitle>
          <DialogDescription>
            SKU: {material.sku} | Type: {material.materialTypeName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Stock Status */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Stock Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStockLevelBadge(material.stockLevel)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="text-lg font-semibold">
                    {material.currentStock} {material.unitOfMeasureSymbol}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Available Stock</p>
                  <p className="text-lg font-semibold text-green-600">
                    {material.availableStock} {material.unitOfMeasureSymbol}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Committed</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {material.committedStock} {material.unitOfMeasureSymbol}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Minimum Stock Level:</span>
                  <span>
                    {material.minimumStockLevel} {material.unitOfMeasureSymbol}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cost Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cost Per Unit</p>
                  <p className="text-lg font-semibold">
                    {formatCurrencyPHP(material.costPerUnit)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Inventory Value</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrencyPHP(material.totalValue)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Supplier Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Supplier Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Supplier Name</p>
                  <p className="font-medium">{material.supplier.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Supplier Code</p>
                  <p className="font-mono text-sm">{material.supplier.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <p className="font-medium">{material.leadTime} days</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {format(new Date(material.lastUpdated), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {material.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {material.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Products Using This Material */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Box className="h-4 w-4" />
                Products Using This Material
                {materialWithProducts && (
                  <Badge variant="secondary">
                    {materialWithProducts.totalProductsUsing}
                  </Badge>
                )}
              </h3>

              {loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Loading product information...
                </div>
              )}

              {error && (
                <div className="text-center py-8 text-red-600">
                  Error: {error}
                </div>
              )}

              {!loading && !error && materialWithProducts && (
                <>
                  {materialWithProducts.products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No products currently use this material</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {materialWithProducts.products.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {product.quantityNeeded} {material.unitOfMeasureSymbol}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                + {product.wastePercentage}% waste
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Total Required (with waste):{" "}
                              <span className="font-medium text-foreground">
                                {product.totalRequired.toFixed(2)} {material.unitOfMeasureSymbol}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
