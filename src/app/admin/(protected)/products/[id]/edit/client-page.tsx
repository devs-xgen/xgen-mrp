// src/app/admin/(protected)/products/[id]/edit/client-page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ProductCategory } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

interface ProductEditClientPageProps {
  product: any;
  categories: ProductCategory[];
  onSubmit: (data: Partial<{
    name: string;
    sku: string;
    description: string;
    categoryId: string;
    sizeRange: string[];
    colorOptions: string[];
    unitCost: number;
    sellingPrice: number;
    minimumStockLevel: number;
    leadTime: number;
    status: string;
  }>) => Promise<any>;
}

export default function ProductEditClientPage({ product, categories, onSubmit }: ProductEditClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    unitCost: Number(product?.unitCost ?? 0),
    sellingPrice: Number(product?.sellingPrice ?? 0),
    minimumStockLevel: Number(product?.minimumStockLevel ?? 0),
    leadTime: Number(product?.leadTime ?? 0),
  });

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await onSubmit({
        name: form.name,
        sku: form.sku,
        description: form.description,
        categoryId: form.categoryId,
        unitCost: Number(form.unitCost),
        sellingPrice: Number(form.sellingPrice),
        minimumStockLevel: Number(form.minimumStockLevel),
        leadTime: Number(form.leadTime),
      });

      if (res?.success) {
        toast({ title: "Product updated", description: "Changes saved successfully." });
        router.push(`/admin/products/${product.id}`);
        router.refresh();
      } else {
        toast({ title: "Update failed", description: res?.error ?? "Unable to update product.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => handleChange("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input id="unitCost" type="number" step="0.01" value={form.unitCost} onChange={(e) => handleChange("unitCost", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input id="sellingPrice" type="number" step="0.01" value={form.sellingPrice} onChange={(e) => handleChange("sellingPrice", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumStockLevel">Minimum Stock Level</Label>
              <Input id="minimumStockLevel" type="number" value={form.minimumStockLevel} onChange={(e) => handleChange("minimumStockLevel", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadTime">Lead Time (days)</Label>
              <Input id="leadTime" type="number" value={form.leadTime} onChange={(e) => handleChange("leadTime", e.target.value)} />
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
