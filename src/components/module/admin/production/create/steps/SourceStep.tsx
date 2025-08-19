"use client";

import { UseFormReturn } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart } from "lucide-react";

import type { ProductionCreateForm } from "@/lib/validation/production-create";

interface SourceStepProps {
  form: UseFormReturn<ProductionCreateForm>;
}

export function SourceStep({ form }: SourceStepProps) {
  const { setValue } = form;

  // Set default to standalone since we only support standalone production orders now
  setValue("source", "standalone");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          Create Standalone Production Order
        </h3>
        <p className="text-muted-foreground">
          Create production orders independently. Customer orders are now created 
          separately for better archiving and workflow management.
        </p>
      </div>

      <Card className="ring-2 ring-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Standalone Production Order</div>
              <div className="text-sm text-muted-foreground">
                Create production orders directly from product selection. 
                Link to customer orders later if needed.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        You'll select products and quantities in the next step.
      </div>
    </div>
  );
}
