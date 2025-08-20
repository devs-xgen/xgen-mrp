"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, RotateCcw, ArrowLeft, RefreshCw, Search, Filter, FileText, TrendingUp } from "lucide-react";
import { OrderArchiveEntry } from "@/lib/actions/order-archiving";
import { restoreCustomerOrder } from "@/lib/actions/order-archiving";
import { formatDate } from "@/lib/utils";
import { formatCurrencyPHP } from "@/lib/constant";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface ArchivedOrdersClientProps {
  initialData: {
    archives: OrderArchiveEntry[];
    total: number;
    pageCount: number;
  };
  statistics: {
    totalArchived: number;
    archivedThisMonth: number;
    archivedThisYear: number;
    topArchiveReasons: Array<{ reason: string; count: number }>;
    averageOrderValue: number;
    totalArchivedValue: number;
  };
  currentPage: number;
  pageSize: number;
  currentFilters: any;
}

export function ArchivedOrdersClient({
  initialData,
  statistics,
  currentPage,
  pageSize,
  currentFilters,
}: ArchivedOrdersClientProps) {
  const [selectedArchive, setSelectedArchive] = useState<OrderArchiveEntry | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Filter state
  const [filters, setFilters] = useState({
    customerName: currentFilters.customerName || "",
    archiveReason: currentFilters.archiveReason || "",
    billingStatus: currentFilters.billingStatus || "",
    minValue: currentFilters.minValue || "",
    maxValue: currentFilters.maxValue || "",
    dateFrom: currentFilters.dateFrom || "",
    dateTo: currentFilters.dateTo || "",
  });

  const handleRestore = async (archive: OrderArchiveEntry) => {
    if (!archive.restorable) {
      toast({
        title: "Cannot Restore",
        description: "This order cannot be restored due to data dependencies.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await restoreCustomerOrder(archive.id);
      
      if (result.success) {
        toast({
          title: "Order Restored",
          description: result.message,
        });
        
        // Refresh the page
        router.refresh();
        setIsRestoreDialogOpen(false);
      } else {
        toast({
          title: "Restore Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.toString().trim() !== "" && value !== "all") {
        queryParams.set(key, value.toString());
      }
    });
    
    router.push(`/admin/customer-orders/archives?${queryParams.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      customerName: "",
      archiveReason: "",
      billingStatus: "",
      minValue: "",
      maxValue: "",
      dateFrom: "",
      dateTo: "",
    });
    router.push("/admin/customer-orders/archives");
  };

  const columns = [
    {
      accessorKey: "orderNumber",
      header: "Order #",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.orderNumber}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(row.original.archivedAt)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.customerName}</div>
        </div>
      ),
    },
    {
      accessorKey: "archiveReason",
      header: "Archive Reason",
      cell: ({ row }: any) => (
        <Badge variant="outline" className="max-w-[150px] truncate">
          {row.original.archiveReason}
        </Badge>
      ),
    },
    {
      accessorKey: "fulfillmentSummary",
      header: "Fulfillment",
      cell: ({ row }: any) => {
        const summary = row.original.fulfillmentSummary;
        return (
          <div className="text-sm">
            <div className="font-medium">{summary.completionRate}%</div>
            <div className="text-muted-foreground">
              {summary.stockFulfilled + summary.productionFulfilled} / {summary.totalQuantity}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "totalValue",
      header: "Value",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {formatCurrencyPHP(row.original.totalValue)}
        </div>
      ),
    },
    {
      accessorKey: "billingStatus",
      header: "Billing",
      cell: ({ row }: any) => {
        const status = row.original.billingStatus;
        const variant = status === "PAID" ? "default" : status === "NOT_BILLED" ? "outline" : "secondary";
        return (
          <Badge variant={variant}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const archive = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedArchive(archive);
                setIsViewDetailsOpen(true);
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            
            {archive.restorable && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedArchive(archive);
                  setIsRestoreDialogOpen(true);
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restore
              </Button>
            )}
            
            {!archive.restorable && (
              <Badge variant="outline" className="text-xs">
                Non-restorable
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.push("/admin/customer-orders")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Customer Orders
      </Button>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Archived"
          value={statistics.totalArchived}
          icon="Archive"
          {...analyticsCardVariants.purple}
        />
        <AnalyticsCard
          title="This Month"
          value={statistics.archivedThisMonth}
          icon="Calendar"
          {...analyticsCardVariants.blue}
        />
        <AnalyticsCard
          title="This Year"
          value={statistics.archivedThisYear}
          icon="TrendingUp"
          {...analyticsCardVariants.green}
        />
        <AnalyticsCard
          title="Total Value"
          value={formatCurrencyPHP(statistics.totalArchivedValue)}
          icon="DollarSign"
          {...analyticsCardVariants.amber}
        />
      </div>

      <Tabs defaultValue="archives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="archives">Archived Orders</TabsTrigger>
          <TabsTrigger value="insights">Archive Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="archives" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="Search customer..."
                    value={filters.customerName}
                    onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="archiveReason">Archive Reason</Label>
                  <Input
                    id="archiveReason"
                    placeholder="Search reason..."
                    value={filters.archiveReason}
                    onChange={(e) => setFilters({ ...filters, archiveReason: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="billingStatus">Billing Status</Label>
                  <Select
                    value={filters.billingStatus}
                    onValueChange={(value) => setFilters({ ...filters, billingStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="NOT_BILLED">Not Billed</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Order Value Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minValue}
                      onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxValue}
                      onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Archive Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Archive Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={applyFilters}>
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Archive Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Archived Orders</CardTitle>
                  <CardDescription>
                    {initialData.total} total archived orders
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => router.refresh()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={initialData.archives}
                columns={columns}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Archive Reasons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Top Archive Reasons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.topArchiveReasons.map((reason, index) => (
                    <div key={reason.reason} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{reason.reason}</span>
                      </div>
                      <Badge variant="secondary">{reason.count} orders</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Archive Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Archive Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrencyPHP(statistics.averageOrderValue)}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((statistics.archivedThisYear / statistics.totalArchived) * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Archived This Year</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Archive Rate</span>
                    <span className="font-medium">
                      {Math.round(statistics.archivedThisMonth / 30 * 100) / 100} orders/day
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Archive Growth</span>
                    <span className="font-medium text-green-600">
                      {statistics.archivedThisMonth > 0 ? "+" : ""}
                      {statistics.archivedThisMonth}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Restore Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore order {selectedArchive?.orderNumber}? 
              This will make the order active again and allow further modifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedArchive && handleRestore(selectedArchive)}
              disabled={isLoading}
            >
              {isLoading ? "Restoring..." : "Restore Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Archive Details - {selectedArchive?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Complete archive information and original order data
            </DialogDescription>
          </DialogHeader>
          
          {selectedArchive && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Archive Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Archive Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Archived Date</p>
                    <p className="font-medium">{formatDate(selectedArchive.archivedAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Archived By</p>
                    <p className="font-medium">{selectedArchive.archivedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reason</p>
                    <p className="font-medium">{selectedArchive.archiveReason}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Restorable</p>
                    <Badge variant={selectedArchive.restorable ? "default" : "destructive"}>
                      {selectedArchive.restorable ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Fulfillment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fulfillment Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedArchive.fulfillmentSummary.completionRate}%</div>
                    <p className="text-muted-foreground">Completion</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedArchive.fulfillmentSummary.stockFulfilled}</div>
                    <p className="text-muted-foreground">From Stock</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{selectedArchive.fulfillmentSummary.productionFulfilled}</div>
                    <p className="text-muted-foreground">From Production</p>
                  </div>
                </CardContent>
              </Card>

              {/* Original Order Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Original Order Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(selectedArchive.originalData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
