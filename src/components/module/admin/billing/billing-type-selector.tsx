"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingTypeSelectorProps } from "@/types/admin/billing-types";
import { billingTypeOptions } from "./billing-type-data";
import { BillingTypeCard } from "./billing-type-card";

export function BillingTypeSelector({
  selectedType,
  onTypeSelect,
  disabled = false,
  className,
}: BillingTypeSelectorProps) {
  return (
    <Card className={cn("bg-card border rounded-lg", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Choose Billing Type</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select the type of billing statement you want to create
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {billingTypeOptions.map((option) => (
            <BillingTypeCard
              key={option.id}
              option={option}
              isSelected={selectedType === option.id}
              onSelect={onTypeSelect}
              disabled={disabled}
            />
          ))}
        </div>
        
        {selectedType && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm font-medium">
                Selected: {billingTypeOptions.find(opt => opt.id === selectedType)?.title}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {billingTypeOptions.find(opt => opt.id === selectedType)?.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}