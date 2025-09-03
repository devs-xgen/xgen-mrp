"use client";

import { useEffect, useState, useCallback } from "react";
import { getBOMForProduct } from "@/lib/actions/bom";
import { getVariantBOM, copyBaseBOMToVariant } from "@/lib/actions/variant-bom";
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
  Package, 
  Copy, 
  Loader2,
  Box,
  Layers,
  CheckCircle
} from "lucide-react";
import { BOMTable } from "./BOMTable";
import { VariantBOMTable } from "./VariantBOMTable";

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
  hasBOM: boolean;
  variantBOM: any[] | null;
  isLoading: boolean;
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
  const [copyingBOM, setCopyingBOM] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBOMData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch base product BOM
      const bomData = await getBOMForProduct(productId);
      setBaseBOM(bomData);

      if (hasVariants && variants.length > 0) {
        // Check which variants have BOMs
        const variantData: VariantBOMData[] = [];
        
        for (const variant of variants) {
          try {
            const variantBOM = await getVariantBOM(variant.id);
            variantData.push({
              variant,
              hasBOM: variantBOM && variantBOM.length > 0,
              variantBOM,
              isLoading: false,
            });
          } catch (error) {
            console.error(`Error fetching BOM for variant ${variant.id}:`, error);
            variantData.push({
              variant,
              hasBOM: false,
              variantBOM: null,
              isLoading: false,
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
  }, [productId, hasVariants, variants, toast]);

  useEffect(() => {
    fetchBOMData();
  }, [fetchBOMData]);

  const handleCopyBaseBOMToVariant = async (variantId: string) => {
    try {
      if (!baseBOM || !baseBOM.entries.length) {
        toast({
          title: "No Base BOM",
          description: "Please create a base product BOM first before copying to variants.",
          variant: "destructive",
        });
        return;
      }

      setCopyingBOM(variantId);
      
      // Update the variant state to show loading
      setVariantBOMData(prev => 
        prev.map(item => 
          item.variant.id === variantId 
            ? { ...item, isLoading: true }
            : item
        )
      );

      const result = await copyBaseBOMToVariant(variantId);

      toast({
        title: "Success",
        description: result.message,
      });

      // Refresh the data to get the new BOM
      await fetchBOMData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to copy BOM",
        variant: "destructive",
      });
      
      // Reset loading state on error
      setVariantBOMData(prev => 
        prev.map(item => 
          item.variant.id === variantId 
            ? { ...item, isLoading: false }
            : item
        )
      );
    } finally {
      setCopyingBOM(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="base" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Base Product BOM</span>
            <span className="sm:hidden">Base BOM</span>
          </TabsTrigger>
          <TabsTrigger value="variants" disabled={!hasVariants} className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Variant BOMs ({variants.length})</span>
            <span className="sm:hidden">Variants ({variants.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-4">
          {/* Base BOM Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Material Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {baseBOM?.entries?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">materials defined</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(baseBOM?.totalMaterialCost || 0)}
                </div>
                <p className="text-xs text-muted-foreground">per unit produced</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Variant Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {variants.length}
                </div>
                <p className="text-xs text-muted-foreground">variants available</p>
              </CardContent>
            </Card>
          </div>

          {/* Base BOM Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Base Product BOM Template
              </CardTitle>
              <CardDescription>
                Master template that can be copied to variants. Create this first before setting up variant BOMs.
              </CardDescription>
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
                <h3 className="text-lg font-semibold mb-2">
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
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Variants Created Yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create product variants to manage variant-specific BOMs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Variant List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Variants
                  </CardTitle>
                  <CardDescription>
                    Manage bill of materials for each product variant. Copy from base BOM or create custom BOMs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>BOM Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variantBOMData.map((variantData) => (
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
                            {variantData.isLoading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Copying BOM...</span>
                              </div>
                            ) : variantData.hasBOM ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <Badge variant="outline" className="text-green-700 border-green-200">
                                  BOM Created
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="secondary">
                                No BOM
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!variantData.hasBOM && !variantData.isLoading ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyBaseBOMToVariant(variantData.variant.id)}
                                disabled={copyingBOM === variantData.variant.id || !baseBOM?.entries.length}
                                className="flex items-center gap-2"
                              >
                                {copyingBOM === variantData.variant.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Copying...
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy Base BOM
                                  </>
                                )}
                              </Button>
                            ) : variantData.hasBOM ? (
                              <Badge variant="outline" className="text-green-700">
                                Ready to Edit
                              </Badge>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Show BOM Tables for variants that have BOMs */}
              {variantBOMData
                .filter(variantData => variantData.hasBOM && !variantData.isLoading)
                .map((variantData) => (
                  <VariantBOMTable
                    key={variantData.variant.id}
                    variant={variantData.variant}
                    onRefresh={fetchBOMData}
                    isLoading={loading}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 