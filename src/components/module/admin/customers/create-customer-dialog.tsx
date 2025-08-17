"use client"

import { useState, useRef, useEffect } from "react"
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

import { Card, CardContent } from "@/components/ui/card"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { generatePostalCode } from "@/lib/utils/location"



// Function to check if customer code exists
const checkCustomerCodeExists = async (code: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/customers/check-code?code=${encodeURIComponent(code)}`);
        if (response.ok) {
            const data = await response.json();
            return data.exists;
        }
    } catch (error) {
        console.error('Error checking customer code:', error);
    }
    return false;
};

const formSchema = z.object({
    name: z.string().min(1, "Company name is required"),
    code: z.string()
        .min(1, "Customer code is required")
        .regex(/^[A-Z0-9-]+$/, "Code must contain only uppercase letters, numbers, and hyphens")
        .min(3, "Code must be at least 3 characters")
        .max(20, "Code must not exceed 20 characters"),
    contactPerson: z.string().min(1, "Contact person is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().refine((val) => {
        // Philippine phone number validation
        // Mobile: +639XXXXXXXXX (11 digits after +63)
        // Landline: +63XXXXXXXXXX (variable length after +63, typically 2-3 area code + 7-8 digits)
        const mobilePattern = /^\+639\d{9}$/;
        const landlinePattern = /^\+63[2-9]\d{7,9}$/;
        return mobilePattern.test(val) || landlinePattern.test(val);
    }, "Please enter a valid Philippine phone number (+639XXXXXXXXX for mobile or +63XXXXXXXXXX for landline)"),
    address: z.string().min(1, "Address is required for Philippine customers"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "Province/Region is required"),
    country: z.string().min(1, "Country is required"),
    postalCode: z.string().optional(),
    tinNumber: z.string().optional().refine((val) => {
        if (!val || val === "") return true; // Optional field
        // Philippine TIN format: XXX-XXX-XXX-XXX (12 digits with dashes)
        const tinPattern = /^\d{3}-\d{3}-\d{3}-\d{3}$/;
        return tinPattern.test(val);
    }, "TIN must be in format XXX-XXX-XXX-XXX (e.g., 123-456-789-000)"),
    creditLimit: z.string().optional().refine(
        (val) => !val || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        "Credit limit must be a valid positive number"
    ),
    paymentTerms: z.string().optional(),
    status: z.nativeEnum(Status),
    notes: z.string().optional(),
}).superRefine((data, ctx) => {
    // Additional Philippine business validations
    if (data.country === "Philippines") {
        // Ensure required fields for Philippine businesses
        if (!data.address || data.address.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Complete address is required for Philippine customers",
                path: ["address"],
            });
        }
        
        if (!data.city || data.city.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "City is required for Philippine customers",
                path: ["city"],
            });
        }
        
        if (!data.state || data.state.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Province/Region is required for Philippine customers",
                path: ["state"],
            });
        }
    }
})

type FormData = z.infer<typeof formSchema>

interface CreateCustomerDialogProps {
    onSuccess?: () => Promise<void>
}

export function CreateCustomerDialog({ onSuccess }: CreateCustomerDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [barangay, setBarangay] = useState("")
    const [isCheckingCode, setIsCheckingCode] = useState(false)
    const [codeExists, setCodeExists] = useState(false)
    const codeCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (codeCheckTimeoutRef.current) {
                clearTimeout(codeCheckTimeoutRef.current);
            }
        };
    }, []);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            contactPerson: "",
            email: "",
            phone: "+63",
            address: "",
            city: "",
            state: "",
            country: "Philippines",
            postalCode: "",
            tinNumber: "",
            creditLimit: "",
            paymentTerms: "Net 30",
            status: "ACTIVE",
            notes: "",
        }
    })

    // Customer code validation
    const handleCodeCheck = async (code: string) => {
        if (code.length < 3) {
            setCodeExists(false);
            return;
        }

        setIsCheckingCode(true);
        try {
            const exists = await checkCustomerCodeExists(code);
            setCodeExists(exists);
            if (exists) {
                form.setError('code', { message: 'Customer code already exists. Please choose a different code.' });
            } else {
                form.clearErrors('code');
            }
        } catch (error) {
            console.error('Error checking customer code:', error);
        } finally {
            setIsCheckingCode(false);
        }
    };

    // Postal code generation
    const handleGeneratePostalCode = async (locationData: { city: string; state?: string; country: string; barangay?: string }) => {
        try {
            const newCode = await generatePostalCode(locationData);
            form.setValue('postalCode', newCode);
        } catch (error) {
            console.error('Error generating postal code:', error);
            form.setValue('postalCode', 'Error - Enter manually');
        }
    };

    const onSubmit = async (data: FormData) => {
        // Final check for duplicate code before submission
        if (codeExists) {
            toast({
                title: "Error",
                description: "Customer code already exists. Please choose a different code.",
                variant: "destructive",
            })
            return;
        }

        try {
            setLoading(true)
            
            // Double-check code availability before submitting
            const exists = await checkCustomerCodeExists(data.code);
            if (exists) {
                setCodeExists(true);
                form.setError('code', { message: 'Customer code already exists. Please choose a different code.' });
                toast({
                    title: "Error",
                    description: "Customer code already exists. Please choose a different code.",
                    variant: "destructive",
                })
                return;
            }

            const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to create customer")
            }

            toast({
                title: "Success",
                description: "Customer created successfully",
            })
            setOpen(false)
            form.reset()
            setBarangay("") // Reset barangay state
            setCodeExists(false) // Reset code validation state
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

    const handleDialogChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Reset validation states when dialog closes
            setCodeExists(false);
            setIsCheckingCode(false);
            setBarangay("");
            form.reset();
            if (codeCheckTimeoutRef.current) {
                clearTimeout(codeCheckTimeoutRef.current);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
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
                        Add a new Philippine customer to your system. All validations are optimized for Philippine business standards.
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
                                                <FormLabel>Company Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. ABC Trading Corp." {...field} />
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
                                                <FormLabel>Customer Code *</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input 
                                                            placeholder="e.g. CUST-001" 
                                                            {...field}
                                                            onChange={(e) => {
                                                                const value = e.target.value.toUpperCase();
                                                                field.onChange(value);
                                                                
                                                                // Clear existing timeout
                                                                if (codeCheckTimeoutRef.current) {
                                                                    clearTimeout(codeCheckTimeoutRef.current);
                                                                }
                                                                
                                                                // Check for existing code after user stops typing
                                                                codeCheckTimeoutRef.current = setTimeout(() => {
                                                                    if (value.length >= 3) {
                                                                        handleCodeCheck(value);
                                                                    } else {
                                                                        setCodeExists(false);
                                                                        form.clearErrors('code');
                                                                    }
                                                                }, 500);
                                                            }}
                                                            className={`pr-10 ${
                                                                codeExists ? 'border-red-500 focus:border-red-500' : 
                                                                field.value && field.value.length >= 3 && !codeExists && !isCheckingCode ? 'border-green-500 focus:border-green-500' : ''
                                                            }`}
                                                        />
                                                        {isCheckingCode && (
                                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                                            </div>
                                                        )}
                                                        {!isCheckingCode && field.value && field.value.length >= 3 && (
                                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                {codeExists ? (
                                                                    <span className="text-red-500">✗</span>
                                                                ) : (
                                                                    <span className="text-green-500">✓</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Unique identifier for this customer (uppercase letters, numbers, and hyphens only)
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
                                                <FormLabel>Contact Person *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Juan dela Cruz" {...field} />
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
                                                <FormLabel>Email Address *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. contact@company.com.ph" {...field} />
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
                                                <FormLabel>Phone Number *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="e.g. +639123456789 (mobile) or +632234567890 (landline)"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Philippine mobile or landline number with country code
                                                </FormDescription>
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
                                            <FormLabel>Complete Address *</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="e.g. Unit 123, Building Name, Street Name, Subdivision/Village" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Include unit/floor, building name, street, subdivision/village
                                            </FormDescription>
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
                                                <FormLabel>Country *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Philippines (default)" 
                                                        {...field}
                                                        onChange={async (e) => {
                                                            field.onChange(e);
                                                            const { city, state } = form.getValues();
                                                            if (city) {
                                                                await handleGeneratePostalCode({
                                                                    city,
                                                                    state,
                                                                    country: e.target.value,
                                                                });
                                                            }
                                                        }} 
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Validation is optimized for Philippine customers
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Province/Region *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="e.g. Metro Manila, Cebu, Davao" 
                                                        {...field}
                                                        onChange={async (e) => {
                                                            field.onChange(e);
                                                            const { city, country } = form.getValues();
                                                            if (city && country) {
                                                                await handleGeneratePostalCode({
                                                                    city,
                                                                    state: e.target.value,
                                                                    country,
                                                                });
                                                            }
                                                        }}
                                                    />
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
                                                <FormLabel>City/Municipality *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="e.g. Makati City, Quezon City, Cebu City" 
                                                        {...field}
                                                        onChange={async (e) => {
                                                            field.onChange(e);
                                                            const { state, country } = form.getValues();
                                                            if (country) {
                                                                await handleGeneratePostalCode({
                                                                    city: e.target.value,
                                                                    state: state || '',
                                                                    country: country || '',
                                                                    barangay: country === 'Philippines' ? barangay : undefined
                                                                });
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
                                                        placeholder="e.g. 1226, 6000, 8000" 
                                                        {...field} 
                                                        className={field.value === "Complete location fields" ? "bg-muted" : ""}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Philippine postal code (auto-generated from location)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {/* Barangay field for Philippines */}
                                {form.watch('country') === 'Philippines' && (
                                    <FormItem className="mt-4">
                                        <FormLabel>Barangay *</FormLabel>
                                        <FormControl>
                                            <Input
                                                id="barangay"
                                                placeholder="e.g. Poblacion, San Antonio, Bagong Silang"
                                                value={barangay}
                                                onChange={async (e) => {
                                                    setBarangay(e.target.value);
                                                    const { city, state, country } = form.getValues();
                                                    if (city && country === 'Philippines') {
                                                        await handleGeneratePostalCode({
                                                            city,
                                                            state,
                                                            country,
                                                            barangay: e.target.value
                                                        });
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Required for accurate postal code and location identification
                                        </FormDescription>
                                    </FormItem>
                                )}
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
                                                <FormLabel>TIN Number (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 123-456-789-000" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Philippine Tax Identification Number (format: XXX-XXX-XXX-XXX)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="creditLimit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Credit Limit (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Maximum allowed credit in Philippine Peso (₱)
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
                                            <FormLabel>Payment Terms (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Net 30, COD, 2/10 Net 30, Due on Receipt" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Standard payment terms for this customer (defaults to Net 30)
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
                                            <FormLabel>Additional Notes (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="e.g. Special delivery instructions, preferred contact method, business relationship details" {...field} />
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
                            <Button type="submit" disabled={loading || codeExists || isCheckingCode}>
                                {loading ? "Creating..." : 
                                 isCheckingCode ? "Checking..." :
                                 codeExists ? "Code Already Exists" :
                                 "Create Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}