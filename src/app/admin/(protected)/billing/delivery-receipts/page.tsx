import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, Truck, Search, Filter, Download, MoreHorizontal, Eye, Edit, Camera, FileText, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Import server actions and types
import { getAllDeliveryReceipts, getDeliveryAnalytics } from "@/lib/actions/delivery-receipts";
import { DeliveryReceiptWithBilling, DeliveryStatus } from "@/types/admin/billing";

export const metadata: Metadata = {
  title: "Delivery Receipts",
  description: "Track delivery confirmations and manage delivery receipts",
};

interface DeliveryReceiptsListProps {
  receipts: DeliveryReceiptWithBilling[];
}

function DeliveryReceiptsList({ receipts }: DeliveryReceiptsListProps) {
  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "IN_TRANSIT":
        return <Badge variant="outline" className="bg-blue-500 text-white">In Transit</Badge>;
      case "DELIVERED":
        return <Badge variant="default" className="bg-green-500 text-white">Delivered</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "RETURNED":
        return <Badge variant="secondary" className="bg-orange-500 text-white">Returned</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryMethodBadge = (method: string | null) => {
    switch (method) {
      case "COURIER":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600">Courier</Badge>;
      case "PICKUP":
        return <Badge variant="outline" className="bg-green-50 text-green-600">Pickup</Badge>;
      case "DELIVERY":
        return <Badge variant="outline" className="bg-purple-50 text-purple-600">Delivery</Badge>;
      default:
        return <Badge variant="outline">{method || 'Unknown'}</Badge>;
    }
  };

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Truck className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No delivery receipts found</h3>
        <p className="text-muted-foreground mb-4">Get started by creating your first delivery receipt.</p>
        <Button asChild>
          <Link href="/admin/billing/delivery-receipts/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Receipt
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 border-b">
            <TableHead className="p-4 text-left font-medium">Receipt #</TableHead>
            <TableHead className="p-4 text-left font-medium">Customer</TableHead>
            <TableHead className="p-4 text-left font-medium">Delivery Date</TableHead>
            <TableHead className="p-4 text-left font-medium">Received By</TableHead>
            <TableHead className="p-4 text-left font-medium">Status</TableHead>
            <TableHead className="p-4 text-left font-medium">Method</TableHead>
            <TableHead className="p-4 text-left font-medium">Tracking</TableHead>
            <TableHead className="p-4 text-left font-medium">Proof</TableHead>
            <TableHead className="p-4 text-left font-medium">Linked</TableHead>
            <TableHead className="p-4 text-left font-medium w-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => {
            const itemsDelivered = Array.isArray(receipt.itemsDelivered) ? receipt.itemsDelivered : [];
            const itemsCount = itemsDelivered.length;
            
            return (
              <TableRow key={receipt.id} className="border-b hover:bg-muted/30 transition-colors">
                <TableCell className="p-4 align-middle font-medium">
                  {receipt.receiptNumber}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {receipt.billingStatements && receipt.billingStatements.length > 0 ? (
                    <div>
                      <div className="font-medium">{receipt.billingStatements[0].customer?.name}</div>
                      <div className="text-sm text-muted-foreground">{receipt.billingStatements[0].customer?.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No customer linked</span>
                  )}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {new Date(receipt.deliveryDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {receipt.receivedBy ? (
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{receipt.receivedBy}</div>
                      {receipt.receivedByTitle && (
                        <div className="text-xs text-muted-foreground">{receipt.receivedByTitle}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not received</span>
                  )}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {getStatusBadge(receipt.deliveryStatus)}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {getDeliveryMethodBadge(receipt.deliveryMethod)}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {receipt.trackingNumber ? (
                    <div className="space-y-1">
                      <div className="font-mono text-sm">{receipt.trackingNumber}</div>
                      {receipt.courierService && (
                        <div className="text-xs text-muted-foreground">{receipt.courierService}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No tracking</span>
                  )}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    {receipt.signatureImage && (
                      <Badge variant="outline" className="bg-green-50 text-green-600 text-xs">
                        Signed
                      </Badge>
                    )}
                    {receipt.photoEvidence && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 text-xs">
                        Photo
                      </Badge>
                    )}
                    {!receipt.signatureImage && !receipt.photoEvidence && (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {receipt.billingStatements && receipt.billingStatements.length > 0 ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600">
                      {receipt.billingStatements.length} Statement{receipt.billingStatements.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/billing/delivery-receipts/${receipt.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Receipt
                        </Link>
                      </DropdownMenuItem>
                      {receipt.deliveryStatus === 'PENDING' && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/billing/delivery-receipts/${receipt.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Receipt
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <MapPin className="mr-2 h-4 w-4" />
                        View Address
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {receipt.signatureImage && (
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Signature
                        </DropdownMenuItem>
                      )}
                      {receipt.photoEvidence && (
                        <DropdownMenuItem>
                          <Camera className="mr-2 h-4 w-4" />
                          View Photos
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download Receipt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {(!receipt.billingStatements || receipt.billingStatements.length === 0) && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/billing/billing-statements/create?receiptId=${receipt.id}`}>
                            Create Billing Statement
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {receipt.deliveryStatus === 'PENDING' && (
                        <DropdownMenuItem className="text-destructive">
                          Delete Receipt
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DeliveryReceiptsTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

async function DeliveryReceiptsContent() {
  try {
    // Fetch delivery receipts and analytics in parallel
    const [receiptsResult, analytics] = await Promise.all([
      getAllDeliveryReceipts({}, 1, 50), // Get first 50 receipts
      getDeliveryAnalytics()
    ]);

    const receipts = receiptsResult.data;

    // Calculate additional metrics from actual data
    const inTransitReceipts = receipts.filter(receipt => receipt.deliveryStatus === 'IN_TRANSIT').length;
    const withSignature = receipts.filter(receipt => receipt.signatureImage).length;
    const withPhoto = receipts.filter(receipt => receipt.photoEvidence).length;

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Total Receipts
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analytics.totalDeliveries}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inTransitReceipts} In Transit
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-green-50/90 border border-green-200/70 dark:bg-green-950/30 dark:border-green-800/50 p-6">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Delivered
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analytics.successfulDeliveries}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.successRate.toFixed(1)}% Success Rate
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-red-50/90 border border-red-200/70 dark:bg-red-950/30 dark:border-red-800/50 p-6">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Failed Deliveries
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analytics.failedDeliveries}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Need Attention
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-purple-50/90 border border-purple-200/70 dark:bg-purple-950/30 dark:border-purple-800/50 p-6">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  With Proof
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {withSignature}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {withPhoto} With Photos
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table Container */}
        <Card className="bg-card border rounded-lg">
          {/* Table Header */}
          <div className="p-6 pb-4 border-b bg-card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search receipts..."
                    className="pl-10"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="courier">Courier</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <DeliveryReceiptsList receipts={receipts} />
        </Card>
      </>
    );
  } catch (error) {
    console.error('Error loading delivery receipts:', error);
    return (
      <Card className="bg-card border rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load delivery receipts. Please try refreshing the page.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </Card>
    );
  }
}

export default function DeliveryReceiptsPage() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Track delivery confirmations and manage delivery receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/billing/delivery-receipts/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Receipt
            </Link>
          </Button>
        </div>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<DeliveryReceiptsTableSkeleton />}>
        <DeliveryReceiptsContent />
      </Suspense>
    </div>
  );
} 