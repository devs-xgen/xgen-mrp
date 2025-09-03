"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { FileText, Receipt, Package, Search, ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

interface BillingDocument {
  id: string
  statementNumber: string
  status: string
  totalAmount: number
  salesInvoice?: {
    id: string
    invoiceNumber: string
    status: string
  }
  deliveryReceipts?: Array<{
    id: string
    receiptNumber: string
    deliveryStatus: string
    deliveryDate: Date
  }>
}

interface ViewBillingDocumentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerOrderNumber: string
  billingDocuments: BillingDocument[]
}

export function ViewBillingDocumentsDialog({
  open,
  onOpenChange,
  customerOrderNumber,
  billingDocuments,
}: ViewBillingDocumentsDialogProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAll, setShowAll] = useState(false)
  
  // Filter and limit billing documents
  const filteredDocuments = useMemo(() => {
    const filtered = billingDocuments.filter(doc => 
      doc.statementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.salesInvoice?.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.deliveryReceipts?.some(receipt => 
        receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    
    // Limit to 6 items initially (2 rows of 3)
    if (!showAll && filtered.length > 6) {
      return filtered.slice(0, 6)
    }
    
    return filtered
  }, [billingDocuments, searchTerm, showAll])
  
  const hasMoreItems = billingDocuments.length > 6 && !showAll
  const totalFiltered = billingDocuments.filter(doc => 
    doc.statementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.salesInvoice?.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.deliveryReceipts?.some(receipt => 
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).length

  const navigateToBillingStatement = (billingStatementId: string) => {
    router.push(`/admin/billing/billing-statements/${billingStatementId}`)
    onOpenChange(false)
  }

  const navigateToSalesInvoice = (salesInvoiceId: string) => {
    router.push(`/admin/billing/sales-invoices/${salesInvoiceId}`)
    onOpenChange(false)
  }

  const navigateToDeliveryReceipt = (deliveryReceiptId: string) => {
    router.push(`/admin/billing/delivery-receipts/${deliveryReceiptId}`)
    onOpenChange(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return <Badge className="bg-green-500 text-white">Paid</Badge>
      case "SENT":
        return <Badge className="bg-blue-500 text-white">Sent</Badge>
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>
      case "DELIVERED":
        return <Badge className="bg-green-500 text-white">Delivered</Badge>
      case "IN_TRANSIT":
        return <Badge className="bg-blue-500 text-white">In Transit</Badge>
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  // Show empty state only if no documents exist at all
  if (billingDocuments.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Billing Documents</DialogTitle>
            <DialogDescription>
              Customer Order: {customerOrderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Billing Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No billing statements have been created for this customer order yet.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Billing Documents</DialogTitle>
          <DialogDescription>
            Customer Order: {customerOrderNumber} 
            {billingDocuments.length > 1 && (
              <span className="ml-2 text-xs">({billingDocuments.length} total)</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter Controls */}
        {billingDocuments.length > 3 && (
          <div className="flex-shrink-0 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by statement number, status, or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <div className="text-sm text-muted-foreground">
                Found {totalFiltered} of {billingDocuments.length} documents
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {filteredDocuments.length === 0 && searchTerm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Results Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No billing documents match your search criteria.
              </p>
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-4">
                {filteredDocuments.map((billing) => (
            <Card key={billing.id} className="border h-fit">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <CardTitle className="text-base truncate">
                      {billing.statementNumber}
                    </CardTitle>
                  </div>
                  {getStatusBadge(billing.status)}
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(billing.totalAmount)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Billing Statement Button */}
                <Button
                  onClick={() => navigateToBillingStatement(billing.id)}
                  className="w-full justify-start"
                  variant="outline"
                  size="sm"
                >
                  <FileText className="mr-2 h-3 w-3" />
                  View Statement
                </Button>

                {/* Sales Invoice Section */}
                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                    Sales Invoice
                  </h4>
                  {billing.salesInvoice ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {billing.salesInvoice.invoiceNumber}
                        </span>
                        {getStatusBadge(billing.salesInvoice.status)}
                      </div>
                      <Button
                        onClick={() => navigateToSalesInvoice(billing.salesInvoice!.id)}
                        className="w-full justify-start"
                        variant="outline"
                        size="sm"
                      >
                        <Receipt className="mr-2 h-3 w-3" />
                        View Invoice
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                      No invoice created
                    </div>
                  )}
                </div>

                {/* Delivery Receipts Section */}
                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                    Delivery Receipts
                  </h4>
                  {billing.deliveryReceipts && billing.deliveryReceipts.length > 0 ? (
                    <div className="space-y-2">
                      {billing.deliveryReceipts.slice(0, 2).map((receipt) => (
                        <div key={receipt.id} className="p-2 bg-muted/20 rounded space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">
                              {receipt.receiptNumber}
                            </span>
                            {getStatusBadge(receipt.deliveryStatus)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(receipt.deliveryDate).toLocaleDateString()}
                            </span>
                            <Button
                              onClick={() => navigateToDeliveryReceipt(receipt.id)}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                            >
                              <Package className="mr-1 h-3 w-3" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                      {billing.deliveryReceipts.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center p-1">
                          +{billing.deliveryReceipts.length - 2} more receipts
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                      No receipts created
                    </div>
                  )}
                </div>
              </CardContent>
                </Card>
                ))}
              </div>

              {/* Show More/Less Button */}
              {(hasMoreItems || (!hasMoreItems && showAll && billingDocuments.length > 6)) && !searchTerm && (
                <div className="flex justify-center py-4">
                  <Button
                    onClick={() => setShowAll(!showAll)}
                    variant="outline"
                    className="gap-2"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show {billingDocuments.length - 6} More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {searchTerm ? `${filteredDocuments.length} shown` : 
             showAll ? `${billingDocuments.length} of ${billingDocuments.length}` :
             `${Math.min(6, billingDocuments.length)} of ${billingDocuments.length}`}
          </div>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}