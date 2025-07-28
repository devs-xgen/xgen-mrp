import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ShareableDocType } from '@prisma/client'
import {
  SharedDeliveryReceipt,
  SharedCustomerInfo,
  SharedCompanyInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay
} from '@/lib/utils/shared-document-transformers'
import { DeliveryReceiptView } from './delivery-receipt-view'

interface SharedDocumentResponse {
  success: boolean
  document?: {
    type: ShareableDocType
    data: SharedDeliveryReceipt
    metadata: {
      customerInfo: SharedCustomerInfo
      companyInfo: SharedCompanyInfo
    }
  }
  error?: string
}

interface PageProps {
  params: {
    token: string
  }
}

async function fetchSharedDocument(token: string): Promise<SharedDocumentResponse | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const response = await fetch(`${baseUrl}/api/shared-documents/${token}`, {
      cache: 'no-store', // Always fetch fresh data for shared documents
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Document not found' }
      }
      if (response.status === 403) {
        return { success: false, error: 'Document access has been revoked' }
      }
      if (response.status === 410) {
        return { success: false, error: 'Document link has expired' }
      }
      if (response.status === 429) {
        return { success: false, error: 'Too many requests. Please try again later.' }
      }
      return { success: false, error: 'Failed to load document' }
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching shared document:', error)
    return { success: false, error: 'Failed to load document' }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = params
  
  // Fetch document for metadata
  const result = await fetchSharedDocument(token)
  
  if (!result?.success || !result.document) {
    return {
      title: 'Document Not Found - XGen Manufacturing',
      description: 'The requested document could not be found or has expired.',
    }
  }

  const { data, metadata } = result.document
  const deliveryReceipt = data as SharedDeliveryReceipt

  return {
    title: `Delivery Receipt ${deliveryReceipt.receiptNumber} - ${metadata.companyInfo.name}`,
    description: `Delivery receipt for ${metadata.customerInfo.name} delivered on ${formatDateForDisplay(deliveryReceipt.deliveryDate)}`,
    robots: 'noindex, nofollow', // Prevent search engine indexing of shared documents
    openGraph: {
      title: `Delivery Receipt ${deliveryReceipt.receiptNumber}`,
      description: `Delivery receipt for ${metadata.customerInfo.name}`,
      type: 'website',
    },
  }
}

function DocumentError({ error, companyInfo }: { error: string; companyInfo?: SharedCompanyInfo }) {
  const defaultCompanyInfo = {
    name: "XGen Manufacturing",
    address: "123 Manufacturing St, Industrial City, IC 12345",
    phone: "+1 (555) 123-4567",
    email: "info@xgenmanufacturing.com",
    website: "www.xgenmanufacturing.com"
  }

  const company = companyInfo || defaultCompanyInfo

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{company.address}</p>
        </div>
      </header>

      {/* Error Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Unavailable</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Need assistance?</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                    {company.phone}
                  </a>
                </p>
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                    {company.email}
                  </a>
                </p>
                {company.website && (
                  <p>
                    <span className="font-medium">Website:</span>{' '}
                    <a href={`https://${company.website}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default async function DeliveryReceiptSharePage({ params }: PageProps) {
  const { token } = params
  
  const result = await fetchSharedDocument(token)
  
  if (!result?.success || !result.document) {
    return <DocumentError error={result?.error || 'Document not found'} />
  }

  // Verify this is actually a delivery receipt
  if (result.document.type !== ShareableDocType.DELIVERY_RECEIPT) {
    return <DocumentError error="Invalid document type" companyInfo={result.document.metadata.companyInfo} />
  }

  const deliveryReceipt = result.document.data as SharedDeliveryReceipt
  const { customerInfo, companyInfo } = result.document.metadata

  return (
    <DeliveryReceiptView
      deliveryReceipt={deliveryReceipt}
      customerInfo={customerInfo}
      companyInfo={companyInfo}
    />
  )
}