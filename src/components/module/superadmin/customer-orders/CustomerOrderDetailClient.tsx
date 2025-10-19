"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductionLinkingPanel } from "./ProductionLinkingPanel";
import { ShoppingCart, User, Building2, Calendar, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface CustomerOrderDetailClientProps {
  order: any;
}

export function CustomerOrderDetailClient({ order }: CustomerOrderDetailClientProps) {
  const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    APPROVED: "default",
    IN_PROGRESS: "default",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
  };

  const totalOrderAmount = order.orderLines.reduce(
    (sum: number, line: any) => sum + line.quantity * line.unitPrice,
    0
  );

  return (
    <div className="space-y-6">
      {/* Order Header Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariantMap[order.status] || "default"}>
              {order.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${order.totalAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.productionOrders?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {format(new Date(order.orderDate), "MMM dd, yyyy")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer & Tenant Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{order.customer.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{order.customer.email || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{order.customer.phone || "N/A"}</div>
            </div>
            {order.customer.address && (
              <div>
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="font-medium">{order.customer.address}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Tenant</div>
              <div className="font-medium">{order.tenant?.name || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Order Date</div>
              <div className="font-medium">
                {format(new Date(order.orderDate), "MMM dd, yyyy")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Delivery Date</div>
              <div className="font-medium">
                {order.requiredDate
                  ? format(new Date(order.requiredDate), "MMM dd, yyyy")
                  : "Not set"}
              </div>
            </div>
            {order.notes && (
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="font-medium text-sm">{order.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Order Lines</CardTitle>
          <CardDescription>
            {order.orderLines.length} item{order.orderLines.length > 1 ? "s" : ""} in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.orderLines.map((line: any) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">
                      {line.product.name}
                      {line.productVariant && (
                        <span className="text-muted-foreground"> - {line.productVariant.displayName}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {line.productVariant?.sku || line.product.sku}
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${line.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(line.quantity * line.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[line.status] || "default"}>
                        {line.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Total Amount
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    ${totalOrderAmount.toFixed(2)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Production Orders Linking */}
      <ProductionLinkingPanel
        customerOrderId={order.id}
        productionOrders={order.productionOrders || []}
        orderLines={order.orderLines}
      />

      {/* Billing Statements */}
      {order.billingStatements && order.billingStatements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Statements</CardTitle>
            <CardDescription>
              {order.billingStatements.length} billing statement{order.billingStatements.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.billingStatements.map((statement: any) => (
                <div
                  key={statement.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-medium">{statement.statementNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(statement.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">${statement.totalAmount.toFixed(2)}</div>
                      <Badge variant="secondary" className="text-xs">
                        {statement.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/superadmin/billing/billing-statements/${statement.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
