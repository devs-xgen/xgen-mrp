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
    if (!d) return "Not yet";
    try {
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid date";
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
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Fulfillment Data</h3>
            <p className="text-sm text-muted-foreground">This order doesn&apos;t have any items to fulfill yet.</p>
          </div>
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
                      <div className="flex flex-col text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">Allocated:</span>
                          <span className={`font-medium ${line?.allocatedAt ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {formatDate(line?.allocatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Fulfilled:</span>
                          <span className={`font-medium ${line?.fulfilledAt ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {formatDate(line?.fulfilledAt)}
                          </span>
                        </div>
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
