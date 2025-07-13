"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Edit, Save, X, FileText, Download, Trash2, CheckCircle, Clock, AlertCircle, Loader2, Eye, Mail } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import types and server actions
import { 
  BillingStatement,
  BillingStatus,
  BillingStatementWithDetails,
  BillingStatementFormData, 
  billingStatementSchema,
} from "@/types/admin/billing";
import { 
  getBillingStatementById,
  updateBillingStatement,
  deleteBillingStatement,
  markBillingStatementAsPaid,
  markBillingStatementAsOverdue,
} from "@/lib/actions/billing-statements";

interface BillingStatementPageProps {
  params: { id: string };
}

export default function BillingStatementPage({ params }: BillingStatementPageProps) {
  const router = useRouter();
  const { id } = params;
  
  // States
  const [billingStatement, setBillingStatement] = useState<BillingStatementWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form setup
  const form = useForm<BillingStatementFormData>({
    resolver: zodResolver(billingStatementSchema),
    defaultValues: {
      customerId: "",
      customerOrderId: "",
      productionOrderId: "",
      deliveryReceiptId: "",
      subtotal: 0,
      taxRate: 0,
      discountAmount: 0,
      paymentTerms: "",
      dueDate: undefined,
      invoiceItems: [],
      notes: "",
      poNumber: "",
      terms: "",
      footerNotes: "",
    },
  });

  // Load billing statement data
  useEffect(() => {
    const loadBillingStatement = async () => {
      setIsLoading(true);
      try {
        const result = await getBillingStatementById(id);
        
        if (result.success && result.data) {
          setBillingStatement(result.data);
          
          // Populate form with current data
          form.reset({
            customerId: result.data.customerId,
            customerOrderId: result.data.customerOrderId || "",
            productionOrderId: result.data.productionOrderId || "",
            deliveryReceiptId: result.data.deliveryReceiptId || "",
            subtotal: result.data.salesInvoice.subtotal,
            taxRate: result.data.salesInvoice.taxRate,
            discountAmount: result.data.discountAmount,
            paymentTerms: result.data.salesInvoice.paymentTerms || "",
            dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
            invoiceItems: result.data.salesInvoice.invoiceItems.map(item => ({
              productId: item.productId || "",
              materialId: item.materialId || "",
              inventoryItemId: item.inventoryItemId || "",
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              productCode: item.productCode || "",
              unit: item.unit || "PCS",
              discountPercent: item.discountPercent || 0,
              taxable: item.taxable,
            })),
            notes: result.data.notes || "",
            poNumber: result.data.salesInvoice.poNumber || "",
            terms: result.data.salesInvoice.terms || "",
            footerNotes: result.data.salesInvoice.footerNotes || "",
          });
        } else {
          toast.error(result.error || "Failed to load billing statement");
          router.push("/admin/billing/billing-statements");
        }
      } catch (error) {
        console.error("Error loading billing statement:", error);
        toast.error("An unexpected error occurred");
        router.push("/admin/billing/billing-statements");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadBillingStatement();
    }
  }, [id, form, router]);

  // Handle form submission
  const onSubmit = async (data: BillingStatementFormData) => {
    if (!billingStatement) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updateBillingStatement(billingStatement.id, data);
      
      if (result.success) {
        toast.success("Billing statement updated successfully");
        setIsEditing(false);
        // Refresh data
        const refreshResult = await getBillingStatementById(id);
        if (refreshResult.success && refreshResult.data) {
          setBillingStatement(refreshResult.data);
        }
      } else {
        toast.error(result.error || "Failed to update billing statement");
      }
    } catch (error) {
      console.error("Error updating billing statement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async () => {
    if (!billingStatement) return;
    
    try {
      const result = await markBillingStatementAsPaid(billingStatement.id);
      
      if (result.success) {
        toast.success("Billing statement marked as paid");
        // Refresh data
        const refreshResult = await getBillingStatementById(id);
        if (refreshResult.success && refreshResult.data) {
          setBillingStatement(refreshResult.data);
        }
      } else {
        toast.error(result.error || "Failed to mark as paid");
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!billingStatement) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteBillingStatement(billingStatement.id);
      
      if (result.success) {
        toast.success("Billing statement deleted successfully");
        router.push("/admin/billing/billing-statements");
      } else {
        toast.error(result.error || "Failed to delete billing statement");
      }
    } catch (error) {
      console.error("Error deleting billing statement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: BillingStatus) => {
    switch (status) {
      case "PAID":
        return "default";
      case "SENT":
        return "secondary";
      case "OVERDUE":
        return "destructive";
      case "DRAFT":
        return "outline";
      case "CANCELLED":
        return "outline";
      case "DISPUTED":
        return "destructive";
      case "PARTIAL":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getStatusIcon = (status: BillingStatus) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4" />;
      case "OVERDUE":
        return <AlertCircle className="h-4 w-4" />;
      case "SENT":
        return <Mail className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
  if (!billingStatement) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Billing Statement Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The billing statement you're looking for doesn't exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/admin/billing/billing-statements">
                Back to Billing Statements
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {billingStatement.statementNumber}
              </h1>
              <Badge variant={getStatusBadgeVariant(billingStatement.status)} className="flex items-center gap-1">
                {getStatusIcon(billingStatement.status)}
                {billingStatement.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Billing statement for {billingStatement.customer.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {billingStatement.status !== "PAID" && billingStatement.status !== "CANCELLED" && (
                <Button size="sm" onClick={handleMarkAsPaid}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Billing Statement</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this billing statement? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsEditing(false);
                  form.reset();
                }}
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
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Billing Statement Details */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Billing Statement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <Form {...form}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Statement Number</Label>
                      <Input value={billingStatement.statementNumber} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Input value={billingStatement.customer.name} disabled />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Billing Date</Label>
                      <Input 
                        value={new Date(billingStatement.billingDate).toLocaleDateString()} 
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
                            placeholder="Additional notes..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Statement Number</Label>
                      <p className="text-sm">{billingStatement.statementNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                      <p className="text-sm">{billingStatement.customer.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Billing Date</Label>
                      <p className="text-sm">{new Date(billingStatement.billingDate).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                      <p className="text-sm">
                        {billingStatement.dueDate 
                          ? new Date(billingStatement.dueDate).toLocaleDateString()
                          : "Not set"
                        }
                      </p>
                    </div>
                  </div>

                  {billingStatement.notes && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                      <p className="text-sm">{billingStatement.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Sales Invoice Items */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingStatement.salesInvoice.invoiceItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.productCode && (
                              <p className="text-sm text-muted-foreground">SKU: {item.productCode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit || 'PCS'}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${item.totalPrice.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Related Information */}
          {(billingStatement.customerOrder || billingStatement.productionOrder || billingStatement.deliveryReceipt) && (
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Related Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {billingStatement.customerOrder && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Customer Order</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{billingStatement.customerOrder.orderNumber}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/customer-orders/${billingStatement.customerOrder.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Order
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
                
                {billingStatement.productionOrder && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Production Order</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Production #{billingStatement.productionOrder.id}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/production/${billingStatement.productionOrder.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Production
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
                
                {billingStatement.deliveryReceipt && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Delivery Receipt</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{billingStatement.deliveryReceipt.receiptNumber}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/billing/delivery-receipts/${billingStatement.deliveryReceipt.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Receipt
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${billingStatement.salesInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({billingStatement.salesInvoice.taxRate}%):</span>
                <span className="font-medium">${billingStatement.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium">-${billingStatement.discountAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-lg">${billingStatement.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Net Amount:</span>
                <span className="font-bold text-lg text-green-600">${billingStatement.netAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={getStatusBadgeVariant(billingStatement.status)} className="flex items-center gap-1">
                  {getStatusIcon(billingStatement.status)}
                  {billingStatement.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Terms:</span>
                <span className="text-sm">{billingStatement.salesInvoice.paymentTerms || "Not specified"}</span>
              </div>
              {billingStatement.paidDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid Date:</span>
                  <span className="text-sm">{new Date(billingStatement.paidDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="font-medium">{billingStatement.customer.name}</p>
                <p className="text-sm text-muted-foreground">Code: {billingStatement.customer.code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm">{billingStatement.customer.email}</p>
                <p className="text-sm">{billingStatement.customer.phone}</p>
              </div>
              {billingStatement.customer.address && (
                <div className="space-y-1">
                  <p className="text-sm">{billingStatement.customer.address}</p>
                  <p className="text-sm">
                    {[
                      billingStatement.customer.city,
                      billingStatement.customer.state,
                      billingStatement.customer.postalCode,
                      billingStatement.customer.country
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/admin/customers/${billingStatement.customer.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Customer
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="bg-muted border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm">{new Date(billingStatement.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated:</span>
                <span className="text-sm">{new Date(billingStatement.updatedAt).toLocaleDateString()}</span>
              </div>
              {billingStatement.createdByUser && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created by:</span>
                  <span className="text-sm">{billingStatement.createdByUser.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 