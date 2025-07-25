"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Users, ShoppingCart, Edit, Star, TrendingUp, Database } from "lucide-react";
import Link from "next/link";
import { BillingTypeRecommendation } from "@/types/admin/billing";

interface BillingRecommendationsCardProps {
  recommendations: BillingTypeRecommendation[];
}

const billingTypeConfig = {
  'customer-order': {
    title: 'Customer Order Billing',
    icon: ShoppingCart,
    color: 'text-blue-600',
    href: '/admin/billing/billing-statements/create?type=customer-order'
  },
  'direct-customer': {
    title: 'Direct Customer Billing',
    icon: Users,
    color: 'text-green-600',
    href: '/admin/billing/billing-statements/create?type=direct-customer'
  },
  'manual-customer': {
    title: 'Manual Customer Entry',
    icon: Edit,
    color: 'text-orange-600',
    href: '/admin/billing/billing-statements/create?type=manual-customer'
  }
};

const basedOnConfig = {
  'usage-pattern': {
    icon: TrendingUp,
    label: 'Usage Pattern',
    color: 'text-blue-600'
  },
  'recent-activity': {
    icon: Star,
    label: 'Recent Activity',
    color: 'text-green-600'
  },
  'customer-data': {
    icon: Database,
    label: 'Data Analysis',
    color: 'text-purple-600'
  }
};

export function BillingRecommendationsCard({ recommendations }: BillingRecommendationsCardProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
            <span>Smart Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-2">No recommendations available yet</p>
            <p className="text-sm mb-4">Create more billing statements to get personalized AI-powered suggestions</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/billing/billing-statements/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Statement
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          <span>Smart Recommendations</span>
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
            <Star className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalized suggestions based on your billing patterns and business data
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => {
            const typeConfig = billingTypeConfig[recommendation.recommendedType];
            const basedOnInfo = basedOnConfig[recommendation.basedOn];
            const TypeIcon = typeConfig.icon;
            const BasedOnIcon = basedOnInfo.icon;
            const confidencePercentage = Math.round(recommendation.confidence * 100);
            const isTopPick = index === 0;

            return (
              <div 
                key={index} 
                className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                  isTopPick 
                    ? 'border-primary bg-primary/5 hover:bg-primary/10' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${typeConfig.color} text-white shadow-sm`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{typeConfig.title}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <BasedOnIcon className={`h-3 w-3 ${basedOnInfo.color}`} />
                        <span className="text-xs text-muted-foreground font-medium">
                          Based on {basedOnInfo.label}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            confidencePercentage >= 80 
                              ? 'border-green-200 text-green-700 bg-green-50' 
                              : confidencePercentage >= 60 
                                ? 'border-amber-200 text-amber-700 bg-amber-50'
                                : 'border-gray-200 text-gray-700 bg-gray-50'
                          }`}
                        >
                          {confidencePercentage}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isTopPick && (
                    <Badge variant="default" className="text-xs bg-primary shadow-sm">
                      <Star className="h-3 w-3 mr-1" />
                      Top Pick
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {recommendation.reason}
                </p>

                <div className="flex items-center justify-between">
                  <Button 
                    asChild 
                    size="sm" 
                    variant={isTopPick ? "default" : "outline"}
                    className={isTopPick ? "shadow-sm" : ""}
                  >
                    <Link href={typeConfig.href}>
                      <Plus className="h-3 w-3 mr-2" />
                      Try {typeConfig.title.split(' ')[0]} Billing
                    </Link>
                  </Button>
                  
                  {confidencePercentage >= 80 && (
                    <div className="flex items-center text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      High confidence
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-1 mb-1">
                <Database className="h-3 w-3" />
                <span>Recommendations update automatically</span>
              </div>
              <span>Based on your usage patterns and business data</span>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/billing/billing-reports">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}