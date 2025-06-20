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
    <Card className="border-0 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Bill of Materials
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Materials required to produce one unit of <span className="font-medium text-gray-700">{productName}</span>
            </p>
          </div>
          <Button 
            onClick={handleShowAddDialog} 
            disabled={loadingMaterials}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            size="sm"
          >
            {loadingMaterials ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Materials...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Show stock warning if product is low in stock */}
        {currentStock !== undefined &&
          minimumStockLevel !== undefined &&
          currentStock < minimumStockLevel &&
          bomEntries.length > 0 && (
            <div className="p-4 border-b">
              <Alert variant="destructive" className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Low Stock Warning</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Current product stock ({currentStock}) is below minimum level ({minimumStockLevel}). 
                  Check material availability before creating new production orders.
                </AlertDescription>
              </Alert>
            </div>
          )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading bill of materials...</p>
            </div>
          </div>
        ) : bomEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-gray-900">Material</TableHead>
                  <TableHead className="font-semibold text-gray-900">SKU</TableHead>
                  <TableHead className="font-semibold text-gray-900">Unit</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Quantity</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Waste %</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Cost per Unit</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Total Cost</TableHead>
                  <TableHead className="text-center font-semibold text-gray-900">Stock Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomEntries.map((entry, index) => {
                  // Calculate stock status
                  const stockStatus: "normal" | "low" | "out" =
                    entry.totalCost === 0
                      ? "out"
                      : entry.totalCost < entry.costPerUnit
                      ? "low"
                      : "normal";

                  return (
                    <TableRow 
                      key={entry.id}
                      className={`hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{entry.materialName}</div>
                          <div className="text-xs text-muted-foreground">
                            Material #{index + 1}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {entry.materialSku}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-700">
                        {entry.unitOfMeasure}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.quantityNeeded.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
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
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            disabled={!!deleteLoading}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteLoading === entry.id}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                          >
                            {deleteLoading === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Total Row */}
                <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 font-semibold">
                  <TableCell colSpan={6} className="text-right text-blue-900">
                    Total Material Cost per Unit:
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-lg font-bold text-blue-700">
                      <MaterialCostDisplay
                        cost={totalMaterialCost}
                        size="md"
                        bold
                      />
                    </div>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border-t bg-gray-50/30">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">No Materials Added</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Start building your bill of materials by adding the first material component.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleShowAddDialog}
                disabled={loadingMaterials}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {loadingMaterials ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Material
                  </>
                )}
              </Button>
            </div>
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
