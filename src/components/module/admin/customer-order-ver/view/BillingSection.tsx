"use client"

import { useState } from "react";
import { SectionCard } from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Calendar, DollarSign, Eye } from "lucide-react";
import { format } from "date-fns";
import { CreateBillingStatementDialog } from "../CreateBillingStatementDialog";
import { formatCurrencyPHP } from "@/lib/constant";
import Link from "next/link";

interface BillingSectionProps {
  order: any;
}

export function BillingSection({ order }: BillingSectionProps) {
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);

  const billingStatements = order.billingStatements || [];
  const hasBillingStatements = billingStatements.length > 0;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default" as const;
      case "SENT":
        return "secondary" as const;
      case "OVERDUE":
        return "destructive" as const;
      case "DRAFT":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      <SectionCard 
        heading={
          <div className="flex items-center justify-between">
            <span>Billing Statements</span>
            <Button
              onClick={() => setIsBillingDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Billing Statement
            </Button>
          </div>
        }
        contentClassName="space-y-4"
      >
        {hasBillingStatements ? (
          <div className="space-y-4">
            {billingStatements.map((billing: any) => (
              <Card key={billing.id} className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {billing.statementNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(billing.status)}>
                        {formatStatus(billing.status)}
                      </Badge>
                      {billing.salesInvoice && (
                        <Badge variant="outline" className="text-xs">
                          Invoice: {billing.salesInvoice.invoiceNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Billing Date</p>
                        <p className="text-muted-foreground">
                          {format(new Date(billing.billingDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Total Amount</p>
                        <p className="text-muted-foreground">
                          {formatCurrencyPHP(billing.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Actions</p>
                        <div className="flex gap-2 mt-1">
                          <Link href={`/billing-statement/${billing.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              View Statement
                            </Button>
                          </Link>
                          {billing.salesInvoice && (
                            <Link href={`/sales-invoice/${billing.salesInvoice.id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                View Invoice
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {billing.deliveryReceipts && billing.deliveryReceipts.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Delivery Receipts</p>
                      <div className="flex flex-wrap gap-2">
                        {billing.deliveryReceipts.map((receipt: any) => (
                          <Badge key={receipt.id} variant="outline" className="text-xs">
                            {receipt.receiptNumber} - {formatStatus(receipt.deliveryStatus)}
                          </Badge>
                        ))}
                      </div>
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
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No Billing Statements</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Create a billing statement for this customer order to generate invoices and track payments.
              </p>
            </div>
            <Button
              onClick={() => setIsBillingDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Billing Statement for this Customer Order
            </Button>
          </div>
        )}
      </SectionCard>

      {/* Billing Statement Dialog */}
      <CreateBillingStatementDialog
        customerOrder={{
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          customer: order.customer,
        }}
        open={isBillingDialogOpen}
        onOpenChange={setIsBillingDialogOpen}
      />
    </div>
  );
}
