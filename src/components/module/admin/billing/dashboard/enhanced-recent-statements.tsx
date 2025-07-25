"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Users, ShoppingCart, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatCurrencyPHP } from "@/lib/constant";

interface BillingStatement {
  id: string;
  statementNumber: string;
  customerName: string;
  customerId: string | null;
  customerOrderId: string | null;
  totalAmount: number;
  netAmount: number;
  status: string;
  billingDate: Date;
  customer?: { name: string } | null;
  customerOrder?: { orderNumber: string } | null;
}

interface EnhancedRecentStatementsProps {
  statements: BillingStatement[];
}

function getBillingType(statement: BillingStatement): {
  type: 'direct-customer' | 'customer-order' | 'manual-customer';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
} {
  if (statement.customerOrderId && statement.customerOrder) {
    return {
      type: 'customer-order',
      label: 'Order',
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-800'
    };
  } else if (statement.customerId && statement.customer) {
    return {
      type: 'direct-customer',
      label: 'Customer',
      icon: Users,
      color: 'bg-green-100 text-green-800'
    };
  } else {
    return {
      type: 'manual-customer',
      label: 'Manual',
      icon: Edit,
      color: 'bg-orange-100 text-orange-800'
    };
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800';
    case 'SENT':
      return 'bg-blue-100 text-blue-800';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function EnhancedRecentStatements({ statements }: EnhancedRecentStatementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Billing Statements</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/billing/billing-statements">
              View All
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No billing statements yet</p>
              <p className="text-sm">Create your first billing statement to get started</p>
            </div>
          ) : (
            statements.map((statement) => {
              const billingTypeInfo = getBillingType(statement);
              const TypeIcon = billingTypeInfo.icon;

              return (
                <div 
                  key={statement.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm">{statement.statementNumber}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${billingTypeInfo.color}`}
                        >
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {billingTypeInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">
                          {statement.customerName || 'Unknown Customer'}
                        </p>
                        {statement.customerOrder && (
                          <Badge variant="outline" className="text-xs">
                            Order: {statement.customerOrder.orderNumber}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(statement.billingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrencyPHP(statement.netAmount)}</p>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${getStatusColor(statement.status)}`}
                    >
                      {statement.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {statements.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {statements.length} recent statements
              </span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Order-based</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Direct</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Manual</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}