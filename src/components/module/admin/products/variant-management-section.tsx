"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Plus, 
  Edit,
  AlertCircle,
  CheckCircle,
  Package,
  Ruler,
  Banknote,
  BarChart3,
  Box,
  Wrench
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { VariantCreationDialog } from "./variant-creation-dialog";
import { ProductWithNumberValues, ProductVariantWithNumberValues } from "@/types/admin/product";
import { formatCurrencyPHP } from "@/lib/constant";

interface VariantManagementSectionProps {
  product: ProductWithNumberValues;
  onStockAdjust: (variant?: ProductVariantWithNumberValues) => void;
  onRefresh: () => Promise<void>;
}

export function VariantManagementSection({ 
  product, 
  onStockAdjust, 
  onRefresh 
}: VariantManagementSectionProps) {
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { 
      label: 'Out of Stock', 
      color: 'text-red-600', 
      bgColor: 'border-l-red-500',
      circleColor: 'bg-red-500',
      icon: AlertCircle,
      variant: 'destructive' as const 
    };
    if (current <= minimum) return { 
      label: 'Low Stock', 
      color: 'text-yellow-600', 
      bgColor: 'border-l-yellow-500',
      circleColor: 'bg-yellow-500',
      icon: AlertCircle,
      variant: 'secondary' as const 
    };
    return { 
      label: 'In Stock', 
      color: 'text-green-600', 
      bgColor: 'border-l-green-500',
      circleColor: 'bg-green-500',
      icon: CheckCircle,
      variant: 'default' as const 
    };
  };

  const getVariantColorCircle = (colorName?: string | null) => {
    if (!colorName) return 'bg-gray-400';
    
    // Map common color names to Tailwind classes
    const colorMap: Record<string, string> = {
      'red': 'bg-red-500',
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'black': 'bg-black',
      'white': 'bg-white border-2 border-gray-300',
      'gray': 'bg-gray-500',
      'grey': 'bg-gray-500',
      'navy': 'bg-blue-900',
      'brown': 'bg-amber-800',
      'orange': 'bg-orange-500',
      'teal': 'bg-teal-500',
      'cyan': 'bg-cyan-500',
      'indigo': 'bg-indigo-500',
      'lime': 'bg-lime-500',
      'emerald': 'bg-emerald-500',
      'sky': 'bg-sky-500',
      'violet': 'bg-violet-500',
      'fuchsia': 'bg-fuchsia-500',
      'rose': 'bg-rose-500',
    };
    
    const normalizedColor = colorName.toLowerCase();
    return colorMap[normalizedColor] || 'bg-gradient-to-br from-purple-400 to-pink-400';
  };

  const toggleVariantExpanded = (variantId: string) => {
    setExpandedVariants(prev => ({
      ...prev,
      [variantId]: !prev[variantId]
    }));
  };

  if (product.hasVariants && product.variants && product.variants.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Product Variants ({product.variants.length})
              </span>
              <div className="flex gap-2">
                <VariantCreationDialog
                  productId={product.id}
                  productName={product.name}
                  onSuccess={onRefresh}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Variants
                    </Button>
                  }
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onStockAdjust()}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Bulk Adjust Stock
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Manage stock levels and configurations for each product variant
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Variants List */}
        <div className="space-y-4">
          {product.variants.map((variant) => {
            const stockStatus = getStockStatus(variant.currentStock, variant.minimumStockLevel);
            const StatusIcon = stockStatus.icon;
            const isExpanded = expandedVariants[variant.id];
            
            return (
                              <Card key={variant.id} className="border transition-all duration-200 hover:shadow-md">
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleVariantExpanded(variant.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {isExpanded ? 
                            <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          }
                          
                          <div>
                            <CardTitle className="text-lg flex items-center gap-3">
                              <span>{variant.displayName}</span>
                              <Badge variant="outline" className="text-xs font-mono bg-muted/50">
                                {variant.sku}
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${stockStatus.circleColor}`} />
                                <Badge variant={stockStatus.variant} className="text-xs">
                                  {stockStatus.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {variant.currentStock} units
                                </span>
                                <span>Min: {variant.minimumStockLevel}</span>
                                <span className="flex items-center gap-1">
                                  <Banknote className="w-3 h-3" />
                                  {formatCurrencyPHP(variant.sellingPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStockAdjust(variant);
                            }}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Adjust
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Variant Attributes */}
                        <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                              <Ruler className="w-4 h-4" />
                              Variant Attributes
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {variant.sizeName && (
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Size</Label>
                                <Badge variant="outline" className="bg-white/80">{variant.sizeName}</Badge>
                              </div>
                            )}
                            {variant.colorName && (
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Color</Label>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${getVariantColorCircle(variant.colorName)} border border-gray-300`} />
                                  <Badge variant="outline" className="bg-white/80">{variant.colorName}</Badge>
                                </div>
                              </div>
                            )}
                            {variant.styleName && (
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Style</Label>
                                <Badge variant="outline" className="bg-white/80">{variant.styleName}</Badge>
                              </div>
                            )}
                            {variant.materialName && (
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Material</Label>
                                <Badge variant="outline" className="bg-white/80">{variant.materialName}</Badge>
                              </div>
                            )}4
                          </CardContent>
                        </Card>

                        {/* Stock Details */}
                        <Card className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-200/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                              <Package className="w-4 h-4" />
                              Stock Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs text-muted-foreground">Current Stock</Label>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${stockStatus.circleColor}`} />
                                <span className="font-semibold">{variant.currentStock}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <Label className="text-xs text-muted-foreground">Min Level</Label>
                              <span className="font-semibold">{variant.minimumStockLevel}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <Label className="text-xs text-muted-foreground">Expected</Label>
                              <span className="font-semibold">{variant.expectedStock}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <Label className="text-xs text-muted-foreground">Committed</Label>
                              <span className="font-semibold">{variant.committedStock}</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Pricing Details */}
                        <Card className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-200/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                              <Banknote className="w-4 h-4" />
                              Pricing Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs text-muted-foreground">Unit Cost</Label>
                              <span className="font-semibold text-red-600">{formatCurrencyPHP(variant.unitCost)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <Label className="text-xs text-muted-foreground">Selling Price</Label>
                              <span className="font-semibold text-blue-600">{formatCurrencyPHP(variant.sellingPrice)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <Label className="text-xs text-muted-foreground">Profit Margin</Label>
                              <span className="font-semibold text-green-600">
                                {(((variant.sellingPrice - variant.unitCost) / variant.sellingPrice) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* BOM Information */}
                      {variant.boms && variant.boms.length > 0 && (
                        <Card className="mt-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                              <Box className="w-4 h-4" />
                              Bill of Materials ({variant.boms.length} materials)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {variant.boms.slice(0, 3).map((bom) => (
                                <div key={bom.id} className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-lg border border-amber-100">
                                  <span className="text-sm font-medium">{bom.material.name}</span>
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs bg-white/80">
                                      {bom.quantityNeeded} units
                                    </Badge>
                                    <span className="text-xs font-semibold text-amber-700">
                                      {formatCurrencyPHP(bom.material.costPerUnit * bom.quantityNeeded)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {variant.boms.length > 3 && (
                                <div className="text-xs text-muted-foreground text-center pt-2 font-medium">
                                  ... and {variant.boms.length - 3} more materials
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // No variants - show creation options
  return (
    <div className="space-y-6">
      {/* Create Variants Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Product Variants
            </span>
            <VariantCreationDialog
              productId={product.id}
              productName={product.name}
              onSuccess={onRefresh}
              trigger={
                <Button variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Variants
                </Button>
              }
            />
          </CardTitle>
          <CardDescription>
            This product does not have variants yet. Create size and color variants to manage different configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Palette className="w-16 h-16 text-muted-foreground" />
                <div className="absolute -top-1 -right-1">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Variants Created</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Variants allow you to manage different sizes, colors, and configurations of this product with individual stock levels and pricing.
            </p>
            <div className="flex justify-center gap-3">
              <VariantCreationDialog
                productId={product.id}
                productName={product.name}
                onSuccess={onRefresh}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Variants
                  </Button>
                }
              />
              <Button variant="outline">
                <Wrench className="w-4 h-4 mr-2" />
                Learn About Variants
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Management for Non-Variant Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stock Management
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onStockAdjust()}
            >
              <Edit className="w-4 h-4 mr-2" />
              Adjust Stock
            </Button>
          </CardTitle>
          <CardDescription>
            Manage stock levels for this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Current Stock</Label>
              <p className="text-3xl font-bold mt-1">{product.currentStock}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Minimum Level</Label>
              <p className="text-3xl font-bold mt-1">{product.minimumStockLevel}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Stock Status</Label>
              <div className="mt-2">
                <Badge 
                  variant={getStockStatus(product.currentStock, product.minimumStockLevel).variant}
                  className="text-sm px-3 py-1"
                >
                  {getStockStatus(product.currentStock, product.minimumStockLevel).label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 