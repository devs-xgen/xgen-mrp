"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Camera, Upload, Loader2, Package, Truck, User } from "lucide-react";
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
  
  // Image URL states (temporary until full upload implementation)
  const [signatureImageUrl, setSignatureImageUrl] = useState<string>("");
  const [photoEvidenceUrl, setPhotoEvidenceUrl] = useState<string>("");

  // Helpers to coerce serialized values coming from server actions
  const toNumberMaybe = (v: unknown): number | unknown => {
    if (typeof v === "string") {
      const n = parseFloat(v);
      return Number.isNaN(n) ? v : n;
    }
    return v;
  };

  const toDateMaybe = (v: unknown): Date | unknown => {
    if (v instanceof Date) return v;
    if (typeof v === "string") {
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d;
    }
    return v;
  };

  // Transform a billing statement to align runtime types with BillingStatementWithRelations
  const hydrateBillingStatement = (s: any): BillingStatementWithRelations => {
    const hydrated: any = {
      ...s,
      // Top-level amounts
      totalAmount: toNumberMaybe(s?.totalAmount),
      taxAmount: toNumberMaybe(s?.taxAmount),
      discountAmount: toNumberMaybe(s?.discountAmount),
      netAmount: toNumberMaybe(s?.netAmount),
      // Top-level dates
      billingDate: toDateMaybe(s?.billingDate),
      dueDate: s?.dueDate ? toDateMaybe(s.dueDate) : null,
      paidDate: s?.paidDate ? toDateMaybe(s.paidDate) : null,
      createdAt: toDateMaybe(s?.createdAt),
      updatedAt: toDateMaybe(s?.updatedAt),
    };

    if (s?.customerOrder) {
      hydrated.customerOrder = {
        ...s.customerOrder,
        orderDate: toDateMaybe(s.customerOrder.orderDate),
        requiredDate: toDateMaybe(s.customerOrder.requiredDate),
        totalAmount: toNumberMaybe(s.customerOrder.totalAmount),
      };
    }

    if (s?.productionOrder) {
      hydrated.productionOrder = {
        ...s.productionOrder,
        startDate: toDateMaybe(s.productionOrder.startDate),
        dueDate: toDateMaybe(s.productionOrder.dueDate),
        quantity: toNumberMaybe(s.productionOrder.quantity),
      };
    }

    if (s?.salesInvoice) {
      hydrated.salesInvoice = {
        ...s.salesInvoice,
        invoiceDate: toDateMaybe(s.salesInvoice.invoiceDate),
        dueDate: s.salesInvoice.dueDate ? toDateMaybe(s.salesInvoice.dueDate) : null,
        subtotal: toNumberMaybe(s.salesInvoice.subtotal),
        taxRate: toNumberMaybe(s.salesInvoice.taxRate),
        taxAmount: toNumberMaybe(s.salesInvoice.taxAmount),
        discountAmount: toNumberMaybe(s.salesInvoice.discountAmount),
        totalAmount: toNumberMaybe(s.salesInvoice.totalAmount),
        invoiceItems: s.salesInvoice.invoiceItems?.map((item: any) => ({
          ...item,
          quantity: toNumberMaybe(item.quantity),
          unitPrice: toNumberMaybe(item.unitPrice),
          totalPrice: toNumberMaybe(item.totalPrice),
          discountPercent: item.discountPercent != null ? toNumberMaybe(item.discountPercent) : null,
        })) ?? [],
      };
    }

    if (Array.isArray(s?.deliveryReceipts)) {
      hydrated.deliveryReceipts = s.deliveryReceipts.map((r: any) => ({
        ...r,
        deliveryDate: toDateMaybe(r.deliveryDate),
      }));
    }

    return hydrated as BillingStatementWithRelations;
  };

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

  // Auto-populate delivery address from billing statement customer data
  const populateDeliveryAddress = useCallback((statement: BillingStatementWithRelations) => {
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
  }, [form]);

  // Load billing statements on component mount
  useEffect(() => {
    const loadBillingStatements = async () => {
      setIsLoading(true);
      try {
        const result = await getAllBillingStatements({}, 1, 100);
        if (result.data) {
          const hydrated = result.data.map(hydrateBillingStatement);
          setBillingStatements(hydrated);
          
          // If initialData has billingStatementId, find and set the selected statement
          if (initialData?.billingStatementId) {
            const statement = hydrated.find(s => s.id === initialData.billingStatementId);
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
  }, [initialData?.billingStatementId, populateDeliveryAddress]);

  // Handle billing statement selection - required billingStatementId (Requirement 3.5)
  const handleBillingStatementSelect = (statementId: string) => {
    const statement = billingStatements.find(s => s.id === statementId);
    setSelectedBillingStatement(statement || null);
    form.setValue("billingStatementId", statementId);
    
    if (statement) {
      populateDeliveryAddress(statement);
    }
  };

  

  // Handle signature image URL change (temporary implementation)
  const handleSignatureImageChange = (url: string) => {
    setSignatureImageUrl(url);
    form.setValue("signatureImage", url);
  };

  // Handle photo evidence URL change (temporary implementation)
  const handlePhotoEvidenceChange = (url: string) => {
    setPhotoEvidenceUrl(url);
    form.setValue("photoEvidence", url);
  };

  // Form submission with simplified fields only
  const handleSubmit = async (data: DeliveryReceiptFormData) => {
    try {
      // Submit data directly (URLs are already set in form)
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit delivery receipt");
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
                  Proof of Delivery <Badge variant="outline" className="text-xs">Optional</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Provide image URLs for signature and delivery photos as proof of delivery
                </p>
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                  <strong>Note:</strong> Full image upload functionality will be implemented in the future. 
                  For now, please provide direct links to images stored in cloud services.
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Signature Image URL */}
                <FormField
                  control={form.control}
                  name="signatureImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Delivery Signature Image URL
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/signature-image.jpg"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleSignatureImageChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Enter a direct link to the signature image (e.g., from Google Drive, Dropbox, etc.)
                      </p>
                      <FormMessage />
                      {signatureImageUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-green-600 mb-2">Image preview:</p>
                          <img
                            src={signatureImageUrl}
                            alt="Signature preview"
                            className="max-w-full h-32 object-contain border rounded"
                            onError={() => {
                              toast.error("Invalid image URL or image failed to load");
                            }}
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Photo Evidence URL */}
                <FormField
                  control={form.control}
                  name="photoEvidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Delivery Photo Evidence URL
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/delivery-photo.jpg"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handlePhotoEvidenceChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Enter a direct link to the delivery photo evidence
                      </p>
                      <FormMessage />
                      {photoEvidenceUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-green-600 mb-2">Image preview:</p>
                          <img
                            src={photoEvidenceUrl}
                            alt="Photo preview"
                            className="max-w-full h-48 object-contain border rounded"
                            onError={() => {
                              toast.error("Invalid image URL or image failed to load");
                            }}
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
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