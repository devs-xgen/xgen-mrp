// src/components/module/admin/products/product-details.tsx
"use client";

import { Status } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductWithNumberValues } from "@/types/admin/product";

interface ProductDetailsProps {
  product: ProductWithNumberValues;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  // Calculate total material cost - making sure to work with numbers
  const totalMaterialCost =
    product.boms?.reduce(
      (acc, bom) => acc + bom.material.costPerUnit * bom.quantityNeeded,
      0
    ) || 0;

  // Calculate profit margin
  const profitMargin =
    ((product.sellingPrice - product.unitCost) / product.sellingPrice) * 100;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="materials">Materials & BOM</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">SKU: </span>
                {product.sku}
              </div>
              <div>
                <span className="font-medium">Name: </span>
                {product.name}
              </div>
              <div>
                <span className="font-medium">Category: </span>
                {product.category?.name || "Uncategorized"}
              </div>
              <div>
                <span className="font-medium">Status: </span>
                <Badge
                  variant={
                    product.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {product.status.toLowerCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {product.description || "No description available"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Product Variants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Size Range</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.sizeRange.length > 0 ? (
                      product.sizeRange.map((size) => (
                        <Badge key={size} variant="outline">
                          {size}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No sizes specified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.colorOptions.length > 0 ? (
                      product.colorOptions.map((color) => (
                        <Badge key={color} variant="outline">
                          {color}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No colors specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="inventory">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
            <CardDescription>
              Current stock levels and inventory management information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-4">Stock Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Current Stock: </span>
                    {product.currentStock}
                  </div>
                  <div>
                    <span className="font-medium">Minimum Stock Level: </span>
                    {product.minimumStockLevel}
                  </div>
                  <div>
                    <span className="font-medium">Lead Time: </span>
                    {product.leadTime} days
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4">Stock Status</h4>
                <Badge
                  variant={
                    product.currentStock <= product.minimumStockLevel
                      ? "destructive"
                      : "default"
                  }
                >
                  {product.currentStock <= product.minimumStockLevel
                    ? "Low Stock"
                    : "In Stock"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="materials">
        <Card>
          <CardHeader>
            <CardTitle>Bill of Materials (BOM)</CardTitle>
            <CardDescription>
              Materials required for product manufacturing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {product.boms && product.boms.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">
                      Quantity Needed
                    </TableHead>
                    <TableHead className="text-right">Waste %</TableHead>
                    <TableHead className="text-right">Cost per Unit</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.boms.map((bom) => (
                    <TableRow key={bom.id}>
                      <TableCell>{bom.material.name}</TableCell>
                      <TableCell className="text-right">
                        {bom.quantityNeeded.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {bom.wastePercentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        ${bom.material.costPerUnit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {(
                          bom.material.costPerUnit * bom.quantityNeeded
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Total Material Cost
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${totalMaterialCost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No bill of materials found for this product.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pricing">
        <Card>
          <CardHeader>
            <CardTitle>Pricing Information</CardTitle>
            <CardDescription>Cost, price, and margin details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Cost Breakdown</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Unit Cost: </span>$
                      {product.unitCost.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Material Cost: </span>$
                      {totalMaterialCost.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Selling Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Selling Price: </span>$
                      {product.sellingPrice.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Profit Margin: </span>
                      {profitMargin.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
              <Card className="bg-muted">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Profit Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(product.sellingPrice - product.unitCost).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profit per unit
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
