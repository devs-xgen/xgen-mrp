"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createProduct } from "@/lib/actions/product";
import type { ProductCategory, Status } from "@prisma/client";

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  sku: string;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  currentStock: number;
  leadTime: number;
  status: Status;
  // Variant fields
  sizes: string[];
  colors: string[];
  hasVariants: boolean;
}

interface SimpleCreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  onSuccess: (product: any) => void;
}

export function SimpleCreateProductDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: SimpleCreateProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      sku: "",
      unitCost: 0,
      sellingPrice: 0,
      minimumStockLevel: 10,
      currentStock: 0,
      leadTime: 7,
      status: "ACTIVE" as Status,
      sizes: [],
      colors: [],
      hasVariants: false,
    },
  });

  const sizes = form.watch("sizes");
  const colors = form.watch("colors");
  const hasVariants = form.watch("hasVariants");

  const addSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
      form.setValue("sizes", [...sizes, sizeInput.trim()]);
      setSizeInput("");
    }
  };

  const removeSize = (size: string) => {
    form.setValue("sizes", sizes.filter(s => s !== size));
  };

  const addColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      form.setValue("colors", [...colors, colorInput.trim()]);
      setColorInput("");
    }
  };

  const removeColor = (color: string) => {
    form.setValue("colors", colors.filter(c => c !== color));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const productData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        sku: data.sku,
        unitCost: data.unitCost,
        sellingPrice: data.sellingPrice,
        minimumStockLevel: data.minimumStockLevel,
        currentStock: data.currentStock,
        leadTime: data.leadTime,
        status: data.status,
        hasVariants: data.hasVariants,
        sizeRange: data.sizes,
        colorOptions: data.colors,
      };

      const result = await createProduct(productData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Product "${data.name}" created successfully${
            data.hasVariants ? ` with ${data.sizes.length} sizes and ${data.colors.length} colors` : ""
          }`,
        });
        form.reset();
        onSuccess(result.data);
      } else {
        throw new Error(result.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Create product error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory. You can create variants with different sizes and colors.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Product Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Product name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Cotton T-Shirt" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  rules={{ required: "SKU is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., TSHIRT-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Product description..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pricing & Stock</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitCost"
                  rules={{ required: "Unit cost is required", min: { value: 0, message: "Must be positive" } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost (₱)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sellingPrice"
                  rules={{ required: "Selling price is required", min: { value: 0, message: "Must be positive" } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (₱)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimumStockLevel"
                  rules={{ required: "Minimum stock level is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock Level</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="leadTime"
                rules={{ required: "Lead time is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Time (days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Variants Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => form.setValue("hasVariants", e.target.checked)}
                  className="rounded"
                />
                <label className="text-lg font-medium">Create Product Variants</label>
              </div>

              {hasVariants && (
                <div className="grid grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50">
                  {/* Sizes */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Sizes</h4>
                    <div className="flex gap-2">
                      <Input
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        placeholder="e.g., XS, S, M, L, XL"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                      />
                      <Button type="button" onClick={addSize} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <Badge key={size} variant="secondary" className="cursor-pointer">
                          {size}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => removeSize(size)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Colors</h4>
                    <div className="flex gap-2">
                      <Input
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        placeholder="e.g., Red, Blue, Black"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                      />
                      <Button type="button" onClick={addColor} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <Badge key={color} variant="secondary" className="cursor-pointer">
                          {color}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => removeColor(color)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {hasVariants && sizes.length > 0 && colors.length > 0 && (
                    <div className="col-span-2 p-3 bg-blue-50 rounded border">
                      <p className="text-sm text-blue-700">
                        <strong>Variants to be created:</strong> {sizes.length} × {colors.length} = {sizes.length * colors.length} variants
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Each size/color combination will be created as a separate product variant.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 