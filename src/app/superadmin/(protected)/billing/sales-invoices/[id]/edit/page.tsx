"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, X, Plus, Calculator, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrencyPHP } from "@/lib/constant";

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
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import types and server actions
import { 
  SalesInvoiceFormData,
  salesInvoiceSchema,
  SalesInvoiceItemFormData,
  SalesInvoiceWithItems,
} from "@/types/admin/billing";
import { getSalesInvoiceById, updateSalesInvoice } from "@/lib/actions/superadmin/sales-invoices";

export default function SuperAdminEditSalesInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<SalesInvoiceWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [invoiceItems, setInvoiceItems] = useState<SalesInvoiceItemFormData[]>([]);

  // Form setup
  const form = useForm<Partial<SalesInvoiceFormData>>({
    resolver: zodResolver(salesInvoiceSchema.partial()),
    defaultValues: {
      subtotal: 0,
      taxRate: 12,
      discountAmount: 0,
      paymentTerms: "Net 30",
      invoiceItems: [],
      poNumber: "",
      terms: "",
      footerNotes: "",
    },
  });

  // Load invoice data
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const invoiceData = await getSalesInvoiceById(invoiceId);
        if (invoiceData) {
          setInvoice(invoiceData);
          
          // Populate form with existing data
          form.setValue("subtotal", Number(invoiceData.subtotal));
          form.setValue("taxRate", Number(invoiceData.taxRate));
          form.setValue("discountAmount", Number(invoiceData.discountAmount));
          form.setValue("paymentTerms", invoiceData.paymentTerms || "Net 30");
          form.setValue("dueDate", invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined);
          form.setValue("poNumber", invoiceData.poNumber || "");
          form.setValue("terms", invoiceData.terms || "");
          form.setValue("footerNotes", invoiceData.footerNotes || "");
          
          // Convert invoice items to form data
          const formItems: SalesInvoiceItemFormData[] = invoiceData.invoiceItems?.map(item => ({
            productId: item.productId || undefined,
            materialId: item.material?.id || undefined,
            inventoryItemId: item.inventoryItem?.id || undefined,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            productCode: item.productCode || "",
            unit: item.unit || "PCS",
            discountPercent: Number(item.discountPercent) || 0,
            taxable: item.taxable,
          })) || [];
          
          setInvoiceItems(formItems);
          form.setValue("invoiceItems", formItems);
        }
      } catch (error) {
        console.error("Error loading invoice:", error);
        toast.error("Failed to load invoice");
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId, form]);

  // Calculate totals
  const calculateTotals = (subtotal: number, taxRate: number, discountAmount: number) => {
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    // Update form values
    form.setValue("subtotal", subtotal);
    form.setValue("taxRate", taxRate);
    form.setValue("discountAmount", discountAmount);
  };

  // Add invoice item
  const addInvoiceItem = () => {
    const newItem: SalesInvoiceItemFormData = {
      description: "",
      quantity: 0,
      unitPrice: 0,
      productCode: "",
      unit: "PCS",
      discountPercent: 0,
      taxable: true,
    };
    
    const updatedItems = [...invoiceItems, newItem];
    setInvoiceItems(updatedItems);
    form.setValue("invoiceItems", updatedItems);
  };

  // Remove invoice item
  const removeInvoiceItem = (index: number) => {
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
    form.setValue("invoiceItems", updatedItems);
    
    // Recalculate subtotal
    const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    form.setValue("subtotal", newSubtotal);
    calculateTotals(newSubtotal, form.getValues("taxRate") || 0, form.getValues("discountAmount") || 0);
  };

  // Update invoice item
  const updateInvoiceItem = (index: number, field: keyof SalesInvoiceItemFormData, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoiceItems(updatedItems);
    form.setValue("invoiceItems", updatedItems);
    
    // Recalculate subtotal
    const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    form.setValue("subtotal", newSubtotal);
    calculateTotals(newSubtotal, form.getValues("taxRate") || 0, form.getValues("discountAmount") || 0);
  };

  // Form submission
  const onSubmit = async (data: Partial<SalesInvoiceFormData>) => {
    if (!invoice) return;

    setIsSubmitting(true);
    
    try {
      const result = await updateSalesInvoice(invoice.id, data);
      
      if (result.success) {
        toast.success("Sales invoice updated successfully");
        router.push(`/superadmin/billing/sales-invoices/${invoice.id}`);
      } else {
        toast.error(result.error || "Failed to update sales invoice");
      }
    } catch (error) {
      console.error("Error updating sales invoice:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Not found state
  if (!invoice) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Invoice Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested sales invoice could not be found.
            </p>
            <Button asChild>
              <Link href="/superadmin/billing/sales-invoices">
                Back to Invoices
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if invoice can be edited
  if (invoice.status !== "DRAFT") {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Cannot Edit Invoice</h3>
            <p className="text-muted-foreground mb-4">
              Only draft invoices can be edited. This invoice has status: {invoice.status}
            </p>
            <Button asChild>
              <Link href={`/superadmin/billing/sales-invoices/${invoice.id}`}>
                View Invoice
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formValues = form.watch();
  const subtotal = formValues.subtotal || 0;
  const taxRate = formValues.taxRate || 0;
  const discountAmount = formValues.discountAmount || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount - discountAmount;

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/superadmin/billing/sales-invoices/${invoice.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoice
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              Modify sales invoice details and items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Billing Statement Information */}
              {invoice.billingStatement && (
                <Card className="bg-card border rounded-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Billing Statement Information</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      This invoice is linked to a billing statement and cannot be changed.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertDescription>
                        <div className="space-y-2">
                          <div><strong>Statement Number:</strong> {invoice.billingStatement.statementNumber}</div>
                          <div><strong>Customer:</strong> {invoice.billingStatement.customerName}</div>
                          <div><strong>Statement Amount:</strong> {formatCurrencyPHP(Number(invoice.billingStatement.totalAmount))}</div>
                          {invoice.billingStatement.customerOrder && (
                            <div><strong>Customer Order:</strong> {invoice.billingStatement.customerOrder.orderNumber}</div>
                          )}
                          {invoice.billingStatement.productionOrder && (
                            <div><strong>Production Order:</strong> {invoice.billingStatement.productionOrder.product?.name || 'N/A'}</div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Basic Information */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Invoice Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        value={invoice.invoiceNumber}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceDate">Invoice Date</Label>
                      <Input
                        id="invoiceDate"
                        type="date"
                        value={new Date(invoice.invoiceDate).toISOString().split('T')[0]}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select terms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Net 30">Net 30 Days</SelectItem>
                              <SelectItem value="Net 15">Net 15 Days</SelectItem>
                              <SelectItem value="Net 60">Net 60 Days</SelectItem>
                              <SelectItem value="COD">Cash on Delivery</SelectItem>
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
                      name="poNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PO Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Customer PO number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Invoice Items</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Modify items included in the sales invoice
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          {invoiceItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Description *</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              step="0.001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price *</Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Product Code</Label>
                            <Input
                              value={item.productCode || ''}
                              onChange={(e) => updateInvoiceItem(index, 'productCode', e.target.value)}
                              placeholder="SKU/Code"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit</Label>
                            <Select 
                              value={item.unit || 'PCS'} 
                              onValueChange={(value) => updateInvoiceItem(index, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PCS">PCS</SelectItem>
                                <SelectItem value="KG">KG</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="BOX">BOX</SelectItem>
                                <SelectItem value="SET">SET</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Discount %</Label>
                            <Input
                              type="number"
                              value={item.discountPercent || 0}
                              onChange={(e) => updateInvoiceItem(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`taxable-${index}`}
                              checked={item.taxable}
                              onChange={(e) => updateInvoiceItem(index, 'taxable', e.target.checked)}
                            />
                            <Label htmlFor={`taxable-${index}`}>Taxable</Label>
                          </div>
                          <div className="text-sm font-medium">
                            Total: {formatCurrencyPHP(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInvoiceItem}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms & Conditions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Terms and conditions..."
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
                    name="footerNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes for the footer..."
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
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              {/* Invoice Summary */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrencyPHP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                      <span className="font-medium">{formatCurrencyPHP(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium">-{formatCurrencyPHP(discountAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-lg">{formatCurrencyPHP(totalAmount)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                calculateTotals(subtotal, value, discountAmount);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="discountAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                calculateTotals(subtotal, taxRate, value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
