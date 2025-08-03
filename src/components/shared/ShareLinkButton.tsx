"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Share2, Check } from 'lucide-react'
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

// Removed ShareLinkResponse interface since we're using direct links now

export function ShareLinkButton({
  documentType,
  documentId,
  onLinkGenerated,
  className,
  variant = 'outline',
  size = 'default',
  disabled = false,
}: ShareLinkButtonProps) {
  const [isCopying, setIsCopying] = useState(false)
  const { toast } = useToast()

  const getShareableLink = () => {
    const baseUrl = window.location.origin
    switch (documentType) {
      case 'billing-statement':
        return `${baseUrl}/billing-statement/share/${documentId}`
      case 'sales-invoice':
        return `${baseUrl}/sales-invoice/share/${documentId}`
      case 'delivery-receipt':
        return `${baseUrl}/delivery-receipt/share/${documentId}`
      default:
        return `${baseUrl}/${documentType}/share/${documentId}`
    }
  }

  const copyToClipboard = async () => {
    if (isCopying || disabled) return

    setIsCopying(true)
    const shareUrl = getShareableLink()
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      onLinkGenerated?.(shareUrl)
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

  return (
    <Button
      onClick={copyToClipboard}
      disabled={isCopying || disabled}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
    >
      {isCopying ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {isCopying ? "Copied!" : "Share Link"}
    </Button>
  )
}