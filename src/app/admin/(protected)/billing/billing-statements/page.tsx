import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText, Search, Filter, Download, MoreHorizontal, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Import server actions and types
import { getAllBillingStatements, getBillingAnalytics } from "@/lib/actions/billing-statements";
import { BillingStatementWithRelations, BillingStatus } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";
import { ManualBillingDialog } from "@/components/module/admin/billing/manual-billing-dialog";
import { BillingStatementList } from "@/components/module/admin/billing/billing-statement-list";

export const metadata: Metadata = {
  title: "Billing Statements",
  description: "Manage customer billing statements and track payments",
};



function BillingStatementsTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

async function BillingStatementsContent() {
  try {
    // Fetch billing statements and analytics in parallel
    const [statementsResult, analytics] = await Promise.all([
      getAllBillingStatements({}, 1, 50), // Get first 50 statements
      getBillingAnalytics()
    ]);

    const statements = statementsResult.data;

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        {/* Table Container */}
        <Card className="bg-card border rounded-lg">
          {/* Table Header */}
          <div className="p-6 pb-4 border-b bg-card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search statements..."
                    className="pl-10"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <BillingStatementList statements={statements} />
        </Card>
      </>
    );
  } catch (error) {
    console.error('Error loading billing statements:', error);
    return (
      <Card className="bg-card border rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load billing statements. Please try refreshing the page.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </Card>
    );
  }
}

export default function BillingStatementsPage() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Statements</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer billing statements and track payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <ManualBillingDialog />
          <Button size="sm" asChild>
            <Link href="/admin/billing/billing-statements/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Statement
            </Link>
          </Button>
        </div>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<BillingStatementsTableSkeleton />}>
        <BillingStatementsContent />
      </Suspense>
    </div>
  );
}