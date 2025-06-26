// src/components/module/admin/customer-orders/product-selection.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Package, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductWithVariantsForOrder, ProductVariantForOrder } from "@/types/admin/customer-order";

interface ProductSelectionProps {
  products: ProductWithVariantsForOrder[];
  value: string; // This will be either productId or variantId
  onValueChange: (value: string, isVariant: boolean, productId: string) => void;
  onPriceChange?: (productId: string, variantId: string | null, price: number) => void;
  placeholder?: string;
  emptyText?: string;
}

export function ProductSelection({
  products,
  value,
  onValueChange,
  onPriceChange,
  placeholder = "Select a product or variant",
  emptyText = "No products found",
}: ProductSelectionProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter products and variants based on search query
  const filteredData = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return products.map(product => {
      const productMatches = product.name.toLowerCase().includes(query) || 
                            product.sku.toLowerCase().includes(query);
      
      const matchingVariants = product.variants?.filter(variant =>
        variant.displayName.toLowerCase().includes(query) ||
        variant.sku.toLowerCase().includes(query) ||
        variant.sizeName?.toLowerCase().includes(query) ||
        variant.colorName?.toLowerCase().includes(query)
      ) || [];

      if (productMatches || matchingVariants.length > 0) {
        return {
          ...product,
          variants: matchingVariants,
          showProduct: productMatches,
        };
      }
      return null;
    }).filter(Boolean);
  }, [products, searchQuery]);

  // Handle selection (product or variant)
  const handleSelect = (id: string, isVariant: boolean, productId: string, price: number) => {
    onValueChange(id, isVariant, productId);
    if (onPriceChange) {
      onPriceChange(productId, isVariant ? id : null, price);
    }
    setOpen(false);
  };

  // Check if a product or variant is low in stock
  const isLowStock = (item: { currentStock?: number; minimumStockLevel?: number }) => {
    return (
      item.currentStock !== undefined &&
      item.minimumStockLevel !== undefined &&
      item.currentStock <= item.minimumStockLevel
    );
  };

  // Get display name for selected value
  const getSelectedDisplayName = () => {
    for (const product of products) {
      if (product.id === value) {
        return (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-medium">{product.name}</span>
              <span className="text-xs text-muted-foreground ml-2">({product.sku})</span>
            </div>
            <Badge variant={isLowStock(product) ? "destructive" : "secondary"} className="ml-2">
              {product.currentStock || 0} stock
            </Badge>
          </div>
        );
      }

      const variant = product.variants?.find(v => v.id === value);
      if (variant) {
        return (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Layers className="w-4 h-4 mr-2 text-green-600" />
              <span className="font-medium">{variant.displayName}</span>
              <span className="text-xs text-muted-foreground ml-2">({variant.sku})</span>
            </div>
            <Badge variant={isLowStock(variant) ? "destructive" : "secondary"} className="ml-2">
              {variant.currentStock} stock
            </Badge>
          </div>
        );
      }
    }
    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] p-3"
        >
          <div className="flex-1">
            {value ? getSelectedDisplayName() : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command>
          <CommandInput
            placeholder="Search by name, SKU, size, or color..."
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-[350px] overflow-y-auto">
            {filteredData.map((productData: any) => (
              <div key={productData.id}>
                {/* Base Product Option (only if product doesn't have variants) */}
                {!productData.hasVariants && (
                  <CommandItem
                    value={productData.id}
                    onSelect={() => handleSelect(productData.id, false, productData.id, productData.unitPrice)}
                    className="flex items-center justify-between py-3 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-3 text-blue-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">{productData.name}</span>
                        <span className="text-xs text-muted-foreground">SKU: {productData.sku}</span>
                      </div>
                      {value === productData.id && (
                        <Check className="ml-2 h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <Badge variant={isLowStock(productData) ? "destructive" : "secondary"}>
                      {productData.currentStock || 0} stock
                    </Badge>
                  </CommandItem>
                )}

                {/* Product Variants */}
                {productData.hasVariants && productData.variants && productData.variants.length > 0 && (
                  <>
                    {/* Product Header */}
                    <div className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border-l-4 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          <span>{productData.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({productData.sku})</span>
                        </div>
                        <Badge variant="outline" className="text-blue-700 border-blue-300">
                          {productData.variants.length} variants
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Variants List */}
                    {productData.variants.map((variant: ProductVariantForOrder) => (
                      <CommandItem
                        key={variant.id}
                        value={variant.id}
                        onSelect={() => handleSelect(variant.id, true, variant.productId, variant.unitPrice)}
                        className="flex items-center justify-between py-3 pl-6 cursor-pointer border-l-2 border-green-100"
                      >
                        <div className="flex items-center">
                          <Layers className="w-4 h-4 mr-3 text-green-600" />
                          <div className="flex flex-col">
                            <span className="font-medium">{variant.displayName}</span>
                            <div className="text-xs text-muted-foreground">
                              <span>SKU: {variant.sku}</span>
                              {variant.sizeName && (
                                <span className="ml-2">• Size: {variant.sizeName}</span>
                              )}
                              {variant.colorName && (
                                <span className="ml-2">• Color: {variant.colorName}</span>
                              )}
                            </div>
                          </div>
                          {value === variant.id && (
                            <Check className="ml-2 h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <Badge variant={isLowStock(variant) ? "destructive" : "secondary"}>
                          {variant.currentStock} stock
                        </Badge>
                      </CommandItem>
                    ))}
                    
                    <Separator className="my-1" />
                  </>
                )}
              </div>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
