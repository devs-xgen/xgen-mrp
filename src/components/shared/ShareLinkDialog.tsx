'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, ExternalLink, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareLinkDialogProps {
  documentType: 'billing-statement' | 'sales-invoice' | 'delivery-receipt'
  documentId: string
  documentTitle?: string
  trigger?: React.ReactNode
  onOpenChange?: (open: boolean) => void
}

export function ShareLinkDialog({
  documentType,
  documentId,
  documentTitle,
  trigger,
  onOpenChange
}: ShareLinkDialogProps) {
  const [isCopying, setIsCopying] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Generate the direct link immediately
  const getShareableLink = () => {
    const baseUrl = window.location.origin
    
    switch (documentType) {
      case 'sales-invoice':
        // Use the existing sales-invoice share route with the document ID
        return `${baseUrl}/sales-invoice/share/${documentId}`
      case 'billing-statement':
        // For billing statements, use similar pattern if route exists
        return `${baseUrl}/billing-statement/share/${documentId}`
      case 'delivery-receipt':
        // For delivery receipts, use similar pattern if route exists
        return `${baseUrl}/delivery-receipt/share/${documentId}`
      default:
        return `${baseUrl}/sales-invoice/share/${documentId}`
    }
  }

  const shareableLink = getShareableLink()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  const getDocumentTypeLabel = (docType: string): string => {
    switch (docType) {
      case 'billing-statement':
        return 'Billing Statement'
      case 'sales-invoice':
        return 'Sales Invoice'
      case 'delivery-receipt':
        return 'Delivery Receipt'
      default:
        return 'Document'
    }
  }

  const copyToClipboard = async () => {
    if (isCopying || !shareableLink) return

    setIsCopying(true)
    
    try {
      await navigator.clipboard.writeText(shareableLink)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy link to clipboard. Please copy manually.')
    } finally {
      // Reset the copying state after a short delay
      setTimeout(() => setIsCopying(false), 1000)
    }
  }

  const openLink = () => {
    if (shareableLink) {
      window.open(shareableLink, '_blank', 'noopener,noreferrer')
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {getDocumentTypeLabel(documentType)}</DialogTitle>
          <DialogDescription>
            {documentTitle 
              ? `Share ${documentTitle} with others`
              : `Share this ${getDocumentTypeLabel(documentType).toLowerCase()} with others`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {shareableLink && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-link">Shareable Link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="share-link"
                    value={shareableLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    disabled={isCopying}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {isCopying ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={openLink}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Link
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This link provides direct access to view the document and can be shared with anyone.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}