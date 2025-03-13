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
import { generatePostalCode, updateLocationData } from "@/lib/utils/location"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

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
    barangay: z.string().optional(), // Added barangay to schema
    paymentTerms: z.string().optional(),
    leadTime: z.number().min(0).describe('Lead time in hours'),
    status: z.nativeEnum(Status),
    notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CreateSupplierDialogProps {
    onSuccess?: () => Promise<void>
}

export function CreateSupplierDialog({ onSuccess }: CreateSupplierDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [barangay, setBarangay] = useState("")
    const [postalCodeLoading, setPostalCodeLoading] = useState(false)

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
            barangay: "", // Added default value
            paymentTerms: "",
            leadTime: 0,
            status: "ACTIVE",
            notes: "",
        }
    })

    // Update the useEffect to handle the new implementation
    useEffect(() => {
        const { city, state, country } = form.getValues();
        
        if (country === 'Philippines') {
            // For Philippines, only update postal code if barangay is provided
            if (city && barangay) {
                const updatePostalCode = async () => {
                    
                    const generatedCode = await generatePostalCode({
                        city,
                        state,
                        country,
                        barangay
                    });
                    form.setValue('postalCode', generatedCode);
                };
                updatePostalCode();
            }
        } else if (city && country) {
            // For other countries
            const updatePostalCode = async () => {
                const generatedCode = await generatePostalCode({
                    city,
                    state,
                    country
                });
                form.setValue('postalCode', generatedCode);
            };
            updatePostalCode();
        }
    }, [form.watch(['city', 'state', 'country']), barangay]);

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            setPostalCodeLoading(true)
            // Only generate postal code if it's empty or has the placeholder text
            let postalCode = data.postalCode
            if (!postalCode || postalCode === "Complete location fields") {
                // For Philippines, require barangay for accurate postal code
                if (data.country === 'Philippines') {
                    if (!barangay) {
                        toast({
                            title: "Missing Barangay",
                            description: "Please enter a barangay name to generate the correct postal code",
                            variant: "destructive",
                        });
                        setLoading(false)
                        return; // Prevent form submission
                    }
                    
                    postalCode = await generatePostalCode({
                        city: data.city || '',
                        state: data.state || '',
                        country: 'Philippines',
                        barangay: barangay
                    });
                } else {
                    // For other countries
                    postalCode = await generatePostalCode({
                        city: data.city || '',
                        state: data.state || '',
                        country: data.country || ''
                    });
                }
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
            setPostalCodeLoading(false)
        }
    }

    // function setPostalCodeLoading(arg0: boolean) {
    //     throw new Error("Function not implemented.")
    // }

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
                        {/* Country field */}
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
                                                field.onChange(e);
                                                console.log("Country changed to:", e.target.value); // Debug log
                                                const { city, state } = form.getValues();
                                                if (city) {
                                                    const newCode = await generatePostalCode({
                                                        city,
                                                        state,
                                                        country: e.target.value,
                                                        barangay: e.target.value === 'Philippines' ? barangay : undefined
                                                    });
                                                    form.setValue('postalCode', newCode);
                                                    console.log("New postal code set:", newCode); // Debug log
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* State/Region field */}
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
                                                field.onChange(e);
                                                const { city, country } = form.getValues();
                                                if (city && country) {
                                                    const newCode = await generatePostalCode({
                                                        city: city || '',
                                                        state: e.target.value,
                                                        country: country || '',
                                                        barangay: country === 'Philippines' ? barangay : undefined
                                                    });
                                                    form.setValue('postalCode', newCode);
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Barangay field (only shown for Philippines) */}
                        {form.watch('country') === 'Philippines' && (
                            <div className="space-y-2">
                                <Label htmlFor="barangay">Barangay <span className="text-red-500">*</span></Label>
                                <Input
                                    id="barangay"
                                    placeholder="Enter barangay name for postal code lookup"
                                    value={barangay}
                                    className={!barangay && form.watch('country') === 'Philippines' ? "border-red-300" : ""}
                                    onChange={async (e) => {
                                        const newBarangay = e.target.value;
                                        setBarangay(newBarangay);
                                        form.setValue('barangay', newBarangay);
                                        
                                        // Clear the postal code first
                                        form.setValue('postalCode', '');
                                        
                                        // Force a slight delay to ensure UI updates
                                        setTimeout(async () => {
                                            const { city, state, country } = form.getValues();
                                            if (city && country === 'Philippines') {
                                                try {
                                                    // Force bypass any caching by adding a timestamp
                                                    const timestamp = new Date().getTime();
                                                    console.log(`Requesting postal code for ${city}, ${newBarangay} at ${timestamp}`);
                                                    
                                                    const newCode = await generatePostalCode({
                                                        city,
                                                        state,
                                                        country,
                                                        barangay: newBarangay
                                                    });
                                                    
                                                    // Set the postal code after a slight delay
                                                    form.setValue('postalCode', newCode);
                                                    console.log(`Updated postal code to ${newCode} for ${city}, ${newBarangay}`);
                                                } catch (err) {
                                                    console.error("Error generating postal code:", err);
                                                    form.setValue('postalCode', "Error");
                                                }
                                            }
                                        }, 100);
                                    }}
                                />
                                {!barangay && form.watch('country') === 'Philippines' ? (
                                    <p className="text-xs text-red-500">
                                        Barangay is required for Philippines addresses to generate correct postal code
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Enter barangay name to automatically generate the correct postal code
                                    </p>
                                )}
                            </div>
                        )}

                        {/* City and Postal Code fields */}
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
                                                    field.onChange(e);
                                                    const { state, country } = form.getValues();
                                                    if (country) {
                                                        const newCode = await generatePostalCode({
                                                            city: e.target.value,
                                                            state: state || '',
                                                            country: country || '',
                                                            barangay: country === 'Philippines' ? barangay : undefined
                                                        });
                                                        form.setValue('postalCode', newCode);
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
                                                placeholder="Enter barangay to auto-generate postal code"
                                                {...field}
                                                className={field.value === "Complete location fields" ? "bg-muted" : ""}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    // Clear the "Complete location fields" placeholder if user starts typing
                                                    if (field.value === "Complete location fields" && e.target.value) {
                                                        field.onChange("");
                                                    }
                                                    
                                                    // If user manually enters a postal code, update the location store
                                                    // Prioritize barangay for Philippines addresses
                                                    if (e.target.value && e.target.value !== "Complete location fields") {
                                                        const { city, state, country } = form.getValues();
                                                        
                                                        // Check if we have a barangay value to use
                                                        if (country === 'Philippines' && barangay) {
                                                            // For Philippines, prioritize barangay for postal code lookup
                                                            updateLocationData({
                                                                city: city || 'Quezon City',
                                                                state: state || 'NCR',
                                                                country: 'Philippines',
                                                                barangay: barangay,
                                                                postalCode: e.target.value
                                                            });
                                                            
                                                            console.log(`Manually set postal code ${e.target.value} for barangay: ${barangay}`);
                                                        } else if (city && country) {
                                                            // For other countries or when barangay is not available
                                                            updateLocationData({
                                                                city,
                                                                state: state || '',
                                                                country,
                                                                postalCode: e.target.value
                                                            });
                                                        }
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <p className="text-sm text-muted-foreground">
                                            {form.watch('country') === 'Philippines' 
                                                ? "Enter barangay name first for automatic postal code generation" 
                                                : "Auto-generated based on location or enter manually"}
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
    );
}