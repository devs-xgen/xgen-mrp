"use client"

import { useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { Status } from "@prisma/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { PhoneInput } from "@/components/ui/phone-input"
import { Card, CardContent } from "@/components/ui/card"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\+\d{1,3}\d+$/, "Invalid phone number format"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    tinNumber: z.string().optional(),
    creditLimit: z.string().optional(),
    paymentTerms: z.string().optional(),
    status: z.nativeEnum(Status),
    notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CreateCustomerDialogProps {
    onSuccess?: () => Promise<void>
}

export function CreateCustomerDialog({ onSuccess }: CreateCustomerDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
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
            tinNumber: "",
            creditLimit: "",
            paymentTerms: "",
            status: "ACTIVE",
            notes: "",
        }
    })

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error("Failed to create customer")
            }

            toast({
                title: "Success",
                description: "Customer created successfully",
            })
            setOpen(false)
            form.reset()
            await onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create customer",
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
                    Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[600px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Customer</DialogTitle>
                    <DialogDescription>
                        Add a new customer to your system. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information Card */}
                        <Card className="border border-muted">
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Customer name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Customer Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. CUST-001" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Unique identifier for this customer
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="contactPerson"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact Person</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Primary contact name" {...field} />
                                                </FormControl>
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
                                                <Select 
                                                    defaultValue={field.value} 
                                                    onValueChange={field.onChange}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                        <SelectItem value="PENDING">Pending</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Information Card */}
                        <Card className="border border-muted">
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Email address" {...field} />
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
                                                    <PhoneInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Full address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Country" {...field} />
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
                                                    <Input placeholder="State/Region" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="City" {...field} />
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
                                                    <Input placeholder="Postal code" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Business Information Card */}
                        <Card className="border border-muted">
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-medium mb-4">Business Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tinNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>TIN Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Tax Identification Number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="creditLimit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Credit Limit</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Maximum allowed credit in PHP
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="paymentTerms"
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Payment Terms</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Net 30" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Standard payment terms for this customer
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Additional notes" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}