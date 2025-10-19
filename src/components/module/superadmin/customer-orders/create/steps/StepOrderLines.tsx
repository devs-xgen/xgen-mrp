"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StepOrderLinesProps {
  form: UseFormReturn<any>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    currentStock: number;
    variants: Array<{
      id: string;
      displayName: string;
      sku: string;
      sellingPrice: number;
      currentStock: number;
    }>;
  }>;
}

export function StepOrderLines({ form, products }: StepOrderLinesProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  const orderLines = form.watch("orderLines") || [];
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddLine = () => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    let unitPrice = product.sellingPrice;
    if (selectedVariantId) {
      const variant = product.variants.find((v) => v.id === selectedVariantId);
      if (variant) unitPrice = variant.sellingPrice;
    }

    if (customPrice !== null && customPrice >= 0) {
      unitPrice = customPrice;
    }

    const newLine = {
      productId: selectedProductId,
      productVariantId: selectedVariantId || undefined,
      quantity,
      unitPrice,
    };

    form.setValue("orderLines", [...orderLines, newLine]);

    // Reset form
    setSelectedProductId("");
    setSelectedVariantId("");
    setQuantity(1);
    setCustomPrice(null);
  };

  const handleRemoveLine = (index: number) => {
    const updated = orderLines.filter((_: any, i: number) => i !== index);
    form.setValue("orderLines", updated);
  };

  const getProductName = (line: any) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return "Unknown Product";

    if (line.productVariantId) {
      const variant = product.variants.find((v) => v.id === line.productVariantId);
      return `${product.name} - ${variant?.displayName || "Unknown Variant"}`;
    }

    return product.name;
  };

  const totalAmount = orderLines.reduce(
    (sum: number, line: any) => sum + line.quantity * line.unitPrice,
    0
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Add Order Lines
          </CardTitle>
          <CardDescription>
            Add products and variants to this customer order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <Select value={selectedProductId} onValueChange={(value) => {
                setSelectedProductId(value);
                setSelectedVariantId("");
                const prod = products.find(p => p.id === value);
                if (prod) {
                  setCustomPrice(prod.sellingPrice);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && selectedProduct.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Variant (Optional)</label>
                <Select value={selectedVariantId} onValueChange={(value) => {
                  setSelectedVariantId(value);
                  const variant = selectedProduct.variants.find(v => v.id === value);
                  if (variant) {
                    setCustomPrice(variant.sellingPrice);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="No variant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No variant</SelectItem>
                    {selectedProduct.variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.displayName} ({variant.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price (Override)</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={customPrice ?? ""}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                placeholder="Default selling price"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddLine}
            disabled={!selectedProductId}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Line
          </Button>
        </CardContent>
      </Card>

      {orderLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Lines ({orderLines.length})</CardTitle>
            <CardDescription>
              Total: ${totalAmount.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderLines.map((line: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {getProductName(line)}
                      </TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${line.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(line.quantity * line.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {orderLines.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No order lines added yet</p>
            <p className="text-sm text-muted-foreground">Add products above to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
