// src/app/admin/(protected)/products/[id]/client-page.tsx
"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, TrendingUp, AlertTriangle, Factory, Plus, Minus, History, Edit, Eye, PieChart, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateProductionDialog } from "@/components/module/admin/products/create-production-dialog";
import { EnhancedVariantBOMSection } from "@/components/module/admin/products/bom/EnhancedVariantBOMSection";
import { VariantCreationDialog } from "@/components/module/admin/products/variant-creation-dialog";
import { ProductDetailsCard } from "@/components/module/admin/products/product-details-card";
import { VariantManagementSection } from "@/components/module/admin/products/variant-management-section";
import { StockAdjustmentDialog } from "@/components/module/admin/products/stock-adjustment-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyPHP } from "@/lib/constant";
import {
  ProductionOrderSummary,
  ProductWithNumberValues,
} from "@/types/admin/product";
import { EditProductDialog } from "@/components/module/admin/products/edit-product-dialog";
import { ProductCategory } from "@prisma/client";

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



export default function ProductDetailClientPage({
  id,
  product,
  workCenters,
}: ProductDetailClientPageProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showProductionDialog, setShowProductionDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);



  useEffect(() => {
    async function fetchCategories() {
      const response = await fetch('/api/categories'); // Adjust endpoint
      const data = await response.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

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



  const openStockDialog = (variant?: any) => {
    setSelectedVariant(variant);
    setShowStockDialog(true);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Enhanced Responsive Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left side - Back button and Product Info */}
        <div className="flex flex-col gap-3 min-w-0 flex-1">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm" className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{product.name}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              <span className="font-medium">SKU:</span> {product.sku}
            </p>
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">Category:</span> {product.category?.name || "Uncategorized"}
            </p>
          </div>
        </div>

        {/* Right side - Action Buttons (Responsive) */}
        <div className="flex items-center gap-2">
          {/* Desktop: Show individual buttons */}
          <div className="hidden md:flex gap-2">
            {/* <Link href={`/admin/products/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            </Link> */}
             <EditProductDialog
                product={product}
                categories={categories}
                onSuccess={async () => router.refresh()}
                trigger={
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </Button>
                }
              />
            <Button size="sm" onClick={() => setShowProductionDialog(true)}>
              <Factory className="h-4 w-4 mr-2" />
              Create Production
            </Button>
          </div>

          {/* Mobile/Tablet: Show dropdown menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push(`/admin/products/${id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProductionDialog(true)}>
                  <Factory className="h-4 w-4 mr-2" />
                  Create Production
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openStockDialog()}>
                  <Package className="h-4 w-4 mr-2" />
                  Adjust Stock
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Hidden CreateProductionDialog component */}
      <CreateProductionDialog
        product={product}
        workCenters={workCenters}
        open={showProductionDialog}
        onOpenChange={setShowProductionDialog}
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto p-1">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger 
            value="variants" 
            className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="hidden sm:inline">Variants</span>
            <span className="sm:hidden">Variants</span>
          </TabsTrigger>
          <TabsTrigger 
            value="materials" 
            className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="hidden sm:inline">Materials & BOM</span>
            <span className="sm:hidden">BOM</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pricing" 
            className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground hidden md:flex"
          >
            Pricing
          </TabsTrigger>
          <TabsTrigger 
            value="production" 
            className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground hidden md:flex"
          >
            Production
          </TabsTrigger>
        </TabsList>

        {/* Mobile Additional Tabs - Show on smaller screens */}
        <div className="md:hidden mt-2">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger 
              value="pricing" 
              className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Pricing
            </TabsTrigger>
            <TabsTrigger 
              value="production" 
              className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Production
            </TabsTrigger>
          </TabsList>
        </div>

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
      <StockAdjustmentDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        product={selectedVariant ? undefined : {
          id: product.id,
          name: product.name,
          currentStock: product.currentStock,
          minimumStockLevel: product.minimumStockLevel
        }}
        variant={selectedVariant ? {
          id: selectedVariant.id,
          displayName: selectedVariant.displayName,
          currentStock: selectedVariant.currentStock,
          minimumStockLevel: selectedVariant.minimumStockLevel
        } : undefined}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
