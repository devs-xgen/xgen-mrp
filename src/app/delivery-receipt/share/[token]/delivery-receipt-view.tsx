'use client'

import {
  SharedDeliveryReceipt,
  SharedCustomerInfo,
  SharedCompanyInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay
} from '@/lib/utils/client-formatters'

interface DeliveryReceiptViewProps {
  deliveryReceipt: SharedDeliveryReceipt
  customerInfo: SharedCustomerInfo
  companyInfo: SharedCompanyInfo
}

export function DeliveryReceiptView({ 
  deliveryReceipt, 
  customerInfo, 
  companyInfo 
}: DeliveryReceiptViewProps) {
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
            <p className="text-sm text-gray-600">Delivery Receipt</p>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">DELIVERY RECEIPT</h2>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Receipt #:</span> {deliveryReceipt.receiptNumber}</p>
                  <p><span className="font-medium">Delivery Date:</span> {formatDateForDisplay(deliveryReceipt.deliveryDate)}</p>
                  {deliveryReceipt.trackingNumber && (
                    <p><span className="font-medium">Tracking #:</span> {deliveryReceipt.trackingNumber}</p>
                  )}
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                      deliveryReceipt.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      deliveryReceipt.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                      deliveryReceipt.deliveryStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {deliveryReceipt.deliveryStatus.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivered To:</h3>
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
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address:</h3>
              <div className="text-sm">
                <p className="whitespace-pre-wrap">{deliveryReceipt.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details:</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-sm text-gray-700">Received By:</span>
                    <p className="text-sm">{deliveryReceipt.receivedBy}</p>
                  </div>
                  {deliveryReceipt.receivedByTitle && (
                    <div>
                      <span className="font-medium text-sm text-gray-700">Title/Position:</span>
                      <p className="text-sm">{deliveryReceipt.receivedByTitle}</p>
                    </div>
                  )}
                  {deliveryReceipt.courierService && (
                    <div>
                      <span className="font-medium text-sm text-gray-700">Courier Service:</span>
                      <p className="text-sm">{deliveryReceipt.courierService}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-sm text-gray-700">Delivery Date:</span>
                    <p className="text-sm">{formatDateForDisplay(deliveryReceipt.deliveryDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-sm text-gray-700">Status:</span>
                    <p className="text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        deliveryReceipt.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        deliveryReceipt.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                        deliveryReceipt.deliveryStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {deliveryReceipt.deliveryStatus.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  {deliveryReceipt.trackingNumber && (
                    <div>
                      <span className="font-medium text-sm text-gray-700">Tracking Number:</span>
                      <p className="text-sm font-mono">{deliveryReceipt.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Notes */}
          {deliveryReceipt.deliveryNotes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Notes:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{deliveryReceipt.deliveryNotes}</p>
              </div>
            </div>
          )}

          {/* Evidence Section */}
          {(deliveryReceipt.signatureImage || deliveryReceipt.photoEvidence) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Evidence:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deliveryReceipt.signatureImage && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Signature:</h4>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={deliveryReceipt.signatureImage} 
                        alt="Delivery signature" 
                        className="max-w-full h-auto"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  </div>
                )}
                {deliveryReceipt.photoEvidence && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Photo Evidence:</h4>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={deliveryReceipt.photoEvidence} 
                        alt="Delivery photo evidence" 
                        className="max-w-full h-auto"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Section */}
          <div className="border-t pt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Delivery Confirmed</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>This delivery receipt confirms that the items were successfully delivered to the specified address and received by <strong>{deliveryReceipt.receivedBy}</strong> on <strong>{formatDateForDisplay(deliveryReceipt.deliveryDate)}</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
            <p>This is a computer-generated document. For questions about this delivery, please contact us at {companyInfo.email} or {companyInfo.phone}</p>
          </div>
        </div>
      </main>
    </div>
  )
}