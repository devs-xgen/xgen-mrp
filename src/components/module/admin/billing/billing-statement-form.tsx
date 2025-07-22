"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, Calculator } from "lucide-react";
import { toast } from "sonner";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  BillingStatementFormData,
  SalesInvoiceItemFormData,
  billingStatementSchema,
} from "@/types/admin/billing";
import { Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { formatCurrencyPHP } from "@/lib/constant";



interface BillingStatementFormProps {
  onSubmit: (data: BillingStatementFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<BillingStatementFormData>;
}

export function BillingStatementForm({
  onSubmit,
  isSubmitting = false,
  initialData,
}: BillingStatementFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState<CustomerOrder | null>(null);
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

  const form = useForm<BillingStatementFormData>({
    resolver: zodResolver(billingStatementSchema),
    defaultValues: {
      customerName: "",
      customerId: "",
      customerOrderId: "",
      productionOrderId: "",
      subtotal: 0,
      taxRate: 12, // Default 12% tax
      discountAmount: 0,
      paymentTerms: "Net 30",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      invoiceItems: invoiceItems,
      notes: "",
      poNumber: "",
      terms: "",
      footerNotes: "",
      ...initialData,
    },
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [customersResult, customerOrdersResult] = await Promise.all([
          getAllCustomers(),
          getCustomerOrders(),
        ]);

        setCustomers(customersResult || []);
        setCustomerOrders(customerOrdersResult || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load required data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    setSelectedCustomerOrder(null); // Clear customer order selection
    
    form.setValue("customerId", customerId);
    form.setValue("customerOrderId", ""); // Clear customer order
    
    if (customer) {
      // Auto-populate customer name
      form.setValue("customerName", customer.name);
    }
  };

  // Handle customer order selection
  const handleCustomerOrderSelect = (customerOrderId: string) => {
    const customerOrder = customerOrders.find(o => o.id === customerOrderId);
    setSelectedCustomerOrder(customerOrder || null);
    setSelectedCustomer(null); // Clear direct customer selection
    
    form.setValue("customerOrderId", customerOrderId);
    form.setValue("customerId", ""); // Clear direct customer
    
    if (customerOrder && customerOrder.customer) {
      // Auto-populate customer name from order
      form.setValue("customerName", customerOrder.customer.name);
      
      // Auto-populate amounts from order
      form.setValue("subtotal", customerOrder.totalAmount);
      calculateTotals(customerOrder.totalAmount, form.getValues("taxRate"), form.getValues("discountAmount"));
      
      // Auto-populate invoice items from order lines if available
      if (customerOrder.orderLines && customerOrder.orderLines.length > 0) {
        const orderItems: SalesInvoiceItemFormData[] = customerOrder.orderLines.map(line => ({
          productId: line.productId,
          description: line.product?.name || "",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          productCode: line.product?.sku || "",
          unit: "PCS",
          discountPercent: 0,
          taxable: true,
        }));
        
        setInvoiceItems(orderItems);
        form.setValue("invoiceItems", orderItems);
      }
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
  const handleSubmit = async (data: BillingStatementFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formValues = form.watch();
  const subtotal = formValues.subtotal || 0;
  const taxRate = formValues.taxRate || 0;
  const discountAmount = formValues.discountAmount || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount - discountAmount;
  const netAmount = totalAmount;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Customer Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select either a direct customer or a customer order
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direct Customer</FormLabel>
                        <Select 
                          onValueChange={handleCustomerSelect} 
                          value={field.value}
                          disabled={!!form.getValues("customerOrderId")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} - {customer.email}
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
                    name="customerOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Order</FormLabel>
                        <Select 
                          onValueChange={handleCustomerOrderSelect} 
                          value={field.value}
                          disabled={!!form.getValues("customerId")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customerOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.orderNumber} - {order.customer?.name} - {formatCurrencyPHP(order.totalAmount)}
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
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Customer name (auto-populated)"
                          {...field}
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show selected customer/order info */}
                {selectedCustomer && (
                  <Alert>
                    <AlertDescription>
                      <strong>Selected Customer:</strong> {selectedCustomer.name}
                      {selectedCustomer.email && ` (${selectedCustomer.email})`}
                    </AlertDescription>
                  </Alert>
                )}

                {selectedCustomerOrder && (
                  <Alert>
                    <AlertDescription>
                      <strong>Selected Order:</strong> {selectedCustomerOrder.orderNumber} - {selectedCustomerOrder.customer?.name}
                      <br />
                      <strong>Order Total:</strong> {formatCurrencyPHP(selectedCustomerOrder.totalAmount)}
                      <br />
                      <strong>Order Date:</strong> {new Date(selectedCustomerOrder.orderDate).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="statementNumber">Statement Number</Label>
                    <Input
                      id="statementNumber"
                      placeholder="Auto-generated"
                      disabled
                    />
                  </div>
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
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes for this billing statement..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Invoice Items</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add items to be included in the billing statement
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
                            <X className="h-4 w-4" />
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
            <Card className="bg-card border rounded-lg sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrencyPHP(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tax ({taxRate}%):</span>
                    <span className="font-medium">{formatCurrencyPHP(taxAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Discount:</span>
                    <span className="font-medium">-{formatCurrencyPHP(discountAmount)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-lg">{formatCurrencyPHP(totalAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Net Amount:</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrencyPHP(netAmount)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create Billing Statement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}