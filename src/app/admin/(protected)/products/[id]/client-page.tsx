// src/app/admin/(protected)/products/[id]/client-page.tsx
"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, TrendingUp, AlertTriangle, Factory, Plus, Minus, History, Edit, Eye, Palette, Ruler, Box, Wrench, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { EnhancedVariantBOMSection } from "@/components/module/admin/products/bom/EnhancedVariantBOMSection";
import { VariantCreationDialog } from "@/components/module/admin/products/variant-creation-dialog";
import { ProductDetailsCard } from "@/components/module/admin/products/product-details-card";
import { VariantManagementSection } from "@/components/module/admin/products/variant-management-section";
import { useToast } from "@/hooks/use-toast";
import { adjustProductStock, adjustVariantStock } from "@/lib/actions/product";
import { formatCurrencyPHP } from "@/lib/constant";
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
  id: string;
  product: ProductWithNumberValues;
  workCenters: WorkCenter[];
}

interface StockAdjustment {
  type: 'ADD' | 'REMOVE';
  quantity: number;
  reason: string;
}

export default function ProductDetailClientPage({
  id,
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

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: 'Out of Stock', color: 'bg-red-500', variant: 'destructive' as const };
    if (current <= minimum) return { label: 'Low Stock', color: 'bg-yellow-500', variant: 'secondary' as const };
    return { label: 'In Stock', color: 'bg-green-500', variant: 'default' as const };
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
        await adjustVariantStock(selectedVariant.id, stockAdjustment);
      } else {
        await adjustProductStock(product.id, stockAdjustment);
      }
      
      toast({
        title: "Success",
        description: "Stock adjusted successfully",
      });
      
      setShowStockDialog(false);
      setSelectedVariant(null);
      setStockAdjustment({ type: 'ADD', quantity: 0, reason: '' });
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
          <Link href={`/admin/products/${id}/edit`}>
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
          <Button onClick={() => setShowProductionDialog(true)}>
            <Factory className="h-4 w-4 mr-2" />
            Create Production
          </Button>
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
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-amber-800 dark:text-amber-200 font-medium">Low Stock Alert</h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="variants" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Variants
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Box className="w-4 h-4" />
            Materials & BOM
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Production
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProductDetailsCard 
            product={product} 
            onStockAdjust={() => openStockDialog()}
            onCreateProduction={() => setShowProductionDialog(true)}
          />
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          <VariantManagementSection
            product={product}
            onStockAdjust={openStockDialog}
            onRefresh={async () => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
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
                  <span className="text-lg font-semibold">{formatCurrencyPHP(product.unitCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Selling Price</span>
                  <span className="text-lg font-semibold">{formatCurrencyPHP(product.sellingPrice)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Profit Margin</span>
                  <span className="text-lg font-semibold text-green-600">
                    {(((product.sellingPrice - product.unitCost) / product.sellingPrice) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Variant Pricing Summary
                  </CardTitle>
                  <CardDescription>
                    Pricing overview across all variants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Lowest Cost</span>
                    <span className="text-lg font-semibold">
                      {formatCurrencyPHP(Math.min(...product.variants.map(v => v.unitCost)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Highest Price</span>
                    <span className="text-lg font-semibold">
                      {formatCurrencyPHP(Math.max(...product.variants.map(v => v.sellingPrice)))}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Average Margin</span>
                    <span className="text-lg font-semibold text-green-600">
                      {(product.variants.reduce((acc, v) => 
                        acc + (((v.sellingPrice - v.unitCost) / v.sellingPrice) * 100), 0
                      ) / product.variants.length).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Factory className="w-4 h-4" />
                  Production History
                </span>
                <Button onClick={() => setShowProductionDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Production Order
                </Button>
              </CardTitle>
              <CardDescription>
                View and manage production orders for {product.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {product.productionOrders && product.productionOrders.length > 0 ? (
                <div className="space-y-4">
                  {product.productionOrders.map((order: ProductionOrderSummary) => (
                    <Card key={order.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {order.quantity} units
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(order.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
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
                  <Link href={`/admin/production?productId=${id}`}>
                    <Button variant="outline" className="w-full">
                      View All Production Orders
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Factory className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No production orders found for this product.
                  </p>
                  <Button onClick={() => setShowProductionDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Production Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Adjust Stock Level
            </DialogTitle>
            <DialogDescription>
              {selectedVariant 
                ? `Adjust stock for ${selectedVariant.displayName}`
                : `Adjust stock for ${product.name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Current Stock</Label>
                <p className="text-lg font-semibold">
                  {selectedVariant ? selectedVariant.currentStock : product.currentStock}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Minimum Level</Label>
                <p className="text-lg font-semibold">
                  {selectedVariant ? selectedVariant.minimumStockLevel : product.minimumStockLevel}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Adjustment Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={stockAdjustment.type === 'ADD' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'ADD' }))}
                  className="w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Stock
                </Button>
                <Button
                  type="button"
                  variant={stockAdjustment.type === 'REMOVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'REMOVE' }))}
                  className="w-full"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  Remove Stock
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to {stockAdjustment.type === 'ADD' ? 'Add' : 'Remove'}</Label>
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
              <Label htmlFor="reason">Reason for Adjustment</Label>
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
                <Label className="text-sm font-medium">New Stock Level:</Label>
                <p className="text-lg font-semibold">
                  {stockAdjustment.type === 'ADD' 
                    ? (selectedVariant ? selectedVariant.currentStock : product.currentStock) + stockAdjustment.quantity
                    : (selectedVariant ? selectedVariant.currentStock : product.currentStock) - stockAdjustment.quantity
                  } units
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
