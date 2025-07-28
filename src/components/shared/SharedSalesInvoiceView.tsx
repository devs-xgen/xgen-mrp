'use client'

import { 
  SharedSalesInvoice,
  SharedCustomerInfo,
  SharedCompanyInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay
} from '@/lib/utils/shared-document-transformers'
import SharedDocumentLayout from './SharedDocumentLayout'

export interface SharedSalesInvoiceViewProps {
  salesInvoice: SharedSalesInvoice
  customerInfo: SharedCustomerInfo
  companyInfo: SharedCompanyInfo
}

export default function SharedSalesInvoiceView({ 
  salesInvoice, 
  customerInfo, 
  companyInfo 
}: SharedSalesInvoiceViewProps) {
  return (
    <SharedDocumentLayout
      documentType="Sales Invoice"
      documentTitle="SALES INVOICE"
      companyInfo={companyInfo}
    >
      {/* Document Header Information */}
      <div className="mb-6">
        <div className="text-right">
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Invoice #:</span> {salesInvoice.invoiceNumber}</p>
            <p><span className="font-medium">Invoice Date:</span> {formatDateForDisplay(salesInvoice.invoiceDate)}</p>
            {salesInvoice.dueDate && (
              <p><span className="font-medium">Due Date:</span> {formatDateForDisplay(salesInvoice.dueDate)}</p>
            )}
            {salesInvoice.poNumber && (
              <p><span className="font-medium">PO Number:</span> {salesInvoice.poNumber}</p>
            )}
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                salesInvoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                salesInvoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                salesInvoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                salesInvoice.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {salesInvoice.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer and Payment Information */}
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

        {/* Payment Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information:</h3>
          <div className="text-sm space-y-1">
            {salesInvoice.paymentTerms && (
              <p><span className="font-medium">Payment Terms:</span> {salesInvoice.paymentTerms}</p>
            )}
            {salesInvoice.dueDate && (
              <p><span className="font-medium">Payment Due:</span> {formatDateForDisplay(salesInvoice.dueDate)}</p>
            )}
            <p><span className="font-medium">Tax Rate:</span> {parseFloat(salesInvoice.taxRate).toFixed(2)}%</p>
            <p>
              <span className="font-medium">Total Amount:</span>{' '}
              <span className="text-lg font-bold text-green-600">
                {formatCurrencyForDisplay(salesInvoice.totalAmount)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      {salesInvoice.invoiceItems && salesInvoice.invoiceItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  {salesInvoice.invoiceItems.some(item => item.discountPercent && parseFloat(item.discountPercent) > 0) && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesInvoice.invoiceItems.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.productCode && (
                          <p className="text-xs text-gray-500 mt-1">Code: {item.productCode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {parseFloat(item.quantity).toLocaleString()}
                      {item.unit && <div className="text-xs text-gray-500">{item.unit}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrencyForDisplay(item.unitPrice)}
                    </td>
                    {salesInvoice.invoiceItems.some(item => item.discountPercent && parseFloat(item.discountPercent) > 0) && (
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {item.discountPercent && parseFloat(item.discountPercent) > 0 ? (
                          <span className="text-red-600">{parseFloat(item.discountPercent).toFixed(1)}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-center">
                      {item.taxable ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrencyForDisplay(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="border-t pt-6">
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrencyForDisplay(salesInvoice.subtotal)}</span>
              </div>
              
              {parseFloat(salesInvoice.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatCurrencyForDisplay(salesInvoice.discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax ({parseFloat(salesInvoice.taxRate).toFixed(2)}%):</span>
                <span className="font-medium">{formatCurrencyForDisplay(salesInvoice.taxAmount)}</span>
              </div>
              
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-green-600">{formatCurrencyForDisplay(salesInvoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      {salesInvoice.terms && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms and Conditions:</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
            {salesInvoice.terms}
          </div>
        </div>
      )}

      {/* Footer Notes */}
      {salesInvoice.footerNotes && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes:</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{salesInvoice.footerNotes}</p>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="mt-8 pt-6 border-t bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Instructions:</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>Please remit payment to the address above or contact us for electronic payment options.</p>
          {salesInvoice.dueDate && (
            <p className="font-medium text-blue-800">
              Payment is due by {formatDateForDisplay(salesInvoice.dueDate)}
            </p>
          )}
          <p>
            For questions about this invoice, please contact us at{' '}
            <a 
              href={`mailto:${companyInfo.email}`} 
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              {companyInfo.email}
            </a>
            {' '}or{' '}
            <a 
              href={`tel:${companyInfo.phone}`} 
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              {companyInfo.phone}
            </a>
          </p>
        </div>
      </div>
    </SharedDocumentLayout>
  )
}