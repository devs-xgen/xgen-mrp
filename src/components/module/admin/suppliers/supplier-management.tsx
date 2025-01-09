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
import { Supplier } from "@prisma/client"
import { Pencil, Plus, Trash } from "lucide-react"

interface SupplierFormData {
    name: string
    code: string
    contactPerson: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    country: string
    postalCode: string
    paymentTerms: string
    leadTime: number
    status: string
    notes: string
}

interface SupplierManagementProps {
    suppliers: Supplier[]
    onSuccess?: () => void
}

export function SupplierManagement({ suppliers, onSuccess }: SupplierManagementProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

    const form = useForm<SupplierFormData>({
        defaultValues: {
            name: "",
            code: "",
            contactPerson: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            paymentTerms: "",
            leadTime: 0,
            status: "ACTIVE",
            notes: "",
        },
    })

    const onSubmit = async (data: SupplierFormData) => {
        try {
            setLoading(true)
            const url = editingSupplier
                ? `/api/suppliers/${editingSupplier.id}`
                : '/api/suppliers'
            const method = editingSupplier ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error(editingSupplier
                    ? "Failed to update supplier"
                    : "Failed to create supplier")
            }

            toast({
                title: "Success",
                description: editingSupplier
                    ? "Supplier updated successfully"
                    : "Supplier created successfully",
            })
            form.reset()
            setEditingSupplier(null)
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

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        form.reset({
            name: supplier.name,
            code: supplier.code,
            contactPerson: supplier.contactPerson || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
            address: supplier.address || "",
            city: supplier.city || "",
            state: supplier.state || "",
            country: supplier.country || "",
            postalCode: supplier.postalCode || "",
            paymentTerms: supplier.paymentTerms || "",
            leadTime: supplier.leadTime || 0,
            status: supplier.status || "ACTIVE",
            notes: supplier.notes || "",
        })
    }

    const handleDelete = async (supplierId: string) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/suppliers/${supplierId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error("Failed to delete supplier")
            }

            toast({
                title: "Success",
                description: "Supplier deleted successfully",
            })
            onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete supplier",
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
                    Manage Suppliers
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Supplier Management</SheetTitle>
                    <SheetDescription>
                        Create and manage your suppliers.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                rules={{ required: "Supplier name is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Supplier name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Add similar FormField for other fields like 'code', 'contactPerson', etc. */}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : editingSupplier ? "Update Supplier" : "Create Supplier"}
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
                            {suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">
                                        {supplier.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={supplier.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {supplier.status.toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(supplier)}
                                                disabled={loading}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(supplier.id)}
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
