import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { 
  FileText, 
  Receipt, 
  Truck, 
  TrendingUp, 
  Plus, 
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Package
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Import server actions
import { getComprehensiveBillingAnalytics } from "@/lib/actions/billing-reports";
import { getAllBillingStatements } from "@/lib/actions/billing-statements";
import { getAllSalesInvoices } from "@/lib/actions/sales-invoices";
import { getAllDeliveryReceipts } from "@/lib/actions/delivery-receipts";
import { FloatingChatbox } from "@/components/global/floating-chatbox";
import { formatCurrencyPHP, CURRENCY_SYMBOLS } from "@/lib/constant";

export const metadata: Metadata = {
  title: "Billing Dashboard",
  description: "Comprehensive billing management and analytics",
};

async function BillingDashboardContent() {
  try {
    // Fetch analytics and recent data
    const [
      analytics,
      recentStatements,
      recentInvoices,
      recentDeliveries
    ] = await Promise.all([
      getComprehensiveBillingAnalytics(),
      getAllBillingStatements({}, 1, 5),
      getAllSalesInvoices({}, 1, 5),
      getAllDeliveryReceipts({}, 1, 5)
    ]);

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Total Revenue"
            value={formatCurrencyPHP(analytics.totalRevenue)}
            icon="CreditCard"
            {...analyticsCardVariants.green}
          />
          <AnalyticsCard
            title="Paid Amount"
            value={formatCurrencyPHP(analytics.paidAmount)}
            icon="CheckCircle"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Pending Amount"
            value={formatCurrencyPHP(analytics.pendingAmount)}
            icon="Clock"
            {...analyticsCardVariants.amber}
          />
          <AnalyticsCard
            title="Overdue"
            value={formatCurrencyPHP(analytics.overdueAmount)}
            icon="AlertTriangle"
            {...analyticsCardVariants.red}
          />
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Billing Statements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.statusBreakdown.map((status) => (
                  <div key={status.status} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">{status.status.toLowerCase()}</span>
                    <Badge 
                      variant={status.status === 'PAID' ? 'secondary' : 
                              status.status === 'OVERDUE' ? 'destructive' : 'outline'}
                    >
                      {status.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.userName} • {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/billing/billing-statements/create">
                  <FileText className="h-6 w-6" />
                  <span>Create Billing Statement</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/billing/sales-invoices/create">
                  <Receipt className="h-6 w-6" />
                  <span>Create Sales Invoice</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/billing/delivery-receipts/create">
                  <Truck className="h-6 w-6" />
                  <span>Create Delivery Receipt</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/billing/billing-reports">
                  <TrendingUp className="h-6 w-6" />
                  <span>View Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Billing Statements</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/billing/billing-statements">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStatements.data.slice(0, 5).map((statement) => (
                  <div key={statement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{statement.statementNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {statement.customer?.name || 'Unknown Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrencyPHP(statement.netAmount)}</p>
                      <Badge 
                        variant={statement.status === 'PAID' ? 'secondary' : 
                                statement.status === 'OVERDUE' ? 'destructive' : 'outline'}
                      >
                        {statement.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Sales Invoices</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/billing/sales-invoices">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.data.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                                                 <p className="text-sm text-muted-foreground">
                           {invoice.billingStatements?.[0]?.customer?.name || 'Unknown Customer'}
                         </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrencyPHP(invoice.totalAmount)}</p>
                      <Badge 
                        variant={invoice.status === 'PAID' ? 'secondary' : 
                                invoice.status === 'SENT' ? 'outline' : 'default'}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading billing dashboard:', error);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-[100px] mb-2" />
                <Skeleton className="h-8 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading billing dashboard</p>
              <p className="text-sm">Please check your database connection and try again</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default function BillingDashboard() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive billing management and financial analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/admin/billing/billing-statements/create">
              <Plus className="h-4 w-4 mr-2" />
              New Billing Statement
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-[100px] mb-2" />
                  <Skeleton className="h-8 w-[150px]" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      }>
        <BillingDashboardContent />
      </Suspense>

      {/* Floating Chat Support */}
      <FloatingChatbox />
    </div>
  );
} 