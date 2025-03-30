// src/components/module/admin/products/bom/BOMTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Plus, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOMEntryForDisplay, ProductBOM } from "@/types/admin/bom";
import { AddMaterialDialog } from "./AddMaterialDialog";
import { EditMaterialDialog } from "./EditMaterialDialog";
import { deleteBOMEntry, getAvailableMaterials } from "@/lib/actions/bom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MaterialOption } from "@/components/shared/material/MaterialSelector";
import {
  MaterialCostDisplay,
  MaterialStatusBadge,
} from "@/components/shared/material";

interface BOMTableProps {
  productId: string;
  productName: string;
  bom: ProductBOM | null;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  currentStock?: number;
  minimumStockLevel?: number;
}

export function BOMTable({
  productId,
  productName,
  bom,
  onRefresh,
  isLoading = false,
  currentStock,
  minimumStockLevel,
}: BOMTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<BOMEntryForDisplay | null>(
    null
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const { toast } = useToast();

  const handleEdit = (entry: BOMEntryForDisplay) => {
    setSelectedEntry(entry);
    setShowEditDialog(true);
  };

  const handleDelete = async (entryId: string) => {
    if (
      confirm("Are you sure you want to remove this material from the BOM?")
    ) {
      try {
        setDeleteLoading(entryId);
        await deleteBOMEntry(entryId);
        await onRefresh();

        toast({
          title: "Material Removed",
          description: "Material has been removed from the bill of materials",
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to remove material",
          variant: "destructive",
        });
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleShowAddDialog = async () => {
    setLoadingMaterials(true);
    try {
      const availableMaterials = await getAvailableMaterials();

      // Map to the MaterialOption format
      const mappedMaterials = availableMaterials.map((m) => ({
        id: m.id,
        name: m.name,
        sku: m.sku,
        costPerUnit:
          typeof m.costPerUnit === "number"
            ? m.costPerUnit
            : Number(m.costPerUnit),
        currentStock: m.currentStock,
        minimumStockLevel: m.minimumStockLevel,
        unitOfMeasureSymbol: m.unitOfMeasure?.symbol || "",
        unitOfMeasureName: m.unitOfMeasure?.name || "",
        typeId: m.typeId,
        typeName: m.type?.name || "",
      }));

      setMaterials(mappedMaterials);
      setShowAddDialog(true);
    } catch (error) {
      console.error("Error loading materials:", error);
      toast({
        title: "Error",
        description: "Failed to load available materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleAddSuccess = async () => {
    setShowAddDialog(false);
    await onRefresh();

    toast({
      title: "Material Added",
      description: "Material has been added to the bill of materials",
    });
  };

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    setSelectedEntry(null);
    await onRefresh();

    toast({
      title: "Material Updated",
      description: "Material specifications have been updated",
    });
  };

  // Get already used material IDs to exclude from Add dialog
  const usedMaterialIds = bom?.entries.map((entry) => entry.materialId) || [];

  // Format currency as PHP
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const bomEntries = bom?.entries || [];
  const totalMaterialCost = bom?.totalMaterialCost || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bill of Materials</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Materials required to produce one unit of {productName}
          </p>
        </div>
        <Button onClick={handleShowAddDialog} disabled={loadingMaterials}>
          {loadingMaterials ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Material
        </Button>
      </CardHeader>

      <CardContent>
        {/* Show stock warning if product is low in stock */}
        {currentStock !== undefined &&
          minimumStockLevel !== undefined &&
          currentStock < minimumStockLevel &&
          bomEntries.length > 0 && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Low Stock Warning</AlertTitle>
              <AlertDescription>
                Current product stock ({currentStock}) is below minimum level (
                {minimumStockLevel}). Check material availability before
                creating new production orders.
              </AlertDescription>
            </Alert>
          )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : bomEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Waste %</TableHead>
                  <TableHead className="text-right">Cost per Unit</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-center">Stock Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomEntries.map((entry) => {
                  // Calculate stock status
                  const stockStatus: "normal" | "low" | "out" =
                    entry.totalCost === 0
                      ? "out"
                      : entry.totalCost < entry.costPerUnit
                      ? "low"
                      : "normal";

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.materialName}
                      </TableCell>
                      <TableCell>{entry.materialSku}</TableCell>
                      <TableCell>{entry.unitOfMeasure}</TableCell>
                      <TableCell className="text-right">
                        {entry.quantityNeeded.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.wastePercentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <MaterialCostDisplay cost={entry.costPerUnit} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MaterialCostDisplay cost={entry.totalCost} bold />
                      </TableCell>
                      <TableCell className="text-center">
                        <MaterialStatusBadge
                          stockStatus={stockStatus}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          disabled={!!deleteLoading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleteLoading === entry.id}
                        >
                          {deleteLoading === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={6} className="text-right font-bold">
                    Total Material Cost per Unit:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <MaterialCostDisplay
                      cost={totalMaterialCost}
                      size="md"
                      bold
                    />
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground mb-4">
              No materials have been added to this product.
            </p>
            <Button variant="outline" onClick={handleShowAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </div>
        )}
      </CardContent>

      {/* Enhanced Add Material Dialog */}
      <AddMaterialDialog
        productId={productId}
        productName={productName}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
        preloadedMaterials={materials}
        excludeMaterialIds={usedMaterialIds}
      />

      {/* Enhanced Edit Material Dialog */}
      {selectedEntry && (
        <EditMaterialDialog
          entry={selectedEntry}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleEditSuccess}
        />
      )}
    </Card>
  );
}
