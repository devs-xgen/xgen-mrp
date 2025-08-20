"use client";

import { UseFormReturn } from "react-hook-form";
import { useState, useMemo } from "react";
import { Search, Package, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [variantFilter, setVariantFilter] = useState<string>("all");

  const productId = watch("productId");
  const selectedProduct = products.find((p) => p.id === productId);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category?.name).filter(Boolean))
    );
    return uniqueCategories.sort();
  }, [products]);

  // Enhanced filtering with multiple criteria
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Text search
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || product.category?.name === categoryFilter;

      // Variant filter
      const matchesVariant =
        variantFilter === "all" ||
        (variantFilter === "with-variants" && product.hasVariants) ||
        (variantFilter === "no-variants" && !product.hasVariants);

      return matchesSearch && matchesCategory && matchesVariant;
    });
  }, [products, searchTerm, categoryFilter, variantFilter]);

  const handleProductSelect = (product: (typeof products)[0]) => {
    setValue("productId", product.id);
    // Reset variant selection when product changes
    setValue("productVariantId", "");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setVariantFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Product</h3>
        <p className="text-muted-foreground">
          Choose the product you want to produce.
        </p>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="space-y-4">
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category-filter">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-filter">Variants</Label>
            <Select value={variantFilter} onValueChange={setVariantFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="with-variants">With Variants</SelectItem>
                <SelectItem value="no-variants">No Variants</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
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
      <div className="space-y-3 max-h-[500px] overflow-y-auto border rounded-lg p-2">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                productId === product.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
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
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium mb-2">
              No products found
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" || variantFilter !== "all"
                ? "Try adjusting your search criteria or filters"
                : "No products available"}
            </p>
            {(searchTerm ||
              categoryFilter !== "all" ||
              variantFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {errors.productId && (
        <p className="text-sm text-destructive">{errors.productId.message}</p>
      )}
    </div>
  );
}
