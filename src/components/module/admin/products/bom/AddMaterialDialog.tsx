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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createBOMEntry, getAvailableMaterials } from "@/lib/actions/bom";
import { Loader2, AlertTriangle, Search, Plus, Trash2, Package, ShoppingCart } from "lucide-react";
import { MaterialOption } from "@/components/shared/material";
import { MaterialCostDisplay, MaterialStatusBadge } from "@/components/shared/material";
import { checkMaterialAvailability } from "@/lib/actions/material-search";
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
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  preloadedMaterials?: MaterialOption[];
  excludeMaterialIds?: string[];
}

export function AddMaterialDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSuccess,
  preloadedMaterials,
  excludeMaterialIds = [],
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
        await createBOMEntry({
          productId,
          materialId: material.id,
          quantityNeeded: material.quantityNeeded,
          wastePercentage: material.wastePercentage,
        });
      }

      await onSuccess();
      onOpenChange(false);

      toast({
        title: "Materials Added",
        description: `Successfully added ${selectedMaterials.length} material(s) to the BOM.`,
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
      <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Add Materials to {productName}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Search and select materials from the left panel, then configure quantities and waste percentages on the right.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 h-[600px] min-h-[400px]">
          {/* Left Panel - Material Search & Selection */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
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
                 <div 
                   className="h-full overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                   style={{ maxHeight: 'calc(600px - 120px)' }}
                 >
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
                              <Button size="sm" variant="outline" className="ml-2">
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Selected Materials */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Selected Materials ({selectedMaterials.length})
                  </div>
                  {selectedMaterials.length > 0 && (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      <MaterialCostDisplay cost={calculateTotalCost()} />
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
                             <CardContent className="flex-1 p-0 overflow-hidden">
                   <div 
                     className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                     style={{ maxHeight: 'calc(600px - 120px)' }}
                   >
                     {selectedMaterials.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No materials selected</p>
                        <p className="text-xs mt-1">Select materials from the left panel to configure them here</p>
                      </div>
                    ) : (
                      selectedMaterials.map((material, index) => {
                        const totalQuantity = material.quantityNeeded * (1 + material.wastePercentage / 100);
                        const totalCost = material.costPerUnit * totalQuantity;
                        
                        return (
                                                     <div key={material.id}>
                             <Card>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm mb-1">{material.name}</h4>
                                    <p className="text-xs text-muted-foreground">{material.sku}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveMaterial(material.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <Label className="text-xs font-medium">Quantity Needed</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      value={material.quantityNeeded}
                                      onChange={(e) => handleUpdateQuantity(material.id, e.target.valueAsNumber || 0.01)}
                                      className="text-right text-sm h-8"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      per {material.unitOfMeasureSymbol}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-xs font-medium">Waste %</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={material.wastePercentage}
                                      onChange={(e) => handleUpdateWaste(material.id, e.target.valueAsNumber || 0)}
                                      className="text-right text-sm h-8"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      additional waste
                                    </p>
                                  </div>
                                </div>

                                <Separator className="my-3" />

                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span>Base quantity:</span>
                                    <span className="font-mono">{material.quantityNeeded.toFixed(2)} {material.unitOfMeasureSymbol}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>With waste ({material.wastePercentage}%):</span>
                                    <span className="font-mono font-medium">{totalQuantity.toFixed(2)} {material.unitOfMeasureSymbol}</span>
                                  </div>
                                  <div className="flex justify-between font-medium text-green-700">
                                    <span>Total cost:</span>
                                    <span><MaterialCostDisplay cost={totalCost} /></span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            {index < selectedMaterials.length - 1 && <div className="h-2" />}
                          </div>
                        );
                      })
                    )}
                  </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || selectedMaterials.length === 0}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selectedMaterials.length} Material{selectedMaterials.length !== 1 ? 's' : ''} to BOM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
