"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart, 
  CheckCircle, 
  AlertTriangle, 
  Factory, 
  Package, 
  Search,
  Filter,
  ArrowRight,
  Calendar,
  ExternalLink
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

import { 
  CustomerOrderAnalysisResult, 
  OverallOrderStatus,
  OrderAnalysisSummary
} from "@/types/admin/order-analysis";
import { formatCurrencyPHP } from "@/lib/constant";

interface ProductionPlanningClientProps {
  ordersRequiringAnalysis: CustomerOrderAnalysisResult[];
  analysisSummary: OrderAnalysisSummary | null;
}

export function ProductionPlanningClient({
  ordersRequiringAnalysis,
  analysisSummary,
}: ProductionPlanningClientProps) {
  const router = useRouter();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    return ordersRequiringAnalysis.filter(order => {
      const matchesSearch = !searchQuery || 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        order.overallStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [ordersRequiringAnalysis, searchQuery, statusFilter]);

  // Calculate selected orders stats
  const selectedOrdersStats = useMemo(() => {
    const selected = filteredOrders.filter(order => selectedOrders.includes(order.orderId));
    return {
      count: selected.length,
      totalValue: selected.reduce((sum, order) => sum + order.totalOrderValue, 0),
      totalItems: selected.reduce((sum, order) => sum + order.itemsNeedingProduction, 0),
    };
  }, [selectedOrders, filteredOrders]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.orderId));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleOrderSelect = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleBulkProductionPlanning = () => {
    if (selectedOrders.length === 0) return;
    
    // Navigate to bulk production creation
    const selectedOrderData = filteredOrders.filter(order => 
      selectedOrders.includes(order.orderId)
    );
    
    // Prepare batch items from all selected orders
    const batchItems = selectedOrderData.flatMap(order =>
      order.orderLines
        .filter(line => line.quantityToProduce > 0)
        .map(line => ({
          productId: line.productId,
          productVariantId: line.productVariantId,
          quantity: line.quantityToProduce,
          customerOrderId: order.orderId,
          priority: "MEDIUM" as const,
          notes: `Production for ${order.orderNumber} - ${line.productName}`,
        }))
    );

    if (batchItems.length === 0) {
      alert("No items requiring production found in selected orders.");
      return;
    }

    const batchData = encodeURIComponent(JSON.stringify({
      batchMode: true,
      batchItems,
      source: "production-planning",
    }));
    
    router.push(`/admin/production/create?batch=${batchData}`);
  };

  const getStatusBadge = (status: OverallOrderStatus) => {
    const variants = {
      [OverallOrderStatus.CAN_FULFILL_IMMEDIATELY]: { 
        variant: "default" as const, 
        className: "bg-green-100 text-green-800 border-green-200" 
      },
      [OverallOrderStatus.MIXED]: { 
        variant: "secondary" as const, 
        className: "bg-blue-100 text-blue-800 border-blue-200" 
      },
      [OverallOrderStatus.REQUIRES_PRODUCTION]: { 
        variant: "outline" as const, 
        className: "bg-orange-100 text-orange-800 border-orange-200" 
      },
      [OverallOrderStatus.MATERIAL_SHORTAGE]: { 
        variant: "destructive" as const, 
        className: "bg-red-100 text-red-800 border-red-200" 
      },
      [OverallOrderStatus.CANNOT_FULFILL]: { 
        variant: "destructive" as const, 
        className: "bg-red-100 text-red-800 border-red-200" 
      },
      [OverallOrderStatus.PARTIAL_FULFILLMENT]: { 
        variant: "secondary" as const, 
        className: "bg-yellow-100 text-yellow-800 border-yellow-200" 
      },
    };

    const config = variants[status] || variants[OverallOrderStatus.MIXED];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {analysisSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Orders Analyzed"
            value={analysisSummary.totalOrdersAnalyzed}
            icon="ShoppingCart"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Need Production"
            value={analysisSummary.totalItemsNeedingProduction}
            icon="Factory"
            {...analyticsCardVariants.orange}
          />
          <AnalyticsCard
            title="Avg. Fulfillment"
            value={`${Math.round(analysisSummary.averageFulfillmentTime)} days`}
            icon="Calendar"
            {...analyticsCardVariants.purple}
          />
          <AnalyticsCard
            title="Need Attention"
            value={analysisSummary.ordersRequiringAttention}
            icon="AlertTriangle"
            {...analyticsCardVariants.red}
          />
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Production Planning Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders or customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={OverallOrderStatus.REQUIRES_PRODUCTION}>
                    Requires Production
                  </SelectItem>
                  <SelectItem value={OverallOrderStatus.MIXED}>
                    Mixed Fulfillment
                  </SelectItem>
                  <SelectItem value={OverallOrderStatus.MATERIAL_SHORTAGE}>
                    Material Shortages
                  </SelectItem>
                  <SelectItem value={OverallOrderStatus.CAN_FULFILL_IMMEDIATELY}>
                    Can Fulfill Immediately
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {selectedOrdersStats.count} orders selected
                  ({selectedOrdersStats.totalItems} items, {formatCurrencyPHP(selectedOrdersStats.totalValue)})
                </div>
                <Button onClick={handleBulkProductionPlanning}>
                  <Factory className="h-4 w-4 mr-2" />
                  Create Production Orders
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Requiring Analysis ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Order Value</TableHead>
                  <TableHead>Fulfillment Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.orderId)}
                        onCheckedChange={(checked) => 
                          handleOrderSelect(order.orderId, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.orderDate.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.overallStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-3 w-3 text-green-600" />
                          <span>{order.itemsFromStock} from stock</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Factory className="h-3 w-3 text-orange-600" />
                          <span>{order.itemsNeedingProduction} need production</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrencyPHP(order.totalOrderValue)}
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${
                        order.estimatedFulfillmentDate > new Date() 
                          ? "text-muted-foreground" 
                          : "text-red-600 font-medium"
                      }`}>
                        {order.estimatedFulfillmentDate.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/customer-orders-v2/${order.orderId}/analyze`)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        {order.itemsNeedingProduction > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const batchItems = order.orderLines
                                .filter(line => line.quantityToProduce > 0)
                                .map(line => ({
                                  productId: line.productId,
                                  productVariantId: line.productVariantId,
                                  quantity: line.quantityToProduce,
                                  customerOrderId: order.orderId,
                                  priority: "MEDIUM" as const,
                                  notes: `Production for ${order.orderNumber} - ${line.productName}`,
                                }));

                              const batchData = encodeURIComponent(JSON.stringify({
                                batchMode: true,
                                batchItems,
                                source: "single-order",
                              }));
                              
                              router.push(`/admin/production/create?batch=${batchData}`);
                            }}
                          >
                            <Factory className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "No orders match your current filters."
                  : "All orders have been analyzed and processed."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
