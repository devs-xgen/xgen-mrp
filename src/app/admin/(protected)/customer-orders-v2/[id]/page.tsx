import { Suspense } from "react";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";
import { getCustomerOrderById } from "@/lib/actions/customer-order";

interface PageProps {
  params: { id: string };
}

async function OrderDetails({ id }: { id: string }) {
  // Fetch only from server action as requested
  const order: any = await getCustomerOrderById(id);

  return (
    <div className="space-y-6">
      <SectionCard
        heading={`Order ${order.orderNumber}`}
        contentClassName="space-y-4"
      >
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

      <SectionCard heading="Production Orders" contentClassName="space-y-4">
        {order.productionOrders?.length ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Variant</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Start</th>
                  <th className="py-2 pr-4">Due</th>
                  <th className="py-2 pr-4">Completed</th>
                </tr>
              </thead>
              <tbody>
                {order.productionOrders.map((po: any) => (
                  <tr key={po.id} className="border-t">
                    <td className="py-2 pr-4">{po.id}</td>
                    <td className="py-2 pr-4">{po.product?.name ?? "—"} {po.product?.sku ? `(${po.product.sku})` : ""}</td>
                    <td className="py-2 pr-4">{po.productVariant?.displayName ?? "—"}</td>
                    <td className="py-2 pr-4">{po.quantity}</td>
                    <td className="py-2 pr-4">{String(po.status)}</td>
                    <td className="py-2 pr-4">{String(po.priority ?? "—")}</td>
                    <td className="py-2 pr-4">{po.startDate ? new Date(po.startDate).toLocaleString() : "—"}</td>
                    <td className="py-2 pr-4">{po.dueDate ? new Date(po.dueDate).toLocaleString() : "—"}</td>
                    <td className="py-2 pr-4">{po.completedQuantity ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No production orders</div>
        )}
      </SectionCard>

      <SectionCard heading="Billing Statements" contentClassName="space-y-4">
        {order.billingStatements?.length ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Statement #</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Billing Date</th>
                  <th className="py-2 pr-4">Invoice</th>
                  <th className="py-2 pr-4">Delivery Receipts</th>
                </tr>
              </thead>
              <tbody>
                {order.billingStatements.map((bs: any) => (
                  <tr key={bs.id} className="border-t">
                    <td className="py-2 pr-4">{bs.statementNumber}</td>
                    <td className="py-2 pr-4">{String(bs.status)}</td>
                    <td className="py-2 pr-4">{bs.totalAmount ?? "—"}</td>
                    <td className="py-2 pr-4">{bs.billingDate ? new Date(bs.billingDate).toLocaleString() : "—"}</td>
                    <td className="py-2 pr-4">{bs.salesInvoice ? `${bs.salesInvoice.invoiceNumber} (${bs.salesInvoice.status})` : "—"}</td>
                    <td className="py-2 pr-4">{bs.deliveryReceipts?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No billing statements</div>
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

export default async function CustomerOrderV2DetailPage({ params }: PageProps) {
  const { id } = params;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customer Order Details</PageTitle>
          <PageDescription>In-depth information for order {id}</PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <Suspense>
          {/* Keep to server action-only data per instruction */}
          <OrderDetails id={id} />
        </Suspense>
      </PageBody>
    </PageContainer>
  );
}
