/**
 * Example usage of ShareLinkButton and ShareLinkManager components
 * 
 * This file demonstrates how to integrate the share link components
 * into existing document pages.
 */

import React, { useState } from 'react'
import { ShareLinkButton } from './ShareLinkButton'
import { ShareLinkManager } from './ShareLinkManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ShareLinkExampleProps {
  documentType: 'billing-statement' | 'sales-invoice' | 'delivery-receipt'
  documentId: string
  documentTitle: string
}

export function ShareLinkExample({
  documentType,
  documentId,
  documentTitle,
}: ShareLinkExampleProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLinkGenerated = (link: string) => {
    console.log('New share link generated:', link)
    // Refresh the ShareLinkManager to show the new link
    setRefreshKey(prev => prev + 1)
  }

  const handleLinksUpdate = () => {
    // Refresh the ShareLinkManager when links are updated
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Document header with share button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{documentTitle}</CardTitle>
            <ShareLinkButton
              documentType={documentType}
              documentId={documentId}
              onLinkGenerated={handleLinkGenerated}
              variant="outline"
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Document content would go here...
          </p>
        </CardContent>
      </Card>

      {/* Share link management */}
      <ShareLinkManager
        key={refreshKey}
        documentType={documentType}
        documentId={documentId}
        onLinksUpdate={handleLinksUpdate}
      />
    </div>
  )
}

/**
 * Integration examples for different document types:
 * 
 * // For billing statements
 * <ShareLinkExample
 *   documentType="billing-statement"
 *   documentId="billing-123"
 *   documentTitle="Billing Statement #BS-2024-001"
 * />
 * 
 * // For sales invoices
 * <ShareLinkExample
 *   documentType="sales-invoice"
 *   documentId="invoice-456"
 *   documentTitle="Sales Invoice #INV-2024-001"
 * />
 * 
 * // For delivery receipts
 * <ShareLinkExample
 *   documentType="delivery-receipt"
 *   documentId="receipt-789"
 *   documentTitle="Delivery Receipt #DR-2024-001"
 * />
 */