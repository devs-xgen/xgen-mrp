"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Factory, Package, ArrowRight, BarChart, CheckCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { createProductionOrdersForItems, allocateStockForOrder } from "@/lib/actions/order-analysis";
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
          allocatedQuantity: line.stockToUse,
          fulfillmentType: "STOCK" as const,
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
    router.push("/admin/production/planning");
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
            {stockLines.length > 0 && (
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

            {productionLines.length > 0 && (
              <Button
                onClick={handleCreateProductionOrders}
                className="flex-1"
              >
                <Factory className="mr-2 h-4 w-4" />
                Create Production Orders ({productionLines.length} items)
              </Button>
            )}

            <Link href="/admin/production/planning">
              <Button variant="outline" className="w-full sm:w-auto">
                <BarChart className="mr-2 h-4 w-4" />
                Production Planning Dashboard
              </Button>
            </Link>
          </div>

          {/* Workflow Guidance */}
          {orderAnalysis.canFulfillImmediately ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ready for immediate fulfillment!</strong> All items are available in stock. 
                Click "Allocate Stock" to reserve inventory for this order.
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
