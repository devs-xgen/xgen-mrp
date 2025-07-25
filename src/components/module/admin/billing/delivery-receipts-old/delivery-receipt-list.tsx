"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Plus, 
  Truck, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Camera, 
  FileText, 
  MapPin,
  X,
} from "lucide-react";

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

// Import types
import { 
  DeliveryReceiptWithBilling, 
  DeliveryStatus,
  DeliveryReceiptFilters 
} from "@/types/admin/billing";

interface DeliveryReceiptListProps {
  receipts: DeliveryReceiptWithBilling[];
  onFilterChange?: (filters: DeliveryReceiptFilters) => void;
  isLoading?: boolean;
}

export function DeliveryReceiptList({ 
  receipts, 
  onFilterChange,
  isLoading = false 
}: DeliveryReceiptListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL");

  // Status badge helper
  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "IN_TRANSIT":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">In Transit</Badge>;
      case "DELIVERED":
        return <Badge variant="default" className="bg-green-50 text-green-600 border-green-200">Delivered</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "RETURNED":
        return <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-200">Returned</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onFilterChange) {
      onFilterChange({
        search: value || undefined,
        status: statusFilter !== "ALL" ? [statusFilter] : undefined,
      });
    }
  };

  // Handle status filter
  const handleStatusFilter = (status: DeliveryStatus | "ALL") => {
    setStatusFilter(status);
    if (onFilterChange) {
      onFilterChange({
        search: searchTerm || undefined,
        status: status !== "ALL" ? [status] : undefined,
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== "ALL";

  // Empty state
  if (receipts.length === 0 && !isLoading) {
    return (
      <Card className="bg-card border rounded-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No delivery receipts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "ALL" 
              ? "Try adjusting your search or filters." 
              : "Get started by creating your first delivery receipt."
            }
          </p>
          <Button asChild>
            <Link href="/admin/billing/delivery-receipts/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Receipt
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Delivery Receipts</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {searchTerm && statusFilter !== "ALL" ? "2 filters" : "1 filter"} active
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={() => handleSearch("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
              <Button asChild size="sm">
                <Link href="/admin/billing/delivery-receipts/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Receipt
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="bg-card border rounded-lg">
        <div className="overflow-auto">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Updating results...
              </div>
            </div>
          )}
          <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Receipt #</TableHead>
                  <TableHead className="hidden sm:table-cell">Customer</TableHead>
                  <TableHead>Billing Statement</TableHead>
                  <TableHead className="hidden md:table-cell">Delivery Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Received By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Tracking</TableHead>
                  <TableHead className="w-[80px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{receipt.receiptNumber}</div>
                        {/* Show customer on mobile */}
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {receipt.billingStatement?.customerName || "Unknown Customer"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {receipt.billingStatement?.customerName || "Unknown Customer"}
                      </p>
                      {receipt.billingStatement?.customer?.email && (
                        <p className="text-sm text-muted-foreground">
                          {receipt.billingStatement.customer.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {receipt.billingStatement ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-auto p-2 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        asChild
                      >
                        <Link href={`/admin/billing/statements/${receipt.billingStatement.id}`}>
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3 text-blue-600" />
                            <span className="font-medium text-blue-600">
                              {receipt.billingStatement.statementNumber}
                            </span>
                          </div>
                        </Link>
                      </Button>
                    ) : (
                      <Badge variant="secondary">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <p className="text-sm">
                        {format(new Date(receipt.deliveryDate), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(receipt.deliveryDate), "h:mm a")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{receipt.receivedBy}</p>
                      {receipt.receivedByTitle && (
                        <p className="text-xs text-muted-foreground">
                          {receipt.receivedByTitle}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(receipt.deliveryStatus)}
                      {/* Show delivery date on mobile/tablet */}
                      <div className="text-xs text-muted-foreground md:hidden">
                        {format(new Date(receipt.deliveryDate), "MMM dd")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="space-y-1">
                      {receipt.trackingNumber && (
                        <p className="text-sm font-mono">{receipt.trackingNumber}</p>
                      )}
                      {receipt.courierService && (
                        <p className="text-xs text-muted-foreground">
                          {receipt.courierService}
                        </p>
                      )}
                      {!receipt.trackingNumber && !receipt.courierService && (
                        <p className="text-xs text-muted-foreground">No tracking</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* View Receipt */}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/billing/delivery-receipts/${receipt.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Receipt
                            </Link>
                          </DropdownMenuItem>
                          
                          {/* Edit Receipt */}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/billing/delivery-receipts/${receipt.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Receipt
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Additional Actions */}
                          {receipt.signatureImage && (
                            <DropdownMenuItem>
                              <Camera className="mr-2 h-4 w-4" />
                              View Signature
                            </DropdownMenuItem>
                          )}
                          {receipt.photoEvidence && (
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Photo
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <MapPin className="mr-2 h-4 w-4" />
                            View Address
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}