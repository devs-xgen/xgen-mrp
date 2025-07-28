'use client'

import { 
  SharedSalesInvoice, 
  SharedCustomerInfo, 
  SharedCompanyInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay
} from '@/lib/utils/client-formatters'

interface SalesInvoiceViewProps {
  salesInvoice: SharedSalesInvoice
  customerInfo: SharedCustomerInfo
  companyInfo: SharedCompanyInfo
}



export default function SalesInvoiceView({ salesInvoice, customerInfo, companyInfo }: SalesInvoiceViewProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
      
      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 z-10">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 print-page">
          {/* Company Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{companyInfo.name}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{companyInfo.address}</p>
                  <p>Phone: {companyInfo.phone}</p>
                  <p>Email: {companyInfo.email}</p>
                  {companyInfo.website && <p>Website: {companyInfo.website}</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">SALES INVOICE</h2>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Invoice #:</span> {salesInvoice.invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {formatDateForDisplay(salesInvoice.invoiceDate)}</p>
                  {salesInvoice.dueDate && (
                    <p><span className="font-medium">Due Date:</span> {formatDateForDisplay(salesInvoice.dueDate)}</p>
                  )}
                  {salesInvoice.poNumber && (
                    <p><span className="font-medium">PO Number:</span> {salesInvoice.poNumber}</p>
                  )}
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                      salesInvoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      salesInvoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesInvoice.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                {customerInfo.phone && <p>Phone: {customerInfo.phone}</p>}
                {customerInfo.email && <p>Email: {customerInfo.email}</p>}
                {customerInfo.tinNumber && <p>TIN: {customerInfo.tinNumber}</p>}
              </div>
            </div>

            {/* Payment Terms */}
            {salesInvoice.paymentTerms && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Terms:</h3>
                <div className="text-sm">
                  <p>{salesInvoice.paymentTerms}</p>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items:</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-900">Qty</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-900">Unit</th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-900">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesInvoice.invoiceItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          {item.productCode && (
                            <p className="text-gray-600 text-xs">Code: {item.productCode}</p>
                          )}
                          {item.discountPercent && parseFloat(item.discountPercent) > 0 && (
                            <p className="text-green-600 text-xs">Discount: {item.discountPercent}%</p>
                          )}
                          {item.taxable && (
                            <p className="text-blue-600 text-xs">Taxable</p>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {parseFloat(item.quantity).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {item.unit || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                        {formatCurrencyForDisplay(item.unitPrice)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">
                        {formatCurrencyForDisplay(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span className="font-medium text-green-600">-{formatCurrencyForDisplay(salesInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax ({parseFloat(salesInvoice.taxRate).toFixed(1)}%):</span>
                    <span className="font-medium">{formatCurrencyForDisplay(salesInvoice.taxAmount)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrencyForDisplay(salesInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          {salesInvoice.terms && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions:</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{salesInvoice.terms}</p>
            </div>
          )}

          {/* Footer Notes */}
          {salesInvoice.footerNotes && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{salesInvoice.footerNotes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
            <p>This is a computer-generated document. For questions, please contact us at {companyInfo.email} or {companyInfo.phone}</p>
          </div>
        </div>
      </main>
    </div>
  )
}