"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
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
import { toast } from "@/hooks/use-toast"
import { Supplier, Status } from "@prisma/client"

interface FormData {
    name: string
    code: string
    contactPerson: string
    email: string
    phone: string
    address?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
    paymentTerms?: string
    leadTime?: number
    status: Status
    notes?: string
}

interface EditSupplierDialogProps {
    supplier: Supplier
    open?: boolean
    trigger: React.ReactNode
    onSuccess?: () => void | Promise<void>
}

export function EditSupplierDialog({
    supplier,
    trigger,
    onSuccess
}: EditSupplierDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm<FormData>({
        defaultValues: {
            name: supplier.name,
            code: supplier.code || "",
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
            status: supplier.status,
            notes: supplier.notes || "",
        },
    })

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/suppliers/${supplier.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                }),
            })

            if (!response.ok) {
                const err = await response.json().catch(() => null)
                throw new Error(err?.error || "Failed to update supplier")
            }

            toast({
                title: "Success",
                description: "Supplier updated successfully",
            })
            setOpen(false)
            router.refresh()
            await onSuccess?.()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to update supplier",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[640px] md:max-w-[800px] lg:max-w-[900px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Supplier</DialogTitle>
                    <DialogDescription>
                        Update the supplier details below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            rules={{ required: "Supplier name is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            rules={{ required: "Code is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPerson"
                            rules={{ required: "Contact person is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Person</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/, message: "Invalid email" }}}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input type="tel" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>City</FormLabel>
                                      <FormControl>
                                          <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="state"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>State/Region</FormLabel>
                                      <FormControl>
                                          <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                              control={form.control}
                              name="country"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Country</FormLabel>
                                      <FormControl>
                                          <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="postalCode"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Postal Code</FormLabel>
                                      <FormControl>
                                          <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                              control={form.control}
                              name="paymentTerms"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Payment Terms</FormLabel>
                                      <FormControl>
                                          <Input {...field} />
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
                                      <FormLabel>Lead Time (hours)</FormLabel>
                                      <FormControl>
                                          <Input type="number" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                        </div>

                        <FormField
                            control={form.control}
                            name="status"
                            rules={{ required: "Status is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(Status).map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
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
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Updating..." : "Update Supplier"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
