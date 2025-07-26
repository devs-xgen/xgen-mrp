"use client";

import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { formatCurrencyPHP } from "@/lib/constant";
import { SalesReportData } from "@/types/admin/billing";

interface SalesInvoicesDashboardProps {
  reportData: SalesReportData;
}

export function SalesInvoicesDashboard({ reportData }: SalesInvoicesDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AnalyticsCard
        title="Total Invoices"
        value={reportData.totalInvoices.toString()}
        icon="Receipt"
        subtitle="All time invoices"
        {...analyticsCardVariants.blue}
      />
      
      <AnalyticsCard
        title="Total Sales"
        value={formatCurrencyPHP(reportData.totalSales)}
        icon="DollarSign"
        subtitle="Total revenue"
        {...analyticsCardVariants.green}
      />
      
      <AnalyticsCard
        title="Paid Invoices"
        value={reportData.paidInvoices.toString()}
        icon="CheckCircle"
        subtitle="Successfully collected"
        {...analyticsCardVariants.green}
      />
      
      <AnalyticsCard
        title="Overdue Invoices"
        value={reportData.overdueInvoices.toString()}
        icon="AlertTriangle"
        subtitle="Requires attention"
        {...analyticsCardVariants.red}
      />
    </div>
  );
}