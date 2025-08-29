"use client"

import { useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { Customer, Status } from "@prisma/client"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { PhoneInput } from "@/components/ui/phone-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().refine((val) => {
        // Philippine phone number validation
        const mobilePattern = /^\+639\d{9}$/ // +639XXXXXXXXX
        const landlinePattern = /^\+63[2-9]\d{7,9}$/ // +63XXXXXXXXXX
        return mobilePattern.test(val) || landlinePattern.test(val)
    }, "Please enter a valid Philippine phone number (+639XXXXXXXXX for mobile or +63XXXXXXXXXX for landline)"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    tinNumber: z.string().optional().refine((val) => {
        if (!val || val === "") return true
        const tinPattern = /^\d{3}-\d{3}-\d{3}-\d{3}$/
        return tinPattern.test(val)
    }, "TIN must be in format XXX-XXX-XXX-XXX (e.g., 123-456-789-000)"),
    creditLimit: z.string().optional().refine(
        (val) => !val || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        "Credit limit must be a valid positive number"
    ),
    paymentTerms: z.string().optional(),
    status: z.nativeEnum(Status),
    notes: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.country === "Philippines") {
        if (!data.address || data.address.trim() === "") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Complete address is required for Philippine customers", path: ["address"] })
        }
        if (!data.city || data.city.trim() === "") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "City is required for Philippine customers", path: ["city"] })
        }
        if (!data.state || data.state.trim() === "") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Province/Region is required for Philippine customers", path: ["state"] })
        }
    }
})

type FormData = z.infer<typeof formSchema>

interface EditCustomerDialogProps {
    customer: Customer
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => Promise<void>
}

export function EditCustomerDialog({
    customer,
    open,
    onOpenChange,
    onSuccess
}: EditCustomerDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            name: customer.name,
            code: customer.code,
            contactPerson: customer.contactPerson,
            email: customer.email,
            phone: customer.phone,
            address: customer.address || "",
            city: customer.city || "",
            state: customer.state || "",
            country: customer.country || "",
            postalCode: customer.postalCode || "",
            tinNumber: customer.tinNumber || "",
            creditLimit: customer.creditLimit?.toString() || "",
            paymentTerms: customer.paymentTerms || "",
            status: customer.status,
            notes: customer.notes || "",
        }
    })

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/customers/${customer.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to update customer")
            }

            toast({
                title: "Success",
                description: "Customer updated successfully",
            })
            onOpenChange(false)
            await onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update customer",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[600px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                    <DialogDescription>
                        Make changes to the customer information below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
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
                                        <FormLabel>Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Customer code" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Person</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contact person name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Email address" 
                                                {...field}
                                                className={`${
                                                    form.formState.errors.email
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : (form.watch('email') && !form.getFieldState('email').invalid)
                                                            ? 'border-green-500 focus:border-green-500'
                                                            : ''
                                                }`}
                                            />
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
                                                allowedCountryCodes={["63"]}
                                                status={
                                                    form.formState.errors.phone
                                                        ? 'error'
                                                        : (form.watch('phone') && !form.getFieldState('phone').invalid)
                                                            ? 'success'
                                                            : undefined
                                                }
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
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Street address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
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
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <FormControl>
                                            <Input placeholder="State" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tinNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TIN Number</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="e.g. 123-456-789-000" 
                                                {...field}
                                                inputMode="numeric"
                                                maxLength={15}
                                                onChange={(e) => {
                                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 12)
                                                    const len = digits.length
                                                    let formatted = ''
                                                    if (len <= 3) {
                                                        formatted = digits
                                                    } else if (len <= 6) {
                                                        formatted = `${digits.slice(0,3)}-${digits.slice(3)}`
                                                    } else if (len <= 9) {
                                                        formatted = `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`
                                                    } else {
                                                        formatted = `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,9)}-${digits.slice(9)}`
                                                    }
                                                    if ((len === 3 || len === 6 || len === 9) && len < 12) {
                                                        formatted += '-'
                                                    }
                                                    field.onChange(formatted)
                                                }}
                                            />
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
                                            <Input type="number" placeholder="Credit limit" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="paymentTerms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Terms</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Payment terms" {...field} />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
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

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional notes" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
} 