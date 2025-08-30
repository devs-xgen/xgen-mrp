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

// Import server actions
import { getComprehensiveBillingAnalytics } from "@/lib/actions/billing-reports";
import { getAllBillingStatements } from "@/lib/actions/billing-statements";
import { getAllSalesInvoices } from "@/lib/actions/sales-invoices";
import { getAllDeliveryReceipts } from "@/lib/actions/delivery-receipts";
import { FloatingChatbox } from "@/components/global/floating-chatbox";
import { formatCurrencyPHP, CURRENCY_SYMBOLS } from "@/lib/constant";

// Import enhanced dashboard components
import { BillingTypeQuickActions } from "@/components/module/admin/billing/dashboard/billing-type-quick-actions";
import { BillingTypeAnalyticsCard } from "@/components/module/admin/billing/dashboard/billing-type-analytics-card";
import { BillingRecommendationsCard } from "@/components/module/admin/billing/dashboard/billing-recommendations-card";
import { EnhancedRecentStatements } from "@/components/module/admin/billing/dashboard/enhanced-recent-statements";

// Import page layout components
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";

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

        {/* Enhanced Quick Actions with Billing Type Support */}
        <BillingTypeQuickActions 
          billingTypeAnalytics={analytics.billingTypeBreakdown}
          recommendations={analytics.billingTypeRecommendations}
        />

        {/* Additional Quick Actions */}
        <SectionCard heading="Other Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/admin/billing/simple-billing-statements">
                <FileText className="h-6 w-6" />
                <span>Simple Billing</span>
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
        </SectionCard>

        {/* Enhanced Analytics and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Recent Statements with Billing Type Indicators */}
          <div className="lg:col-span-2">
            <EnhancedRecentStatements statements={recentStatements.data.slice(0, 5)} />
          </div>

          {/* Billing Type Analytics */}
          <div>
            <BillingTypeAnalyticsCard analytics={analytics.billingTypeBreakdown || []} />
          </div>
        </div>

        {/* Recommendations and Sales Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Smart Recommendations */}
          <BillingRecommendationsCard recommendations={analytics.billingTypeRecommendations || []} />

          {/* Recent Sales Invoices */}
          <SectionCard heading={
            <div className="flex items-center justify-between">
              <span>Recent Sales Invoices</span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/billing/sales-invoices">View All</Link>
              </Button>
            </div>
          }>
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
          </SectionCard>
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
    <PageContainer>
      {/* Page Header - Using page-layout components */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Billing Dashboard</PageTitle>
          <PageDescription>
            Comprehensive billing management and financial analytics
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-200">
            <Link href="/admin/billing/billing-statements/create">
              <Plus className="h-5 w-5 mr-2" />
              Create New Statement
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admin/billing/billing-statements">
              <FileText className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

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
          <SectionCard>
            <Skeleton className="h-40 w-full" />
          </SectionCard>
        </div>
      }>
        <BillingDashboardContent />
      </Suspense>

      {/* Floating Chat Support */}
      <FloatingChatbox />
    </PageContainer>
  );
}