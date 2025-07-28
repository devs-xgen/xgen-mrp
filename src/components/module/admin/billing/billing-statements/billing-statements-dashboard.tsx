"use client"

import { formatCurrencyPHP } from "@/lib/constant"
import { AnalyticsCard } from "@/components/ui/analytics-card"

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
      <AnalyticsCard
        title="Total Statements"
        value={analytics.totalBillingStatements}
        icon="FileText"
        iconColor="text-blue-600"
        bgColor="bg-card"
        borderColor="border-blue-200/70"
      />

      {/* Paid Amount */}
      <AnalyticsCard
        title="Paid Amount"
        value={formatCurrencyPHP(analytics.paidAmount)}
        icon="CheckCircle"
        iconColor="text-green-600"
        bgColor="bg-green-50/90 dark:bg-green-950/30"
        borderColor="border-green-200/70 dark:border-green-800/50"
      />

      {/* Overdue Amount */}
      <AnalyticsCard
        title="Overdue Amount"
        value={formatCurrencyPHP(analytics.overdueAmount)}
        icon="AlertTriangle"
        iconColor="text-red-600"
        bgColor="bg-red-50/90 dark:bg-red-950/30"
        borderColor="border-red-200/70 dark:border-red-800/50"
      />
      
      {/* Total Revenue */}
      <AnalyticsCard
        title="Total Revenue"
        value={formatCurrencyPHP(analytics.totalRevenue)}
        icon="Coins"
        iconColor="text-blue-600"
        bgColor="bg-blue-50/90 dark:bg-blue-950/30"
        borderColor="border-blue-200/70 dark:border-blue-800/50"
      />
    </div>
  )
}