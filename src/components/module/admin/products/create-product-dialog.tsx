"use client"

import { useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { ProductCategory } from "@prisma/client"
import { formatCurrencyPHP } from "@/lib/constant"

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
    sizeRange: z.array(z.string()).default([]),
    colorOptions: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>

interface CreateProductDialogProps {
    categories: ProductCategory[]
    onSuccess?: () => Promise<void>
}

export function CreateProductDialog({ categories, onSuccess }: CreateProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newSize, setNewSize] = useState("")
    const [newColor, setNewColor] = useState("")

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
            sizeRange: [],
            colorOptions: [],
        }
    })

    const watchSizeRange = form.watch("sizeRange")
    const watchColorOptions = form.watch("colorOptions")

    // Add size to range
    const addSize = () => {
        if (newSize.trim()) {
            const currentSizes = form.getValues("sizeRange")
            if (!currentSizes.includes(newSize.trim())) {
                form.setValue("sizeRange", [...currentSizes, newSize.trim()])
                setNewSize("")
            }
        }
    }

    // Remove size from range
    const removeSize = (size: string) => {
        const currentSizes = form.getValues("sizeRange")
        form.setValue("sizeRange", currentSizes.filter(s => s !== size))
    }

    // Add color option
    const addColor = () => {
        if (newColor.trim()) {
            const currentColors = form.getValues("colorOptions")
            if (!currentColors.includes(newColor.trim())) {
                form.setValue("colorOptions", [...currentColors, newColor.trim()])
                setNewColor("")
            }
        }
    }

    // Remove color option
    const removeColor = (color: string) => {
        const currentColors = form.getValues("colorOptions")
        form.setValue("colorOptions", currentColors.filter(c => c !== color))
    }

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)

            const response = await fetch("/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to create product")
            }

            toast({
                title: "Success",
                description: "Product created successfully",
            })
            setOpen(false)
            form.reset()
            if (onSuccess) await onSuccess()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Something went wrong",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                    <DialogDescription>
                        Add a new product to your inventory. You can create variants later.
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

                        {/* Pricing & Inventory */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="unitCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Cost</FormLabel>
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
                                            <FormLabel>Selling Price</FormLabel>
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

                        {/* Size Range */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Size Range</h3>
                            
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add size (e.g., XS, S, M, L, XL)"
                                    value={newSize}
                                    onChange={(e) => setNewSize(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                                />
                                <Button type="button" onClick={addSize}>
                                    Add
                                </Button>
                            </div>

                            {watchSizeRange.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {watchSizeRange.map((size) => (
                                        <Badge key={size} variant="secondary" className="flex items-center gap-1">
                                            {size}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 ml-1"
                                                onClick={() => removeSize(size)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Color Options */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Color Options</h3>
                            
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add color option"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                                />
                                <Button type="button" onClick={addColor}>
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
                                                onClick={() => removeColor(color)}
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