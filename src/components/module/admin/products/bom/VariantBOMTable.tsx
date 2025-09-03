"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Plus, Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaterialOption } from "@/components/shared/material/MaterialSelector";
import {
  MaterialCostDisplay,
  MaterialStatusBadge,
} from "@/components/shared/material";
import { AddMaterialDialog } from "./AddMaterialDialog";
import { EditMaterialDialog } from "./EditMaterialDialog";
import { getAvailableMaterials } from "@/lib/actions/bom";
import { 
  getVariantBOM,
  updateVariantBOMEntry, 
  deleteVariantBOMEntry, 
  createVariantBOMEntry 
} from "@/lib/actions/variant-bom";
import { ProductVariantWithNumberValues } from "@/types/admin/product";
import { BOMEntryForDisplay } from "@/types/admin/bom";

interface VariantBOMTableProps {
  variant: ProductVariantWithNumberValues;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

interface VariantBOMEntry extends BOMEntryForDisplay {
  isVariantSpecific: boolean;
  notes?: string;
}

export function VariantBOMTable({
  variant,
  onRefresh,
  isLoading = false,
}: VariantBOMTableProps) {
  const [variantBOM, setVariantBOM] = useState<any[]>([]);
  const [loadingBOM, setLoadingBOM] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<VariantBOMEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const { toast } = useToast();

  // Fetch variant BOM data
  const fetchVariantBOM = useCallback(async () => {
    try {
      setLoadingBOM(true);
      const bomData = await getVariantBOM(variant.id);
      setVariantBOM(bomData || []);
    } catch (error) {
      console.error("Error fetching variant BOM:", error);
      setVariantBOM([]);
    } finally {
      setLoadingBOM(false);
    }
  }, [variant.id]);

  useEffect(() => {
    fetchVariantBOM();
  }, [fetchVariantBOM]);

  const handleEdit = (entry: any) => {
    const bomEntry: VariantBOMEntry = {
      id: entry.id,
      productId: variant.productId,
      materialId: entry.materialId,
      materialName: entry.material?.name || '',
      materialSku: entry.material?.sku || '',
      quantityNeeded: entry.quantityNeeded,
      wastePercentage: entry.wastePercentage,
      costPerUnit: entry.material?.costPerUnit || 0,
      totalCost: (entry.material?.costPerUnit || 0) * entry.quantityNeeded * (1 + entry.wastePercentage / 100),
      unitOfMeasure: entry.material?.unitOfMeasure?.symbol || '',
      isVariantSpecific: true,
      notes: entry.notes,
    };
    
    setSelectedEntry(bomEntry);
    setShowEditDialog(true);
  };

  const handleDelete = async (entryId: string) => {
    if (
      confirm(`Are you sure you want to remove this material from the ${variant.displayName} BOM?`)
    ) {
      try {
        setDeleteLoading(entryId);
        await deleteVariantBOMEntry(entryId);
        await fetchVariantBOM();
        await onRefresh();

        toast({
          title: "Material Removed",
          description: `Material has been removed from ${variant.displayName} BOM`,
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
    await fetchVariantBOM();
    await onRefresh();

    toast({
      title: "Material Added",
      description: `Material has been added to ${variant.displayName} BOM`,
    });
  };

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    setSelectedEntry(null);
    await fetchVariantBOM();
    await onRefresh();

    toast({
      title: "Material Updated",
      description: `Material specifications have been updated for ${variant.displayName}`,
    });
  };

  // Get already used material IDs to exclude from Add dialog
  const usedMaterialIds = variantBOM?.map((entry) => entry.materialId) || [];

  // Format currency as PHP
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const bomEntries = variantBOM || [];
  const totalMaterialCost = bomEntries.reduce((total, entry) => {
    const materialCost = entry.material?.costPerUnit || 0;
    const quantity = entry.quantityNeeded || 0;
    const waste = entry.wastePercentage || 0;
    const totalQuantity = quantity * (1 + waste / 100);
    return total + (materialCost * totalQuantity);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              {variant.displayName} BOM
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Materials required to produce one unit of {variant.displayName}
            </p>
          </div>
          <Button 
            onClick={handleShowAddDialog} 
            disabled={loadingMaterials}
            size="sm"
          >
            {loadingMaterials ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
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
        {isLoading || loadingBOM ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading variant BOM...</p>
            </div>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomEntries.map((entry, index) => {
                  const totalCost = (entry.material?.costPerUnit || 0) * 
                    entry.quantityNeeded * (1 + entry.wastePercentage / 100);
                  
                  return (
                    <TableRow key={entry.id || index}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-medium">{entry.material?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Material #{index + 1}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {entry.material?.sku}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.material?.unitOfMeasure?.symbol}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.quantityNeeded?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.wastePercentage?.toFixed(2) || '0.00'}%
                      </TableCell>
                      <TableCell className="text-right">
                        <MaterialCostDisplay cost={entry.material?.costPerUnit || 0} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MaterialCostDisplay cost={totalCost} bold />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            disabled={!!deleteLoading}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteLoading === entry.id}
                            className="h-8 w-8 p-0"
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
                <TableRow className="border-t-2 font-semibold">
                  <TableCell colSpan={6} className="text-right">
                    Total Material Cost per Unit:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(totalMaterialCost)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Materials Defined
              </h3>
              <p className="text-sm mb-4">
                This variant doesn&apos;t have any materials defined in its BOM.
              </p>
              <Button onClick={handleShowAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Material
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Material Dialog */}
      {showAddDialog && (
        <AddMaterialDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          productId={variant.productId}
          productName={variant.displayName}
          onSuccess={handleAddSuccess}
          preloadedMaterials={materials}
          excludeMaterialIds={usedMaterialIds}
          isVariantMode={true}
          variantId={variant.id}
        />
      )}

      {/* Edit Material Dialog */}
      {showEditDialog && selectedEntry && (
        <EditMaterialDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          entry={selectedEntry}
          onSuccess={handleEditSuccess}
          isVariantMode={true}
          variantId={variant.id}
        />
      )}
    </Card>
  );
} 