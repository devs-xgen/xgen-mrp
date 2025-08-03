"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, ExternalLink, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface DirectShareLinkProps {
  documentType: 'sales-invoice' | 'billing-statement' | 'delivery-receipt'
  documentId: string
  className?: string
}

export function DirectShareLink({
  documentType,
  documentId,
  className = ""
}: DirectShareLinkProps) {
  const getShareableLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/${documentType}/share/${documentId}`
  }

  const shareableLink = getShareableLink()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy link to clipboard')
    }
  }

  const openLink = () => {
    window.open(shareableLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className={`bg-card border rounded-lg ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="share-link">Direct Link</Label>
          <div className="flex gap-2">
            <Input
              id="share-link"
              value={shareableLink}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This link provides direct access to view the document and can be shared with anyone.
          </p>
        </div>
        
        <Button
          onClick={openLink}
          variant="outline"
          className="w-full gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open Link
        </Button>
      </CardContent>
    </Card>
  )
}