"use client"

import { useState } from "react"
import { SectionCard } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, CreditCard, Calendar, DollarSign, Receipt, Info, AlertCircle, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { formatCurrencyPHP } from "@/lib/constant"
import { syncBillingStatusWithPayment } from "@/lib/actions/billing-payment-sync"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PaymentSectionProps {
  order: any
}

export function PaymentSection({ order }: PaymentSectionProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const transactions = order.transaction || []
  const hasPayments = transactions.length > 0

  // Calculate payment summary
  const totalOrderAmount = order.totalAmount || 0
  const totalPaid = transactions
    .filter((transaction: any) => transaction.status === "COMPLETED")
    .reduce((sum: number, transaction: any) => sum + (transaction.amount || 0), 0)
  const remainingBalance = totalOrderAmount - totalPaid
  const isFullyPaid = remainingBalance <= 0
  const hasPartialPayment = totalPaid > 0 && !isFullyPaid
  const canMarkAsPaid = isFullyPaid && remainingBalance <= 0
  const percentPaid = totalOrderAmount > 0
    ? Math.min(100, Math.round((totalPaid / totalOrderAmount) * 100))
    : 0

  const getPaymentStatusBadge = () => {
    if (isFullyPaid) {
      return <Badge variant="default" className="bg-green-600">Fully Paid</Badge>
    } else if (hasPartialPayment) {
      return <Badge variant="secondary">Partially Paid</Badge>
    } else {
      return <Badge variant="destructive">Unpaid</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return <CreditCard className="h-4 w-4" />
      case "CASH":
        return <DollarSign className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const formatPaymentMethod = (method: string) => {
    return method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default" as const
      case "PENDING":
        return "secondary" as const
      case "FAILED":
        return "destructive" as const
      default:
        return "outline" as const
    }
  }

  const handleMarkAsPaid = async () => {
    setIsMarkingAsPaid(true)
    try {
      const result = await syncBillingStatusWithPayment(order.id)
      
      if (result.success) {
        toast({
          title: "✅ Payment Complete",
          description: `All ${result.updatedCount} billing statement(s) have been marked as PAID`,
        })
        router.refresh()
      } else {
        toast({
          title: "⚠️ Cannot Mark as Paid",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to update billing status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingAsPaid(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Payments</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>What this tab is:</strong> Record actual money received from the customer.</p>
              <p><strong>Key rule:</strong> Billing can be marked as <em>Paid</em> only after full payment is recorded here.</p>
              <p className="text-blue-900/80">Workflow: Create billing → Record payments → When fully paid, mark billing as Paid.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </span>
            {getPaymentStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Order Amount</p>
              <p className="text-2xl font-bold">{formatCurrencyPHP(totalOrderAmount)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">Total Paid</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrencyPHP(totalPaid)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700">Remaining Balance</p>
              <p className="text-2xl font-bold text-orange-700">{formatCurrencyPHP(remainingBalance)}</p>
            </div>
          </div>

          {/* Payment progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Payment Progress</span>
              <span>{percentPaid}%</span>
            </div>
            <div className="h-2 rounded bg-muted">
              <div
                className="h-2 rounded bg-green-600"
                style={{ width: `${percentPaid}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <SectionCard 
        heading={
          <div className="flex items-center justify-between">
            <span>Payment Records</span>
            <Button
              onClick={() => setIsPaymentDialogOpen(true)}
              size="sm"
              className="gap-2"
              disabled={isFullyPaid}
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </div>
        }
        contentClassName="space-y-4"
      >
        {hasPayments ? (
          <div className="space-y-4">
            {transactions.map((transaction: any) => (
              <Card key={transaction.id} className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      {formatPaymentMethod(transaction.paymentMethod)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <span className="text-lg font-bold">
                        {formatCurrencyPHP(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Payment Date</p>
                        <p className="text-muted-foreground">
                          {format(new Date(transaction.paymentDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Handled By</p>
                        <p className="text-muted-foreground">
                          {transaction.handledByUser?.profile?.firstName || 'Unknown'} {transaction.handledByUser?.profile?.lastName || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="text-muted-foreground">
                          {transaction.status === 'COMPLETED' ? 'Payment Confirmed' : 'Processing'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {transaction.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No Payment Records</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No payments have been recorded for this customer order yet. 
                Record payments as they are received to track the payment status.
              </p>
            </div>
            <Button
              onClick={() => setIsPaymentDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Record First Payment
            </Button>
          </div>
        )}

        {/* Mark as Paid Button - appears when fully paid */}
        {canMarkAsPaid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Payment Complete!</p>
                  <p className="text-sm text-green-700">
                    All payments have been received. You can now mark related billing statements as paid.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleMarkAsPaid}
                disabled={isMarkingAsPaid}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isMarkingAsPaid ? "Processing..." : "Mark Billing as Paid"}
              </Button>
            </div>
          </div>
        )}

        {/* Outstanding Balance Alert */}
        {!isFullyPaid && hasPayments && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Outstanding Balance:</strong> {formatCurrencyPHP(remainingBalance)} remaining. 
              Continue recording payments until the order is fully paid.
            </AlertDescription>
          </Alert>
        )}
      </SectionCard>

      {/* Payment Dialog Placeholder - This would be implemented separately */}
      {isPaymentDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Payment recording dialog would be implemented here.
            </p>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700">Remaining Balance</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrencyPHP(remainingBalance)}
              </p>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsPaymentDialogOpen(false)}>
                Save Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
