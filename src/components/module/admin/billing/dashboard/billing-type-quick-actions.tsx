"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShoppingCart, Edit, Plus, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import { BillingTypeAnalytics, BillingTypeRecommendation } from "@/types/admin/billing";

interface BillingTypeQuickActionsProps {
  billingTypeAnalytics?: BillingTypeAnalytics[];
  recommendations?: BillingTypeRecommendation[];
}

const billingTypeConfig = {
  'customer-order': {
    title: 'Customer Order Billing',
    description: 'Bill from existing customer orders with pre-filled details',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    href: '/admin/billing/billing-statements/create?type=customer-order'
  },
  'direct-customer': {
    title: 'Direct Customer Billing',
    description: 'Bill existing customers directly from your database',
    icon: Users,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    href: '/admin/billing/billing-statements/create?type=direct-customer'
  },
  'manual-customer': {
    title: 'Manual Customer Entry',
    description: 'Enter customer details manually for one-time billing',
    icon: Edit,
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    href: '/admin/billing/billing-statements/create?type=manual-customer'
  }
};

export function BillingTypeQuickActions({ 
  billingTypeAnalytics = [], 
  recommendations = [] 
}: BillingTypeQuickActionsProps) {
  // Get the most recommended type
  const topRecommendation = recommendations
    .sort((a, b) => b.confidence - a.confidence)[0];

  // Get usage statistics for sorting (most used first, but recommended always first)
  const sortedTypes = Object.keys(billingTypeConfig).sort((a, b) => {
    const aIsRecommended = topRecommendation?.recommendedType === a;
    const bIsRecommended = topRecommendation?.recommendedType === b;
    
    if (aIsRecommended && !bIsRecommended) return -1;
    if (!aIsRecommended && bIsRecommended) return 1;
    
    const aStats = billingTypeAnalytics.find(stat => stat.billingType === a);
    const bStats = billingTypeAnalytics.find(stat => stat.billingType === b);
    return (bStats?.count || 0) - (aStats?.count || 0);
  });

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Create New Billing Statement</span>
          </div>
          <div className="flex items-center space-x-2">
            {topRecommendation && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                <Star className="h-3 w-3 mr-1" />
                AI Recommended
              </Badge>
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose your preferred billing method. Enhanced with smart recommendations based on your usage patterns.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {sortedTypes.map((typeId) => {
            const config = billingTypeConfig[typeId as keyof typeof billingTypeConfig];
            const stats = billingTypeAnalytics.find(stat => stat.billingType === typeId);
            const isRecommended = topRecommendation?.recommendedType === typeId;
            const Icon = config.icon;

            return (
              <div key={typeId} className="relative group">
                <Button 
                  asChild 
                  variant={isRecommended ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-center space-y-3 w-full relative transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                    isRecommended 
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20' 
                      : 'hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <Link href={config.href}>
                    <div className={`p-3 rounded-full ${config.color} text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm mb-1">{config.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {config.description}
                      </div>
                      {stats && stats.count > 0 && (
                        <div className="flex items-center justify-center mt-2 space-x-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Used {stats.count} times
                          </div>
                          {stats.lastUsed && (
                            <div className="text-xs text-muted-foreground">
                              • Last: {new Date(stats.lastUsed).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                      {isRecommended && (
                        <div className="text-xs font-medium text-primary-foreground/90 mt-1">
                          ⭐ Recommended for you
                        </div>
                      )}
                    </div>
                  </Link>
                </Button>
                {isRecommended && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge variant="default" className="text-xs px-2 py-1 bg-primary shadow-lg">
                      <Star className="h-3 w-3 mr-1" />
                      Top Pick
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Enhanced Statistics Summary */}
        {billingTypeAnalytics.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Your Billing Patterns</span>
              <div className="flex items-center space-x-4">
                {billingTypeAnalytics.map((stat) => {
                  const config = billingTypeConfig[stat.billingType as keyof typeof billingTypeConfig];
                  return (
                    <div key={stat.billingType} className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${config.color.replace('bg-', 'bg-')}`}></div>
                      <span className="text-xs text-muted-foreground">
                        {stat.count} {config.title.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Additional Quick Actions */}
        <div className="pt-4 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/admin/billing/billing-statements">
                <TrendingUp className="h-4 w-4 mr-2" />
                View All Statements
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/admin/billing/billing-reports">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics & Reports
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}