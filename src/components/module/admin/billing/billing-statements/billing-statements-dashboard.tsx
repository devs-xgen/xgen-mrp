"use client"

import { FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatCurrencyPHP } from "@/lib/constant"

interface BillingAnalytics {
  totalBillingStatements: number
  paidAmount: number
  overdueAmount: number
  totalRevenue: number
}

interface BillingStatementsDashboardProps {
  analytics: BillingAnalytics
}

export function BillingStatementsDashboard({ analytics }: BillingStatementsDashboardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Statements */}
      <Card className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-muted-foreground truncate">
              Total Statements
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {analytics.totalBillingStatements}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Paid Amount */}
      <Card className="bg-green-50/90 border border-green-200/70 dark:bg-green-950/30 dark:border-green-800/50 p-6">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-sm font-medium text-muted-foreground truncate">
              Paid Amount
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrencyPHP(analytics.paidAmount)}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Overdue Amount */}
      <Card className="bg-red-50/90 border border-red-200/70 dark:bg-red-950/30 dark:border-red-800/50 p-6">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-sm font-medium text-muted-foreground truncate">
              Overdue Amount
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrencyPHP(analytics.overdueAmount)}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Total Revenue */}
      <Card className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-muted-foreground truncate">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrencyPHP(analytics.totalRevenue)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}