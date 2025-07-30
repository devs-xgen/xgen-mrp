import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ShareableDocType } from '@prisma/client'
import {
  SharedBillingStatement,
  SharedCustomerInfo,
  SharedCompanyInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay,
  transformBillingStatementToShared,
  extractCustomerInfo
} from '@/lib/utils/shared-document-transformers'
import { DEFAULT_COMPANY_INFO } from '@/lib/constant'
import { BillingStatementView } from './billing-statement-view'
import { prisma } from '@/lib/db'

interface SharedDocumentResponse {
  success: boolean
  document?: {
    type: ShareableDocType
    data: SharedBillingStatement
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

async function fetchBillingStatementById(documentId: string): Promise<SharedDocumentResponse | null> {
  try {
    const billingStatement = await prisma.billingStatement.findUnique({
      where: { id: documentId },
      include: {
        customer: true,
        customerOrder: {
          include: {
            customer: true
          }
        },
        productionOrder: {
          include: {
            product: true,
            productVariant: true
          }
        },
        salesInvoice: {
          include: {
            invoiceItems: {
              include: {
                Material: true,
                product: true
              }
            }
          }
        },
        deliveryReceipts: true,
        createdByUser: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    if (!billingStatement) {
      return { success: false, error: 'Document not found' }
    }

    // Transform the billing statement using existing transformer
    const transformedDocument = transformBillingStatementToShared(billingStatement)
    
    // Extract customer info
    const customerInfo = extractCustomerInfo(
      billingStatement.customer,
      billingStatement.customerOrder,
      billingStatement.customerName
    )
    
    return {
      success: true,
      document: {
        type: ShareableDocType.BILLING_STATEMENT,
        data: transformedDocument,
        metadata: {
          customerInfo,
          companyInfo: DEFAULT_COMPANY_INFO
        }
      }
    }
  } catch (error) {
    console.error('Error fetching billing statement:', error)
    return { success: false, error: 'Failed to load document' }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  
  // Fetch document for metadata (token is actually document ID)
  const result = await fetchBillingStatementById(token)
  
  if (!result?.success || !result.document) {
    return {
      title: `Document Not Found - ${DEFAULT_COMPANY_INFO.name}`,
      description: 'The requested document could not be found or has expired.',
    }
  }

  const { data, metadata } = result.document
  const billingStatement = data as SharedBillingStatement

  return {
    title: `Billing Statement ${billingStatement.statementNumber} - ${metadata.companyInfo.name}`,
    description: `Billing statement for ${billingStatement.customerName} dated ${formatDateForDisplay(billingStatement.billingDate)}`,
    robots: 'noindex, nofollow', // Prevent search engine indexing of shared documents
    openGraph: {
      title: `Billing Statement ${billingStatement.statementNumber}`,
      description: `Billing statement for ${billingStatement.customerName}`,
      type: 'website',
    },
  }
}

function DocumentError({ error, companyInfo }: { error: string; companyInfo?: SharedCompanyInfo }) {
  const company = companyInfo || DEFAULT_COMPANY_INFO

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

export default async function BillingStatementSharePage({ params }: PageProps) {
  const { token } = await params
  
  const result = await fetchBillingStatementById(token)
  
  if (!result?.success || !result.document) {
    return <DocumentError error={result?.error || 'Document not found'} />
  }

  // Document type is already verified in fetchBillingStatementById

  const billingStatement = result.document.data as SharedBillingStatement
  const { customerInfo, companyInfo } = result.document.metadata

  return (
    <BillingStatementView
      billingStatement={billingStatement}
      customerInfo={customerInfo}
      companyInfo={companyInfo}
    />
  )
}