"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertTriangle } from "lucide-react";

interface OverridesStepProps {
  form: UseFormReturn<any>;
}

export function OverridesStep({ form }: OverridesStepProps) {
  const skipDateValidation = form.watch("skipDateValidation");
  const skipMaterialCheck = form.watch("skipMaterialCheck");
  const forceAllocateMaterials = form.watch("forceAllocateMaterials");
  const hasCustomCosts =
    form.watch("customPlannedCost") !== undefined ||
    form.watch("customActualCost") !== undefined ||
    form.watch("customVariance") !== undefined;

  const hasAnyOverride =
    skipDateValidation || skipMaterialCheck || forceAllocateMaterials || hasCustomCosts;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              SuperAdmin Override Capabilities
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              These options bypass normal validation rules. All overrides are logged in the audit
              trail with your reason.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Validation Overrides</h3>

        <FormField
          control={form.control}
          name="skipDateValidation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none flex-1">
                <FormLabel className="flex items-center gap-2">
                  Skip Date Validation
                  {field.value && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      OVERRIDE ACTIVE
                    </span>
                  )}
                </FormLabel>
                <FormDescription>
                  Allow backdated orders and due dates before start dates. Useful for recording
                  historical production or emergency situations.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skipMaterialCheck"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none flex-1">
                <FormLabel className="flex items-center gap-2">
                  Skip Material Availability Check
                  {field.value && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      OVERRIDE ACTIVE
                    </span>
                  )}
                </FormLabel>
                <FormDescription>
                  Create production order without checking if materials are available. Use when
                  materials will arrive later or for planning purposes.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="forceAllocateMaterials"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none flex-1">
                <FormLabel className="flex items-center gap-2">
                  Force Allocate Materials
                  {field.value && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      OVERRIDE ACTIVE
                    </span>
                  )}
                </FormLabel>
                <FormDescription>
                  Reserve materials even if insufficient stock available. May cause production
                  delays. Use for high-priority orders with expected material arrivals.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium">Custom Cost Assignment (Optional)</h3>
        <p className="text-sm text-muted-foreground">
          Set custom costs at order creation. Leave empty to calculate from BOM.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="customPlannedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Material Cost</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="e.g., 1500.00" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Budgeted cost</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customActualCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Material Cost</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="e.g., 1650.00" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Actual spent</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customVariance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Variance</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 150.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">Cost variance</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Audit Reason *
                {hasAnyOverride && (
                  <span className="text-xs text-amber-600">(Required for overrides)</span>
                )}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explain why you're creating this production order, especially if using overrides..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Minimum 15 characters. All SuperAdmin actions are logged with reason for compliance.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {hasAnyOverride && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                Overrides Active - Review Carefully
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                You have {[skipDateValidation, skipMaterialCheck, forceAllocateMaterials, hasCustomCosts].filter(Boolean).length} override(s) enabled. Ensure your
                audit reason clearly explains the business justification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
