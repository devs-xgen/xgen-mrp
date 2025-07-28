"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Share2, Copy, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DocumentType = 'billing-statement' | 'sales-invoice' | 'delivery-receipt'

interface ShareLinkButtonProps {
  documentType: DocumentType
  documentId: string
  onLinkGenerated?: (link: string) => void
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
}

interface ShareLinkResponse {
  success: boolean
  shareableLink?: {
    id: string
    token: string
    url: string
    expiresAt: string
  }
  error?: string
}

export function ShareLinkButton({
  documentType,
  documentId,
  onLinkGenerated,
  className,
  variant = 'outline',
  size = 'default',
  disabled = false,
}: ShareLinkButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [isCopying, setIsCopying] = useState(false)
  const { toast } = useToast()

  const mapDocumentTypeToEnum = (docType: DocumentType): string => {
    switch (docType) {
      case 'billing-statement':
        return 'BILLING_STATEMENT'
      case 'sales-invoice':
        return 'SALES_INVOICE'
      case 'delivery-receipt':
        return 'DELIVERY_RECEIPT'
      default:
        return docType.toUpperCase().replace('-', '_')
    }
  }

  const generateShareLink = async () => {
    if (isGenerating || disabled) return

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: mapDocumentTypeToEnum(documentType),
          documentId,
        }),
      })

      const data: ShareLinkResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate share link')
      }

      if (data.success && data.shareableLink) {
        const shareUrl = data.shareableLink.url
        setGeneratedLink(shareUrl)
        onLinkGenerated?.(shareUrl)
        
        toast({
          title: "Share link generated",
          description: "The shareable link has been created successfully.",
        })
      } else {
        throw new Error(data.error || 'Failed to generate share link')
      }
    } catch (error) {
      console.error('Error generating share link:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate share link",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (url: string) => {
    if (isCopying) return

    setIsCopying(true)
    
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied",
        description: "The share link has been copied to your clipboard.",
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard. Please copy manually.",
        variant: "destructive",
      })
    } finally {
      // Reset the copying state after a short delay to show the check icon
      setTimeout(() => setIsCopying(false), 1000)
    }
  }

  // If we have a generated link, show copy button
  if (generatedLink) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => copyToClipboard(generatedLink)}
          disabled={isCopying}
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
        >
          {isCopying ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {isCopying ? "Copied!" : "Copy Link"}
        </Button>
        <Button
          onClick={() => setGeneratedLink(null)}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          Generate New
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={generateShareLink}
      disabled={isGenerating || disabled}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {isGenerating ? "Generating..." : "Generate Share Link"}
    </Button>
  )
}