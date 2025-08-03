"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Edit, Save, X, FileText, Download, Trash2, CheckCircle, Clock, AlertCircle, Loader2, Eye, Mail, Share2, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

// Import types and server actions
import { 
  BillingStatus,
  BillingStatementWithRelations,
  BillingStatementFormData, 
  billingStatementSchema,
} from "@/types/admin/billing";
import { SerializableData } from "@/lib/utils/decimal-serializer";
import { formatCurrencyPHP } from "@/lib/constant";
import { 
  getBillingStatementById,
  updateBillingStatement,
  deleteBillingStatement,
  updateBillingStatementStatus,
} from "@/lib/actions/billing-statements";
import { ShareLinkButton } from "@/components/shared/ShareLinkButton";
import { DirectShareLink } from "@/components/shared/DirectShareLink";

type SerializedBillingStatement = SerializableData<BillingStatementWithRelations>;

interface BillingStatementClientProps {
  billingStatement: SerializedBillingStatement;
  billingStatementId: string;
}

export function BillingStatementClient({ 
  billingStatement: initialBillingStatement, 
  billingStatementId 
}: BillingStatementClientProps) {
  const router = useRouter();
  
  // States
  const [billingStatement, setBillingStatement] = useState<SerializedBillingStatement>(initialBillingStatement);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  // Form setup
  const form = useForm<BillingStatementFormData>({
    resolver: zodResolver(billingStatementSchema),
    defaultValues: {
      customerId: billingStatement.customerId,
      customerOrderId: billingStatement.customerOrderId || "",
      productionOrderId: billingStatement.productionOrderId || "",
      subtotal: Number(billingStatement.salesInvoice?.subtotal || 0),
      taxRate: Number(billingStatement.salesInvoice?.taxRate || 0),
      discountAmount: Number(billingStatement.discountAmount || 0),
      paymentTerms: billingStatement.salesInvoice?.paymentTerms || "",
      dueDate: billingStatement.dueDate ? new Date(billingStatement.dueDate as unknown as string) : undefined,
      invoiceItems: billingStatement.salesInvoice?.invoiceItems?.map(item => ({
        productId: item.productId || "",
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        productCode: item.productCode || "",
        unit: item.unit || "PCS",
        discountPercent: Number(item.discountPercent || 0),
        taxable: item.taxable,
      })) || [],
      notes: billingStatement.notes || "",
      poNumber: billingStatement.salesInvoice?.poNumber || "",
      terms: billingStatement.salesInvoice?.terms || "",
      footerNotes: billingStatement.salesInvoice?.footerNotes || "",
    },
  });

  // Handle form submission
  // Generate shareable link
  const getShareableLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/billing-statement/share/${billingStatementId}`;
  };

  // Copy shareable link to clipboard
  const copyShareableLink = async () => {
    if (isCopyingLink) return;
    
    setIsCopyingLink(true);
    try {
      const shareUrl = getShareableLink();
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error("Failed to copy link to clipboard");
    } finally {
      setTimeout(() => setIsCopyingLink(false), 1000);
    }
  };

  const onSubmit = async (data: BillingStatementFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await updateBillingStatement(billingStatementId, data);
      
      if (result.success) {
        toast.success("Billing statement updated successfully");
        setIsEditing(false);
        // Refresh data
        const refreshResult = await getBillingStatementById(billingStatementId);
        if (refreshResult) {
          setBillingStatement(refreshResult);
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
    try {
      const result = await updateBillingStatementStatus(billingStatementId, BillingStatus.PAID);
      
      if (result.success) {
        toast.success("Billing statement marked as paid");
        // Refresh data
        const refreshResult = await getBillingStatementById(billingStatementId);
        if (refreshResult) {
          setBillingStatement(refreshResult);
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
    setIsDeleting(true);
    
    try {
      const result = await deleteBillingStatement(billingStatementId);
      
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

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex">
          <Link href="/admin/billing/billing-statements">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Statements
              </Button>
            </Link>
        </div>
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-4">
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
              <Button 
                onClick={copyShareableLink}
                disabled={isCopyingLink}
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                {isCopyingLink ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
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
                        value={new Date(billingStatement.billingDate as unknown as string).toLocaleDateString()} 
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
                      <p className="text-sm">{new Date(billingStatement.billingDate as unknown as string).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                      <p className="text-sm">
                        {billingStatement.dueDate 
                          ? new Date(billingStatement.dueDate as unknown as string).toLocaleDateString()
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
                    {billingStatement.salesInvoice?.invoiceItems?.map((item, index) => (
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
                          {Number(item.quantity)} {item.unit || 'PCS'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrencyPHP(Number(item.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyPHP(Number(item.totalPrice))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Related Information */}
          {(billingStatement.customerOrder || billingStatement.productionOrder || (billingStatement.deliveryReceipts && billingStatement.deliveryReceipts.length > 0)) && (
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
                
                {billingStatement.deliveryReceipts && billingStatement.deliveryReceipts.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Delivery Receipts</Label>
                    <div className="space-y-2">
                      {billingStatement.deliveryReceipts.map((receipt) => (
                        <div key={receipt.id} className="flex items-center gap-2">
                          <Badge variant="outline">{receipt.receiptNumber}</Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/billing/delivery-receipts/${receipt.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Receipt
                            </Link>
                          </Button>
                        </div>
                      ))}
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
                <span className="font-medium">{formatCurrencyPHP(Number(billingStatement.salesInvoice?.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({Number(billingStatement.salesInvoice?.taxRate)}%):</span>
                <span className="font-medium">{formatCurrencyPHP(Number(billingStatement.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium">-{formatCurrencyPHP(Number(billingStatement.discountAmount))}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-lg">{formatCurrencyPHP(Number(billingStatement.totalAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Net Amount:</span>
                <span className="font-bold text-lg text-green-600">{formatCurrencyPHP(Number(billingStatement.netAmount))}</span>
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
                  <span className="text-sm">{new Date(billingStatement.paidDate as unknown as string).toLocaleDateString()}</span>
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

          {/* Direct Share Link */}
          <DirectShareLink
            documentType="billing-statement"
            documentId={billingStatementId}
          />

          {/* Timestamps */}
          <Card className="bg-muted border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm">{new Date(billingStatement.createdAt as unknown as string).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated:</span>
                <span className="text-sm">{new Date(billingStatement.updatedAt as unknown as string).toLocaleDateString()}</span>
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