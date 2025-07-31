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
import { Copy, ExternalLink, RefreshCw, Share2 } from 'lucide-react'
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
  const [shareableLink, setShareableLink] = useState<string>('')
  const [isCopying, setIsCopying] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
    
    // Generate link when dialog opens
    if (open) {
      generateDirectLink()
    }
  }

  const generateDirectLink = () => {
    // Generate direct link based on document type
    const baseUrl = window.location.origin
    let directLink = ''
    
    switch (documentType) {
      case 'sales-invoice':
        directLink = `${baseUrl}/sales-invoice/share/${documentId}`
        break
      case 'billing-statement':
        // For billing statements, we might still need the token-based approach
        // or create a similar direct route
        directLink = `${baseUrl}/billing-statement/share/${documentId}`
        break
      case 'delivery-receipt':
        // For delivery receipts, we might still need the token-based approach
        // or create a similar direct route
        directLink = `${baseUrl}/delivery-receipt/share/${documentId}`
        break
      default:
        directLink = `${baseUrl}/document/share/${documentId}`
    }
    
    setShareableLink(directLink)
    toast.success('Shareable link generated successfully!')
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
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Link
                </Button>
                <Button
                  onClick={generateDirectLink}
                  variant="ghost"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This link can be accessed by anyone and does not expire.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}