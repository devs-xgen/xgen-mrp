// src/components/module/admin/products/product-details.tsx
"use client";

import { useState, useEffect } from "react";
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
import { ProductWithNumberValues } from "@/types/admin/product";
import { BOMSection } from "./bom/BOMSection";
import { getBOMForProduct } from "@/lib/actions/bom";
import { useToast } from "@/hooks/use-toast";
import { ProductBOM } from "@/types/admin/bom";
import { CURRENCY_SYMBOLS, CURRENCY_FORMATS } from "@/lib/constant";

interface ProductDetailsProps {
  product: ProductWithNumberValues;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [bomData, setBomData] = useState<ProductBOM | null>(null);
  const [isLoadingBom, setIsLoadingBom] = useState(false);
  const { toast } = useToast();

  // Function to fetch updated BOM data
  const fetchBOMData = async () => {
    try {
      setIsLoadingBom(true);
      const data = await getBOMForProduct(product.id);
      setBomData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bill of materials",
        variant: "destructive",
      });
      console.error("Error fetching BOM:", error);
    } finally {
      setIsLoadingBom(false);
    }
  };

  // Initial load of BOM data
  useEffect(() => {
    fetchBOMData();
  }, [product.id]);

  // Calculate profit margin
  const profitMargin =
    ((product.sellingPrice - product.unitCost) / product.sellingPrice) * 100;

  // Use BOM data from state or fallback to product.boms for total calculation
  const totalMaterialCost = bomData
    ? bomData.totalMaterialCost
    : product.boms?.reduce(
        (acc, bom) => acc + bom.material.costPerUnit * bom.quantityNeeded,
        0
      ) || 0;

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
        }).format(amount);
      };

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
        {/* Integrated BOM Section with the new component */}
        <BOMSection productId={product.id} productName={product.name} />
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
                <span className="font-medium">Unit Cost: </span>
                {formatCurrency(product.unitCost)}
              </div>
              <div>
                <span className="font-medium">Material Cost: </span>
                {formatCurrency(totalMaterialCost)}
              </div>
              {bomData && (
                <div className="text-xs text-muted-foreground">
                  Based on {bomData.entries.length} materials in BOM
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Selling Information</h4>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Selling Price: </span>
                {formatCurrency(product.sellingPrice)}
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
              {formatCurrency(product.sellingPrice - product.unitCost)}
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
