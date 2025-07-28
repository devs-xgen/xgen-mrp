'use client'

import { SharedCompanyInfo } from './SharedDocumentLayout'

export interface DocumentNotFoundProps {
  reason: 'expired' | 'revoked' | 'not-found' | 'invalid-type' | 'server-error' | 'rate-limited'
  companyInfo?: SharedCompanyInfo
  retryAfter?: number // For rate limiting
}

const defaultCompanyInfo: SharedCompanyInfo = {
  name: "XGen Manufacturing",
  address: "123 Manufacturing St, Industrial City, IC 12345",
  phone: "+1 (555) 123-4567",
  email: "info@xgenmanufacturing.com",
  website: "www.xgenmanufacturing.com"
}

const errorMessages = {
  'expired': 'This document link has expired and is no longer accessible.',
  'revoked': 'Access to this document has been revoked.',
  'not-found': 'The requested document could not be found.',
  'invalid-type': 'The document type is not valid for this link.',
  'server-error': 'There was an error loading the document. Please try again later.',
  'rate-limited': 'Too many requests. Please wait before trying again.'
}

const errorTitles = {
  'expired': 'Link Expired',
  'revoked': 'Access Revoked',
  'not-found': 'Document Not Found',
  'invalid-type': 'Invalid Document',
  'server-error': 'Server Error',
  'rate-limited': 'Rate Limited'
}

export default function DocumentNotFound({ 
  reason, 
  companyInfo, 
  retryAfter 
}: DocumentNotFoundProps) {
  const company = companyInfo || defaultCompanyInfo
  const message = errorMessages[reason] || errorMessages['not-found']
  const title = errorTitles[reason] || errorTitles['not-found']

  const getIconColor = () => {
    switch (reason) {
      case 'expired':
        return 'text-yellow-600 bg-yellow-100'
      case 'revoked':
        return 'text-red-600 bg-red-100'
      case 'rate-limited':
        return 'text-orange-600 bg-orange-100'
      case 'server-error':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-red-600 bg-red-100'
    }
  }

  const getIcon = () => {
    switch (reason) {
      case 'expired':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'revoked':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        )
      case 'rate-limited':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'server-error':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
    }
  }

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
      <main className="flex-1 flex items-center justify-center px-4" role="main">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${getIconColor()}`}>
              {getIcon()}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {reason === 'rate-limited' && retryAfter && (
              <p className="text-sm text-orange-600 mb-6">
                Please wait {retryAfter} seconds before trying again.
              </p>
            )}
            
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-2">Need assistance?</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  <a 
                    href={`tel:${company.phone}`} 
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    {company.phone}
                  </a>
                </p>
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  <a 
                    href={`mailto:${company.email}`} 
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    {company.email}
                  </a>
                </p>
                {company.website && (
                  <p>
                    <span className="font-medium">Website:</span>{' '}
                    <a 
                      href={`https://${company.website}`} 
                      className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
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