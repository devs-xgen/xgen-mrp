"use client"
import { useState } from "react";
import { SectionCard } from "@/components/shared/page-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Factory } from "lucide-react";
import { CreateProductionOrdersDialog } from "@/components/module/admin/customer-orders/create-production-orders-dialog";

interface ProductionSectionProps {
  order: any;
}

export function ProductionSection({ order }: ProductionSectionProps) {
  const prodOrders: any[] = Array.isArray(order?.productionOrders) ? order.productionOrders : [];
  const [isProdDialogOpen, setIsProdDialogOpen] = useState(false);

  const formatDate = (d?: string | Date | null) => {
    if (!d) return "—";
    try {
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toLocaleString();
    } catch {
      return "—";
    }
  };

  const statusBadge = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">In Progress</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "CANCELLED":
      case "FAILED":
        return <Badge variant="destructive">{status}</Badge>;
      case "ON_HOLD":
        return <Badge variant="warning">On Hold</Badge>;
      case "ACTIVE":
      default:
        return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  const priorityBadge = (priority?: string) => {
    switch (priority) {
      case "CRITICAL":
      case "URGENT":
        return <Badge variant="destructive">{priority}</Badge>;
      case "HIGH":
        return <Badge variant="warning">{priority}</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary">{priority}</Badge>;
      case "LOW":
      default:
        return <Badge variant="outline">{priority || "LOW"}</Badge>;
    }
  };

  const safePct = (num: number, den: number) => (den > 0 ? Math.min(100, Math.max(0, (num / den) * 100)) : 0);

  return (
    <div className="space-y-6">
      <SectionCard 
        heading={
          <div className="flex items-center justify-between">
            <span>Production</span>
            {prodOrders.length === 0 && (
              <Button onClick={() => setIsProdDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Production Orders
              </Button>
            )}
          </div>
        }
        contentClassName="space-y-4"
      >
        {prodOrders.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <Factory className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No Production Orders</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Create production orders for this customer order to start manufacturing.
              </p>
            </div>
            <Button onClick={() => setIsProdDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Production Orders for this Customer Order
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-32">Completed</TableHead>
                <TableHead className="w-32">Progress</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-28">Priority</TableHead>
                <TableHead className="w-80">Dates</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prodOrders.map((po: any) => {
                const product = po?.product;
                const variant = po?.productVariant;
                const name = variant?.displayName || product?.name || "Item";
                const sku = variant?.sku || product?.sku || "";
                const qty = Math.max(0, Number(po?.quantity) || 0);
                const done = Math.max(0, Number(po?.completedQuantity) || 0);
                const pct = safePct(done, qty);

                return (
                  <TableRow key={po.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">{sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{qty}</TableCell>
                    <TableCell className="tabular-nums">{done}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-28">
                          <Progress value={pct} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{Math.round(pct)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(String(po?.status || ""))}</TableCell>
                    <TableCell>{priorityBadge(String(po?.priority || ""))}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>
                          Start: <span className="font-medium text-foreground">{formatDate(po?.startDate)}</span>
                        </span>
                        <span>
                          Due: <span className="font-medium text-foreground">{formatDate(po?.dueDate)}</span>
                        </span>
                        <span>
                          Completed: <span className="font-medium text-foreground">{formatDate(po?.completedAt)}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[20rem]">
                      <div className="truncate text-sm text-muted-foreground">{po?.notes || ""}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <CreateProductionOrdersDialog
        customerOrderId={order.id}
        customerOrderNumber={order.orderNumber}
        open={isProdDialogOpen}
        onOpenChange={setIsProdDialogOpen}
      />
    </div>
  );
}
