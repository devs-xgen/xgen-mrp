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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Plus, 
  Package, 
  DollarSign, 
  Palette, 
  Ruler, 
  Info,
  Sparkles,
  ShoppingCart,
  Tag
} from "lucide-react";
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
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim().toUpperCase())) {
      form.setValue("sizes", [...sizes, sizeInput.trim().toUpperCase()]);
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

  const addPredefinedSizes = (sizeSet: string[]) => {
    const newSizes = [...new Set([...sizes, ...sizeSet])];
    form.setValue("sizes", newSizes);
  };

  const addPredefinedColors = (colorSet: string[]) => {
    const newColors = [...new Set([...colors, ...colorSet])];
    form.setValue("colors", newColors);
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Create New Product
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Add a new product to your inventory with optional size and color variants
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing & Stock
                    </TabsTrigger>
                    <TabsTrigger value="variants" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Variants
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Product Information
                        </CardTitle>
                        <CardDescription>
                          Enter the basic details about your product
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            rules={{ required: "Product name is required" }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="e.g., Premium Cotton T-Shirt" 
                                    className="h-11"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Choose a clear, descriptive name for your product
                                </FormDescription>
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
                                <FormLabel>SKU (Stock Keeping Unit) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="e.g., TSHIRT-COTTON-001" 
                                    className="h-11"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Unique identifier for inventory tracking
                                </FormDescription>
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
                                <Textarea 
                                  {...field} 
                                  placeholder="Describe your product features, materials, and benefits..."
                                  className="min-h-[100px] resize-none"
                                />
                              </FormControl>
                              <FormDescription>
                                Provide detailed information about the product
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="categoryId"
                            rules={{ required: "Category is required" }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Category *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue placeholder="Select a category" />
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
                                <FormDescription>
                                  Choose the appropriate product category
                                </FormDescription>
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
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ACTIVE">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Active
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="INACTIVE">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        Inactive
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Set product availability status
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Pricing Information
                        </CardTitle>
                        <CardDescription>
                          Set the cost and selling price for your product
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="unitCost"
                            rules={{ required: "Unit cost is required", min: { value: 0, message: "Must be positive" } }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit Cost (₱) *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      {...field} 
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="pl-10 h-11"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Cost to produce or purchase this product
                                </FormDescription>
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
                                <FormLabel>Selling Price (₱) *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      {...field} 
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="pl-10 h-11"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Price at which you'll sell this product
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          Inventory Management
                        </CardTitle>
                        <CardDescription>
                          Configure stock levels and lead times
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    className="h-11"
                                    placeholder="0"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Starting inventory quantity
                                </FormDescription>
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
                                <FormLabel>Minimum Stock *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="h-11"
                                    placeholder="10"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Reorder alert threshold
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="leadTime"
                            rules={{ required: "Lead time is required" }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lead Time (days) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="h-11"
                                    placeholder="7"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Days to restock/produce
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="variants" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5" />
                              Product Variants
                            </CardTitle>
                            <CardDescription>
                              Create multiple variations of your product with different sizes and colors
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FormField
                              control={form.control}
                              name="hasVariants"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium">
                                    Enable Variants
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CardHeader>

                      {hasVariants && (
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sizes Section */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Ruler className="h-5 w-5 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">Size Variants</h4>
                              </div>
                              
                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex gap-2 mb-3">
                                  <Input
                                    value={sizeInput}
                                    onChange={(e) => setSizeInput(e.target.value)}
                                    placeholder="Enter size (e.g., XS, S, M, L, XL)"
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                                    className="flex-1"
                                  />
                                  <Button 
                                    type="button" 
                                    onClick={addSize} 
                                    size="sm"
                                    className="px-3"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div className="text-xs text-gray-600 mb-2">Quick Add:</div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addPredefinedSizes(["XS", "S", "M", "L", "XL", "XXL"])}
                                      className="text-xs"
                                    >
                                      Clothing Sizes
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addPredefinedSizes(["28", "30", "32", "34", "36", "38"])}
                                      className="text-xs"
                                    >
                                      Waist Sizes
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addPredefinedSizes(["6", "7", "8", "9", "10", "11", "12"])}
                                      className="text-xs"
                                    >
                                      Shoe Sizes
                                    </Button>
                                  </div>
                                </div>

                                {sizes.length > 0 && (
                                  <div className="mt-4">
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                      Selected Sizes ({sizes.length}):
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {sizes.map((size) => (
                                        <Badge 
                                          key={size} 
                                          variant="secondary" 
                                          className="cursor-pointer hover:bg-red-100 transition-colors"
                                        >
                                          {size}
                                          <X 
                                            className="h-3 w-3 ml-1 hover:text-red-600" 
                                            onClick={() => removeSize(size)}
                                          />
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Colors Section */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Palette className="h-5 w-5 text-purple-600" />
                                <h4 className="font-semibold text-gray-900">Color Variants</h4>
                              </div>
                              
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex gap-2 mb-3">
                                  <Input
                                    value={colorInput}
                                    onChange={(e) => setColorInput(e.target.value)}
                                    placeholder="Enter color (e.g., Red, Blue, Black)"
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                                    className="flex-1"
                                  />
                                  <Button 
                                    type="button" 
                                    onClick={addColor} 
                                    size="sm"
                                    className="px-3"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div className="text-xs text-gray-600 mb-2">Quick Add:</div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addPredefinedColors(["Black", "White", "Gray", "Navy"])}
                                      className="text-xs"
                                    >
                                      Basic Colors
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addPredefinedColors(["Red", "Blue", "Green", "Yellow", "Orange", "Purple"])}
                                      className="text-xs"
                                    >
                                      Bright Colors
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addPredefinedColors(["Beige", "Khaki", "Olive", "Maroon", "Burgundy"])}
                                      className="text-xs"
                                    >
                                      Earth Tones
                                    </Button>
                                  </div>
                                </div>

                                {colors.length > 0 && (
                                  <div className="mt-4">
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                      Selected Colors ({colors.length}):
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {colors.map((color) => (
                                        <Badge 
                                          key={color} 
                                          variant="secondary" 
                                          className="cursor-pointer hover:bg-red-100 transition-colors"
                                        >
                                          {color}
                                          <X 
                                            className="h-3 w-3 ml-1 hover:text-red-600" 
                                            onClick={() => removeColor(color)}
                                          />
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Variant Summary */}
                          {sizes.length > 0 && colors.length > 0 && (
                            <div className="mt-6">
                              <Separator className="mb-4" />
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-start gap-3">
                                  <Info className="h-5 w-5 text-green-600 mt-0.5" />
                                  <div>
                                    <h4 className="font-semibold text-green-800 mb-1">
                                      Variant Summary
                                    </h4>
                                    <p className="text-green-700 text-sm mb-2">
                                      <strong>{sizes.length} sizes</strong> × <strong>{colors.length} colors</strong> = <strong>{sizes.length * colors.length} total variants</strong>
                                    </p>
                                    <p className="text-green-600 text-xs">
                                      Each combination will be created as a separate product variant with its own SKU and inventory tracking.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {hasVariants && sizes.length === 0 && colors.length === 0 && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                              <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-yellow-800 mb-1">
                                    Add Variants
                                  </h4>
                                  <p className="text-yellow-700 text-sm">
                                    Add at least one size or color to create product variants. You can use the quick-add buttons or enter custom values.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}

                      {!hasVariants && (
                        <CardContent>
                          <div className="text-center py-8 text-gray-500">
                            <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">
                              Enable variants to create multiple versions of your product with different sizes and colors.
                            </p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </div>

          {/* Fixed Footer */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {hasVariants && sizes.length > 0 && colors.length > 0 && (
                  <span className="font-medium text-green-600">
                    {sizes.length * colors.length} variants will be created
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 