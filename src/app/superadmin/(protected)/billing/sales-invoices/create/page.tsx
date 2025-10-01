"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, X, Plus, Calculator, Loader2, Trash2, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import types and server actions
import { 
  SalesInvoiceFormData,
  salesInvoiceSchema,
  SalesInvoiceItemFormData,
  Customer,
  BillingStatement,
} from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";
import { ProductionOrder } from "@/types/admin/production-order";
import { Product } from "@/types/admin/product";
import { createSalesInvoice } from "@/lib/actions/superadmin/sales-invoices";
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { getProductionOrders } from "@/lib/actions/production-order";
import { getAllBillingStatements } from "@/lib/actions/superadmin/billing-statements";

export default function SuperAdminCreateSalesInvoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [billingStatements, setBillingStatements] = useState<BillingStatement[]>([]);
  const [selectedBillingStatement, setSelectedBillingStatement] = useState<BillingStatement | null>(null);
  
  // Form states
  const [invoiceItems, setInvoiceItems] = useState<SalesInvoiceItemFormData[]>([
    {
      description: "",
      quantity: 0,
      unitPrice: 0,
      productCode: "",
      unit: "PCS",
      discountPercent: 0,
      taxable: true,
    },
  ]);

  // Form setup
  const form = useForm<SalesInvoiceFormData>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: {
      billingStatementId: "", // Required field
      subtotal: 0,
      taxRate: 12, // Default 12% tax
      discountAmount: 0,
      paymentTerms: "Net 30",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      invoiceItems: invoiceItems,
      poNumber: "",
      terms: "",
      footerNotes: "",
    },
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load billing statements that don't have invoices yet
        const billingStatementsResult = await getAllBillingStatements({}, 1, 100);
        
        if (billingStatementsResult.data) {
          // Filter out billing statements that already have sales invoices
          const availableStatements = billingStatementsResult.data.filter(
            statement => !statement.salesInvoice
          );
          setBillingStatements(availableStatements);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load billing statements");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle billing statement selection
  const handleBillingStatementSelect = (billingStatementId: string) => {
    const statement = billingStatements.find(s => s.id === billingStatementId);
    setSelectedBillingStatement(statement || null);
    form.setValue("billingStatementId", billingStatementId);
    
    if (statement) {
      // Auto-populate form values from billing statement
      form.setValue("subtotal", Number(statement.totalAmount));
      form.setValue("taxRate", (Number(statement.taxAmount) / Number(statement.totalAmount)) * 100);
      form.setValue("discountAmount", Number(statement.discountAmount));
      
      // Set default payment terms and due date
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      form.setValue("dueDate", dueDate);
      form.setValue("paymentTerms", "Net 30");
      
      // Create default invoice item from billing statement
      const defaultItem: SalesInvoiceItemFormData = {
        description: `Billing for ${statement.customerName}`,
        quantity: 1,
        unitPrice: Number(statement.totalAmount),
        productCode: "",
        unit: "LOT",
        discountPercent: 0,
        taxable: true,
      };
      
      setInvoiceItems([defaultItem]);
      form.setValue("invoiceItems", [defaultItem]);
    }
  };

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
    calculateTotals(newSubtotal, form.getValues("taxRate"), form.getValues("discountAmount"));
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
    calculateTotals(newSubtotal, form.getValues("taxRate"), form.getValues("discountAmount"));
  };

  // Form submission
  const onSubmit = async (data: SalesInvoiceFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await createSalesInvoice(data);
      
      if (result.success) {
        toast.success("Sales invoice created successfully");
        router.push("/superadmin/billing/sales-invoices");
      } else {
        toast.error(result.error || "Failed to create sales invoice");
      }
    } catch (error) {
      console.error("Error creating sales invoice:", error);
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
          <Link href="/superadmin/billing/sales-invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Sales Invoice</h1>
            <p className="text-muted-foreground mt-1">
              Create a new sales invoice for billing customers
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
            Save Invoice
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Invoice Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
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
                                  {statement.statementNumber} - {statement.customerName} - {formatCurrencyPHP(Number(statement.totalAmount))}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Display selected billing statement info */}
                  {selectedBillingStatement && (
                    <Alert>
                      <AlertDescription>
                        <div className="space-y-2">
                          <div><strong>Customer:</strong> {selectedBillingStatement.customerName}</div>
                          <div><strong>Statement Number:</strong> {selectedBillingStatement.statementNumber}</div>
                          <div><strong>Total Amount:</strong> {formatCurrencyPHP(Number(selectedBillingStatement.totalAmount))}</div>
                          {selectedBillingStatement.customerOrder && (
                            <div><strong>Customer Order:</strong> {selectedBillingStatement.customerOrder.orderNumber}</div>
                          )}
                          {selectedBillingStatement.productionOrder && (
                            <div><strong>Production Order:</strong> {selectedBillingStatement.productionOrder.product?.name || 'N/A'}</div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        placeholder="Auto-generated"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceDate">Invoice Date</Label>
                      <Input
                        id="invoiceDate"
                        type="date"
                        value={new Date().toISOString().split('T')[0]}
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
                    Add items to be included in the sales invoice
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

              {/* Quick Actions */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Search className="mr-2 h-4 w-4" />
                    Preview Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
