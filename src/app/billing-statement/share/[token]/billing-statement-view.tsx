'use client'

import { 
  SharedBillingStatement,
  SharedCustomerInfo,
  SharedCompanyInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay
} from '@/lib/utils/client-formatters'

interface BillingStatementViewProps {
  billingStatement: SharedBillingStatement
  customerInfo: SharedCustomerInfo
  companyInfo: SharedCompanyInfo
}

export function BillingStatementView({ 
  billingStatement, 
  customerInfo, 
  companyInfo 
}: BillingStatementViewProps) {
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
            <p className="text-sm text-gray-600">Billing Statement</p>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">BILLING STATEMENT</h2>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Statement #:</span> {billingStatement.statementNumber}</p>
                  <p><span className="font-medium">Date:</span> {formatDateForDisplay(billingStatement.billingDate)}</p>
                  {billingStatement.dueDate && (
                    <p><span className="font-medium">Due Date:</span> {formatDateForDisplay(billingStatement.dueDate)}</p>
                  )}
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                      billingStatement.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      billingStatement.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {billingStatement.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>

          {/* Production Order Information */}
          {billingStatement.productionOrder && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Production Details:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Production Order:</span> {billingStatement.productionOrder.id}</p>
                    <p><span className="font-medium">Quantity:</span> {billingStatement.productionOrder.quantity}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Start Date:</span> {formatDateForDisplay(billingStatement.productionOrder.startDate)}</p>
                    <p><span className="font-medium">Due Date:</span> {formatDateForDisplay(billingStatement.productionOrder.dueDate)}</p>
                  </div>
                  {billingStatement.productionOrder.product && (
                    <div className="md:col-span-2">
                      <p><span className="font-medium">Product:</span> {billingStatement.productionOrder.product.name} ({billingStatement.productionOrder.product.sku})</p>
                    </div>
                  )}
                  {billingStatement.productionOrder.productVariant && (
                    <div className="md:col-span-2">
                      <p><span className="font-medium">Variant:</span> {billingStatement.productionOrder.productVariant.displayName} ({billingStatement.productionOrder.productVariant.sku})</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
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
          </div>

          {/* Payment Status */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              <div className="flex items-center space-x-3">
                {billingStatement.status === 'PAID' ? (
                  <>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Payment Completed</p>
                      <p className="text-xs text-green-600">
                        Amount paid: {formatCurrencyForDisplay(billingStatement.netAmount)}
                      </p>
                    </div>
                  </>
                ) : billingStatement.status === 'PENDING' ? (
                  <>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Payment Pending</p>
                      <p className="text-xs text-yellow-600">
                        Amount due: {formatCurrencyForDisplay(billingStatement.netAmount)}
                        {billingStatement.dueDate && ` • Due: ${formatDateForDisplay(billingStatement.dueDate)}`}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Payment Overdue</p>
                      <p className="text-xs text-red-600">
                        Amount overdue: {formatCurrencyForDisplay(billingStatement.netAmount)}
                        {billingStatement.dueDate && ` • Due: ${formatDateForDisplay(billingStatement.dueDate)}`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {billingStatement.notes && (
            <div className="mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{billingStatement.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t text-center text-xs text-gray-500">
            <p>This is a computer-generated document. For questions, please contact us at {companyInfo.email} or {companyInfo.phone}</p>
          </div>
        </div>
      </main>
    </div>
  )
}