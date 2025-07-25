"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, ShoppingCart, Edit, TrendingUp, Calendar } from "lucide-react";
import { BillingTypeAnalytics } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";

interface BillingTypeAnalyticsCardProps {
  analytics: BillingTypeAnalytics[];
}

const billingTypeConfig = {
  'customer-order': {
    title: 'Customer Order',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'direct-customer': {
    title: 'Direct Customer',
    icon: Users,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'manual-customer': {
    title: 'Manual Entry',
    icon: Edit,
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
};

export function BillingTypeAnalyticsCard({ analytics }: BillingTypeAnalyticsCardProps) {
  const totalCount = analytics.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = analytics.reduce((sum, item) => sum + item.totalAmount, 0);

  // Sort by usage count
  const sortedAnalytics = [...analytics].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Billing Type Usage</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAnalytics.map((item) => {
            const config = billingTypeConfig[item.billingType];
            const Icon = config.icon;
            const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;

            return (
              <div key={item.billingType} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-full ${config.color} text-white`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{config.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} statements • {formatCurrencyPHP(item.totalAmount)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {percentage.toFixed(1)}%
                    </Badge>
                    {item.lastUsed && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
                {item.averageAmount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Average: {formatCurrencyPHP(item.averageAmount)}
                  </div>
                )}
              </div>
            );
          })}

          {analytics.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No billing data available yet</p>
              <p className="text-sm">Create your first billing statement to see analytics</p>
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Total Statements</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrencyPHP(totalAmount)}</div>
                <div className="text-xs text-muted-foreground">Total Amount</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}