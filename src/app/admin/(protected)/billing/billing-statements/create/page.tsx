"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Metadata } from "next";
import { ArrowLeft, Save, X, Search, Plus, Calculator, Loader2 } from "lucide-react";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormDescription,
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
  BillingStatementFormData, 
  billingStatementSchema,
  SalesInvoiceItemFormData,
  Customer,
  DeliveryReceipt,
  SalesInvoice,
} from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";
import { ProductionOrder } from "@/types/admin/production-order";
import { Product } from "@/types/admin/product";
import { Material } from "@/types/admin/materials";
import { createBillingStatement } from "@/lib/actions/billing-statements";
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { getProductionOrders } from "@/lib/actions/production-order";
import { getAllDeliveryReceipts } from "@/lib/actions/delivery-receipts";
import { getAllSalesInvoices } from "@/lib/actions/sales-invoices";

export default function CreateBillingStatementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [deliveryReceipts, setDeliveryReceipts] = useState<DeliveryReceipt[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState<CustomerOrder | null>(null);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<ProductionOrder | null>(null);
  const [selectedDeliveryReceipt, setSelectedDeliveryReceipt] = useState<DeliveryReceipt | null>(null);
  const [selectedSalesInvoice, setSelectedSalesInvoice] = useState<SalesInvoice | null>(null);
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
  const form = useForm<BillingStatementFormData>({
    resolver: zodResolver(billingStatementSchema),
    defaultValues: {
      customerId: "",
      customerOrderId: "",
      productionOrderId: "",
      deliveryReceiptId: "",
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
    },
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load all required data in parallel
        const [
          customersResult,
          customerOrdersResult,
          productionOrdersResult,
          deliveryReceiptsResult,
          salesInvoicesResult,
        ] = await Promise.all([
          getAllCustomers(),
          getCustomerOrders(),
          getProductionOrders(),
          getAllDeliveryReceipts(),
          getAllSalesInvoices(),
        ]);

        if (customersResult.success && customersResult.data) {
          setCustomers(customersResult.data);
        }
        if (customerOrdersResult && Array.isArray(customerOrdersResult)) {
          setCustomerOrders(customerOrdersResult);
        }
        if (productionOrdersResult && Array.isArray(productionOrdersResult)) {
          setProductionOrders(productionOrdersResult);
        }
        if (deliveryReceiptsResult.data && Array.isArray(deliveryReceiptsResult.data)) {
          setDeliveryReceipts(deliveryReceiptsResult.data);
        }
        if (salesInvoicesResult.data && Array.isArray(salesInvoicesResult.data)) {
          setSalesInvoices(salesInvoicesResult.data);
        }
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
    form.setValue("customerId", customerId);
    
    // Reset dependent fields
    form.setValue("customerOrderId", "");
    form.setValue("productionOrderId", "");
    setSelectedCustomerOrder(null);
    setSelectedProductionOrder(null);
  };

  // Handle customer order selection
  const handleCustomerOrderSelect = async (orderId: string) => {
    const order = customerOrders.find(o => o.id === orderId);
    setSelectedCustomerOrder(order || null);
    form.setValue("customerOrderId", orderId);
    
    if (order) {
      // Auto-populate customer if not already selected
      if (!selectedCustomer && order.customerId) {
        const customer = customers.find(c => c.id === order.customerId);
        if (customer) {
          setSelectedCustomer(customer);
          form.setValue("customerId", customer.id);
        }
      }
      
      // Auto-populate amounts from order
      form.setValue("subtotal", order.totalAmount);
      calculateTotals(order.totalAmount, form.getValues("taxRate"), form.getValues("discountAmount"));
    }
  };

  // Handle production order selection
  const handleProductionOrderSelect = async (orderId: string) => {
    const order = productionOrders.find(o => o.id === orderId);
    setSelectedProductionOrder(order || null);
    form.setValue("productionOrderId", orderId);
    
    if (order) {
      // Auto-populate customer from linked customer order
      if (order.customerOrderId) {
        const customerOrder = customerOrders.find(co => co.id === order.customerOrderId);
        if (customerOrder) {
          setSelectedCustomerOrder(customerOrder);
          form.setValue("customerOrderId", customerOrder.id);
          
          const customer = customers.find(c => c.id === customerOrder.customerId);
          if (customer) {
            setSelectedCustomer(customer);
            form.setValue("customerId", customer.id);
          }
        }
      }
      
      // Calculate amount from production order
      const amount = order.quantity * 100 || 0; // Default price, would need to be calculated properly
      form.setValue("subtotal", amount);
      calculateTotals(amount, form.getValues("taxRate"), form.getValues("discountAmount"));
    }
  };

  // Handle sales invoice selection
  const handleSalesInvoiceSelect = (invoiceId: string) => {
    const invoice = salesInvoices.find(i => i.id === invoiceId);
    setSelectedSalesInvoice(invoice || null);
    
    if (invoice) {
      // Auto-populate amounts from invoice
      form.setValue("subtotal", invoice.subtotal);
      form.setValue("taxRate", invoice.taxRate);
      form.setValue("discountAmount", invoice.discountAmount);
      form.setValue("paymentTerms", invoice.paymentTerms || "Net 30");
      form.setValue("dueDate", invoice.dueDate);
      form.setValue("poNumber", invoice.poNumber || "");
      form.setValue("terms", invoice.terms || "");
      form.setValue("footerNotes", invoice.footerNotes || "");
      
      calculateTotals(invoice.subtotal, invoice.taxRate, invoice.discountAmount);
    }
  };

  // Calculate totals
  const calculateTotals = (subtotal: number, taxRate: number, discountAmount: number) => {
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const netAmount = totalAmount;
    
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
  const onSubmit = async (data: BillingStatementFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await createBillingStatement(data);
      
      if (result.success) {
        toast.success("Billing statement created successfully");
        router.push("/admin/billing/billing-statements");
      } else {
        toast.error(result.error || "Failed to create billing statement");
      }
    } catch (error) {
      console.error("Error creating billing statement:", error);
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
  const netAmount = totalAmount;

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/billing-statements">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Statements
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Billing Statement</h1>
            <p className="text-muted-foreground mt-1">
              Create a new billing statement for a customer order or production
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
            Save Statement
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
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer *</FormLabel>
                          <Select onValueChange={handleCustomerSelect} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name} ({customer.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingDate">Billing Date *</Label>
                      <Input
                        id="billingDate"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
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

              {/* Source Information */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Source Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Link this statement to a customer order or production order
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Order</FormLabel>
                          <Select onValueChange={handleCustomerOrderSelect} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer order" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customerOrders.map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.orderNumber} - ${order.totalAmount.toLocaleString()}
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
                      name="productionOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Production Order</FormLabel>
                          <Select onValueChange={handleProductionOrderSelect} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select production order" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productionOrders.map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.product?.name || "Unknown Product"} - Qty: {order.quantity}
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
                    name="deliveryReceiptId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Receipt (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery receipt" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deliveryReceipts.map((receipt) => (
                              <SelectItem key={receipt.id} value={receipt.id}>
                                {receipt.receiptNumber} - {new Date(receipt.deliveryDate).toLocaleDateString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            Total: ${(item.quantity * item.unitPrice).toFixed(2)}
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
              {/* Billing Summary */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                      <span className="font-medium">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Net Amount:</span>
                      <span className="font-bold text-lg">${netAmount.toFixed(2)}</span>
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
                    Preview Statement
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                  </Button>
                </CardContent>
              </Card>

              {/* Status Information */}
              <Card className="bg-muted border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Status Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created by:</span>
                    <span className="text-sm">Current User</span>
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