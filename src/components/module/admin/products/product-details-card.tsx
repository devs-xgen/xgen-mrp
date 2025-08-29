// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { 
//   Package, 
//   Palette, 
//   Ruler, 
//   Factory, 
//   Plus, 
//   History, 
//   Edit,
//   Eye,
//   Calendar,
//   TrendingUp,
//   AlertCircle,
//   CheckCircle,
//   Clock
// } from "lucide-react";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import { ProductWithNumberValues, ProductionOrderSummary } from "@/types/admin/product";
// import { formatCurrencyPHP } from "@/lib/constant";
// import { useRouter } from "next/navigation";

// interface ProductDetailsCardProps {
//   product: ProductWithNumberValues;
//   onStockAdjust: () => void;
//   onCreateProduction: () => void;
// }

// export function ProductDetailsCard({ 
//   product, 
//   onStockAdjust, 
//   onCreateProduction 
// }: ProductDetailsCardProps) {
//   const router = useRouter();

//   const getStockStatus = (current: number, minimum: number) => {
//     if (current === 0) return { 
//       label: 'Out of Stock', 
//       color: 'text-red-600', 
//       bgColor: 'bg-red-50 border-red-200',
//       icon: AlertCircle,
//       variant: 'destructive' as const 
//     };
//     if (current <= minimum) return { 
//       label: 'Low Stock', 
//       color: 'text-yellow-600', 
//       bgColor: 'bg-yellow-50 border-yellow-200',
//       icon: AlertCircle,
//       variant: 'secondary' as const 
//     };
//     return { 
//       label: 'In Stock', 
//       color: 'text-green-600', 
//       bgColor: 'bg-green-50 border-green-200',
//       icon: CheckCircle,
//       variant: 'default' as const 
//     };
//   };

//   const stockStatus = getStockStatus(product.currentStock, product.minimumStockLevel);
//   const StatusIcon = stockStatus.icon;

//   return (
//     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//       {/* Basic Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Package className="w-4 h-4" />
//             Product Information
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label className="text-xs font-medium text-muted-foreground">Status</Label>
//               <div className="mt-1">
//                 <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
//                   {product.status.toLowerCase()}
//                 </Badge>
//               </div>
//             </div>
//             <div>
//               <Label className="text-xs font-medium text-muted-foreground">Lead Time</Label>
//               <p className="text-sm font-medium flex items-center gap-1 mt-1">
//                 <Clock className="w-3 h-3" />
//                 {product.leadTime} days
//               </p>
//             </div>
//           </div>

//           <Separator />

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label className="text-xs font-medium text-muted-foreground">Has Variants</Label>
//               <div className="mt-1">
//                 <Badge variant={product.hasVariants ? "default" : "outline"}>
//                   {product.hasVariants ? "Yes" : "No"}
//                 </Badge>
//               </div>
//             </div>
//             <div>
//               <Label className="text-xs font-medium text-muted-foreground">Category</Label>
//               <p className="text-sm font-medium mt-1">
//                 {product.category?.name || "Uncategorized"}
//               </p>
//             </div>
//           </div>

//           {product.description && (
//             <>
//               <Separator />
//               <div>
//                 <Label className="text-xs font-medium text-muted-foreground">Description</Label>
//                 <p className="text-sm mt-1 text-muted-foreground">
//                   {product.description}
//                 </p>
//               </div>
//             </>
//           )}
//         </CardContent>
//       </Card>

//       {/* Stock Information */}
//       <Card className={stockStatus.bgColor}>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Package className="w-4 h-4" />
//             Stock Management
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <Label className="text-xs font-medium text-muted-foreground">Stock Status</Label>
//               <div className="flex items-center gap-2 mt-1">
//                 <StatusIcon className={`w-4 h-4 ${stockStatus.color}`} />
//                 <Badge variant={stockStatus.variant}>
//                   {stockStatus.label}
//                 </Badge>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label className="text-xs font-medium text-muted-foreground">Current Stock</Label>
//               <p className="text-xl font-bold mt-1">{product.currentStock}</p>
//             </div>
//             <div>
//               <Label className="text-xs font-medium text-muted-foreground">Min Level</Label>
//               <p className="text-xl font-bold mt-1">{product.minimumStockLevel}</p>
//             </div>
//           </div>

//           <Separator />

//           <div className="space-y-2">
//             <Button 
//               variant="outline" 
//               size="sm" 
//               className="w-full"
//               onClick={onStockAdjust}
//             >
//               <Edit className="w-4 h-4 mr-2" />
//               Adjust Stock Level
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Pricing Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <TrendingUp className="w-4 h-4" />
//             Pricing Details
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-3">
//             <div className="flex justify-between items-center">
//               <Label className="text-xs font-medium text-muted-foreground">Unit Cost</Label>
//               <span className="text-sm font-semibold">{formatCurrencyPHP(product.unitCost)}</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <Label className="text-xs font-medium text-muted-foreground">Selling Price</Label>
//               <span className="text-sm font-semibold">{formatCurrencyPHP(product.sellingPrice)}</span>
//             </div>
//           </div>

//           <Separator />

//           <div className="flex justify-between items-center">
//             <Label className="text-xs font-medium text-muted-foreground">Profit Margin</Label>
//             <span className="text-sm font-semibold text-green-600">
//               {(((product.sellingPrice - product.unitCost) / product.sellingPrice) * 100).toFixed(1)}%
//             </span>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Quick Actions */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Factory className="w-4 h-4" />
//             Quick Actions
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-2">
//           <Button 
//             variant="default" 
//             size="sm" 
//             className="w-full justify-start"
//             onClick={onCreateProduction}
//           >
//             <Factory className="w-4 h-4 mr-2" />
//             Create Production Order
//           </Button>
          
//           <Sheet>
//             <SheetTrigger asChild>
//               <Button variant="outline" size="sm" className="w-full justify-start">
//                 <History className="w-4 h-4 mr-2" />
//                 Production History
//               </Button>
//             </SheetTrigger>
//             <SheetContent className="w-[400px] sm:w-[540px]">
//               <SheetHeader>
//                 <SheetTitle>Production History</SheetTitle>
//                 <SheetDescription>
//                   View all production orders for {product.name}
//                 </SheetDescription>
//               </SheetHeader>
//               <div className="mt-6 space-y-4">
//                 {product.productionOrders && product.productionOrders.length > 0 ? (
//                   <>
//                     {product.productionOrders.map((order: ProductionOrderSummary) => (
//                       <Card key={order.id}>
//                         <CardContent className="pt-4">
//                           <div className="flex justify-between items-start">
//                             <div className="space-y-1">
//                               <p className="font-medium">Order #{order.id.slice(-8)}</p>
//                               <p className="text-sm text-muted-foreground flex items-center gap-1">
//                                 <Package className="w-3 h-3" />
//                                 Quantity: {order.quantity}
//                               </p>
//                               <p className="text-sm text-muted-foreground flex items-center gap-1">
//                                 <Calendar className="w-3 h-3" />
//                                 Due: {new Date(order.dueDate).toLocaleDateString()}
//                               </p>
//                             </div>
//                             <div className="flex flex-col gap-2">
//                               <Badge variant="outline">{order.status}</Badge>
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => router.push(`/admin/production/${order.id}`)}
//                               >
//                                 <Eye className="w-3 h-3 mr-1" />
//                                 View
//                               </Button>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))}
//                     <Link href={`/admin/production?productId=${product.id}`}>
//                       <Button variant="outline" className="w-full">
//                         <Eye className="w-4 h-4 mr-2" />
//                         View All Production Orders
//                       </Button>
//                     </Link>
//                   </>
//                 ) : (
//                   <div className="text-center py-8">
//                     <Factory className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//                     <p className="text-muted-foreground mb-4">
//                       No production orders found for this product.
//                     </p>
//                     <Button onClick={onCreateProduction} className="w-full">
//                       <Plus className="w-4 h-4 mr-2" />
//                       Create First Production Order
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </SheetContent>
//           </Sheet>
//         </CardContent>
//       </Card>

//       {/* Legacy Options Display (for non-variant products) */}
//       {!product.hasVariants && (product.sizeRange.length > 0 || product.colorOptions.length > 0) && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Palette className="w-4 h-4" />
//               Product Options
//             </CardTitle>
//             <CardDescription>
//               Available sizes and colors for this product
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {product.sizeRange.length > 0 && (
//               <div>
//                 <Label className="text-xs font-medium text-muted-foreground">Size Range</Label>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {product.sizeRange.map((size) => (
//                     <Badge key={size} variant="outline" className="flex items-center gap-1">
//                       <Ruler className="w-3 h-3" />
//                       {size}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//             )}
//             {product.colorOptions.length > 0 && (
//               <div>
//                 <Label className="text-xs font-medium text-muted-foreground">Color Options</Label>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {product.colorOptions.map((color) => (
//                     <Badge key={color} variant="outline" className="flex items-center gap-1">
//                       <Palette className="w-3 h-3" />
//                       {color}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Palette, 
  Ruler, 
  Factory, 
  Plus, 
  History, 
  Edit,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductWithNumberValues, ProductionOrderSummary } from "@/types/admin/product";
import { formatCurrencyPHP } from "@/lib/constant";
import { useRouter } from "next/navigation";

interface ProductDetailsCardProps {
  product: ProductWithNumberValues;
  onStockAdjust: () => void;
  onCreateProduction: () => void;
}

// Extending the ProductWithNumberValues type to include a variants array for the new logic
interface ProductWithVariants extends ProductWithNumberValues {
  variants?: {
    id: string;
    name: string;
    currentStock: number;
  }[];
}

export function ProductDetailsCard({ 
  product, 
  onStockAdjust, 
  onCreateProduction 
}: ProductDetailsCardProps) {
  const router = useRouter();

  // Determine the total stock. If the product has variants, sum their stocks. Otherwise, use the product's current stock.
  const totalStock = product.hasVariants && product.variants
    ? product.variants.reduce((sum, variant) => sum + variant.currentStock, 0)
    : product.currentStock;

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { 
      label: 'Out of Stock', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50 border-red-200',
      icon: AlertCircle,
      variant: 'destructive' as const 
    };
    if (current <= minimum) return { 
      label: 'Low Stock', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: AlertCircle,
      variant: 'secondary' as const 
    };
    return { 
      label: 'In Stock', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50 border-green-200',
      icon: CheckCircle,
      variant: 'default' as const 
    };
  };

  const stockStatus = getStockStatus(product.currentStock, product.minimumStockLevel);
  const StatusIcon = stockStatus.icon;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                  {product.status.toLowerCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Lead Time</Label>
              <p className="text-sm font-medium flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {product.leadTime} days
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Has Variants</Label>
              <div className="mt-1">
                <Badge variant={product.hasVariants ? "default" : "outline"}>
                  {product.hasVariants ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Category</Label>
              <p className="text-sm font-medium mt-1">
                {product.category?.name || "Uncategorized"}
              </p>
            </div>
          </div>

          {product.description && (
            <>
              <Separator />
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 text-muted-foreground">
                  {product.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stock Information */}
      <Card className={stockStatus.bgColor}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Stock Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Stock Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <StatusIcon className={`w-4 h-4 ${stockStatus.color}`} />
                <Badge variant={stockStatus.variant}>
                  {stockStatus.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Current Stock</Label>
              <p className="text-xl font-bold mt-1">{product.currentStock + totalStock}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Min Level</Label>
              <p className="text-xl font-bold mt-1">{product.minimumStockLevel}</p>
            </div>
          </div>

          <Separator />
          
          {/* Display variant breakdown if they exist */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Stock Breakdown</Label>
              <div className="space-y-1">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{variant.name}</span>
                    <span className="font-semibold">{variant.currentStock}</span>
                  </div>
                ))}
              </div>
              <Separator />
            </div>
          )}

          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onStockAdjust}
            >
              <Edit className="w-4 h-4 mr-2" />
              Adjust Stock Level
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Pricing Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium text-muted-foreground">Unit Cost</Label>
              <span className="text-sm font-semibold">{formatCurrencyPHP(product.unitCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium text-muted-foreground">Selling Price</Label>
              <span className="text-sm font-semibold">{formatCurrencyPHP(product.sellingPrice)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium text-muted-foreground">Profit Margin</Label>
            <span className="text-sm font-semibold text-green-600">
              {(((product.sellingPrice - product.unitCost) / product.sellingPrice) * 100).toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full justify-start"
            onClick={onCreateProduction}
          >
            <Factory className="w-4 h-4 mr-2" />
            Create Production Order
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
                            <div className="space-y-1">
                              <p className="font-medium">Order #{order.id.slice(-8)}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                Quantity: {order.quantity}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
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
                    <Link href={`/admin/production?productId=${product.id}`}>
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View All Production Orders
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Factory className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No production orders found for this product.
                    </p>
                    <Button onClick={onCreateProduction} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Production Order
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      {/* Legacy Options Display (for non-variant products) */}
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
                <Label className="text-xs font-medium text-muted-foreground">Size Range</Label>
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
                <Label className="text-xs font-medium text-muted-foreground">Color Options</Label>
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
    </div>
  );
}
