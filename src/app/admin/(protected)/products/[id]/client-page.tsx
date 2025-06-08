// src/app/admin/(protected)/products/[id]/client-page.tsx
"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, TrendingUp, AlertTriangle, Factory, Plus, Minus, History, Edit, Eye, Palette, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateProductionDialog } from "@/components/module/admin/products/create-production-dialog";
import { BOMSection } from "@/components/module/admin/products/bom/BOMSection";
import { EnhancedVariantBOMSection } from "@/components/module/admin/products/bom/EnhancedVariantBOMSection";
import { useToast } from "@/hooks/use-toast";
import { adjustProductStock, adjustVariantStock } from "@/lib/actions/product";
import {
  ProductionOrderSummary,
  ProductWithNumberValues,
} from "@/types/admin/product";

interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

interface ProductDetailClientPageProps {
  params: {
    id: string;
  };
  product: ProductWithNumberValues;
  workCenters: WorkCenter[];
}

interface StockAdjustment {
  type: 'ADD' | 'REMOVE';
  quantity: number;
  reason: string;
}

export default function ProductDetailClientPage({
  params,
  product,
  workCenters,
}: ProductDetailClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showProductionDialog, setShowProductionDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustment>({
    type: 'ADD',
    quantity: 0,
    reason: ''
  });

  // Check if we should open the production dialog automatically
  useEffect(() => {
    if (searchParams.get("action") === "produce") {
      setShowProductionDialog(true);
    }
  }, [searchParams]);

  if (!product) {
    notFound();
  }

  // Calculate analytics
  const totalVariants = product.variants?.length || 0;
  const totalStock = product.hasVariants 
    ? product.variants?.reduce((sum, v) => sum + v.currentStock, 0) || 0
    : product.currentStock;
  const lowStockVariants = product.variants?.filter(v => v.currentStock <= v.minimumStockLevel).length || 0;
  const activeProductionOrders = product.productionOrders?.length || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (current <= minimum) return { label: 'Low Stock', color: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const handleStockAdjustment = async () => {
    if (!stockAdjustment.quantity || !stockAdjustment.reason.trim()) {
      toast({
        title: "Error",
        description: "Please enter quantity and reason for stock adjustment",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedVariant) {
        // Adjust variant stock
        await adjustVariantStock(selectedVariant.id, stockAdjustment);
      } else {
        // Adjust product stock
        await adjustProductStock(product.id, stockAdjustment);
      }
      
      toast({
        title: "Success",
        description: "Stock adjusted successfully",
      });
      
      setShowStockDialog(false);
      setSelectedVariant(null);
      setStockAdjustment({ type: 'ADD', quantity: 0, reason: '' });
      
      // Refresh the page data
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error?.message || "Failed to adjust stock",
        variant: "destructive",
      });
    }
  };

  const openStockDialog = (variant?: any) => {
    setSelectedVariant(variant);
    setShowStockDialog(true);
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
            <p className="text-muted-foreground">
              SKU: {product.sku} • Category: {product.category?.name || "Uncategorized"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
          <CreateProductionDialog
            product={product}
            workCenters={workCenters}
            open={showProductionDialog}
            onOpenChange={setShowProductionDialog}
          />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Stock"
          value={totalStock}
          icon="Package"
          {...analyticsCardVariants.blue}
        />
        <AnalyticsCard
          title="Total Variants"
          value={totalVariants}
          icon="Grid"
          {...analyticsCardVariants.purple}
        />
        <AnalyticsCard
          title="Low Stock Items"
          value={lowStockVariants}
          icon="AlertTriangle"
          {...analyticsCardVariants.amber}
        />
        <AnalyticsCard
          title="Active Production"
          value={activeProductionOrders}
          icon="Factory"
          {...analyticsCardVariants.green}
        />
      </div>

      {/* Low Stock Alert */}
      {((!product.hasVariants && product.currentStock <= product.minimumStockLevel) || 
        (product.hasVariants && lowStockVariants > 0)) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-amber-800 font-medium">Low Stock Alert</h3>
                <p className="text-amber-700 text-sm mt-1">
                  {!product.hasVariants 
                    ? `Current stock (${product.currentStock}) is below minimum level (${product.minimumStockLevel})`
                    : `${lowStockVariants} variant(s) are below minimum stock levels`
                  }. Consider creating a production order or adjusting stock levels.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowProductionDialog(true)}
                  >
                    Create Production Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openStockDialog()}
                  >
                    Adjust Stock
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Variants & Stock</TabsTrigger>
          <TabsTrigger value="materials">Materials & BOM</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                    {product.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Lead Time</span>
                  <span className="text-sm">{product.leadTime} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Has Variants</span>
                  <Badge variant={product.hasVariants ? "default" : "outline"}>
                    {product.hasVariants ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {product.description || "No description available"}
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => openStockDialog()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adjust Stock
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowProductionDialog(true)}
                >
                  <Factory className="w-4 h-4 mr-2" />
                  Create Production
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <History className="w-4 h-4 mr-2" />
                      Production History
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Production History</SheetTitle>
                      <SheetDescription>
                        View all production orders for {product.name}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {product.productionOrders && product.productionOrders.length > 0 ? (
                        <>
                          {product.productionOrders.map((order: ProductionOrderSummary) => (
                            <Card key={order.id}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">Order #{order.id.slice(-6)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Quantity: {order.quantity}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Due: {new Date(order.dueDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Badge variant="outline">{order.status}</Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/admin/production/${order.id}`)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          <Link href={`/admin/production?productId=${params.id}`}>
                            <Button variant="outline" className="w-full">
                              View All Production Orders
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Factory className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No production orders found for this product.
                          </p>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          </div>

          {/* Legacy Size and Color Display (for non-variant products) */}
          {!product.hasVariants && (product.sizeRange.length > 0 || product.colorOptions.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Product Options
                </CardTitle>
                <CardDescription>
                  Available sizes and colors for this product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.sizeRange.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Size Range</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.sizeRange.map((size) => (
                        <Badge key={size} variant="outline" className="flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {product.colorOptions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Color Options</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.colorOptions.map((color) => (
                        <Badge key={color} variant="outline" className="flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          {product.hasVariants && product.variants && product.variants.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Product Variants ({product.variants.length})
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openStockDialog()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Bulk Adjust Stock
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage stock levels for each product variant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.variants.map((variant) => {
                    const stockStatus = getStockStatus(variant.currentStock, variant.minimumStockLevel);
                    
                    return (
                      <Card key={variant.id} className="border-l-4" style={{borderLeftColor: stockStatus.color.replace('bg-', '#')}}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{variant.displayName}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {variant.sku}
                                </Badge>
                                <Badge 
                                  variant={stockStatus.label === 'In Stock' ? 'default' : 'destructive'}
                                  className={`text-white ${stockStatus.color}`}
                                >
                                  {stockStatus.label}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {variant.sizeName && (
                                  <div>
                                    <span className="text-muted-foreground">Size:</span>
                                    <span className="ml-1 font-medium">{variant.sizeName}</span>
                                  </div>
                                )}
                                {variant.colorName && (
                                  <div>
                                    <span className="text-muted-foreground">Color:</span>
                                    <span className="ml-1 font-medium">{variant.colorName}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground">Stock:</span>
                                  <span className="ml-1 font-medium">{variant.currentStock}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Min Level:</span>
                                  <span className="ml-1 font-medium">{variant.minimumStockLevel}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cost:</span>
                                  <span className="ml-1 font-medium">{formatCurrency(variant.unitCost)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Price:</span>
                                  <span className="ml-1 font-medium">{formatCurrency(variant.sellingPrice)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStockDialog(variant)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Adjust
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Stock Management
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openStockDialog()}
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
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Current Stock</Label>
                    <p className="text-2xl font-bold">{product.currentStock}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Minimum Stock Level</Label>
                    <p className="text-2xl font-bold">{product.minimumStockLevel}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Stock Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={getStockStatus(product.currentStock, product.minimumStockLevel).label === 'In Stock' ? 'default' : 'destructive'}
                        className={`text-white ${getStockStatus(product.currentStock, product.minimumStockLevel).color}`}
                      >
                        {getStockStatus(product.currentStock, product.minimumStockLevel).label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="materials">
          <EnhancedVariantBOMSection 
            productId={product.id} 
            productName={product.name}
            hasVariants={product.hasVariants}
            variants={product.variants}
            currentStock={product.currentStock}
            minimumStockLevel={product.minimumStockLevel}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Base Pricing
                </CardTitle>
                <CardDescription>
                  Base cost and selling price for this product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Unit Cost</span>
                  <span className="text-lg font-semibold">{formatCurrency(product.unitCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Selling Price</span>
                  <span className="text-lg font-semibold">{formatCurrency(product.sellingPrice)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Profit Margin</span>
                  <span className="text-lg font-semibold text-green-600">
                    {(((product.sellingPrice - product.unitCost) / product.sellingPrice) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {product.hasVariants && (
              <Card>
                <CardHeader>
                  <CardTitle>Variant Pricing Summary</CardTitle>
                  <CardDescription>
                    Pricing overview across all variants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Lowest Cost</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(Math.min(...(product.variants?.map(v => v.unitCost) || [product.unitCost])))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Highest Price</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(Math.max(...(product.variants?.map(v => v.sellingPrice) || [product.sellingPrice])))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Average Margin</span>
                    <span className="text-lg font-semibold text-green-600">
                      {product.variants && product.variants.length > 0 
                        ? (product.variants.reduce((acc, v) => 
                            acc + (((v.sellingPrice - v.unitCost) / v.sellingPrice) * 100), 0
                          ) / product.variants.length).toFixed(1)
                        : '0.0'
                      }%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Adjust Stock
            </DialogTitle>
            <DialogDescription>
              {selectedVariant 
                ? `Adjust stock for ${selectedVariant.displayName}`
                : `Adjust stock for ${product.name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Stock</Label>
                <p className="text-lg font-semibold">
                  {selectedVariant ? selectedVariant.currentStock : product.currentStock}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Minimum Level</Label>
                <p className="text-lg font-semibold">
                  {selectedVariant ? selectedVariant.minimumStockLevel : product.minimumStockLevel}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={stockAdjustment.type === 'ADD' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'ADD' }))}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Stock
                </Button>
                <Button
                  type="button"
                  variant={stockAdjustment.type === 'REMOVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'REMOVE' }))}
                  className="flex-1"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  Remove Stock
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={stockAdjustment.quantity || ''}
                onChange={(e) => setStockAdjustment(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 0 
                }))}
                placeholder="Enter quantity..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={stockAdjustment.reason}
                onChange={(e) => setStockAdjustment(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                placeholder="Enter reason for adjustment..."
                rows={3}
              />
            </div>

            {stockAdjustment.quantity > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  New Stock Level: {' '}
                  <span className="text-lg">
                    {stockAdjustment.type === 'ADD' 
                      ? (selectedVariant ? selectedVariant.currentStock : product.currentStock) + stockAdjustment.quantity
                      : (selectedVariant ? selectedVariant.currentStock : product.currentStock) - stockAdjustment.quantity
                    }
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdjustment}>
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
