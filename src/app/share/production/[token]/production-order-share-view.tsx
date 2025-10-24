// src/app/share/production/[token]/production-order-share-view.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Factory,
  Package,
  Calendar,
  Shield,
  Info,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Truck,
  ClipboardCheck,
  AlertCircle,
  Building2,
} from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";
import { format } from "date-fns";

interface ProductionOrderShareViewProps {
  productionOrder: any;
  shareableLink: any;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
  ON_HOLD: "bg-yellow-500",
  CANCELLED: "bg-red-500",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-blue-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

const operationStatusColors: Record<string, string> = {
  PENDING: "border-gray-300 bg-gray-50",
  IN_PROGRESS: "border-blue-400 bg-blue-50",
  COMPLETED: "border-green-400 bg-green-50",
  ON_HOLD: "border-yellow-400 bg-yellow-50",
  CANCELLED: "border-red-400 bg-red-50",
};

export function ProductionOrderShareView({
  productionOrder,
  shareableLink,
}: ProductionOrderShareViewProps) {
  const hasVariant = productionOrder.productVariant;
  const hasOperations = productionOrder.operations && productionOrder.operations.length > 0;
  const hasQualityChecks = productionOrder.qualityChecks && productionOrder.qualityChecks.length > 0;
  const hasDelivery = productionOrder.deliveryAssignment;
  const hasCustomer = productionOrder.customerOrder?.customer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Factory className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {productionOrder.product.name}
                  {hasVariant && (
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      - {productionOrder.productVariant.displayName}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Production Order #{productionOrder.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Badge
                className={`${statusColors[productionOrder.status]} text-white px-3 py-1`}
              >
                {productionOrder.status.replace(/_/g, " ")}
              </Badge>
              <Badge
                variant="outline"
                className={`${priorityColors[productionOrder.priority]} text-white px-3 py-1`}
              >
                {productionOrder.priority} Priority
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                    <p className="text-2xl font-bold">{productionOrder.quantity}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(productionOrder.startDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(productionOrder.dueDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">
                      {hasOperations
                        ? Math.round(
                            (productionOrder.operations.filter(
                              (op: any) => op.status === "COMPLETED"
                            ).length /
                              productionOrder.operations.length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                  <p className="text-lg font-semibold">{productionOrder.product.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="text-lg font-semibold">{productionOrder.product.sku}</p>
                </div>
                {productionOrder.product.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-lg font-semibold">
                      {productionOrder.product.category.name}
                    </p>
                  </div>
                )}
                {hasVariant && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Variant</p>
                      <p className="text-lg font-semibold">
                        {productionOrder.productVariant.displayName}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Variant Attributes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {productionOrder.productVariant.attributeValues.map((av: any) => (
                          <Badge key={av.id} variant="outline">
                            {av.attribute.name}: {av.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {hasCustomer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                    <p className="text-lg font-semibold">
                      {productionOrder.customerOrder.customer.name}
                    </p>
                  </div>
                  {productionOrder.customerOrder.customer.email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg font-semibold">
                        {productionOrder.customerOrder.customer.email}
                      </p>
                    </div>
                  )}
                  {productionOrder.customerOrder.customer.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-lg font-semibold">
                        {productionOrder.customerOrder.customer.phone}
                      </p>
                    </div>
                  )}
                  {productionOrder.customerOrder.customer.address && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-lg font-semibold">
                        {productionOrder.customerOrder.customer.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operations Timeline */}
          {hasOperations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Production Operations
                </CardTitle>
                <CardDescription>
                  Track the status of each operation in the production workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productionOrder.operations.map((operation: any, index: number) => (
                    <div
                      key={operation.id}
                      className={`p-4 border-l-4 rounded-lg ${
                        operationStatusColors[operation.status]
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">
                              #{index + 1} {operation.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {operation.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Work Center</p>
                              <p className="font-medium">{operation.workCenter.name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Assigned To</p>
                              <p className="font-medium">
                                {operation.assignedTo?.name || "Not Assigned"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Duration</p>
                              <p className="font-medium">{operation.estimatedDuration} hours</p>
                            </div>
                          </div>
                          {operation.actualStartTime && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Started: </span>
                              <span className="font-medium">
                                {format(new Date(operation.actualStartTime), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                          )}
                          {operation.actualEndTime && (
                            <div className="mt-1 text-sm">
                              <span className="text-muted-foreground">Completed: </span>
                              <span className="font-medium">
                                {format(new Date(operation.actualEndTime), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quality Checks */}
          {hasQualityChecks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Quality Control
                </CardTitle>
                <CardDescription>Quality inspection reports and findings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productionOrder.qualityChecks.map((check: any) => (
                    <div
                      key={check.id}
                      className={`p-4 border rounded-lg ${
                        check.status === "PASSED"
                          ? "border-green-200 bg-green-50 dark:bg-green-950"
                          : check.status === "FAILED"
                          ? "border-red-200 bg-red-50 dark:bg-red-950"
                          : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {check.status === "PASSED" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-semibold">
                              {check.inspector
                                ? `${check.inspector.firstName} ${check.inspector.lastName}`
                                : "Unknown Inspector"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(check.checkDate), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                        <Badge
                          variant={check.status === "PASSED" ? "default" : "destructive"}
                        >
                          {check.status}
                        </Badge>
                      </div>
                      {check.defectsFound > 0 && (
                        <div className="mb-2">
                          <p className="text-sm">
                            <span className="font-medium">Defects Found: </span>
                            {check.defectsFound}
                          </p>
                        </div>
                      )}
                      {check.actionTaken && (
                        <div className="mb-2">
                          <p className="text-sm">
                            <span className="font-medium">Action Taken: </span>
                            {check.actionTaken}
                          </p>
                        </div>
                      )}
                      {check.notes && (
                        <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                          <p className="text-sm">{check.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Information */}
          {hasDelivery && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                    <p className="text-lg font-semibold">
                      {productionOrder.deliveryAssignment.assignedUser?.name || "Not Assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline" className="text-sm">
                      {productionOrder.deliveryAssignment.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {productionOrder.deliveryAssignment.scheduledDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Scheduled Date</p>
                      <p className="text-lg font-semibold">
                        {format(
                          new Date(productionOrder.deliveryAssignment.scheduledDate),
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                  )}
                  {productionOrder.deliveryAssignment.deliveryAddress && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Delivery Address
                      </p>
                      <p className="text-lg font-semibold">
                        {productionOrder.deliveryAssignment.deliveryAddress}
                      </p>
                    </div>
                  )}
                  {productionOrder.deliveryAssignment.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Delivery Notes
                      </p>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <p>{productionOrder.deliveryAssignment.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Share Info Footer */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure shared link</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Expires: {new Date(shareableLink.expiresAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Views: {shareableLink.accessCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-muted-foreground">
          <p>This is a shared production order view for business collaboration.</p>
          <p className="mt-1">Powered by XGEN MRP System</p>
        </div>
      </div>
    </div>
  );
}
