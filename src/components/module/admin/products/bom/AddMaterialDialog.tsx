// src/components/module/admin/products/bom/AddMaterialDialog.tsx
"use client";

import { useState, useEffect } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createBOMEntry, getAvailableMaterials } from "@/lib/actions/bom";
import { createVariantBOMEntry } from "@/lib/actions/variant-bom";
import { Loader2, Search, Plus, Trash2, Package, ShoppingCart, X } from "lucide-react";
import { MaterialOption } from "@/components/shared/material";
import { MaterialCostDisplay, MaterialStatusBadge } from "@/components/shared/material";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Selected material with quantities
interface SelectedMaterial extends MaterialOption {
  quantityNeeded: number;
  wastePercentage: number;
}

// Validation schema for each selected material
const materialEntrySchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  quantityNeeded: z.coerce
    .number()
    .positive("Quantity must be greater than 0"),
  wastePercentage: z.coerce
    .number()
    .min(0, "Waste percentage cannot be negative")
    .max(100, "Waste percentage cannot exceed 100%"),
});

interface AddMaterialDialogProps {
  productId: string; // This can be either productId or variantId depending on mode
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  preloadedMaterials?: MaterialOption[];
  excludeMaterialIds?: string[];
  isVariantMode?: boolean; // New prop to indicate if this is for a variant
  variantId?: string; // The actual variant ID when in variant mode
}

export function AddMaterialDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSuccess,
  preloadedMaterials,
  excludeMaterialIds = [],
  isVariantMode = false,
  variantId,
}: AddMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
  const { toast } = useToast();

  // Load materials when dialog opens
  useEffect(() => {
    if (open) {
      if (preloadedMaterials && preloadedMaterials.length > 0) {
        setAvailableMaterials(preloadedMaterials);
      }
      // Reset selections
      setSelectedMaterials([]);
      setSearchQuery("");
    }
  }, [open, preloadedMaterials]);

  // Filter available materials based on search and exclusions
  const filteredMaterials = availableMaterials.filter((material) => {
    const matchesSearch = searchQuery === "" || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const notExcluded = !excludeMaterialIds.includes(material.id);
    const notSelected = !selectedMaterials.some(selected => selected.id === material.id);
    
    return matchesSearch && notExcluded && notSelected;
  });

  // Add material to selection
  const handleAddMaterial = (material: MaterialOption) => {
    const newSelectedMaterial: SelectedMaterial = {
      ...material,
      quantityNeeded: 1,
      wastePercentage: 0,
    };
    setSelectedMaterials(prev => [...prev, newSelectedMaterial]);
  };

  // Remove material from selection
  const handleRemoveMaterial = (materialId: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  // Update quantity for selected material
  const handleUpdateQuantity = (materialId: string, quantityNeeded: number) => {
    setSelectedMaterials(prev => 
      prev.map(m => 
        m.id === materialId 
          ? { ...m, quantityNeeded: Math.max(0.01, quantityNeeded) }
          : m
      )
    );
  };

  // Update waste percentage for selected material
  const handleUpdateWaste = (materialId: string, wastePercentage: number) => {
    setSelectedMaterials(prev => 
      prev.map(m => 
        m.id === materialId 
          ? { ...m, wastePercentage: Math.max(0, Math.min(100, wastePercentage)) }
          : m
      )
    );
  };

  // Get material stock status
  const getStockStatus = (material: MaterialOption): "normal" | "low" | "out" => {
    if (material.currentStock <= 0) return "out";
    if (material.currentStock < material.minimumStockLevel) return "low";
    return "normal";
  };

  // Calculate total cost for selected materials
  const calculateTotalCost = () => {
    return selectedMaterials.reduce((total, material) => {
      const totalQuantity = material.quantityNeeded * (1 + material.wastePercentage / 100);
      return total + (material.costPerUnit * totalQuantity);
    }, 0);
  };

  // Handle form submission - add all selected materials
  const handleSubmit = async () => {
    if (selectedMaterials.length === 0) {
      toast({
        title: "No Materials Selected",
        description: "Please select at least one material to add to the BOM.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Add each selected material to BOM
      for (const material of selectedMaterials) {
        if (isVariantMode && variantId) {
          // Use variant BOM creation for variants
          await createVariantBOMEntry({
            productVariantId: variantId,
            materialId: material.id,
            quantityNeeded: material.quantityNeeded,
            wastePercentage: material.wastePercentage,
            notes: `Added to ${productName} variant`,
          });
        } else {
          // Use regular BOM creation for base products
          await createBOMEntry({
            productId,
            materialId: material.id,
            quantityNeeded: material.quantityNeeded,
            wastePercentage: material.wastePercentage,
          });
        }
      }

      await onSuccess();
      onOpenChange(false);

      toast({
        title: "Materials Added",
        description: `Successfully added ${selectedMaterials.length} material(s) to the ${isVariantMode ? 'variant' : ''} BOM.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add materials to bill of materials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2 truncate">
                <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Add Materials to {productName} {isVariantMode ? 'Variant' : ''}</span>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Select materials and specify their quantities for the {isVariantMode ? 'variant' : 'product'} bill of materials.
                {isVariantMode && (
                  <span className="block mt-1 text-sm font-medium">
                    Note: These materials will be specific to this variant.
                  </span>
                )}
              </DialogDescription>
            </div>
            
            {/* Action Buttons in Header */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {selectedMaterials.length > 0 && (
                <Badge variant="secondary" className="text-sm px-2 py-1 hidden sm:flex">
                  <MaterialCostDisplay cost={calculateTotalCost()} />
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || selectedMaterials.length === 0}
                size="sm"
                className="min-w-[100px]"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span className="hidden sm:inline">
                  Add {selectedMaterials.length} Material{selectedMaterials.length !== 1 ? 's' : ''}
                </span>
                <span className="sm:hidden">
                  Add ({selectedMaterials.length})
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="sm:hidden h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
            {/* Left Panel - Material Search & Selection */}
            <div className="flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Available Materials
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search materials by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {filteredMaterials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">
                            {searchQuery ? "No materials found matching your search" : "No available materials"}
                          </p>
                        </div>
                      ) : (
                        filteredMaterials.map((material) => {
                          const stockStatus = getStockStatus(material);
                          return (
                            <div
                              key={material.id}
                              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => handleAddMaterial(material)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm truncate">{material.name}</h4>
                                    <MaterialStatusBadge stockStatus={stockStatus} size="sm" />
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div>SKU: {material.sku}</div>
                                    <div className="flex gap-4">
                                      <span>Stock: {material.currentStock} {material.unitOfMeasureSymbol}</span>
                                      <span>Cost: <MaterialCostDisplay cost={material.costPerUnit} /></span>
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" className="ml-2 flex-shrink-0">
                                  <Plus className="w-3 h-3 mr-1" />
                                  <span className="hidden sm:inline">Add</span>
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Selected Materials */}
            <div className="flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Selected Materials ({selectedMaterials.length})
                    </div>
                    {selectedMaterials.length > 0 && (
                      <Badge variant="secondary" className="text-sm px-2 py-1 sm:hidden">
                        <MaterialCostDisplay cost={calculateTotalCost()} />
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {selectedMaterials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No materials selected</p>
                          <p className="text-xs mt-1">Select materials from the left panel to configure them here</p>
                        </div>
                      ) : (
                        selectedMaterials.map((material) => {
                          const totalQuantity = material.quantityNeeded * (1 + material.wastePercentage / 100);
                          const totalCost = material.costPerUnit * totalQuantity;
                          
                          return (
                            <Card key={material.id}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm mb-1 truncate">{material.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{material.sku}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveMaterial(material.id)}
                                    className="h-6 w-6 p-0 flex-shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div>
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      value={material.quantityNeeded}
                                      onChange={(e) => handleUpdateQuantity(material.id, e.target.valueAsNumber || 0.01)}
                                      className="text-right text-sm h-7"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {material.unitOfMeasureSymbol}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-xs">Waste %</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={material.wastePercentage}
                                      onChange={(e) => handleUpdateWaste(material.id, e.target.valueAsNumber || 0)}
                                      className="text-right text-sm h-7"
                                    />
                                  </div>
                                </div>

                                <Separator className="my-2" />

                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span>Total quantity:</span>
                                    <span className="font-mono">{totalQuantity.toFixed(2)} {material.unitOfMeasureSymbol}</span>
                                  </div>
                                  <div className="flex justify-between font-medium">
                                    <span>Total cost:</span>
                                    <span><MaterialCostDisplay cost={totalCost} /></span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile-only bottom action bar */}
        <div className="sm:hidden border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || selectedMaterials.length === 0}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add ({selectedMaterials.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
