"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ProfitabilityAnalytics } from "@/lib/actions/superadmin/analytics/financial";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfitabilityAnalyticsProps {
  data: ProfitabilityAnalytics;
}

export function ProfitabilityAnalyticsComponent({ data }: ProfitabilityAnalyticsProps) {
  const isGrossMarginHealthy = data.grossMargin >= 30;
  const topProducts = data.byProduct.slice(0, 10);
  const bottomProducts = data.byProduct.slice(-5);

  const getMarginColor = (margin: number) => {
    if (margin >= 40) return "#10b981"; // green
    if (margin >= 20) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 40)
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <TrendingUp className="h-3 w-3" />
          Excellent
        </Badge>
      );
    if (margin >= 20)
      return (
        <Badge variant="secondary" className="gap-1">
          <Percent className="h-3 w-3" />
          Good
        </Badge>
      );
    return (
      <Badge variant="destructive" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        Low
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.grossProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.grossMargin}%</div>
            <div className="mt-1">{getMarginBadge(data.grossMargin)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${data.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">After expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.netMargin}%</div>
            <p className="text-xs text-muted-foreground mt-1">Net profitability</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Profitable Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Most Profitable Products</CardTitle>
          <CardDescription>Highest margin products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-xs text-muted-foreground">{product.productSKU}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${product.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${product.cost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-green-600">
                        ${product.profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className="font-mono font-bold"
                          style={{ color: getMarginColor(product.margin) }}
                        >
                          {product.margin}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{product.orderCount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No product data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Margin Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin by Product</CardTitle>
          <CardDescription>Top 10 products by margin percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="productSKU" type="category" width={100} className="text-xs" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-2">{data.productName}</p>
                      <div className="space-y-1 text-sm">
                        <p>SKU: {data.productSKU}</p>
                        <p>Profit Margin: {data.margin}%</p>
                        <p>Profit: ${data.profit.toLocaleString()}</p>
                        <p>Revenue: ${data.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                {topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getMarginColor(entry.margin)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tenant Profitability */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability by Tenant</CardTitle>
          <CardDescription>Profit margins across tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byTenant.length > 0 ? (
                  data.byTenant.map((tenant) => (
                    <TableRow key={tenant.tenantId}>
                      <TableCell className="font-medium">{tenant.tenantName}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${tenant.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${tenant.cost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-green-600">
                        ${tenant.profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className="font-mono font-bold"
                          style={{ color: getMarginColor(tenant.margin) }}
                        >
                          {tenant.margin}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No tenant data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Low Margin Products Alert */}
      {bottomProducts.some((p) => p.margin < 10) && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Low Margin Products
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200">
              Products with margins below 10%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bottomProducts
                .filter((p) => p.margin < 10)
                .map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.productSKU}</p>
                    </div>
                    <Badge variant="destructive">{product.margin}% margin</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
