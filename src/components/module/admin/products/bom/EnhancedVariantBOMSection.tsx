"use client";

import { useEffect, useState } from "react";
import { getBOMForProduct } from "@/lib/actions/bom";
import { createProductVariantBOM } from "@/lib/actions/product-variants";
import { getVariantBOM, getCombinedVariantBOM, copyBaseBOMToVariant } from "@/lib/actions/variant-bom";
import { ProductBOM } from "@/types/admin/bom";
import { ProductVariantWithNumberValues } from "@/types/admin/product";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  Palette, 
  Copy, 
  Plus, 
  Loader2, 
  AlertTriangle,
  Edit,
  Trash2,
  Calculator
} from "lucide-react";
import { BOMTable } from "./BOMTable";

interface EnhancedVariantBOMSectionProps {
  productId: string;
  productName: string;
  hasVariants: boolean;
  variants?: ProductVariantWithNumberValues[];
  currentStock?: number;
  minimumStockLevel?: number;
}

interface VariantBOMData {
  variant: ProductVariantWithNumberValues;
  baseBOM: ProductBOM | null;
  variantBOM: any[] | null;
  combinedBOM: any[] | null;
  totalCost: number;
}

export function EnhancedVariantBOMSection({
  productId,
  productName,
  hasVariants,
  variants = [],
  currentStock,
  minimumStockLevel,
}: EnhancedVariantBOMSectionProps) {
  const [baseBOM, setBaseBOM] = useState<ProductBOM | null>(null);
  const [variantBOMData, setVariantBOMData] = useState<VariantBOMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("base");
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantWithNumberValues | null>(null);
  const { toast } = useToast();

  const fetchBOMData = async () => {
    try {
      setLoading(true);
      
      // Fetch base product BOM
      const bomData = await getBOMForProduct(productId);
      setBaseBOM(bomData);

      if (hasVariants && variants.length > 0) {
        // Fetch variant-specific BOMs
        const variantData: VariantBOMData[] = [];
        
        for (const variant of variants) {
          try {
            const variantBOM = await getVariantBOM(variant.id);
            const combinedBOM = combineBaseBOMWithVariant(bomData, variantBOM);
            const totalCost = calculateVariantBOMCost(combinedBOM);
            
            variantData.push({
              variant,
              baseBOM: bomData,
              variantBOM,
              combinedBOM,
              totalCost,
            });
          } catch (error) {
            console.error(`Error fetching BOM for variant ${variant.id}:`, error);
            variantData.push({
              variant,
              baseBOM: bomData,
              variantBOM: null,
              combinedBOM: bomData?.entries || [],
              totalCost: bomData?.totalMaterialCost || 0,
            });
          }
        }
        
        setVariantBOMData(variantData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bill of materials",
        variant: "destructive",
      });
      console.error("Error fetching BOM:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOMData();
  }, [productId, hasVariants, variants]);

  const combineBaseBOMWithVariant = (baseBOM: ProductBOM | null, variantBOM: any[] | null) => {
    if (!baseBOM) return [];
    
    const combined = [...baseBOM.entries];
    
    if (variantBOM && variantBOM.length > 0) {
      // Override or add variant-specific materials
      variantBOM.forEach(variantEntry => {
        const existingIndex = combined.findIndex(
          baseEntry => baseEntry.materialId === variantEntry.materialId
        );
        
        if (existingIndex >= 0) {
          // Override base quantity with variant-specific quantity
          combined[existingIndex] = {
            ...combined[existingIndex],
            quantityNeeded: variantEntry.quantityNeeded,
            wastePercentage: variantEntry.wastePercentage,
          } as any;
        } else {
          // Add new variant-specific material
          combined.push({
            ...variantEntry,
          } as any);
        }
      });
    }
    
    return combined;
  };

  const calculateVariantBOMCost = (bomEntries: any[]) => {
    return bomEntries.reduce((total, entry) => {
      const materialCost = entry.material?.costPerUnit || 0;
      const quantity = entry.quantityNeeded || 0;
      const waste = entry.wastePercentage || 0;
      const totalQuantity = quantity * (1 + waste / 100);
      return total + (materialCost * totalQuantity);
    }, 0);
  };

  const handleCopyBaseBOMToVariant = async (variant: ProductVariantWithNumberValues) => {
    try {
      if (!baseBOM || !baseBOM.entries.length) {
        toast({
          title: "Error",
          description: "No base BOM to copy",
          variant: "destructive",
        });
        return;
      }

      const result = await copyBaseBOMToVariant(variant.id);

      toast({
        title: "Success",
        description: result.message,
      });

      await fetchBOMData();
      setShowCopyDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to copy BOM",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getVariantBOMStatus = (variantData: VariantBOMData) => {
    if (!variantData.variantBOM || variantData.variantBOM.length === 0) {
      return {
        status: "Using Base BOM",
        color: "bg-blue-500",
        description: "This variant uses the base product BOM"
      };
    }
    
    const hasOverrides = variantData.variantBOM.some(vEntry => 
      variantData.baseBOM?.entries.some(bEntry => bEntry.materialId === vEntry.materialId)
    );
    
    const hasAdditional = variantData.variantBOM.some(vEntry => 
      !variantData.baseBOM?.entries.some(bEntry => bEntry.materialId === vEntry.materialId)
    );

    if (hasOverrides && hasAdditional) {
      return {
        status: "Custom BOM",
        color: "bg-purple-500",
        description: "Has material overrides and additional materials"
      };
    } else if (hasOverrides) {
      return {
        status: "Partial Override",
        color: "bg-orange-500",
        description: "Some base materials have different quantities"
      };
    } else {
      return {
        status: "Extended BOM",
        color: "bg-green-500",
        description: "Uses base BOM plus additional materials"
      };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="base" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Base Product BOM
          </TabsTrigger>
          <TabsTrigger value="variants" disabled={!hasVariants} className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Variant BOMs ({variants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Base Product BOM Template
                  </CardTitle>
                  <CardDescription>
                    Master template that applies to all variants. Changes here affect all variants using base BOM.
                  </CardDescription>
                </div>
                {hasVariants && baseBOM && baseBOM.entries.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCopyDialog(true)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Variants
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          <BOMTable
            productId={productId}
            productName={productName}
            bom={baseBOM}
            onRefresh={fetchBOMData}
            isLoading={loading}
            currentStock={currentStock}
            minimumStockLevel={minimumStockLevel}
          />
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          {!hasVariants ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No Variants Available
                </h3>
                <p className="text-sm text-muted-foreground">
                  This product doesn&apos;t have size/color variants. Only base BOM is applicable.
                </p>
              </CardContent>
            </Card>
          ) : variants.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No Variants Created Yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create product variants to manage variant-specific BOMs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Variant BOM Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Variant BOM Summary
                  </CardTitle>
                  <CardDescription>
                    Cost analysis across all product variants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>BOM Status</TableHead>
                        <TableHead>Material Count</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variantBOMData.map((variantData) => {
                        const status = getVariantBOMStatus(variantData);
                        
                        return (
                          <TableRow key={variantData.variant.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{variantData.variant.displayName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {variantData.variant.sizeName && `Size: ${variantData.variant.sizeName}`}
                                  {variantData.variant.sizeName && variantData.variant.colorName && " • "}
                                  {variantData.variant.colorName && `Color: ${variantData.variant.colorName}`}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-white ${status.color}`}>
                                  {status.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {status.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {variantData.combinedBOM?.length || 0} materials
                              </span>
                              {variantData.variantBOM && variantData.variantBOM.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  +{variantData.variantBOM.length} variant-specific
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {formatCurrency(variantData.totalCost)}
                              </span>
                              {baseBOM && variantData.totalCost !== baseBOM.totalMaterialCost && (
                                <div className="text-xs text-muted-foreground">
                                  {variantData.totalCost > baseBOM.totalMaterialCost ? '+' : ''}
                                  {formatCurrency(variantData.totalCost - baseBOM.totalMaterialCost)} vs base
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                {(!variantData.variantBOM || variantData.variantBOM.length === 0) && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVariant(variantData.variant);
                                      setShowCopyDialog(true);
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Individual Variant BOM Details */}
              {variantBOMData.map((variantData) => (
                <Card key={variantData.variant.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          {variantData.variant.displayName} BOM
                        </CardTitle>
                        <CardDescription>
                          Materials needed for {variantData.variant.displayName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-white ${getVariantBOMStatus(variantData).color}`}>
                          {getVariantBOMStatus(variantData).status}
                        </Badge>
                        <span className="text-lg font-semibold">
                          {formatCurrency(variantData.totalCost)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {variantData.combinedBOM && variantData.combinedBOM.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Waste %</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variantData.combinedBOM.map((entry: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="font-medium">{entry.material?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {entry.material?.sku}
                                </div>
                              </TableCell>
                              <TableCell>
                                {entry.quantityNeeded} {entry.material?.unitOfMeasure?.symbol}
                              </TableCell>
                              <TableCell>{entry.wastePercentage}%</TableCell>
                              <TableCell>
                                {formatCurrency(entry.material?.costPerUnit || 0)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(
                                  (entry.material?.costPerUnit || 0) * 
                                  entry.quantityNeeded * 
                                  (1 + entry.wastePercentage / 100)
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={entry.isVariantSpecific ? "default" : "secondary"}>
                                  {entry.isVariantSpecific ? "Variant" : "Base"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No materials defined for this variant.
                        {baseBOM && baseBOM.entries.length > 0 && (
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedVariant(variantData.variant);
                                setShowCopyDialog(true);
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy from Base BOM
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Copy BOM Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Copy Base BOM
            </DialogTitle>
            <DialogDescription>
              {selectedVariant 
                ? `Copy base product BOM to ${selectedVariant.displayName}?`
                : "Select variants to copy the base BOM to:"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedVariant ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedVariant.displayName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {baseBOM?.entries.length || 0} materials will be copied
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatCurrency(baseBOM?.totalMaterialCost || 0)}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {variants.map((variant) => (
                  <div 
                    key={variant.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div>
                      <div className="font-medium">{variant.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {variant.sizeName && `Size: ${variant.sizeName}`}
                        {variant.sizeName && variant.colorName && " • "}
                        {variant.colorName && `Color: ${variant.colorName}`}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedVariant && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleCopyBaseBOMToVariant(selectedVariant)}>
                Copy BOM
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 