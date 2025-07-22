"use client";

import { format } from "date-fns";
import Link from "next/link";
import { 
  Package, 
  Calendar, 
  User, 
  MapPin, 
  Truck, 
  Camera, 
  FileText, 
  Eye, 
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Import types
import { DeliveryReceiptWithBilling, DeliveryStatus } from "@/types/admin/billing";

interface DeliveryReceiptCardProps {
  receipt: DeliveryReceiptWithBilling;
  showActions?: boolean;
}

export function DeliveryReceiptCard({ 
  receipt, 
  showActions = true 
}: DeliveryReceiptCardProps) {
  
  // Status badge and icon helper
  const getStatusInfo = (status: DeliveryStatus) => {
    switch (status) {
      case "PENDING":
        return {
          badge: <Badge variant="secondary" className="bg-yellow-50 text-yellow-600 border-yellow-200">Pending</Badge>,
          icon: <Clock className="h-4 w-4 text-yellow-600" />
        };
      case "IN_TRANSIT":
        return {
          badge: <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">In Transit</Badge>,
          icon: <Truck className="h-4 w-4 text-blue-600" />
        };
      case "DELIVERED":
        return {
          badge: <Badge variant="default" className="bg-green-50 text-green-600 border-green-200">Delivered</Badge>,
          icon: <CheckCircle className="h-4 w-4 text-green-600" />
        };
      case "FAILED":
        return {
          badge: <Badge variant="destructive">Failed</Badge>,
          icon: <XCircle className="h-4 w-4 text-red-600" />
        };
      case "RETURNED":
        return {
          badge: <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-200">Returned</Badge>,
          icon: <AlertCircle className="h-4 w-4 text-orange-600" />
        };
      case "CANCELLED":
        return {
          badge: <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Cancelled</Badge>,
          icon: <XCircle className="h-4 w-4 text-gray-600" />
        };
      default:
        return {
          badge: <Badge variant="outline">{status}</Badge>,
          icon: <Package className="h-4 w-4 text-gray-600" />
        };
    }
  };

  const statusInfo = getStatusInfo(receipt.deliveryStatus);

  return (
    <Card className="bg-card border rounded-lg hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              {receipt.receiptNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Delivery Receipt
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.badge}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Billing Statement Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Billing Statement</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                {receipt.billingStatement?.customerName || "Unknown Customer"}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {receipt.billingStatement?.statementNumber || "N/A"}
                </Badge>
                {receipt.billingStatement && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/billing/statements/${receipt.billingStatement.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Delivery Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Delivery Date:</span>
            </div>
            <p className="text-sm font-medium ml-6">
              {format(new Date(receipt.deliveryDate), "PPP")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Received By:</span>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium">{receipt.receivedBy}</p>
              {receipt.receivedByTitle && (
                <p className="text-xs text-muted-foreground">{receipt.receivedByTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Delivery Address:</span>
          </div>
          <p className="text-sm ml-6 text-gray-700">
            {receipt.deliveryAddress}
          </p>
        </div>

        {/* Tracking Information */}
        {(receipt.trackingNumber || receipt.courierService) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tracking:</span>
              </div>
              <div className="ml-6 space-y-1">
                {receipt.trackingNumber && (
                  <p className="text-sm font-mono">{receipt.trackingNumber}</p>
                )}
                {receipt.courierService && (
                  <p className="text-xs text-muted-foreground">{receipt.courierService}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Delivery Notes */}
        {receipt.deliveryNotes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
              <p className="text-sm text-gray-700">{receipt.deliveryNotes}</p>
            </div>
          </>
        )}

        {/* Proof of Delivery */}
        {(receipt.signatureImage || receipt.photoEvidence) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Proof of Delivery</h4>
              <div className="flex items-center gap-2">
                {receipt.signatureImage && (
                  <Badge variant="outline" className="text-xs">
                    <Camera className="h-3 w-3 mr-1" />
                    Signature
                  </Badge>
                )}
                {receipt.photoEvidence && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Photo
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        {showActions && (
          <>
            <Separator />
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/billing/delivery-receipts/${receipt.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
              {receipt.deliveryStatus === 'PENDING' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/billing/delivery-receipts/${receipt.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}

        {/* Metadata */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created: {format(new Date(receipt.createdAt), "MMM dd, yyyy")}</span>
            {receipt.updatedAt !== receipt.createdAt && (
              <span>Updated: {format(new Date(receipt.updatedAt), "MMM dd, yyyy")}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}