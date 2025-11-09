"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Factory, Package, ArrowRight, BarChart, CheckCircle, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { createProductionOrdersForItems, allocateStockForOrder, syncProductionOrdersWithCustomerOrder } from "@/lib/actions/order-analysis";
import { CustomerOrderAnalysisResult, RecommendedAction } from "@/types/admin/order-analysis";

interface ProductionPlanningActionsProps {
  orderAnalysis: CustomerOrderAnalysisResult;
  orderId: string;
}

export function ProductionPlanningActions({
  orderAnalysis,
  orderId,
}: ProductionPlanningActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter lines by recommendation type
  const stockLines = orderAnalysis.orderLines.filter(
    line => line.recommendedAction === RecommendedAction.USE_STOCK
  );
  const productionLines = orderAnalysis.orderLines.filter(
    line => line.recommendedAction === RecommendedAction.PRODUCE_ALL ||
           line.recommendedAction === RecommendedAction.HYBRID
  );

  const handleCreateProductionOrders = () => {
    if (productionLines.length === 0) {
      toast.error("No items require production orders");
      return;
    }

    // Prepare batch data for production planning
    const batchData = {
      batchMode: true,
      batchItems: productionLines.map(line => ({
        productId: line.productId,
        productVariantId: line.productVariantId || "",
        quantity: line.quantityToProduce,
        customerOrderId: orderId,
        priority: "MEDIUM" as const,
        notes: `Production for customer order ${orderAnalysis.orderNumber}`,
      })),
    };

    // Navigate to production create with batch data
    const batchParam = encodeURIComponent(JSON.stringify(batchData));
    router.push(`/admin/production/create?batch=${batchParam}`);
  };

  const handleAllocateStock = async () => {
    if (stockLines.length === 0) {
      toast.error("No items available for stock allocation");
      return;
    }

    startTransition(async () => {
      try {
        const allocations = stockLines.map(line => ({
          orderLineId: line.id,
          productId: line.productId,
          productVariantId: line.productVariantId,
          quantityToAllocate: line.stockToUse,
          reservationDate: new Date(),
          notes: `Allocation for order ${orderAnalysis.orderNumber}`,
        }));

        const result = await allocateStockForOrder(orderId, allocations);
        
        if (result.success) {
          toast.success(`Successfully allocated stock for ${result.allocatedItems.length} items`);
          router.refresh();
        } else {
          toast.error(`Stock allocation failed: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        console.error("Error allocating stock:", error);
        toast.error("Failed to allocate stock");
      }
    });
  };

  const handleNavigateToPlanning = () => {
    router.push(`/admin/customer-orders-v2/${orderId}/production-planning`);
  };

  const handleSyncProductionOrders = async () => {
    startTransition(async () => {
      try {
        const result = await syncProductionOrdersWithCustomerOrder(orderId);
        
        if (result.success) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(`Sync failed: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        console.error("Error syncing production orders:", error);
        toast.error("Failed to sync production orders");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Production Planning Actions
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Choose how to fulfill this customer order based on the analysis results.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stockLines.length}
              </div>
              <div className="text-sm text-muted-foreground">From Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {productionLines.length}
              </div>
              <div className="text-sm text-muted-foreground">Need Production</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {orderAnalysis.orderLines.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center">
              <Badge variant={orderAnalysis.canFulfillImmediately ? "default" : "secondary"}>
                {orderAnalysis.canFulfillImmediately ? "Ready" : "Mixed"}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Fulfillment</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {stockLines.length > 0 && !orderAnalysis.hasExistingProductionOrders && (
              <Button
                onClick={handleAllocateStock}
                disabled={isPending}
                variant="outline"
                className="flex-1"
              >
                <Package className="mr-2 h-4 w-4" />
                Allocate Stock ({stockLines.length} items)
              </Button>
            )}

            {productionLines.length > 0 && !orderAnalysis.hasExistingProductionOrders && (
              <Button
                onClick={handleCreateProductionOrders}
                className="flex-1"
                disabled={isPending}
              >
                <Factory className="mr-2 h-4 w-4" />
                Create Production Orders ({productionLines.length} items)
              </Button>
            )}

            {orderAnalysis.hasExistingProductionOrders && orderAnalysis.needsSync && (
              <Button
                onClick={handleSyncProductionOrders}
                disabled={isPending}
                className="flex-1"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                Sync Production Orders
              </Button>
            )}

            <Link href={`/admin/customer-orders-v2/${orderId}/production-planning`}>
              <Button variant="outline" className="w-full sm:w-auto">
                <BarChart className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </Link>
          </div>

          {/* Workflow Guidance */}
          {orderAnalysis.hasExistingProductionOrders ? (
            <Alert>
              <Factory className="h-4 w-4" />
              <AlertDescription>
                <strong>Production orders exist.</strong> This customer order already has {orderAnalysis.existingProductionOrders?.length || 0} production order(s). 
                {orderAnalysis.needsSync 
                  ? ' Sync is required to update quantities and dates.' 
                  : ' Orders are up to date with current requirements.'}
              </AlertDescription>
            </Alert>
          ) : orderAnalysis.canFulfillImmediately ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ready for immediate fulfillment!</strong> All items are available in stock. 
                Click &quot;Allocate Stock&quot; to reserve inventory for this order.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Factory className="h-4 w-4" />
              <AlertDescription>
                <strong>Mixed fulfillment required.</strong> Some items are available in stock, 
                others need production. You can process both simultaneously or separately.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Existing Production Orders Section */}
      {orderAnalysis.hasExistingProductionOrders && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Existing Production Orders
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Production orders already created for this customer order
                </p>
              </div>
              {orderAnalysis.needsSync && (
                <Button
                  onClick={handleSyncProductionOrders}
                  disabled={isPending}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                  Sync Orders
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderAnalysis.needsSync && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sync Required!</strong> Customer order has been updated after production orders were created. 
                  Click &quot;Sync Orders&quot; to update production quantities and dates.
                </AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orderAnalysis.existingProductionOrders || []).map((po: any) => {
                  const productName = po.productVariant?.displayName || po.product?.name || 'Unknown Product';
                  const sku = po.productVariant?.sku || po.product?.sku || '';
                  
                  return (
                    <TableRow key={po.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{productName}</span>
                          <span className="text-xs text-muted-foreground">{sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {po.quantity}
                      </TableCell>
                      <TableCell className="text-center">
                        {po.completedQuantity || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          po.status === 'COMPLETED' ? 'default' :
                          po.status === 'ACTIVE' ? 'secondary' :
                          po.status === 'CANCELLED' ? 'destructive' : 'outline'
                        }>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          po.priority === 'URGENT' || po.priority === 'CRITICAL' ? 'destructive' :
                          po.priority === 'HIGH' ? 'default' : 'outline'
                        }>
                          {po.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/production/${po.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="text-sm text-muted-foreground">
              Total: {orderAnalysis.existingProductionOrders?.length || 0} production order(s)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommended Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <div className="font-medium">Allocate Available Stock</div>
                <div className="text-sm text-muted-foreground">
                  Reserve inventory for items that are in stock ({stockLines.length} items)
                </div>
              </div>
              {stockLines.length > 0 ? (
                <Badge variant="default">Available</Badge>
              ) : (
                <Badge variant="secondary">N/A</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="flex-1">
                <div className="font-medium">Create Production Orders</div>
                <div className="text-sm text-muted-foreground">
                  Plan production for items that need manufacturing ({productionLines.length} items)
                </div>
              </div>
              {productionLines.length > 0 ? (
                <Badge variant="destructive">Required</Badge>
              ) : (
                <Badge variant="secondary">N/A</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="flex-1">
                <div className="font-medium">Monitor Fulfillment</div>
                <div className="text-sm text-muted-foreground">
                  Track progress and complete order fulfillment
                </div>
              </div>
              <Badge variant="outline">Next</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
