// src/app/share/products/[token]/product-share-view.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Grid, Tag, Info, Calendar, Shield } from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";

interface ProductShareViewProps {
  product: any;
  shareableLink: any;
}

export function ProductShareView({ product, shareableLink }: ProductShareViewProps) {
  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Product Information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Product Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Product Details
              </CardTitle>
              <CardDescription>Essential product information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="text-lg font-semibold">{product.sku}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-lg font-semibold">
                    {product.category?.name || "Uncategorized"}
                  </p>
                </div>
              </div>

              {product.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                    <p className="text-base text-gray-700 dark:text-gray-300">
                      {product.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Pricing Information
              </CardTitle>
              <CardDescription>Product pricing details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Selling Price</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrencyPHP(Number(product.sellingPrice))}
                  </p>
                </div>
                {product.unitCost > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Unit Cost</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                      {formatCurrencyPHP(Number(product.unitCost))}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Variants Card (if product has variants) */}
          {hasVariants && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="w-5 h-5" />
                  Product Variants
                </CardTitle>
                <CardDescription>
                  This product has {product.variants.length} variant(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.variants.map((variant: any) => (
                    <div
                      key={variant.id}
                      className="p-4 border rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{variant.displayName}</h4>
                          <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>
                          {variant.attributeValues && variant.attributeValues.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {variant.attributeValues.map((av: any) => (
                                <Badge key={av.id} variant="outline" className="text-xs">
                                  {av.attribute.name}: {av.value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrencyPHP(Number(variant.sellingPrice))}
                          </p>
                          {variant.unitCost > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Cost: {formatCurrencyPHP(Number(variant.unitCost))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Share Info Footer */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure shared link</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Expires: {new Date(shareableLink.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Views: {shareableLink.accessCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-muted-foreground">
          <p>This is a shared product view. Some information may be limited.</p>
          <p className="mt-1">Powered by XGEN MRP System</p>
        </div>
      </div>
    </div>
  );
}
