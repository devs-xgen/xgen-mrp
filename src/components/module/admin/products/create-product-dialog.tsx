"use client"

import { useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X, Layers, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { ProductCategory } from "@prisma/client"

// Common clothing sizes with ordering
const COMMON_SIZES = [
  { name: "XS", code: "XS", order: 1 },
  { name: "S", code: "S", order: 2 },
  { name: "M", code: "M", order: 3 },
  { name: "L", code: "L", order: 4 },
  { name: "XL", code: "XL", order: 5 },
  { name: "XXL", code: "XXL", order: 6 },
  { name: "XXXL", code: "XXXL", order: 7 },
] as const;

// Size variant schema
const sizeVariantSchema = z.object({
  sizeName: z.string().min(1, "Size name is required"),
  sizeCode: z.string().min(1, "Size code is required"),
  unitCost: z.number().min(0, "Unit cost must be non-negative"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative"),
  minimumStockLevel: z.number().min(0, "Minimum stock must be non-negative"),
  sortOrder: z.number().default(0),
});

// Form validation schema
const formSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    sku: z.string().min(1, "SKU is required"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    minimumStockLevel: z.number().min(0),
    unitCost: z.number().min(0),
    sellingPrice: z.number().min(0),
    leadTime: z.number().min(0),
    colorOptions: z.array(z.string()).default([]),
    // Variant fields
    hasVariants: z.boolean().default(false),
    sizeVariants: z.array(sizeVariantSchema).default([]),
    // Legacy fields (when not using variants)
    sizeRange: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>

interface CreateProductDialogProps {
    categories: ProductCategory[]
    onSuccess?: () => Promise<void>
}

export function CreateProductDialog({ categories, onSuccess }: CreateProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newColorOption, setNewColorOption] = useState("")

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            sku: "",
            description: "",
            categoryId: "",
            minimumStockLevel: 0,
            unitCost: 0,
            sellingPrice: 0,
            leadTime: 0,
            colorOptions: [],
            hasVariants: false,
            sizeVariants: [],
            sizeRange: [],
        }
    })

    const watchHasVariants = form.watch("hasVariants")
    const watchSizeVariants = form.watch("sizeVariants")
    const watchColorOptions = form.watch("colorOptions")

    // Add common size variant
    const addCommonSize = (size: { name: string; code: string; order: number }) => {
        const currentVariants = form.getValues("sizeVariants")
        const exists = currentVariants.some(v => v.sizeName === size.name)
        
        if (!exists) {
            const baseUnitCost = form.getValues("unitCost") || 0
            const baseSellingPrice = form.getValues("sellingPrice") || 0
            
            form.setValue("sizeVariants", [
                ...currentVariants,
                {
                    sizeName: size.name,
                    sizeCode: size.code,
                    unitCost: baseUnitCost,
                    sellingPrice: baseSellingPrice,
                    minimumStockLevel: form.getValues("minimumStockLevel") || 0,
                    sortOrder: size.order,
                }
            ])
        }
    }

    // Remove size variant
    const removeSizeVariant = (index: number) => {
        const currentVariants = form.getValues("sizeVariants")
        form.setValue("sizeVariants", currentVariants.filter((_, i) => i !== index))
    }

    // Add color option
    const addColorOption = () => {
        if (newColorOption.trim()) {
            const currentColors = form.getValues("colorOptions")
            if (!currentColors.includes(newColorOption.trim())) {
                form.setValue("colorOptions", [...currentColors, newColorOption.trim()])
                setNewColorOption("")
            }
        }
    }

    // Remove color option
    const removeColorOption = (color: string) => {
        const currentColors = form.getValues("colorOptions")
        form.setValue("colorOptions", currentColors.filter(c => c !== color))
    }

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)

            // Validate size variants if enabled
            if (data.hasVariants && data.sizeVariants.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please add at least one size variant",
                    variant: "destructive",
                })
                return
            }

            // Prepare form data with proper size handling
            const formData = { ...data };
            
            if (data.hasVariants && data.sizeVariants.length > 0) {
                // If variants are enabled, populate sizeRange from sizeVariants for backward compatibility
                formData.sizeRange = data.sizeVariants
                    .map(variant => variant.sizeName)
                    .sort((a, b) => {
                        // Sort sizes in proper order (XS, S, M, L, XL, etc.)
                        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
                        const aIndex = sizeOrder.indexOf(a);
                        const bIndex = sizeOrder.indexOf(b);
                        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                        return a.localeCompare(b);
                    });
            } else {
                // For non-variant products, ensure sizeRange is properly set
                formData.sizeRange = data.sizeRange || [];
            }

            // Debug: Log the data being sent
            console.log("Form data being sent:", {
                name: formData.name,
                hasVariants: formData.hasVariants,
                sizeRange: formData.sizeRange,
                colorOptions: formData.colorOptions,
                sizeVariants: formData.sizeVariants?.length || 0
            });

            const response = await fetch("/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to create product")
            }

            toast({
                title: "Success",
                description: `Product created successfully${data.hasVariants ? ` with ${data.sizeVariants.length} size variants` : ''}`,
            })
            setOpen(false)
            form.reset()
            await onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create product",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Create New Product
                    </DialogTitle>
                    <DialogDescription>
                        Add a new product to your inventory. Configure size variants for clothing items.
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter product name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter SKU" {...field} />
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
                                            <Textarea 
                                                placeholder="Product description" 
                                                className="resize-none" 
                                                rows={3}
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Size Variants Toggle */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="hasVariants"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2">
                                                <Layers className="h-4 w-4" />
                                                Enable Size Variants
                                            </FormLabel>
                                            <FormDescription>
                                                Create different sizes with individual BOMs and pricing
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {watchHasVariants && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Size Variants</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Quick Add Common Sizes */}
                                        <div>
                                            <p className="text-sm font-medium mb-2">Quick Add Common Sizes:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {COMMON_SIZES.map((size) => (
                                                    <Button
                                                        key={size.name}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addCommonSize(size)}
                                                        disabled={watchSizeVariants.some(v => v.sizeName === size.name)}
                                                    >
                                                        {size.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Size Variants List */}
                                        {watchSizeVariants.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Added Sizes:</p>
                                                <div className="space-y-2">
                                                    {watchSizeVariants.map((variant, index) => (
                                                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                                            <Badge variant="secondary">{variant.sizeName}</Badge>
                                                            <span className="text-sm text-muted-foreground">
                                                                ₱{variant.unitCost} / ₱{variant.sellingPrice}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeSizeVariant(index)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Separator />

                        {/* Pricing & Inventory */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">
                                {watchHasVariants ? "Base Pricing & Inventory" : "Pricing & Inventory"}
                            </h3>
                            {watchHasVariants && (
                                <p className="text-sm text-muted-foreground">
                                    These values will be used as defaults for new size variants
                                </p>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="unitCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Cost (₱)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="0.00"
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
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Selling Price (₱)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="0.00"
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
                                    name="minimumStockLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Minimum Stock Level</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number"
                                                    placeholder="0"
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
                                    name="leadTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lead Time (days)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number"
                                                    placeholder="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Color Options */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Color Options</h3>
                            
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add color option"
                                    value={newColorOption}
                                    onChange={(e) => setNewColorOption(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColorOption())}
                                />
                                <Button type="button" onClick={addColorOption}>
                                    Add
                                </Button>
                            </div>

                            {watchColorOptions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {watchColorOptions.map((color) => (
                                        <Badge key={color} variant="secondary" className="flex items-center gap-1">
                                            {color}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 ml-1"
                                                onClick={() => removeColorOption(color)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setOpen(false)}
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
    )
}