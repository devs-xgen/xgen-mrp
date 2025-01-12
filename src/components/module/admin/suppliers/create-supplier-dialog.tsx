"use client"

import { useState, useEffect } from "react"
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

// Form validation schema
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+\d{1,3}\d+$/, "Invalid phone number format").optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    paymentTerms: z.string().optional(),
    leadTime: z.number().min(0).describe('Lead time in hours'),
    status: z.nativeEnum(Status),
    notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CreateSupplierDialogProps {
    onSuccess?: () => Promise<void>
}

interface GeoNamesResult {
    postalCodes?: Array<{
        postalCode: string;
        placeName: string;
        adminName1: string;
        countryCode: string;
    }>;
}

// Fallback to a simpler implementation that doesn't rely on external APIs
async function generatePostalCode({
    city,
    state,
    country
}: {
    city?: string,
    state?: string,
    country?: string
}): Promise<string> {
    try {
        if (!city || !country) {
            return "Need city and country"
        }

        const cityCode = city.substring(0, 3).toUpperCase()
        const stateCode = state ? state.substring(0, 2).toUpperCase() : 'XX'
        const countryCode = country.substring(0, 2).toUpperCase()

        const hash = Array.from(city + state + country)
            .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const numberPart = (hash % 9000 + 1000).toString()

        return `${cityCode}${stateCode}-${numberPart}`
    } catch (error) {
        console.error('Failed to generate postal code:', error)
        return "Error generating code"
    }
}

export function CreateSupplierDialog({ onSuccess }: CreateSupplierDialogProps) {
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
            paymentTerms: "",
            leadTime: 0,
            status: "ACTIVE",
            notes: "",
        }
    })

    // Update the useEffect to handle the new implementation
    useEffect(() => {
        const { city, state, country } = form.getValues()
        if (city && country) {
            const updatePostalCode = async () => {
                const generatedCode = await generatePostalCode({
                    city,
                    state,
                    country
                })
                form.setValue('postalCode', generatedCode)
            }
            updatePostalCode()
        }
    }, [form.watch(['city', 'state', 'country'])])

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)

            // Only generate postal code if it's empty or has the placeholder text
            let postalCode = data.postalCode
            if (!postalCode || postalCode === "Complete location fields") {
                postalCode = await generatePostalCode({
                    city: data.city || '',
                    state: data.state || '',
                    country: data.country || ''
                })
            }

            // Update the data with the postal code
            const submissionData = {
                ...data,
                postalCode: postalCode
            }

            const response = await fetch("/api/suppliers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to create supplier")
            }

            toast({
                title: "Success",
                description: "Supplier created successfully",
            })
            setOpen(false)
            form.reset()
            await onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create supplier",
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
                    Add Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[500px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Supplier</DialogTitle>
                    <DialogDescription>
                        Add a new supplier to your inventory. Fill in the supplier details below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="name"
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
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Supplier code" {...field} />
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
                                        <Input placeholder="Contact person" {...field} />
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
                                            <Input placeholder="Email" {...field} />
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
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Country"
                                                {...field}
                                                onChange={async (e) => {
                                                    field.onChange(e)
                                                    const { city, state } = form.getValues()
                                                    if (city) {
                                                        const newCode = await generatePostalCode({
                                                            city,
                                                            state,
                                                            country: e.target.value
                                                        })
                                                        form.setValue('postalCode', newCode)
                                                    }
                                                }}
                                            />
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
                                            <Input
                                                placeholder="State/Region"
                                                {...field}
                                                onChange={async (e) => {
                                                    field.onChange(e)
                                                    const { city, country } = form.getValues()
                                                    if (city && country) {
                                                        const newCode = await generatePostalCode({
                                                            city: city || '',
                                                            state: e.target.value,
                                                            country: country || ''
                                                        })
                                                        form.setValue('postalCode', newCode)
                                                    }
                                                }}
                                            />
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
                                                <Input
                                                    placeholder="City"
                                                    {...field}
                                                    onChange={async (e) => {
                                                        field.onChange(e)
                                                        const { state, country } = form.getValues()
                                                        if (country) {
                                                            const newCode = await generatePostalCode({
                                                                city: e.target.value,
                                                                state: state || '',
                                                                country: country || ''
                                                            })
                                                            form.setValue('postalCode', newCode)
                                                        }
                                                    }}
                                                />
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
                                                <Input
                                                    placeholder="Enter postal code or complete location fields for auto-generation"
                                                    {...field}
                                                    className={field.value === "Complete location fields" ? "bg-muted" : ""}
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        // Clear the "Complete location fields" placeholder if user starts typing
                                                        if (field.value === "Complete location fields" && e.target.value) {
                                                            field.onChange("")
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <p className="text-sm text-muted-foreground">
                                                Auto-generated based on location or enter manually
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="paymentTerms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Terms</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Payment Terms" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="leadTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead Time (hours)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="Lead time in hours"
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                            />
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
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
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
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Notes" {...field} />
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
                                {loading ? "Creating..." : "Create Supplier"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}