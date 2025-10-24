// src/components/module/admin/production/production-order-share-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { 
  Copy, 
  Download, 
  Link2, 
  QrCode, 
  Share2, 
  Calendar,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Factory
} from "lucide-react";
import {
  createProductionOrderShareableLink,
  getProductionOrderShareableLinks,
  revokeShareableLink,
} from "@/lib/actions/shareable-link";

interface ProductionOrderShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: string;
  productionOrderLabel: string;
}

export function ProductionOrderShareDialog({
  open,
  onOpenChange,
  productionOrderId,
  productionOrderLabel,
}: ProductionOrderShareDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState<any>(null);
  const [existingLinks, setExistingLinks] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareLink
    ? `${window.location.origin}/share/production/${shareLink.token}`
    : "";

  useEffect(() => {
    if (open) {
      loadExistingLinks();
    }
  }, [open, productionOrderId]);

  const loadExistingLinks = async () => {
    setIsLoading(true);
    try {
      const result = await getProductionOrderShareableLinks(productionOrderId);
      if (result.success && result.links) {
        setExistingLinks(result.links);
        
        // Set active link if exists
        const activeLink = result.links.find(
          (link) => !link.isRevoked && new Date(link.expiresAt) > new Date()
        );
        if (activeLink) {
          setShareLink(activeLink);
        }
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async () => {
    setIsLoading(true);
    try {
      const result = await createProductionOrderShareableLink(productionOrderId, 30);
      if (result.success && result.link) {
        setShareLink(result.link);
        toast({
          title: "Share link created",
          description: "Your production order share link is ready to use.",
        });
        await loadExistingLinks();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create share link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("production-order-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `production-order-${productionOrderId.substring(0, 8)}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({
        title: "Downloaded!",
        description: "QR code saved as PNG",
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      const result = await revokeShareableLink(linkId);
      if (result.success) {
        toast({
          title: "Link revoked",
          description: "The share link has been revoked",
        });
        if (shareLink?.id === linkId) {
          setShareLink(null);
        }
        await loadExistingLinks();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to revoke link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Production Order
          </DialogTitle>
          <DialogDescription>
            Generate a secure shareable link or QR code for <strong>{productionOrderLabel}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Active Link Section */}
          {!shareLink ? (
            <div className="text-center py-8">
              <Factory className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Share Link</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a shareable link to allow business partners to view production details
              </p>
              <Button onClick={handleCreateLink} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* QR Code Section */}
              <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG
                    id="production-order-qr-code"
                    value={shareUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                
                {/* Share URL Display */}
                <div className="w-full max-w-md p-3 border rounded-lg bg-white dark:bg-gray-900">
                  <p className="text-xs font-medium text-muted-foreground mb-1 text-center">Share URL</p>
                  <p className="text-sm font-mono break-all text-center">{shareUrl}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Link Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      <p className="text-xs font-medium">Expires</p>
                    </div>
                    <p className="text-sm font-semibold">
                      {new Date(shareLink.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="w-3 h-3" />
                      <p className="text-xs font-medium">Views</p>
                    </div>
                    <p className="text-sm font-semibold">{shareLink.accessCount}</p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleRevokeLink(shareLink.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Revoke This Link
                </Button>
              </div>
            </>
          )}

          {/* Previous Links Section */}
          {existingLinks.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Share History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              link.isRevoked
                                ? "destructive"
                                : new Date(link.expiresAt) < new Date()
                                ? "secondary"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {link.isRevoked
                              ? "Revoked"
                              : new Date(link.expiresAt) < new Date()
                              ? "Expired"
                              : "Active"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {link.accessCount} views
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Created {new Date(link.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!link.isRevoked && new Date(link.expiresAt) > new Date() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeLink(link.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
