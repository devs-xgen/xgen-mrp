"use client";

import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyPHP } from "@/lib/constant";

import type { ProductionCreateForm } from "@/lib/validation/production-create";

interface ProductStepProps {
  form: UseFormReturn<ProductionCreateForm>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    description?: string;
    sellingPrice: number;
    currentStock: number;
    hasVariants: boolean;
    category?: {
      name: string;
    };
    variants?: Array<{
      id: string;
      displayName: string;
      sku: string;
      currentStock: number;
    }>;
  }>;
}

export function ProductStep({ form, products }: ProductStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const [searchTerm, setSearchTerm] = useState("");

  const productId = watch("productId");
  const selectedProduct = products.find((p) => p.id === productId);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product: (typeof products)[0]) => {
    setValue("productId", product.id);
    // Reset variant selection when product changes
    setValue("productVariantId", "");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Product</h3>
        <p className="text-muted-foreground">
          Choose the product you want to produce.
        </p>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="search"
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Selected Product Display */}
      {selectedProduct && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-900">
                  {selectedProduct.name}
                </div>
                <div className="text-sm text-blue-700">
                  SKU: {selectedProduct.sku}
                </div>
                {selectedProduct.category && (
                  <Badge
                    variant="outline"
                    className="mt-1 text-blue-700 border-blue-300"
                  >
                    {selectedProduct.category.name}
                  </Badge>
                )}
              </div>
              <div className="text-right text-blue-900">
                <div className="font-medium">
                  {formatCurrencyPHP(selectedProduct.sellingPrice)}
                </div>
                <div className="text-sm">
                  Stock: {selectedProduct.currentStock}
                </div>
                {selectedProduct.hasVariants && (
                  <Badge className="mt-1 bg-blue-600">Has Variants</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              productId === product.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => handleProductSelect(product)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </div>
                  {product.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {product.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category.name}
                      </Badge>
                    )}
                    {product.hasVariants && (
                      <Badge variant="secondary" className="text-xs">
                        {product.variants?.length || 0} variants
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrencyPHP(product.sellingPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stock: {product.currentStock}
                  </div>
                  {product.currentStock <= 10 && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No products found matching "{searchTerm}"
          </p>
        </div>
      )}

      {errors.productId && (
        <p className="text-sm text-destructive">{errors.productId.message}</p>
      )}
    </div>
  );
}
