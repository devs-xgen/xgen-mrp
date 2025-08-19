"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Factory, 
  Receipt, 
  CreditCard, 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Edit,
  Eye
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatCurrencyPHP } from "@/lib/constant";
import { FulfillmentIndicator } from "./FulfillmentIndicator";

interface CustomerOrderDetailsClientProps {
  order: any; // We'll properly type this later
}

export function CustomerOrderDetailsClient({ order }: CustomerOrderDetailsClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate fulfillment statistics
  const fulfillmentStats = order.orderLines.reduce(
    (stats: any, line: any) => {
      const allocated = (line.stockAllocated || 0) + (line.productionQuantity || 0);
      const completion = line.quantity > 0 ? Math.round((allocated / line.quantity) * 100) : 0;
      
      stats.totalItems++;
      stats.totalQuantity += line.quantity;
      stats.totalAllocated += allocated;
      stats.totalCompletion += completion;
      
      if (line.fulfillmentStatus === "FULFILLED") {
        stats.fulfilledItems++;
      } else if (line.fulfillmentStatus === "ALLOCATED") {
        stats.allocatedItems++;
      } else {
        stats.pendingItems++;
      }
      
      if (line.stockAllocated > 0) {
        stats.fromStock += line.stockAllocated;
      }
      
      if (line.productionQuantity > 0) {
        stats.fromProduction += line.productionQuantity;
      }
      
      return stats;
    },
    {
      totalItems: 0,
      totalQuantity: 0,
      totalAllocated: 0,
      totalCompletion: 0,
      fulfilledItems: 0,
      allocatedItems: 0,
      pendingItems: 0,
      fromStock: 0,
      fromProduction: 0,
    }
  );

  const averageCompletion = fulfillmentStats.totalItems > 0 
    ? Math.round(fulfillmentStats.totalCompletion / fulfillmentStats.totalItems)
    : 0;

  const getStatusColor = (status: string) => {
    const colors = {
      COMPLETED: "bg-green-500 text-white",
      IN_PROGRESS: "bg-blue-500 text-white", 
      PENDING: "bg-yellow-500 text-white",
      CANCELLED: "bg-red-500 text-white",
      ACTIVE: "bg-blue-500 text-white",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500 text-white";
  };

  const getFulfillmentStatusIcon = (status: string) => {
    switch (status) {
      case "FULFILLED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "ALLOCATED":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/customer-orders/${order.id}/analyze`}>
          <Button variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Analyze Stock
          </Button>
        </Link>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Order
        </Button>
        {order.billingStatements?.length > 0 && (
          <Link href={`/admin/billing-statement/${order.billingStatements[0].id}`}>
            <Button variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              View Billing
            </Button>
          </Link>
        )}
      </div>

      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyPHP(order.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {order.orderLines.length} items • {fulfillmentStats.totalQuantity} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion}%</div>
            <Progress value={averageCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order._count.productionOrders}</div>
            <p className="text-xs text-muted-foreground">
              {fulfillmentStats.fromProduction} units from production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(order.status)}>
              {order.status.toLowerCase().replace("_", " ")}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Due: {formatDate(order.requiredDate)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{order.customer.name}</h3>
                  <p className="text-sm text-muted-foreground">Code: {order.customer.code}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{order.customer.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{order.customer.phone || "Not provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p>{order.customer.address || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Terms</p>
                    <p>{order.customer.paymentTerms || "Standard"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Credit Limit</p>
                    <p>{order.customer.creditLimit ? formatCurrencyPHP(order.customer.creditLimit) : "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p>{formatDate(order.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Required Date</p>
                    <p>{formatDate(order.requiredDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
                {order.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Notes</p>
                      <p className="text-sm bg-muted p-3 rounded-md">{order.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Lines */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.orderLines.length} items totaling {fulfillmentStats.totalQuantity} units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderLines.map((line: any, index: number) => {
                  const productInfo = line.productVariant || line.product;
                  const allocated = (line.stockAllocated || 0) + (line.productionQuantity || 0);
                  const completion = line.quantity > 0 ? Math.round((allocated / line.quantity) * 100) : 0;
                  
                  return (
                    <div key={line.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          <div>
                            <h4 className="font-medium">{productInfo.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              SKU: {productInfo.sku} • {line.quantity} units @ {formatCurrencyPHP(line.unitPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrencyPHP(line.quantity * line.unitPrice)}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getFulfillmentStatusIcon(line.fulfillmentStatus || "PENDING")}
                            <span>{completion}% fulfilled</span>
                          </div>
                        </div>
                        
                        <div className="w-24">
                          <Progress value={completion} className="h-2" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">From Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{fulfillmentStats.fromStock}</div>
                <p className="text-xs text-muted-foreground">units allocated</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">From Production</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{fulfillmentStats.fromProduction}</div>
                <p className="text-xs text-muted-foreground">units planned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{fulfillmentStats.pendingItems}</div>
                <p className="text-xs text-muted-foreground">items pending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Details</CardTitle>
              <CardDescription>Track fulfillment progress for each order line</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderLines.map((line: any) => (
                  <FulfillmentIndicator 
                    key={line.id}
                    fulfillmentOverview={{
                      overallCompletion: line.quantity > 0 ? Math.round(((line.stockAllocated || 0) + (line.productionQuantity || 0)) / line.quantity * 100) : 0,
                      totalAllocated: (line.stockAllocated || 0) + (line.productionQuantity || 0),
                      fromStock: line.stockAllocated || 0,
                      fromProduction: line.productionQuantity || 0,
                      pendingItems: line.fulfillmentStatus === "PENDING" ? 1 : 0,
                      fulfilledItems: line.fulfillmentStatus === "FULFILLED" ? 1 : 0,
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          {order.productionOrders && order.productionOrders.length > 0 ? (
            <div className="space-y-4">
              {order.productionOrders.map((po: any) => (
                <Card key={po.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Production Order #{po.id.slice(-8)}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(po.status)}>
                          {po.status.toLowerCase().replace("_", " ")}
                        </Badge>
                        <Link href={`/admin/production/${po.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <CardDescription>
                      {(po.productVariant || po.product).name} • {po.quantity} units
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p>{formatDate(po.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p>{formatDate(po.dueDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p>{po.completedQuantity} / {po.quantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Priority</p>
                        <Badge variant="outline">{po.priority}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Production Orders</h3>
                <p className="text-muted-foreground mb-4">
                  This order doesn't have any associated production orders yet.
                </p>
                <Link href={`/admin/customer-orders/${order.id}/analyze`}>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Order
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {order.billingStatements && order.billingStatements.length > 0 ? (
            <div className="space-y-4">
              {order.billingStatements.map((bs: any) => (
                <Card key={bs.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Statement #{bs.statementNumber}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(bs.status)}>
                          {bs.status.toLowerCase()}
                        </Badge>
                        <Link href={`/admin/billing-statement/${bs.id}`}>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <CardDescription>
                      Created on {formatDate(bs.billingDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-medium">{formatCurrencyPHP(bs.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tax Amount</p>
                        <p>{formatCurrencyPHP(bs.taxAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Amount</p>
                        <p className="font-medium">{formatCurrencyPHP(bs.netAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p>{bs.dueDate ? formatDate(bs.dueDate) : "Not set"}</p>
                      </div>
                    </div>

                    {bs.salesInvoice && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <h4 className="font-medium mb-2">Sales Invoice</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span>#{bs.salesInvoice.invoiceNumber}</span>
                          <Badge variant="outline">{bs.salesInvoice.status}</Badge>
                        </div>
                      </div>
                    )}

                    {bs.deliveryReceipts && bs.deliveryReceipts.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Delivery Receipts</h4>
                        <div className="space-y-2">
                          {bs.deliveryReceipts.map((dr: any) => (
                            <div key={dr.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                              <span>#{dr.receiptNumber}</span>
                              <Badge variant="outline">{dr.deliveryStatus}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Billing Statements</h3>
                <p className="text-muted-foreground mb-4">
                  No billing statements have been created for this order yet.
                </p>
                <Button>
                  <Receipt className="h-4 w-4 mr-2" />
                  Create Billing Statement
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {order.transaction && order.transaction.length > 0 ? (
            <div className="space-y-4">
              {order.transaction.map((tx: any) => (
                <Card key={tx.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payment #{tx.id.slice(-8)}</CardTitle>
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status.toLowerCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      {tx.paymentMethod} • {formatDate(tx.paymentDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="text-lg font-medium">{formatCurrencyPHP(tx.amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Method</p>
                        <p>{tx.paymentMethod.replace("_", " ")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Handled By</p>
                        <p>{tx.handledByUser.email}</p>
                      </div>
                    </div>
                    {tx.notes && (
                      <div className="mt-4">
                        <p className="text-muted-foreground text-sm mb-1">Notes</p>
                        <p className="text-sm bg-muted p-2 rounded">{tx.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Payments</h3>
                <p className="text-muted-foreground mb-4">
                  No payments have been recorded for this order yet.
                </p>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
