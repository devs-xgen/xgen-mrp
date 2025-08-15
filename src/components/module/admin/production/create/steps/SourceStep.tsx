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
  const { watch, setValue } = form;
  const source = watch("source");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          How would you like to create this production order?
        </h3>
        <p className="text-muted-foreground">
          Choose whether to create a standalone production order or link it to
          an existing customer order.
        </p>
      </div>

      <RadioGroup
        value={source}
        onValueChange={(value: "standalone" | "customer_order") => {
          setValue("source", value);
          // Reset related fields when switching source
          if (value === "standalone") {
            setValue("customerId", "");
            setValue("customerOrderId", "");
          } else {
            setValue("productId", "");
            setValue("productVariantId", "");
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card
          className={`cursor-pointer transition-colors ${source === "standalone" ? "ring-2 ring-blue-500" : ""}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="standalone" id="standalone" />
              <Label htmlFor="standalone" className="cursor-pointer flex-1">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Standalone Production</div>
                    <div className="text-sm text-muted-foreground">
                      Create production order directly from product selection
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${source === "customer_order" ? "ring-2 ring-blue-500" : ""}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="customer_order" id="customer_order" />
              <Label htmlFor="customer_order" className="cursor-pointer flex-1">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">From Customer Order</div>
                    <div className="text-sm text-muted-foreground">
                      Link to an existing customer order and its products
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>

      <div className="text-center text-sm text-muted-foreground">
        {source === "standalone"
          ? "You'll select products directly in the next step."
          : "You'll choose a customer order and its products in the next step."}
      </div>
    </div>
  );
}
