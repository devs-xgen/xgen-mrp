"use client"
import { SectionCard } from "@/components/shared/page-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FulfillmentSectionProps {
  order: any;
}

export function FulfillmentSection({ order }: FulfillmentSectionProps) {
  const lines: any[] = Array.isArray(order?.orderLines) ? order.orderLines : [];

  const formatDate = (d?: string | Date | null) => {
    if (!d) return "—";
    try {
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toLocaleString();
    } catch {
      return "—";
    }
  };

  const badgeForStatus = (status?: string) => {
    switch (status) {
      case "FULFILLED":
        return <Badge variant="success">Fulfilled</Badge>;
      case "PARTIALLY_FULFILLED":
        return <Badge variant="warning">Partially Fulfilled</Badge>;
      case "ALLOCATED":
        return <Badge variant="secondary">Allocated</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "PENDING":
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const computeProgress = (line: any) => {
    const qty = Math.max(0, Number(line?.quantity) || 0);
    const allocated = Math.max(0, Number(line?.stockAllocated) || 0);
    const produced = Math.max(0, Number(line?.productionQuantity) || 0);
    const type = String(line?.fulfillmentType || "PENDING");

    const safePct = (num: number, den: number) => (den > 0 ? Math.min(100, Math.max(0, (num / den) * 100)) : 0);
    const allocatedPct = safePct(allocated, qty);
    const producedPct = safePct(produced, qty);

    let totalPct = 0;
    if (type === "STOCK") totalPct = allocatedPct;
    else if (type === "PRODUCTION") totalPct = producedPct;
    else if (type === "HYBRID") totalPct = safePct(allocated + produced, qty);
    else totalPct = 0;

    return { qty, allocated, produced, allocatedPct, producedPct, totalPct };
  };

  return (
    <div className="space-y-6">
      <SectionCard heading="Fulfillment" contentClassName="space-y-4">
        {lines.length === 0 ? (
          <div className="text-sm text-muted-foreground">No order lines found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-32">Allocated</TableHead>
                <TableHead className="w-32">Produced</TableHead>
                <TableHead className="w-32">Progress</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-64">Timestamps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const product = line?.product;
                const variant = line?.productVariant;
                const name = variant?.displayName || product?.name || "Item";
                const sku = variant?.sku || product?.sku || "";
                const type = String(line?.fulfillmentType || "PENDING");
                const status = String(line?.fulfillmentStatus || "PENDING");
                const { qty, allocated, produced, allocatedPct, producedPct, totalPct } = computeProgress(line);

                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">{sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{qty}</TableCell>
                    <TableCell>
                      <Badge variant={type === "STOCK" ? "secondary" : type === "PRODUCTION" ? "default" : type === "HYBRID" ? "success" : "outline"}>
                        {type}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {allocated}/{qty}
                      <div className="mt-1">
                        <Progress value={allocatedPct} />
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {produced}/{qty}
                      <div className="mt-1">
                        <Progress value={producedPct} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-28">
                          <Progress value={totalPct} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(totalPct)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{badgeForStatus(status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>
                          Allocated: <span className="font-medium text-foreground">{formatDate(line?.allocatedAt)}</span>
                        </span>
                        <span>
                          Fulfilled: <span className="font-medium text-foreground">{formatDate(line?.fulfilledAt)}</span>
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
