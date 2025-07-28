'use client'

import { 
  SharedDeliveryReceipt,
  SharedCustomerInfo,
  SharedCompanyInfo,
  formatDateForDisplay
} from '@/lib/utils/shared-document-transformers'
import SharedDocumentLayout from './SharedDocumentLayout'

export interface SharedDeliveryReceiptViewProps {
  deliveryReceipt: SharedDeliveryReceipt
  customerInfo: SharedCustomerInfo
  companyInfo: SharedCompanyInfo
}

export default function SharedDeliveryReceiptView({ 
  deliveryReceipt, 
  customerInfo, 
  companyInfo 
}: SharedDeliveryReceiptViewProps) {
  return (
    <SharedDocumentLayout
      documentType="Delivery Receipt"
      documentTitle="DELIVERY RECEIPT"
      companyInfo={companyInfo}
    >
      {/* Document Header Information */}
      <div className="mb-6">
        <div className="text-right">
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Receipt #:</span> {deliveryReceipt.receiptNumber}</p>
            <p><span className="font-medium">Delivery Date:</span> {formatDateForDisplay(deliveryReceipt.deliveryDate)}</p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                deliveryReceipt.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                deliveryReceipt.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                deliveryReceipt.deliveryStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                deliveryReceipt.deliveryStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {deliveryReceipt.deliveryStatus.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer and Delivery Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information:</h3>
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
          </div>
        </div>

        {/* Shipping Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Information:</h3>
          <div className="text-sm space-y-1">
            {deliveryReceipt.trackingNumber && (
              <p>
                <span className="font-medium">Tracking Number:</span>{' '}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                  {deliveryReceipt.trackingNumber}
                </span>
              </p>
            )}
            {deliveryReceipt.courierService && (
              <p><span className="font-medium">Courier Service:</span> {deliveryReceipt.courierService}</p>
            )}
            <p><span className="font-medium">Delivery Date:</span> {formatDateForDisplay(deliveryReceipt.deliveryDate)}</p>
            <p>
              <span className="font-medium">Delivery Status:</span>{' '}
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                deliveryReceipt.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                deliveryReceipt.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                deliveryReceipt.deliveryStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                deliveryReceipt.deliveryStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {deliveryReceipt.deliveryStatus.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address:</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-900 whitespace-pre-line">{deliveryReceipt.deliveryAddress}</p>
        </div>
      </div>

      {/* Recipient Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recipient Information:</h3>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Received By:</span> {deliveryReceipt.receivedBy}</p>
              {deliveryReceipt.receivedByTitle && (
                <p><span className="font-medium">Title/Position:</span> {deliveryReceipt.receivedByTitle}</p>
              )}
            </div>
            <div>
              <p><span className="font-medium">Date Received:</span> {formatDateForDisplay(deliveryReceipt.deliveryDate)}</p>
              <p>
                <span className="font-medium">Confirmation Status:</span>{' '}
                {deliveryReceipt.deliveryStatus === 'DELIVERED' ? (
                  <span className="text-green-600 font-medium">✓ Confirmed Delivered</span>
                ) : (
                  <span className="text-yellow-600 font-medium">⚠ Pending Confirmation</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Notes */}
      {deliveryReceipt.deliveryNotes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Notes:</h3>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{deliveryReceipt.deliveryNotes}</p>
          </div>
        </div>
      )}

      {/* Evidence Section */}
      {(deliveryReceipt.signatureImage || deliveryReceipt.photoEvidence) && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Evidence:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Signature */}
            {deliveryReceipt.signatureImage && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Recipient Signature:</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <img 
                    src={deliveryReceipt.signatureImage} 
                    alt="Recipient signature"
                    className="max-w-full h-auto max-h-32 mx-auto"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
              </div>
            )}

            {/* Photo Evidence */}
            {deliveryReceipt.photoEvidence && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Delivery Photo:</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <img 
                    src={deliveryReceipt.photoEvidence} 
                    alt="Delivery photo evidence"
                    className="max-w-full h-auto max-h-48 mx-auto rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking Information */}
      {(deliveryReceipt.trackingNumber || deliveryReceipt.courierService) && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tracking Information:</h3>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {deliveryReceipt.trackingNumber && (
                <div>
                  <p className="font-medium text-gray-900 mb-1">Tracking Number:</p>
                  <p className="font-mono bg-white px-3 py-2 rounded border text-center">
                    {deliveryReceipt.trackingNumber}
                  </p>
                </div>
              )}
              {deliveryReceipt.courierService && (
                <div>
                  <p className="font-medium text-gray-900 mb-1">Courier Service:</p>
                  <p className="bg-white px-3 py-2 rounded border">
                    {deliveryReceipt.courierService}
                  </p>
                </div>
              )}
            </div>
            {deliveryReceipt.trackingNumber && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-xs text-gray-600">
                  Use the tracking number above to check the latest delivery status with the courier service.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Confirmation */}
      <div className="border-t pt-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Confirmation</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Receipt Number:</span>
              <span className="font-mono font-medium">{deliveryReceipt.receiptNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery Date:</span>
              <span className="font-medium">{formatDateForDisplay(deliveryReceipt.deliveryDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Received By:</span>
              <span className="font-medium">{deliveryReceipt.receivedBy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                deliveryReceipt.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                deliveryReceipt.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                deliveryReceipt.deliveryStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {deliveryReceipt.deliveryStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          {deliveryReceipt.deliveryStatus === 'DELIVERED' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Delivery Confirmed</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                This delivery has been successfully completed and confirmed by the recipient.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-8 pt-6 border-t bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Questions About This Delivery?</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            If you have any questions about this delivery or need to report any issues, please contact us:
          </p>
          <div className="flex flex-wrap gap-4">
            <span>
              <span className="font-medium">Phone:</span>{' '}
              <a 
                href={`tel:${companyInfo.phone}`} 
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                {companyInfo.phone}
              </a>
            </span>
            <span>
              <span className="font-medium">Email:</span>{' '}
              <a 
                href={`mailto:${companyInfo.email}`} 
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                {companyInfo.email}
              </a>
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Please reference receipt number {deliveryReceipt.receiptNumber} when contacting us.
          </p>
        </div>
      </div>
    </SharedDocumentLayout>
  )
}