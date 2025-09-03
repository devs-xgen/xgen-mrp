"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Trash2, 
  Copy, 
  ExternalLink, 
  Calendar, 
  Eye, 
  Globe,
  Loader2,
  Check,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export type DocumentType = 'billing-statement' | 'sales-invoice' | 'delivery-receipt'

// stable mapping at module scope to avoid exhaustive-deps complaints
const DOC_TYPE_TO_ENUM: Record<DocumentType, 'BILLING_STATEMENT' | 'SALES_INVOICE' | 'DELIVERY_RECEIPT'> = {
  'billing-statement': 'BILLING_STATEMENT',
  'sales-invoice': 'SALES_INVOICE',
  'delivery-receipt': 'DELIVERY_RECEIPT',
}

interface ShareableLink {
  id: string
  token: string
  url: string
  documentType: string
  documentId: string
  createdAt: string
  expiresAt: string
  isRevoked: boolean
  revokedAt: string | null
  accessCount: number
  lastAccessedAt: string | null
  lastAccessedIp: string | null
  status: 'active' | 'expired' | 'revoked'
  createdBy: {
    id: string
    email: string
  }
}

interface ShareLinkManagerProps {
  documentType: DocumentType
  documentId: string
  onLinksUpdate?: () => void
  className?: string
}

interface ShareLinksResponse {
  links: ShareableLink[]
}

interface RevokeResponse {
  success: boolean
  message: string
}

export function ShareLinkManager({
  documentType,
  documentId,
  onLinksUpdate,
  className,
}: ShareLinkManagerProps) {
  const [links, setLinks] = useState<ShareableLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [revokingLinkId, setRevokingLinkId] = useState<string | null>(null)
  const [copyingLinkId, setCopyingLinkId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchLinks = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = new URLSearchParams({
        documentType: DOC_TYPE_TO_ENUM[documentType],
        documentId,
      })

      const response = await fetch(`/api/share-links/list?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch share links')
      }

      const data: ShareLinksResponse = await response.json()
      setLinks(data.links || [])
    } catch (error) {
      console.error('Error fetching share links:', error)
      toast({
        title: "Error",
        description: "Failed to load share links",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [documentType, documentId, toast])

  const revokeLink = async (linkId: string) => {
    setRevokingLinkId(linkId)
    
    try {
      const response = await fetch(`/api/share-links/revoke?linkId=${linkId}`, {
        method: 'DELETE',
      })

      const data: RevokeResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to revoke share link')
      }

      if (data.success) {
        toast({
          title: "Link revoked",
          description: "The share link has been successfully revoked.",
        })
        
        // Refresh the links list
        await fetchLinks()
        onLinksUpdate?.()
      } else {
        throw new Error(data.message || 'Failed to revoke share link')
      }
    } catch (error) {
      console.error('Error revoking share link:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke share link",
        variant: "destructive",
      })
    } finally {
      setRevokingLinkId(null)
    }
  }

  const copyToClipboard = async (url: string, linkId: string) => {
    setCopyingLinkId(linkId)
    
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
      setTimeout(() => setCopyingLinkId(null), 1000)
    }
  }

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case 'expired':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expired</Badge>
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Share Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading share links...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Share Links ({links.length})
          </CardTitle>
          <Button
            onClick={() => fetchLinks(true)}
            disabled={isRefreshing}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No share links have been created for this document yet.</p>
            <p className="text-sm mt-1">Use the &quot;Generate Share Link&quot; button to create one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Header with status and actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(link.status)}
                    <span className="text-sm text-muted-foreground">
                      Created {formatDate(link.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.status === 'active' && (
                      <>
                        <Button
                          onClick={() => copyToClipboard(link.url, link.id)}
                          disabled={copyingLinkId === link.id}
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                        >
                          {copyingLinkId === link.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copyingLinkId === link.id ? "Copied!" : "Copy"}
                        </Button>
                        <Button
                          onClick={() => openLink(link.url)}
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                      </>
                    )}
                    {link.status === 'active' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            disabled={revokingLinkId === link.id}
                          >
                            {revokingLinkId === link.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Share Link</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this share link? This action cannot be undone and the link will no longer be accessible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeLink(link.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Link
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {/* Link details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{formatDate(link.expiresAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Views:</span>
                    <span>{link.accessCount}</span>
                  </div>
                  {link.lastAccessedAt && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <span className="text-muted-foreground">Last accessed:</span>
                      <span>{formatDate(link.lastAccessedAt)}</span>
                      {link.lastAccessedIp && (
                        <span className="text-muted-foreground">from {link.lastAccessedIp}</span>
                      )}
                    </div>
                  )}
                  {link.revokedAt && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <span className="text-muted-foreground">Revoked:</span>
                      <span>{formatDate(link.revokedAt)}</span>
                    </div>
                  )}
                </div>

                {/* URL display for inactive links */}
                {link.status !== 'active' && (
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all text-muted-foreground">
                    {link.url}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}