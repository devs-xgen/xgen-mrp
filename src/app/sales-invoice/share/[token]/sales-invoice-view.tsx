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

export function SalesInvoiceView({ 
  salesInvoice, 
  customerInfo, 
  companyInfo 
}: SalesInvoiceViewProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { 
            background: white !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body { background: white !important; }
        }
      `}</style>

      {/* Header with Print Button */}
      <header className="bg-white shadow-sm border-b no-print">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{companyInfo.name}</h1>
            <p className="text-sm text-gray-600">Sales Invoice</p>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </header>

      {/* Document Content */}
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
          <div className="mb-8">
            <div className="flex justify-end">
              <div className="w-full max-w-sm bg-gray-50 rounded-lg p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Subtotal:</span>
                    <span className="font-medium">{formatCurrencyForDisplay(salesInvoice.subtotal)}</span>
                  </div>
                  {parseFloat(salesInvoice.discountAmount) > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Discount:</span>
                      <span className="font-medium text-green-600">-{formatCurrencyForDisplay(salesInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Tax ({parseFloat(salesInvoice.taxRate).toFixed(1)}%):</span>
                    <span className="font-medium">{formatCurrencyForDisplay(salesInvoice.taxAmount)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrencyForDisplay(salesInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          {salesInvoice.terms && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{salesInvoice.terms}</p>
              </div>
            </div>
          )}

          {/* Footer Notes */}
          {salesInvoice.footerNotes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{salesInvoice.footerNotes}</p>
              </div>
            </div>
          )}

          {/* Payment Status Section */}
          <div className="border-t pt-6">
            <div className={`rounded-lg p-4 ${
              salesInvoice.status === 'PAID' ? 'bg-green-50 border border-green-200' :
              salesInvoice.status === 'PENDING' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${
                    salesInvoice.status === 'PAID' ? 'text-green-400' :
                    salesInvoice.status === 'PENDING' ? 'text-yellow-400' :
                    'text-red-400'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    {salesInvoice.status === 'PAID' ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : salesInvoice.status === 'PENDING' ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    )}
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    salesInvoice.status === 'PAID' ? 'text-green-800' :
                    salesInvoice.status === 'PENDING' ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    {salesInvoice.status === 'PAID' ? 'Payment Received' :
                     salesInvoice.status === 'PENDING' ? 'Payment Pending' :
                     'Payment Overdue'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    salesInvoice.status === 'PAID' ? 'text-green-700' :
                    salesInvoice.status === 'PENDING' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    <p>
                      {salesInvoice.status === 'PAID' 
                        ? `This invoice has been paid in full. Total amount: ${formatCurrencyForDisplay(salesInvoice.totalAmount)}`
                        : salesInvoice.status === 'PENDING'
                        ? `Payment is pending for this invoice. Amount due: ${formatCurrencyForDisplay(salesInvoice.totalAmount)}${salesInvoice.dueDate ? ` by ${formatDateForDisplay(salesInvoice.dueDate)}` : ''}`
                        : `This invoice is overdue. Amount due: ${formatCurrencyForDisplay(salesInvoice.totalAmount)}${salesInvoice.dueDate ? ` (was due ${formatDateForDisplay(salesInvoice.dueDate)})` : ''}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
            <p>This is a computer-generated document. For questions about this invoice, please contact us at {companyInfo.email} or {companyInfo.phone}</p>
          </div>
        </div>
      </main>
    </div>
  )
}