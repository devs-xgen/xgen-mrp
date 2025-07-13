"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Calendar, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  AlertCircle, 
  BarChart3, 
  PieChart, 
  Loader2,
  FileText,
  Search,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Import types and server actions
import { 
  BillingReportFilters,
  billingReportFiltersSchema,
  SalesAnalytics,
  MonthlyBillingReport,
  CustomerBillingReport,
  OverduePaymentReport,
  Customer,
} from "@/types/admin/billing";
import {
  getSalesAnalytics,
  getMonthlyBillingReport,
  getCustomerBillingReport,
  getOverduePaymentsReport,
  getBillingTrendAnalysis,
  getTopCustomersByRevenue,
  getPaymentStatusDistribution,
} from "@/lib/actions/billing-reports";
import { getAllCustomers } from "@/lib/actions/customers";

export default function BillingReportsPage() {
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyBillingReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerBillingReport[]>([]);
  const [overdueReport, setOverdueReport] = useState<OverduePaymentReport[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // days
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Form setup for filters
  const form = useForm<BillingReportFilters>({
    resolver: zodResolver(billingReportFiltersSchema),
    defaultValues: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      customerId: "",
      status: "",
    },
  });

  // Load initial data
  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [
        analyticsResult,
        monthlyResult,
        overdueResult,
        customersResult,
      ] = await Promise.all([
        getSalesAnalytics(),
        getMonthlyBillingReport(new Date().getMonth() + 1, new Date().getFullYear()),
        getOverduePaymentsReport(),
        getAllCustomers(),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setSalesAnalytics(analyticsResult.data);
      }
      if (monthlyResult.success && monthlyResult.data) {
        setMonthlyReport(monthlyResult.data);
      }
      if (overdueResult.success && overdueResult.data) {
        setOverdueReport(overdueResult.data);
      }
      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data);
      }
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReportData();
    setIsRefreshing(false);
    toast.success("Reports refreshed successfully");
  };

  // Handle customer-specific report
  const loadCustomerReport = async (customerId: string) => {
    if (!customerId) return;
    
    try {
      const result = await getCustomerBillingReport(customerId);
      if (result.success && result.data) {
        setCustomerReport([result.data]);
      }
    } catch (error) {
      console.error("Error loading customer report:", error);
      toast.error("Failed to load customer report");
    }
  };

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    form.setValue("startDate", startDate);
    form.setValue("endDate", new Date());
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "SENT":
        return "secondary";
      case "OVERDUE":
        return "destructive";
      case "DRAFT":
        return "outline";
      default:
        return "outline";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive billing insights and financial reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select 
                  value={selectedCustomerId} 
                  onValueChange={(value) => {
                    setSelectedCustomerId(value);
                    if (value) loadCustomerReport(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All customers</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {salesAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(salesAnalytics.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center text-sm text-green-600 mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{salesAnalytics.revenueGrowthPercent.toFixed(1)}% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{salesAnalytics.totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center text-sm text-blue-600 mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{salesAnalytics.invoiceGrowthPercent.toFixed(1)}% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outstanding Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(salesAnalytics.outstandingAmount)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {salesAnalytics.overdueCount} overdue invoices
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Customers</p>
                  <p className="text-2xl font-bold">{salesAnalytics.activeCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {salesAnalytics.newCustomers} new this period
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="customers">Customer Analysis</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Payments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart Placeholder */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Revenue trend chart would go here</p>
                    <p className="text-xs text-gray-400">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Distribution */}
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Payment status chart would go here</p>
                    <p className="text-xs text-gray-400">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {salesAnalytics && (
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {salesAnalytics.paymentSuccessRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Payment Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {salesAnalytics.averageInvoiceValue.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Average Invoice Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {salesAnalytics.averagePaymentTime.toFixed(0)} days
                    </p>
                    <p className="text-sm text-muted-foreground">Average Payment Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Monthly Report Tab */}
        <TabsContent value="monthly" className="space-y-6">
          {monthlyReport ? (
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Monthly Report - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(monthlyReport.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{monthlyReport.totalInvoices}</p>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{monthlyReport.paidInvoices}</p>
                    <p className="text-sm text-muted-foreground">Paid Invoices</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(monthlyReport.averageInvoiceValue)}</p>
                    <p className="text-sm text-muted-foreground">Average Invoice</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Top Customers This Month</h4>
                  <div className="space-y-2">
                    {monthlyReport.topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{customer.customerName}</p>
                          <p className="text-sm text-muted-foreground">{customer.invoiceCount} invoices</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(customer.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border rounded-lg">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No monthly report data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Customer Analysis Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Customer Billing Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedCustomerId ? "Showing data for selected customer" : "Select a customer from the filters above to view detailed analysis"}
              </p>
            </CardHeader>
            <CardContent>
              {customerReport.length > 0 ? (
                <div className="space-y-6">
                  {customerReport.map((report, index) => (
                    <div key={index} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold">{formatCurrency(report.totalBilled)}</p>
                          <p className="text-sm text-muted-foreground">Total Billed</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold">{formatCurrency(report.totalPaid)}</p>
                          <p className="text-sm text-muted-foreground">Total Paid</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold">{formatCurrency(report.totalOutstanding)}</p>
                          <p className="text-sm text-muted-foreground">Outstanding</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Recent Invoices</h4>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Invoice Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.recentInvoices.map((invoice, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                  <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                                  <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                                  <TableCell>
                                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                      {invoice.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a customer to view detailed analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Payments Tab */}
        <TabsContent value="overdue" className="space-y-6">
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Overdue Payments
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Invoices that are past their due date and require follow-up
              </p>
            </CardHeader>
            <CardContent>
              {overdueReport.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.customerName}</p>
                              <p className="text-sm text-muted-foreground">{item.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.statementNumber}</TableCell>
                          <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{item.daysOverdue} days</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.outstandingAmount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" disabled>
                                Send Reminder
                              </Button>
                              <Button size="sm" variant="outline" disabled>
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600">No Overdue Payments!</p>
                  <p className="text-muted-foreground">All invoices are current or paid on time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 