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

  const sharePath = `/share/production/${shareableLink.token}`;
  const totalOperations = productionOrder.operations?.length ?? 0;
  const completedOperations = productionOrder.operations?.filter(
    (op: any) => op.status === "COMPLETED"
  ).length ?? 0;
  const progress = totalOperations > 0 ? Math.round((completedOperations / totalOperations) * 100) : 0;
  const uniqueWorkCenters = totalOperations
    ? new Set(
        productionOrder.operations
          .map((op: any) => op.workCenter?.name)
          .filter((name: string | undefined) => Boolean(name))
      ).size
    : 0;
  const uniqueOperators = totalOperations
    ? new Set(
        productionOrder.operations
          .map((op: any) => op.assignedTo?.id)
          .filter((id: string | undefined) => Boolean(id))
      ).size
    : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <span className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-500/10" />
      <span className="pointer-events-none absolute -left-40 bottom-[-20%] h-[26rem] w-[26rem] rounded-full bg-purple-400/20 blur-[110px] dark:bg-purple-500/10" />

      <div className="relative z-10">
        <header className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-white/40 bg-white/70 p-8 shadow-xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Factory className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-blue-500 dark:text-blue-400">
                    Production Order
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                    {productionOrder.product.name}
                    {hasVariant && (
                      <span className="ml-2 text-lg font-normal text-blue-600/80 dark:text-blue-400/70">
                        — {productionOrder.productVariant.displayName}
                      </span>
                    )}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <Badge className={`${statusColors[productionOrder.status]} text-white px-3 py-1`}>
                      {productionOrder.status.replace(/_/g, " ")}
                    </Badge>
                    <Separator orientation="vertical" className="hidden h-4 sm:flex" />
                    <Badge
                      variant="outline"
                      className={`${priorityColors[productionOrder.priority]} text-white px-3 py-1`}
                    >
                      {productionOrder.priority} Priority
                    </Badge>
                    <Separator orientation="vertical" className="hidden h-4 sm:flex" />
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <span>PO #{productionOrder.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:min-w-[260px]">
                <div className="rounded-2xl border border-blue-200/60 bg-blue-50/60 px-4 py-3 text-sm shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
                  <p className="font-medium text-blue-700 dark:text-blue-300">Share URL</p>
                  <p className="mt-1 truncate text-xs text-blue-600/80 dark:text-blue-200/80">{sharePath}</p>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Tokenized external access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Expires {new Date(shareableLink.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>{shareableLink.accessCount} view events</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Quantity
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
                    {productionOrder.quantity}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">units</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Start Date
                </p>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                  {format(new Date(productionOrder.startDate), "MMM dd, yyyy")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Due Date
                </p>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                  {format(new Date(productionOrder.dueDate), "MMM dd, yyyy")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Progress
                </p>
                <p className="mt-3 text-3xl font-semibold text-blue-600 dark:text-blue-400">{progress}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completedOperations} of {totalOperations} operations completed
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Info className="h-5 w-5" />
                  Production Narrative
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  At-a-glance context for planners and stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Customer Order
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                      {productionOrder.customerOrder?.orderNumber ?? "Independent production"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Priority
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                      {productionOrder.priority.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Notes
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                      {productionOrder.notes?.length ? productionOrder.notes : "No additional notes."}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Start & Due
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <span>Start: {format(new Date(productionOrder.startDate), "MMM dd, yyyy")}</span>
                      <Separator orientation="vertical" className="hidden h-4 sm:flex" />
                      <span>Due: {format(new Date(productionOrder.dueDate), "MMM dd, yyyy")}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Work Centers & Personnel
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Distinct work centers</p>
                        <p className="text-lg font-semibold">{uniqueWorkCenters}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Assigned operators</p>
                        <p className="text-lg font-semibold">{uniqueOperators}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
              <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Package className="h-5 w-5" />
                    Product & Variant
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Canonical product metadata for this build
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-800/50 dark:bg-slate-900/60">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Product Name
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {productionOrder.product.name}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-800/50 dark:bg-slate-900/60">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        SKU
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {productionOrder.product.sku}
                      </p>
                    </div>
                    {productionOrder.product.category && (
                      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-800/50 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Category
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {productionOrder.product.category.name}
                        </p>
                      </div>
                    )}
                    {hasVariant && (
                      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-800/50 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Variant
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {productionOrder.productVariant.displayName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          SKU: {productionOrder.productVariant.sku}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(() => {
                            const attributes: { label: string; value: string }[] = [];

                            if (productionOrder.productVariant?.sizeName) {
                              attributes.push({
                                label: "Size",
                                value: productionOrder.productVariant.sizeName,
                              });
                            }

                            if (productionOrder.productVariant?.colorName) {
                              attributes.push({
                                label: "Color",
                                value: productionOrder.productVariant.colorName,
                              });
                            }

                            if (productionOrder.productVariant?.styleName) {
                              attributes.push({
                                label: "Style",
                                value: productionOrder.productVariant.styleName,
                              });
                            }

                            if (productionOrder.productVariant?.materialName) {
                              attributes.push({
                                label: "Material",
                                value: productionOrder.productVariant.materialName,
                              });
                            }

                            if (productionOrder.productVariant?.variantGroup) {
                              attributes.push({
                                label: "Group",
                                value: productionOrder.productVariant.variantGroup,
                              });
                            }

                            return attributes.map((attr) => (
                              <Badge
                                key={`${productionOrder.productVariant.id}-${attr.label}`}
                                variant="secondary"
                                className="bg-slate-200/70 text-xs text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                              >
                                {attr.label}: {attr.value}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-5 w-5" />
                    Execution Metrics
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Operational cadence and resource deployment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-br from-purple-500/90 to-indigo-600/90 p-5 text-white shadow-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Progress</p>
                    <p className="mt-3 text-3xl font-semibold">{progress}%</p>
                    <p className="mt-1 text-xs text-white/80">
                      {completedOperations} of {totalOperations} operations complete
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 text-sm dark:border-slate-800/50 dark:bg-slate-900/60">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Distinct Work Centers</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uniqueWorkCenters}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 text-sm dark;border-slate-800/50 dark:bg-slate-900/60">
                      <p className="font-medium text-slate-700 dark:text-slate-200">Assigned Operators</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uniqueOperators}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {hasCustomer && (
              <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-5 w-5" />
                    Customer Partner
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Contact information for downstream coordination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Company
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {productionOrder.customerOrder.customer.name}
                      </p>
                    </div>
                    {productionOrder.customerOrder.customer.email && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Email
                        </p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                          {productionOrder.customerOrder.customer.email}
                        </p>
                      </div>
                    )}
                    {productionOrder.customerOrder.customer.phone && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Phone
                        </p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                          {productionOrder.customerOrder.customer.phone}
                        </p>
                      </div>
                    )}
                    {productionOrder.customerOrder.customer.address && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Address
                        </p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                          {productionOrder.customerOrder.customer.address}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasOperations && (
              <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5" />
                    Operations Timeline
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Phase-by-phase execution tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productionOrder.operations.map((operation: any, index: number) => (
                    <div
                      key={operation.id}
                      className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm transition-all hover:border-blue-200 dark:border-slate-800/50 dark:bg-slate-900/60 hover:dark:border-blue-500/30"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                              Phase {index + 1}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {operation.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {operation.name}
                          </h3>
                          <div className="grid gap-4 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Work Center
                              </p>
                              <p className="mt-1 font-medium">{operation.workCenter.name}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Assigned To
                              </p>
                              <p className="mt-1 font-medium">
                                {operation.assignedTo?.name || "Not Assigned"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Duration
                              </p>
                              <p className="mt-1 font-medium">{operation.estimatedDuration} hrs</p>
                            </div>
                          </div>
                          <div className="grid gap-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                            {operation.actualStartTime && (
                              <p>
                                <span className="font-medium text-slate-600 dark:text-slate-300">Started:</span> {" "}
                                {format(new Date(operation.actualStartTime), "MMM dd, yyyy HH:mm")}
                              </p>
                            )}
                            {operation.actualEndTime && (
                              <p>
                                <span className="font-medium text-slate-600 dark:text-slate-300">Completed:</span> {" "}
                                {format(new Date(operation.actualEndTime), "MMM dd, yyyy HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {hasQualityChecks && (
              <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ClipboardCheck className="h-5 w-5" />
                    Quality Surveillance
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Inspection log and remediation notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productionOrder.qualityChecks.map((check: any) => (
                    <div
                      key={check.id}
                      className={`rounded-2xl border p-5 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-500/30 ${
                        check.status === "PASSED"
                          ? "border-green-200/80 bg-green-50/80 dark:border-green-500/20 dark:bg-green-500/10"
                          : check.status === "FAILED"
                          ? "border-red-200/80 bg-red-50/80 dark:border-red-500/20 dark:bg-red-500/10"
                          : "border-yellow-200/80 bg-yellow-50/80 dark:border-yellow-500/20 dark:bg-yellow-500/10"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {check.status === "PASSED" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {check.inspector
                                ? `${check.inspector.firstName} ${check.inspector.lastName}`
                                : "Unknown Inspector"}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {format(new Date(check.checkDate), "MMM dd, yyyy HH:mm")}
                          </p>
                          {check.notes && (
                            <p className="text-sm text-slate-700 dark:text-slate-200">{check.notes}</p>
                          )}
                        </div>
                        <Badge variant={check.status === "PASSED" ? "default" : "destructive"}>
                          {check.status}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                        <p>
                          <span className="font-medium">Defects:</span> {check.defectsFound ?? 0}
                        </p>
                        {check.actionTaken && (
                          <p>
                            <span className="font-medium">Action Taken:</span> {check.actionTaken}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {hasDelivery && (
              <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Truck className="h-5 w-5" />
                    Logistics & Delivery
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Downstream readiness checkpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Assigned Coordinator
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {productionOrder.deliveryAssignment.assignedUser?.name || "Not Assigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Delivery Status
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {productionOrder.deliveryAssignment.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {productionOrder.deliveryAssignment.scheduledDate && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Scheduled Date
                        </p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                          {format(
                            new Date(productionOrder.deliveryAssignment.scheduledDate),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    )}
                    {productionOrder.deliveryAssignment.deliveryAddress && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Delivery Address
                        </p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                          {productionOrder.deliveryAssignment.deliveryAddress}
                        </p>
                      </div>
                    )}
                  </div>
                  {productionOrder.deliveryAssignment.notes && (
                    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-300">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Special Instructions
                      </p>
                      <p className="mt-2">{productionOrder.deliveryAssignment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
              <CardContent className="flex flex-col gap-6 py-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure token distribution</span>
                  </div>
                  <Separator orientation="vertical" className="hidden h-4 sm:flex" />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Valid through {new Date(shareableLink.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <Separator orientation="vertical" className="hidden h-4 sm:flex" />
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>{shareableLink.accessCount} view events tracked</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  This collaborative panel is generated in real time from XGEN MRP. Content is read-only and reflects the latest production state when accessed.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl border border-white/40 bg-white/60 p-6 text-center text-sm text-slate-500 shadow-lg backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-400">
            <p>This dashboard is published for partner visibility. Direct edits are disabled in share mode.</p>
            <p className="mt-1">Powered by XGEN MRP System</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
