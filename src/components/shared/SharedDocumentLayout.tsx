'use client'

import { ReactNode } from 'react'

export interface SharedCompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  website?: string
}

export interface SharedDocumentLayoutProps {
  children: ReactNode
  documentType: string
  documentTitle: string
  companyInfo: SharedCompanyInfo
  onPrint?: () => void
  onDownload?: () => void
  showPrintButton?: boolean
  showDownloadButton?: boolean
}

export default function SharedDocumentLayout({
  children,
  documentType,
  documentTitle,
  companyInfo,
  onPrint,
  onDownload,
  showPrintButton = true,
  showDownloadButton = false
}: SharedDocumentLayoutProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    }
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
          .min-h-screen { min-height: auto !important; }
        }
      `}</style>

      {/* Header with Action Buttons */}
      <header className="bg-white shadow-sm border-b no-print">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{companyInfo.name}</h1>
            <p className="text-sm text-gray-600">{documentType}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {showPrintButton && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label={`Print ${documentType}`}
              >
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" 
                  />
                </svg>
                Print
              </button>
            )}
            
            {showDownloadButton && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label={`Download ${documentType}`}
              >
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                Download
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Document Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg print-page">
          {/* Company Header */}
          <div className="p-8 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{companyInfo.name}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{companyInfo.address}</p>
                  <div className="flex flex-wrap gap-4">
                    <span>Phone: {companyInfo.phone}</span>
                    <span>Email: {companyInfo.email}</span>
                    {companyInfo.website && <span>Website: {companyInfo.website}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{documentTitle}</h2>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-8">
            {children}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-6 border-t text-center text-xs text-gray-500">
            <p>
              This is a computer-generated document. For questions, please contact us at{' '}
              <a 
                href={`mailto:${companyInfo.email}`} 
                className="text-blue-600 hover:underline"
              >
                {companyInfo.email}
              </a>
              {' '}or{' '}
              <a 
                href={`tel:${companyInfo.phone}`} 
                className="text-blue-600 hover:underline"
              >
                {companyInfo.phone}
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}