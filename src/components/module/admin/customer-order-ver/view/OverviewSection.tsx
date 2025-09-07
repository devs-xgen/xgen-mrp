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
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>{String(order.status)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Order Date</span>
              {order.orderDate ? (
                <span className="font-medium">{new Date(order.orderDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No order date set</div>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Required Date</span>
              {order.requiredDate ? (
                <span className="font-medium">{new Date(order.requiredDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No required date set</div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Total Amount</span>
              {order.totalAmount ? (
                <span className="font-bold text-lg text-primary">{order.totalAmount}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No amount set</div>
              )}
            </div>
            <div className="flex items-start justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Notes</span>
              {order.notes ? (
                <span className="text-sm max-w-xs text-right">{order.notes}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No notes added</div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard heading="Customer" contentClassName="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Customer Name</span>
              {order.customer?.name ? (
                <span className="font-medium">{order.customer.name}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No customer name</div>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Email</span>
              {order.customer?.email ? (
                <span className="font-medium text-blue-600">{order.customer.email}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No email provided</div>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Phone</span>
              {order.customer?.phone ? (
                <span className="font-medium">{order.customer.phone}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No phone number</div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Address</span>
              {order.customer?.address ? (
                <span className="font-medium max-w-xs text-right">{order.customer.address}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No address provided</div>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Payment Terms</span>
              {order.customer?.paymentTerms ? (
                <span className="font-medium">{order.customer.paymentTerms}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No payment terms</div>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Credit Limit</span>
              {order.customer?.creditLimit ? (
                <span className="font-bold text-primary">{order.customer.creditLimit}</span>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">No credit limit set</div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard heading="Order Lines" contentClassName="space-y-4">
        {order.orderLines?.length ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b-2 border-border">
                  <th className="py-3 pr-4 font-semibold">Item</th>
                  <th className="py-3 pr-4 font-semibold">Variant</th>
                  <th className="py-3 pr-4 font-semibold text-center">Quantity</th>
                  <th className="py-3 pr-4 font-semibold text-right">Unit Price</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {order.orderLines.map((line: any) => (
                  <tr key={line.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{line.product?.name || 'Unknown Product'}</div>
                      {line.product?.sku && (
                        <div className="text-xs text-muted-foreground">SKU: {line.product.sku}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {line.productVariant?.displayName ? (
                        <span className="text-sm">{line.productVariant.displayName}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No variant</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center font-medium">{line.quantity}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-primary">{line.unitPrice}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        line.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        line.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        line.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{String(line.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Order Items</h3>
            <p className="text-sm text-muted-foreground">This order doesn&apos;t have any items yet.</p>
          </div>
        )}
      </SectionCard>
      {order.transactions && order.transactions.length > 0 && (
        <SectionCard heading="Transactions" contentClassName="space-y-4">
          <div className="space-y-3">
            {order.transactions.map((transaction: any) => (
              <div key={transaction.id} className="border rounded-lg p-4 bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div><span className="text-muted-foreground">Payment Method:</span> {transaction.paymentMethod}</div>
                    <div><span className="text-muted-foreground">Amount:</span> {transaction.amount}</div>
                    <div><span className="text-muted-foreground">Payment Date:</span> {transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleString() : "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div><span className="text-muted-foreground">Status:</span> {transaction.status}</div>
                    <div><span className="text-muted-foreground">Handled By:</span> {transaction.handledByUser?.name || transaction.handledBy || "—"}</div>
                    {transaction.notes && (
                      <div><span className="text-muted-foreground">Notes:</span> {transaction.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {order.transaction && !order.transactions && (
        <SectionCard heading="Transaction" contentClassName="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div><span className="text-muted-foreground">Payment Method:</span> {order.transaction.paymentMethod}</div>
              <div><span className="text-muted-foreground">Amount:</span> {order.transaction.amount}</div>
              <div><span className="text-muted-foreground">Payment Date:</span> {order.transaction.paymentDate ? new Date(order.transaction.paymentDate).toLocaleString() : "—"}</div>
            </div>
            <div className="space-y-1">
              <div><span className="text-muted-foreground">Status:</span> {order.transaction.status}</div>
              <div><span className="text-muted-foreground">Handled By:</span> {order.transaction.handledByUser?.name || order.transaction.handledBy || "—"}</div>
              {order.transaction.notes && (
                <div><span className="text-muted-foreground">Notes:</span> {order.transaction.notes}</div>
              )}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
