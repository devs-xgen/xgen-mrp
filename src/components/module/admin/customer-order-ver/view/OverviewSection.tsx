"use client"
import { SectionCard } from "@/components/shared/page-layout";

interface OverviewSectionProps {
  order: any;
}

export function OverviewSection({ order }: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      <SectionCard heading={`Order ${order.orderNumber}`} contentClassName="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div><span className="text-muted-foreground">Status:</span> {String(order.status)}</div>
            <div><span className="text-muted-foreground">Order Date:</span> {order.orderDate ? new Date(order.orderDate).toLocaleString() : "—"}</div>
            <div><span className="text-muted-foreground">Required Date:</span> {order.requiredDate ? new Date(order.requiredDate).toLocaleString() : "—"}</div>
          </div>
          <div className="space-y-1">
            <div><span className="text-muted-foreground">Total Amount:</span> {order.totalAmount ?? "—"}</div>
            <div><span className="text-muted-foreground">Notes:</span> {order.notes || "—"}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard heading="Customer" contentClassName="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div><span className="text-muted-foreground">Name:</span> {order.customer?.name ?? "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {order.customer?.email ?? "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> {order.customer?.phone ?? "—"}</div>
          </div>
          <div className="space-y-1">
            <div><span className="text-muted-foreground">Address:</span> {order.customer?.address ?? "—"}</div>
            <div><span className="text-muted-foreground">Payment Terms:</span> {order.customer?.paymentTerms ?? "—"}</div>
            <div><span className="text-muted-foreground">Credit Limit:</span> {order.customer?.creditLimit ?? "—"}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard heading="Order Lines" contentClassName="space-y-4">
        {order.orderLines?.length ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Variant</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Unit Price</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {order.orderLines.map((line: any) => (
                  <tr key={line.id} className="border-t">
                    <td className="py-2 pr-4">
                      {line.product?.name ?? "—"} {line.product?.sku ? `(${line.product.sku})` : ""}
                    </td>
                    <td className="py-2 pr-4">
                      {line.productVariant?.displayName ?? "—"}
                    </td>
                    <td className="py-2 pr-4">{line.quantity}</td>
                    <td className="py-2 pr-4">{line.unitPrice}</td>
                    <td className="py-2 pr-4">{String(line.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No order lines</div>
        )}
      </SectionCard>
      {order.transaction && (
        <SectionCard heading="Transaction (raw)" contentClassName="space-y-2">
          <pre className="text-xs overflow-x-auto bg-muted/30 p-3 rounded">{JSON.stringify(order.transaction, null, 2)}</pre>
        </SectionCard>
      )}
    </div>
  );
}
