// src/components/module/admin/customer-orders/product-selection.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Info } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock?: number;
  minimumStockLevel?: number;
}

interface ProductSelectionProps {
  products: Product[];
  value: string;
  onValueChange: (value: string) => void;
  onPriceChange?: (productId: string, price: number) => void;
  placeholder?: string;
  emptyText?: string;
}

export function ProductSelection({
  products,
  value,
  onValueChange,
  onPriceChange,
  placeholder = "Select a product",
  emptyText = "No products found",
}: ProductSelectionProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // When a product is selected, also update the price if needed
  const handleSelect = (productId: string) => {
    onValueChange(productId);
    if (onPriceChange) {
      const selectedProduct = products.find((p) => p.id === productId);
      if (selectedProduct) {
        onPriceChange(productId, selectedProduct.unitPrice);
      }
    }
    setOpen(false);
  };

  // Check if a product is low in stock
  const isLowStock = (product: Product) => {
    return (
      product.currentStock !== undefined &&
      product.minimumStockLevel !== undefined &&
      product.currentStock <= product.minimumStockLevel
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <span className="flex items-center">
              {(() => {
                const selected = products.find(
                  (product) => product.id === value
                );
                if (selected) {
                  return (
                    <>
                      <span className="mr-2">{selected.name}</span>
                      <span className="text-xs text-muted-foreground mr-2">
                        ({selected.sku})
                      </span>
                      {isLowStock(selected) && (
                        <Badge variant="destructive" className="ml-auto">
                          Low Stock
                        </Badge>
                      )}
                    </>
                  );
                }
                return placeholder;
              })()}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search products..."
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={product.id}
                onSelect={() => handleSelect(product.id)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center">
                    <span>{product.name}</span>
                    {value === product.id && (
                      <Check className="ml-2 h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex text-xs text-muted-foreground mt-1">
                    <span>SKU: {product.sku}</span>
                    <span className="mx-2">|</span>
                    <span>Price: {formatCurrency(product.unitPrice)}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  {product.currentStock !== undefined && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={
                              isLowStock(product) ? "destructive" : "secondary"
                            }
                            className="mr-2"
                          >
                            {product.currentStock} in stock
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Minimum Stock: {product.minimumStockLevel}</p>
                          {isLowStock(product) && (
                            <p className="text-red-500">Low stock warning!</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
