"use client";

import { ArrowLeft, Package, Factory, CheckCircle, AlertTriangle, Clock, ShoppingCart } from "lucide-react";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { FulfillmentDashboard } from "../fulfillment/FulfillmentDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
import { CustomerOrderAnalysisResult } from "@/types/admin/order-analysis";
import { StockStatus, RecommendedAction, OverallOrderStatus } from "@/types/admin/order-analysis";

// Utils
import { formatCurrencyPHP } from "@/lib/constant";

// Components
import { StockStatusBadge } from "./StockStatusBadge";
import { RecommendedActionBadge } from "./RecommendedActionBadge";
import { OrderAnalysisSummaryCard } from "./OrderAnalysisSummaryCard";
import { ProductionPlanningActions } from "./ProductionPlanningActions";

interface CustomerOrderAnalysisClientProps {
  orderAnalysis: CustomerOrderAnalysisResult;
  orderId: string;
  backHref?: string;
}

export function CustomerOrderAnalysisClient({
  orderAnalysis,
  orderId,
  backHref = "/admin/customer-orders",
}: CustomerOrderAnalysisClientProps) {

  const getOverallStatusBadge = (status: OverallOrderStatus) => {
    const variants = {
      [OverallOrderStatus.CAN_FULFILL_IMMEDIATELY]: { variant: "default" as const, color: "text-green-600", icon: CheckCircle },
      [OverallOrderStatus.MIXED]: { variant: "secondary" as const, color: "text-blue-600", icon: Package },
      [OverallOrderStatus.REQUIRES_PRODUCTION]: { variant: "outline" as const, color: "text-orange-600", icon: Factory },
      [OverallOrderStatus.MATERIAL_SHORTAGE]: { variant: "destructive" as const, color: "text-red-600", icon: AlertTriangle },
      [OverallOrderStatus.CANNOT_FULFILL]: { variant: "destructive" as const, color: "text-red-600", icon: AlertTriangle },
      // [OverallOrderStatus.PARTIAL_FULFILLMENT]: { variant: "secondary" as const, color: "text-yellow-600", icon: Clock },
    };

    const config = variants[status] || variants[OverallOrderStatus.MIXED];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-2">
        <Icon className="h-4 w-4" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="analysis" className="w-full">
          <TabsList>
            <TabsTrigger value="analysis">Stock Analysis</TabsTrigger>
            {/* <TabsTrigger value="fulfillment">Fulfillment Tracker</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6 mt-6">

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <OrderAnalysisSummaryCard
            title="Overall Status"
            content={getOverallStatusBadge(orderAnalysis.overallStatus)}
            icon={ShoppingCart}
          />
          <OrderAnalysisSummaryCard
            title="Order Value"
            content={formatCurrencyPHP(orderAnalysis.totalOrderValue)}
            icon={Package}
          />
          <OrderAnalysisSummaryCard
            title="From Stock"
            content={`${orderAnalysis.itemsFromStock} items`}
            icon={CheckCircle}
            variant="green"
          />
          <OrderAnalysisSummaryCard
            title="Need Production"
            content={`${orderAnalysis.itemsNeedingProduction} items`}
            icon={Factory}
            variant="orange"
          />
        </div>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Order Number</label>
              <p className="font-medium">{orderAnalysis.orderNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Customer</label>
              <p className="font-medium">{orderAnalysis.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Order Date</label>
              <p className="font-medium">{orderAnalysis.orderDate.toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Required Date</label>
              <p className="font-medium">{orderAnalysis.requiredDate.toLocaleDateString()}</p>
            </div>
            {/* <div>
              <label className="text-sm font-medium text-muted-foreground">Est. Fulfillment</label>
              <p className="font-medium">{orderAnalysis.estimatedFulfillmentDate.toLocaleDateString()}</p>
            </div> */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Can Fulfill Immediately</label>
              <Badge variant={orderAnalysis.canFulfillImmediately ? "default" : "secondary"}>
                {orderAnalysis.canFulfillImmediately ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Production Planning Actions - Single Source of Truth */}
        <ProductionPlanningActions 
          orderAnalysis={orderAnalysis}
          orderId={orderId}
        />

        {/* Items Analysis Table */}
        <Card>
          <CardHeader>
            <CardTitle>Items Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty Requested</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead>Recommended Action</TableHead>
                    <TableHead>Stock to Use</TableHead>
                    <TableHead>Qty to Produce</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderAnalysis.orderLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{line.productName}</p>
                          <p className="text-sm text-muted-foreground">{line.productSku}</p>
                          {line.variantDisplayName && (
                            <p className="text-sm text-blue-600">{line.variantDisplayName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {line.quantity}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{line.currentStock}</span>
                          <span className="text-sm text-muted-foreground">
                            Min: {line.minimumStockLevel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge status={line.stockStatus} />
                      </TableCell>
                      <TableCell>
                        <RecommendedActionBadge action={line.recommendedAction} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {line.stockToUse > 0 ? line.stockToUse : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {line.quantityToProduce > 0 ? line.quantityToProduce : '-'}
                      </TableCell>
                      <TableCell>
                        {formatCurrencyPHP(line.unitPrice)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrencyPHP(line.totalValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Summary */}
        {orderAnalysis.canFulfillImmediately && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Good news!</strong> This entire order can be fulfilled immediately from existing stock.
              No production orders are required.
            </AlertDescription>
          </Alert>
        )}
          </TabsContent>
          
          {/* <TabsContent value="fulfillment" className="mt-6">
            <FulfillmentDashboard 
              orderId={orderId}
              fulfillmentData={{
                orderId: orderId,
                orderNumber: orderAnalysis.orderNumber,
                orderLines: orderAnalysis.orderLines.map(line => ({
                  id: line.id,
                  product: {
                    id: line.productId,
                    name: line.productName,
                    sku: line.productSku,
                    displayName: line.variantDisplayName || line.productName,
                  },
                  quantity: line.quantity,
                  stockAllocated: line.stockToUse,
                  productionQuantity: line.quantityToProduce,
                  fulfillmentType: line.stockToUse > 0 && line.quantityToProduce > 0 ? "HYBRID" : 
                                  line.stockToUse > 0 ? "STOCK" : 
                                  line.quantityToProduce > 0 ? "PRODUCTION" : "PENDING",
                  fulfillmentStatus: "PENDING", // This would come from the database in a real implementation
                  allocatedAt: null,
                  fulfilledAt: null,
                  completionPercentage: 0,
                })),
                overallCompletion: 0, // This would be calculated based on actual fulfillment status
              }}
            />
          </TabsContent> */}
        </Tabs>
      </div>
    </>
  );
}
