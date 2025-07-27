"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Camera, Upload, Loader2, Package, Truck, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatCurrencyPHP } from "@/lib/constant";

// Import types and server actions
import { 
  DeliveryReceiptFormData,
  deliveryReceiptSchema,
  DeliveryStatus,
  BillingStatementWithRelations,
} from "@/types/admin/billing";
import { getAllBillingStatements } from "@/lib/actions/billing-statements";

interface DeliveryReceiptFormProps {
  initialData?: Partial<DeliveryReceiptFormData>;
  onSubmit: (data: DeliveryReceiptFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function DeliveryReceiptForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Create Receipt"
}: DeliveryReceiptFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [billingStatements, setBillingStatements] = useState<BillingStatementWithRelations[]>([]);
  const [selectedBillingStatement, setSelectedBillingStatement] = useState<BillingStatementWithRelations | null>(null);
  
  // File upload states
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Form setup with simplified fields only (Requirements 3.1, 3.2, 3.3, 3.4)
  const form = useForm<DeliveryReceiptFormData>({
    resolver: zodResolver(deliveryReceiptSchema),
    defaultValues: {
      billingStatementId: initialData?.billingStatementId || "",
      deliveryDate: initialData?.deliveryDate || new Date(),
      receivedBy: initialData?.receivedBy || "",
      receivedByTitle: initialData?.receivedByTitle || "",
      deliveryAddress: initialData?.deliveryAddress || "",
      deliveryNotes: initialData?.deliveryNotes || "",
      deliveryStatus: initialData?.deliveryStatus || DeliveryStatus.PENDING,
      signatureImage: initialData?.signatureImage || "",
      photoEvidence: initialData?.photoEvidence || "",
      trackingNumber: initialData?.trackingNumber || "",
      courierService: initialData?.courierService || "",
    },
  });

  // Load billing statements on component mount
  useEffect(() => {
    const loadBillingStatements = async () => {
      setIsLoading(true);
      try {
        const result = await getAllBillingStatements({}, 1, 100);
        if (result.data) {
          setBillingStatements(result.data);
          
          // If initialData has billingStatementId, find and set the selected statement
          if (initialData?.billingStatementId) {
            const statement = result.data.find(s => s.id === initialData.billingStatementId);
            if (statement) {
              setSelectedBillingStatement(statement);
              // Auto-populate delivery address from customer data
              populateDeliveryAddress(statement);
            }
          }
        }
      } catch (error) {
        console.error("Error loading billing statements:", error);
        toast.error("Failed to load billing statements");
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingStatements();
  }, [initialData?.billingStatementId]);

  // Handle billing statement selection - required billingStatementId (Requirement 3.5)
  const handleBillingStatementSelect = (statementId: string) => {
    const statement = billingStatements.find(s => s.id === statementId);
    setSelectedBillingStatement(statement || null);
    form.setValue("billingStatementId", statementId);
    
    if (statement) {
      populateDeliveryAddress(statement);
    }
  };

  // Auto-populate delivery address from billing statement customer data
  const populateDeliveryAddress = (statement: BillingStatementWithRelations) => {
    let address = "";
    
    if (statement.customer) {
      address = [
        statement.customer.address,
        statement.customer.city,
        statement.customer.state,
        statement.customer.postalCode,
        statement.customer.country
      ].filter(Boolean).join(", ");
    } else if (statement.customerOrder?.customer) {
      const customer = statement.customerOrder.customer;
      address = [
        customer.address,
        customer.city,
        customer.state,
        customer.postalCode,
        customer.country
      ].filter(Boolean).join(", ");
    }
    
    if (address && !form.getValues("deliveryAddress")) {
      form.setValue("deliveryAddress", address);
    }
  };

  // Handle signature file upload (Requirement 3.3 - optional proof)
  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSignaturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo file upload (Requirement 3.3 - optional proof)
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission with simplified fields only
  const handleSubmit = async (data: DeliveryReceiptFormData) => {
    try {
      // Convert files to base64 for storage (in a real app, you'd upload to cloud storage)
      let signatureBase64 = data.signatureImage || "";
      let photoBase64 = data.photoEvidence || "";
      
      if (signatureFile) {
        const reader = new FileReader();
        signatureBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(signatureFile);
        });
      }
      
      if (photoFile) {
        const reader = new FileReader();
        photoBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
      }
      
      // Add file data to form data
      const formDataWithFiles = {
        ...data,
        signatureImage: signatureBase64,
        photoEvidence: photoBase64,
      };
      
      await onSubmit(formDataWithFiles);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Billing Statement Selection - Required (Requirement 3.5) */}
                <FormField
                  control={form.control}
                  name="billingStatementId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Statement *</FormLabel>
                      <Select onValueChange={handleBillingStatementSelect} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing statement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {billingStatements.map((statement) => (
                            <SelectItem key={statement.id} value={statement.id}>
                              {statement.statementNumber} - {statement.customerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Essential delivery information (Requirements 3.1, 3.2) */}
                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Delivery Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                            <SelectItem value="RETURNED">Returned</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receivedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Received By *</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person who received" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receivedByTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title/Position</FormLabel>
                        <FormControl>
                          <Input placeholder="Manager, Supervisor, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Complete delivery address..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional delivery notes..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Tracking Information - Optional (Requirement 3.4) */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courierService"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Courier Service</FormLabel>
                        <FormControl>
                          <Input placeholder="FedEx, UPS, DHL, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Tracking number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Proof of Delivery - Optional (Requirement 3.3) */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Proof of Delivery
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload signature and photos as proof of delivery
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Signature Upload */}
                <div className="space-y-4">
                  <Label>Delivery Signature</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        id="signature-upload"
                      />
                      <label htmlFor="signature-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Click to upload signature image
                          </p>
                          <p className="text-xs text-gray-400">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </label>
                    </div>
                    {signaturePreview && (
                      <div className="mt-4">
                        <img
                          src={signaturePreview}
                          alt="Signature preview"
                          className="max-w-full h-32 object-contain mx-auto border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Evidence Upload */}
                <div className="space-y-4">
                  <Label>Photo Evidence</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Click to upload delivery photo
                          </p>
                          <p className="text-xs text-gray-400">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </label>
                    </div>
                    {photoPreview && (
                      <div className="mt-4">
                        <img
                          src={photoPreview}
                          alt="Photo preview"
                          className="max-w-full h-48 object-contain mx-auto border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Billing Statement Information */}
            {selectedBillingStatement && (
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Billing Statement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="font-medium">{selectedBillingStatement.statementNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Customer: {selectedBillingStatement.customerName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">{selectedBillingStatement.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-sm font-medium">
                      {formatCurrencyPHP(selectedBillingStatement.totalAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Package className="mr-2 h-4 w-4" />
              )}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}