"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { ProductCategory } from "@prisma/client"
import { Pencil, Plus, Trash } from "lucide-react"

interface CategoryFormData {
    name: string
    description: string
}

interface CategoryManagementProps {
    categories: ProductCategory[]
    onSuccess?: () => void
}

export function CategoryManagement({ categories, onSuccess }: CategoryManagementProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)

    const form = useForm<CategoryFormData>({
        defaultValues: {
            name: "",
            description: "",
        },
    })

    const onSubmit = async (data: CategoryFormData) => {
        try {
            setLoading(true)
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : '/api/categories'
            const method = editingCategory ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error(editingCategory
                    ? "Failed to update category"
                    : "Failed to create category")
            }

            toast({
                title: "Success",
                description: editingCategory
                    ? "Category updated successfully"
                    : "Category created successfully",
            })
            form.reset()
            setEditingCategory(null)
            onSuccess?.()
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

    const handleEdit = (category: ProductCategory) => {
        setEditingCategory(category)
        form.reset({
            name: category.name,
            description: category.description || "",
        })
    }

    const handleDelete = async (categoryId: string) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error("Failed to delete category")
            }

            toast({
                title: "Success",
                description: "Category deleted successfully",
            })
            onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete category",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Manage Categories
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Category Management</SheetTitle>
                    <SheetDescription>
                        Create and manage your product categories.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                rules={{ required: "Category name is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Category name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Category description"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                            </Button>
                        </form>
                    </Form>
                </div>

                <Separator className="my-6" />

                <div className="relative">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={category.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {category.status.toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(category)}
                                                disabled={loading}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(category.id)}
                                                disabled={loading}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </SheetContent>
        </Sheet>
    )
}