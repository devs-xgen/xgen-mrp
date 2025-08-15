"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyPHP } from "@/lib/constant";

import type { ProductionCreateForm } from "@/lib/validation/production-create";

interface VariantStepProps {
  form: UseFormReturn<ProductionCreateForm>;
  selectedProduct?: {
    id: string;
    name: string;
    hasVariants: boolean;
    variants?: Array<{
      id: string;
      displayName: string;
      sku: string;
      sizeName?: string;
      colorName?: string;
      unitPrice: number;
      currentStock: number;
      minimumStockLevel: number;
    }>;
  };
}

export function VariantStep({ form, selectedProduct }: VariantStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;

  const productVariantId = watch("productVariantId");

  if (
    !selectedProduct?.hasVariants ||
    !selectedProduct.variants ||
    selectedProduct.variants.length === 0
  ) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          This product does not have variants.
        </p>
      </div>
    );
  }

  // All variants returned from server are already active (filtered in server action)
  const availableVariants = selectedProduct.variants;
  const selectedVariant = availableVariants.find(
    (v) => v.id === productVariantId
  );

  const handleVariantSelect = (variant: (typeof availableVariants)[0]) => {
    setValue("productVariantId", variant.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Product Variant</h3>
        <p className="text-muted-foreground">
          Choose the specific variant of <strong>{selectedProduct.name}</strong>{" "}
          to produce.
        </p>
      </div>

      {/* Selected Variant Display */}
      {selectedVariant && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-900">
                  {selectedVariant.displayName}
                </div>
                <div className="text-sm text-blue-700">
                  SKU: {selectedVariant.sku}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {selectedVariant.sizeName && (
                    <Badge
                      variant="outline"
                      className="text-blue-700 border-blue-300"
                    >
                      Size: {selectedVariant.sizeName}
                    </Badge>
                  )}
                  {selectedVariant.colorName && (
                    <Badge
                      variant="outline"
                      className="text-blue-700 border-blue-300"
                    >
                      Color: {selectedVariant.colorName}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-blue-900">
                <div className="font-medium">
                  {formatCurrencyPHP(selectedVariant.unitPrice)}
                </div>
                <div className="text-sm">
                  Stock: {selectedVariant.currentStock}
                </div>
                {selectedVariant.currentStock <=
                  selectedVariant.minimumStockLevel && (
                  <Badge variant="destructive" className="mt-1">
                    Low Stock
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variant List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {availableVariants.map((variant) => (
          <Card
            key={variant.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              productVariantId === variant.id
                ? "ring-2 ring-blue-500 bg-blue-50"
                : ""
            }`}
            onClick={() => handleVariantSelect(variant)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{variant.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {variant.sku}
                  </div>
                  <div className="flex items-center gap-2">
                    {variant.sizeName && (
                      <Badge variant="outline" className="text-xs">
                        Size: {variant.sizeName}
                      </Badge>
                    )}
                    {variant.colorName && (
                      <Badge variant="outline" className="text-xs">
                        Color: {variant.colorName}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrencyPHP(variant.unitPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stock: {variant.currentStock}
                  </div>
                  {variant.currentStock <= variant.minimumStockLevel && (
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

      {availableVariants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No variants available for this product.
          </p>
        </div>
      )}

      {errors.productVariantId && (
        <p className="text-sm text-destructive">
          {errors.productVariantId.message}
        </p>
      )}
    </div>
  );
}
