'use client'

import { 
  SharedBillingStatement,
  SharedCustomerInfo,
  SharedCompanyInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay
} from '@/lib/utils/shared-document-transformers'
import SharedDocumentLayout from './SharedDocumentLayout'

export interface SharedBillingStatementViewProps {
  billingStatement: SharedBillingStatement
  customerInfo: SharedCustomerInfo
  companyInfo: SharedCompanyInfo
}

export default function SharedBillingStatementView({ 
  billingStatement, 
  customerInfo, 
  companyInfo 
}: SharedBillingStatementViewProps) {
  return (
    <SharedDocumentLayout
      documentType="Billing Statement"
      documentTitle="BILLING STATEMENT"
      companyInfo={companyInfo}
    >
      {/* Document Header Information */}
      <div className="mb-6">
        <div className="text-right">
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Statement #:</span> {billingStatement.statementNumber}</p>
            <p><span className="font-medium">Date:</span> {formatDateForDisplay(billingStatement.billingDate)}</p>
            {billingStatement.dueDate && (
              <p><span className="font-medium">Due Date:</span> {formatDateForDisplay(billingStatement.dueDate)}</p>
            )}
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                billingStatement.status === 'PAID' ? 'bg-green-100 text-green-800' :
                billingStatement.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                billingStatement.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {billingStatement.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer and Order Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
          <div className="text-sm space-y-1">
            <p className="font-medium">{customerInfo.name}</p>
            {customerInfo.address && <p>{customerInfo.address}</p>}
            {(customerInfo.city || customerInfo.state || customerInfo.postalCode) && (
              <p>
                {[customerInfo.city, customerInfo.state, customerInfo.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {customerInfo.country && <p>{customerInfo.country}</p>}
            {customerInfo.phone && (
              <p>
                <span className="font-medium">Phone:</span>{' '}
                <a 
                  href={`tel:${customerInfo.phone}`} 
                  className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  {customerInfo.phone}
                </a>
              </p>
            )}
            {customerInfo.email && (
              <p>
                <span className="font-medium">Email:</span>{' '}
                <a 
                  href={`mailto:${customerInfo.email}`} 
                  className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  {customerInfo.email}
                </a>
              </p>
            )}
            {customerInfo.tinNumber && (
              <p><span className="font-medium">TIN:</span> {customerInfo.tinNumber}</p>
            )}
          </div>
        </div>

        {/* Order Information */}
        {billingStatement.customerOrder && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information:</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Order #:</span> {billingStatement.customerOrder.orderNumber}</p>
              <p><span className="font-medium">Order Date:</span> {formatDateForDisplay(billingStatement.customerOrder.orderDate)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Production Order Information */}
      {billingStatement.productionOrder && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Production Details:</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Production Order:</span> {billingStatement.productionOrder.id}</p>
                <p><span className="font-medium">Quantity:</span> {billingStatement.productionOrder.quantity.toLocaleString()}</p>
              </div>
              <div>
                <p><span className="font-medium">Start Date:</span> {formatDateForDisplay(billingStatement.productionOrder.startDate)}</p>
                <p><span className="font-medium">Due Date:</span> {formatDateForDisplay(billingStatement.productionOrder.dueDate)}</p>
              </div>
              {billingStatement.productionOrder.product && (
                <div className="md:col-span-2">
                  <p>
                    <span className="font-medium">Product:</span>{' '}
                    {billingStatement.productionOrder.product.name} ({billingStatement.productionOrder.product.sku})
                  </p>
                </div>
              )}
              {billingStatement.productionOrder.productVariant && (
                <div className="md:col-span-2">
                  <p>
                    <span className="font-medium">Variant:</span>{' '}
                    {billingStatement.productionOrder.productVariant.displayName} ({billingStatement.productionOrder.productVariant.sku})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Invoice Information */}
      {billingStatement.salesInvoice && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sales Invoice Details:</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Invoice #:</span> {billingStatement.salesInvoice.invoiceNumber}</p>
                <p><span className="font-medium">Invoice Date:</span> {formatDateForDisplay(billingStatement.salesInvoice.invoiceDate)}</p>
                {billingStatement.salesInvoice.poNumber && (
                  <p><span className="font-medium">PO Number:</span> {billingStatement.salesInvoice.poNumber}</p>
                )}
              </div>
              <div>
                {billingStatement.salesInvoice.dueDate && (
                  <p><span className="font-medium">Due Date:</span> {formatDateForDisplay(billingStatement.salesInvoice.dueDate)}</p>
                )}
                {billingStatement.salesInvoice.paymentTerms && (
                  <p><span className="font-medium">Payment Terms:</span> {billingStatement.salesInvoice.paymentTerms}</p>
                )}
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                    billingStatement.salesInvoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    billingStatement.salesInvoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {billingStatement.salesInvoice.status}
                  </span>
                </p>
              </div>
            </div>
            
            {/* Invoice Items */}
            {billingStatement.salesInvoice.invoiceItems && billingStatement.salesInvoice.invoiceItems.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Invoice Items:</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {billingStatement.salesInvoice.invoiceItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item.description}
                            {item.productCode && (
                              <div className="text-xs text-gray-500">Code: {item.productCode}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {parseFloat(item.quantity).toLocaleString()}
                            {item.unit && <span className="text-gray-500 ml-1">{item.unit}</span>}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {formatCurrencyForDisplay(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium">
                            {formatCurrencyForDisplay(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Receipts */}
      {billingStatement.deliveryReceipts && billingStatement.deliveryReceipts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Information:</h3>
          <div className="space-y-4">
            {billingStatement.deliveryReceipts.map((receipt) => (
              <div key={receipt.id} className="bg-green-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Receipt #:</span> {receipt.receiptNumber}</p>
                    <p><span className="font-medium">Delivery Date:</span> {formatDateForDisplay(receipt.deliveryDate)}</p>
                    <p><span className="font-medium">Received By:</span> {receipt.receivedBy}</p>
                    {receipt.receivedByTitle && (
                      <p><span className="font-medium">Title:</span> {receipt.receivedByTitle}</p>
                    )}
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                        receipt.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        receipt.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {receipt.deliveryStatus}
                      </span>
                    </p>
                    {receipt.trackingNumber && (
                      <p><span className="font-medium">Tracking:</span> {receipt.trackingNumber}</p>
                    )}
                    {receipt.courierService && (
                      <p><span className="font-medium">Courier:</span> {receipt.courierService}</p>
                    )}
                  </div>
                  {receipt.deliveryAddress && (
                    <div className="md:col-span-2">
                      <p><span className="font-medium">Delivery Address:</span> {receipt.deliveryAddress}</p>
                    </div>
                  )}
                  {receipt.deliveryNotes && (
                    <div className="md:col-span-2">
                      <p><span className="font-medium">Notes:</span> {receipt.deliveryNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="border-t pt-6">
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">{formatCurrencyForDisplay(billingStatement.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Amount:</span>
                <span className="font-medium">{formatCurrencyForDisplay(billingStatement.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrencyForDisplay(billingStatement.discountAmount)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Net Amount:</span>
                <span>{formatCurrencyForDisplay(billingStatement.netAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {billingStatement.notes && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{billingStatement.notes}</p>
        </div>
      )}
    </SharedDocumentLayout>
  )
}