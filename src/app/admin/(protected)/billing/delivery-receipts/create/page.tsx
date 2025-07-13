"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, X, Camera, Upload, Loader2, Package, Truck, MapPin, User } from "lucide-react";
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
  DeliveryReceiptFormData,
  deliveryReceiptSchema,
  Customer,
} from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";
import { ProductionOrder } from "@/types/admin/production-order";
import { createDeliveryReceipt } from "@/lib/actions/delivery-receipts";
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { getProductionOrders } from "@/lib/actions/production-order";

export default function CreateDeliveryReceiptPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  
  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState<CustomerOrder | null>(null);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<ProductionOrder | null>(null);
  
  // File upload states
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Form setup
  const form = useForm<DeliveryReceiptFormData>({
    resolver: zodResolver(deliveryReceiptSchema),
    defaultValues: {
      customerOrderId: "",
      productionOrderId: "",
      deliveryDate: new Date(),
      receivedBy: "",
      receivedByTitle: "",
      deliveryAddress: "",
      deliveryNotes: "",
      itemsDelivered: {},
      deliveryStatus: "DELIVERED",
      trackingNumber: "",
      courierService: "",
      deliveryMethod: "DELIVERY",
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
        ] = await Promise.all([
          getAllCustomers(),
          getCustomerOrders(),
          getProductionOrders(),
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
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load required data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle customer order selection
  const handleCustomerOrderSelect = async (orderId: string) => {
    const order = customerOrders.find(o => o.id === orderId);
    setSelectedCustomerOrder(order || null);
    form.setValue("customerOrderId", orderId);
    
    if (order) {
      // Auto-populate customer
      const customer = customers.find(c => c.id === order.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        
        // Auto-populate delivery address from customer
        const customerAddress = [
          customer.address,
          customer.city,
          customer.state,
          customer.postalCode,
          customer.country
        ].filter(Boolean).join(", ");
        
        form.setValue("deliveryAddress", customerAddress);
      }
      
      // Auto-populate items delivered from order
      const itemsDelivered = {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: order.orderLines?.map(line => ({
          product: line.product?.name || "Unknown Product",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })) || [],
      };
      
      form.setValue("itemsDelivered", itemsDelivered);
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
            
            // Auto-populate delivery address
            const customerAddress = [
              customer.address,
              customer.city,
              customer.state,
              customer.postalCode,
              customer.country
            ].filter(Boolean).join(", ");
            
            form.setValue("deliveryAddress", customerAddress);
          }
        }
      }
      
      // Auto-populate items delivered from production order
      const itemsDelivered = {
        productionOrderId: order.id,
        product: order.product?.name || "Unknown Product",
        quantity: order.quantity,
        completedQuantity: order.completedQuantity || 0,
      };
      
      form.setValue("itemsDelivered", itemsDelivered);
    }
  };

  // Handle signature file upload
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

  // Handle photo file upload
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

  // Form submission
  const onSubmit = async (data: DeliveryReceiptFormData) => {
    setIsSubmitting(true);
    
    try {
      // Convert files to base64 for storage (in a real app, you'd upload to cloud storage)
      let signatureBase64 = "";
      let photoBase64 = "";
      
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
      
      const result = await createDeliveryReceipt(formDataWithFiles);
      
      if (result.success) {
        toast.success("Delivery receipt created successfully");
        router.push("/admin/billing/delivery-receipts");
      } else {
        toast.error(result.error || "Failed to create delivery receipt");
      }
    } catch (error) {
      console.error("Error creating delivery receipt:", error);
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

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/delivery-receipts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Delivery Receipt</h1>
            <p className="text-muted-foreground mt-1">
              Create a new delivery receipt to track shipments and confirmations
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
            Save Receipt
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="receiptNumber">Receipt Number</Label>
                      <Input
                        id="receiptNumber"
                        placeholder="Auto-generated"
                        disabled
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Date *</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                            />
                          </FormControl>
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

              {/* Source Information */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Source Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Link this receipt to a customer order or production order
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
                </CardContent>
              </Card>

              {/* Tracking Information */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tracking Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PICKUP">Pickup</SelectItem>
                              <SelectItem value="DELIVERY">Delivery</SelectItem>
                              <SelectItem value="COURIER">Courier</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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

              {/* Proof of Delivery */}
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
              {/* Delivery Status */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Delivery Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FormField
                    control={form.control}
                    name="deliveryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
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
                </CardContent>
              </Card>

              {/* Customer Information */}
              {selectedCustomer && (
                <Card className="bg-card border rounded-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-muted-foreground">Code: {selectedCustomer.code}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">{selectedCustomer.email}</p>
                      <p className="text-sm">{selectedCustomer.phone}</p>
                    </div>
                    {selectedCustomer.address && (
                      <div className="space-y-1">
                        <p className="text-sm">{selectedCustomer.address}</p>
                        <p className="text-sm">
                          {[
                            selectedCustomer.city,
                            selectedCustomer.state,
                            selectedCustomer.postalCode,
                            selectedCustomer.country
                          ].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Order Information */}
              {selectedCustomerOrder && (
                <Card className="bg-card border rounded-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order Number:</span>
                      <Badge variant="outline">{selectedCustomerOrder.orderNumber}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order Date:</span>
                      <span className="text-sm">{new Date(selectedCustomerOrder.orderDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                      <span className="text-sm font-medium">${selectedCustomerOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <MapPin className="mr-2 h-4 w-4" />
                    Track Location
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Package className="mr-2 h-4 w-4" />
                    Print Receipt
                  </Button>
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card className="bg-muted border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="secondary">Draft</Badge>
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