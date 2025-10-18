"use client";

import { UseFormReturn } from "react-hook-form";
import { Check, X, Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReviewStepProps {
  form: UseFormReturn<any>;
  products: any[];
}

export function ReviewStep({ form, products }: ReviewStepProps) {
  const formData = form.getValues();
  const selectedProduct = products.find((p) => p.id === formData.productId);
  const selectedVariant = selectedProduct?.variants?.find(
    (v: any) => v.id === formData.productVariantId
  );

  const hasOverrides =
    formData.skipDateValidation ||
    formData.skipMaterialCheck ||
    formData.forceAllocateMaterials ||
    formData.customPlannedCost !== undefined ||
    formData.customActualCost !== undefined ||
    formData.customVariance !== undefined;

  const overridesList = [];
  if (formData.skipDateValidation) overridesList.push("Date Validation Bypassed");
  if (formData.skipMaterialCheck) overridesList.push("Material Check Bypassed");
  if (formData.forceAllocateMaterials) overridesList.push("Force Allocate Materials");
  if (
    formData.customPlannedCost !== undefined ||
    formData.customActualCost !== undefined ||
    formData.customVariance !== undefined
  ) {
    overridesList.push("Custom Costs Applied");
  }

  return (
    <div className="space-y-6">
      {hasOverrides && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                SuperAdmin Overrides Active
              </h3>
              <ul className="mt-2 space-y-1">
                {overridesList.map((override, index) => (
                  <li key={index} className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {override}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Production Order Summary</h3>

        <div className="grid gap-4">
          {/* Product Information */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Product Information</h4>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Product</dt>
                <dd className="font-medium">{selectedProduct?.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">SKU</dt>
                <dd className="font-mono text-xs">{selectedProduct?.sku}</dd>
              </div>
              {selectedVariant && (
                <>
                  <div>
                    <dt className="text-muted-foreground">Variant</dt>
                    <dd className="font-medium">{selectedVariant.displayName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Variant SKU</dt>
                    <dd className="font-mono text-xs">{selectedVariant.sku}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Production Details */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Production Details</h4>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Quantity</dt>
                <dd className="font-medium">{formData.quantity} units</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Priority</dt>
                <dd>
                  <Badge
                    variant={
                      formData.priority === "CRITICAL" || formData.priority === "URGENT"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {formData.priority}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Start Date</dt>
                <dd className="font-medium">
                  {new Date(formData.startDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Due Date</dt>
                <dd className="font-medium">
                  {new Date(formData.dueDate).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Options */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Production Options</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Generate BOM</dt>
                <dd>
                  {formData.generateBOM ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Reserve Materials</dt>
                <dd>
                  {formData.reserveMaterials ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Custom Costs */}
          {(formData.customPlannedCost !== undefined ||
            formData.customActualCost !== undefined ||
            formData.customVariance !== undefined) && (
            <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                Custom Costs
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  OVERRIDE
                </Badge>
              </h4>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                {formData.customPlannedCost !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">Planned Cost</dt>
                    <dd className="font-medium">₱{Number(formData.customPlannedCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
                  </div>
                )}
                {formData.customActualCost !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">Actual Cost</dt>
                    <dd className="font-medium">₱{Number(formData.customActualCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
                  </div>
                )}
                {formData.customVariance !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">Variance</dt>
                    <dd className="font-medium">₱{Number(formData.customVariance).toLocaleString(undefined, { minimumFractionDigits: 2, signDisplay: 'always' })}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Notes */}
          {formData.notes && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {formData.notes}
              </p>
            </div>
          )}

          {/* Audit Reason */}
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
            <h4 className="font-medium mb-3">Audit Reason</h4>
            <p className="text-sm whitespace-pre-wrap">{formData.reason}</p>
          </div>
        </div>
      </div>

      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Click <strong>Create Order</strong> to submit this production order. All details and
          overrides will be logged in the audit trail for compliance.
        </p>
      </div>
    </div>
  );
}
