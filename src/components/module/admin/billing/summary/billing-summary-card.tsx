"use client";

import { useState, useEffect, useCallback } from "react";
import { Calculator, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrencyPHP } from "@/lib/constant";
import { convertDecimals } from "@/lib/convertDecimals";

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface BillingCalculations {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  netAmount: number;
}

export interface BillingSummaryCardProps {
  calculations: BillingCalculations;
  onCalculationChange: (field: keyof BillingCalculations, value: number) => void;
  isEditable?: boolean;
  showValidation?: boolean;
  errors?: Record<string, string>;
  className?: string;
  autoCalculate?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export interface CalculationValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// ==============================================
// CALCULATION UTILITIES
// ==============================================

/**
 * Calculate tax amount with proper decimal handling
 */
export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  const result = (subtotal * taxRate) / 100;
  return Math.round(result * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate total amount with proper decimal handling
 */
export function calculateTotalAmount(
  subtotal: number,
  taxAmount: number,
  discountAmount: number
): number {
  const result = subtotal + taxAmount - discountAmount;
  return Math.round(result * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate billing calculations
 */
export function validateCalculations(calculations: BillingCalculations): CalculationValidation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Validate subtotal
  if (calculations.subtotal < 0) {
    errors.subtotal = "Subtotal cannot be negative";
  }

  // Validate tax rate
  if (calculations.taxRate < 0) {
    errors.taxRate = "Tax rate cannot be negative";
  } else if (calculations.taxRate > 100) {
    errors.taxRate = "Tax rate cannot exceed 100%";
  } else if (calculations.taxRate > 50) {
    warnings.taxRate = "Tax rate seems unusually high";
  }

  // Validate discount amount
  if (calculations.discountAmount < 0) {
    errors.discountAmount = "Discount amount cannot be negative";
  } else if (calculations.discountAmount > calculations.subtotal) {
    errors.discountAmount = "Discount cannot exceed subtotal";
  } else if (calculations.discountAmount > calculations.subtotal * 0.5) {
    warnings.discountAmount = "Large discount applied";
  }

  // Validate total amount
  if (calculations.totalAmount < 0) {
    errors.totalAmount = "Total amount cannot be negative";
  }

  // Check calculation accuracy
  const expectedTaxAmount = calculateTaxAmount(calculations.subtotal, calculations.taxRate);
  const expectedTotalAmount = calculateTotalAmount(
    calculations.subtotal,
    expectedTaxAmount,
    calculations.discountAmount
  );

  if (Math.abs(calculations.taxAmount - expectedTaxAmount) > 0.01) {
    warnings.taxAmount = "Tax calculation may be inaccurate";
  }

  if (Math.abs(calculations.totalAmount - expectedTotalAmount) > 0.01) {
    warnings.totalAmount = "Total calculation may be inaccurate";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Auto-calculate dependent values
 */
export function autoCalculateValues(
  field: keyof BillingCalculations,
  value: number,
  currentCalculations: BillingCalculations
): BillingCalculations {
  const updated = { ...currentCalculations, [field]: value };

  // Auto-calculate tax amount when subtotal or tax rate changes
  if (field === 'subtotal' || field === 'taxRate') {
    updated.taxAmount = calculateTaxAmount(updated.subtotal, updated.taxRate);
  }

  // Auto-calculate total and net amounts when any relevant field changes
  if (['subtotal', 'taxAmount', 'discountAmount'].includes(field) || 
      (field === 'taxRate' && updated.taxAmount !== currentCalculations.taxAmount)) {
    updated.totalAmount = calculateTotalAmount(
      updated.subtotal,
      updated.taxAmount,
      updated.discountAmount
    );
    updated.netAmount = updated.totalAmount; // Net amount equals total amount in this context
  }

  return convertDecimals(updated);
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export function BillingSummaryCard({
  calculations,
  onCalculationChange,
  isEditable = true,
  showValidation = false,
  errors = {},
  className = "",
  autoCalculate = true,
  onValidationChange,
}: BillingSummaryCardProps) {
  const [localCalculations, setLocalCalculations] = useState<BillingCalculations>(calculations);
  const [validation, setValidation] = useState<CalculationValidation>({ 
    isValid: true, 
    errors: {}, 
    warnings: {} 
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // Update local calculations when props change
  useEffect(() => {
    setLocalCalculations(calculations);
  }, [calculations]);

  // Validate calculations whenever they change
  useEffect(() => {
    const validationResult = validateCalculations(localCalculations);
    setValidation(validationResult);
    onValidationChange?.(validationResult.isValid);
  }, [localCalculations, onValidationChange]);

  // Handle calculation changes with auto-calculation
  const handleCalculationChange = useCallback((
    field: keyof BillingCalculations,
    value: number
  ) => {
    setIsCalculating(true);
    
    let updatedCalculations: BillingCalculations;
    
    if (autoCalculate) {
      updatedCalculations = autoCalculateValues(field, value, localCalculations);
    } else {
      updatedCalculations = { ...localCalculations, [field]: value };
    }

    setLocalCalculations(updatedCalculations);
    onCalculationChange(field, value);
    
    // Trigger auto-calculation for dependent fields
    if (autoCalculate && field !== 'taxAmount' && field !== 'totalAmount' && field !== 'netAmount') {
      setTimeout(() => {
        Object.entries(updatedCalculations).forEach(([key, val]) => {
          if (key !== field && val !== localCalculations[key as keyof BillingCalculations]) {
            onCalculationChange(key as keyof BillingCalculations, val);
          }
        });
      }, 0);
    }
    
    setTimeout(() => setIsCalculating(false), 100);
  }, [localCalculations, onCalculationChange, autoCalculate]);

  // Handle input changes with validation
  const handleInputChange = (field: keyof BillingCalculations, inputValue: string) => {
    const numericValue = parseFloat(inputValue) || 0;
    handleCalculationChange(field, numericValue);
  };

  // Recalculate all dependent values
  const handleRecalculate = () => {
    const recalculated = autoCalculateValues('subtotal', localCalculations.subtotal, localCalculations);
    setLocalCalculations(recalculated);
    
    // Notify parent of all changes
    Object.entries(recalculated).forEach(([key, value]) => {
      onCalculationChange(key as keyof BillingCalculations, value);
    });
  };

  const hasErrors = Object.keys(validation.errors).length > 0 || Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(validation.warnings).length > 0;

  return (
    <Card className={`bg-card border rounded-lg sticky top-6 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Billing Summary
          </div>
          <div className="flex items-center gap-2">
            {isCalculating && (
              <Badge variant="secondary" className="text-xs">
                Calculating...
              </Badge>
            )}
            {hasErrors && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            {!hasErrors && validation.isValid && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Validation Alerts */}
        {showValidation && hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix calculation errors before proceeding.
            </AlertDescription>
          </Alert>
        )}

        {showValidation && hasWarnings && !hasErrors && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Please review the highlighted calculations.
            </AlertDescription>
          </Alert>
        )}

        {/* Calculation Fields */}
        <div className="space-y-4">
          {/* Subtotal */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-muted-foreground">Subtotal:</Label>
              {isEditable ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={localCalculations.subtotal}
                    onChange={(e) => handleInputChange('subtotal', e.target.value)}
                    className={`w-32 text-right ${
                      validation.errors.subtotal || errors.subtotal ? 'border-destructive' : ''
                    }`}
                    disabled={isCalculating}
                  />
                </div>
              ) : (
                <span className="font-medium">{formatCurrencyPHP(localCalculations.subtotal)}</span>
              )}
            </div>
            {(validation.errors.subtotal || errors.subtotal) && (
              <p className="text-xs text-destructive">
                {validation.errors.subtotal || errors.subtotal}
              </p>
            )}
          </div>

          {/* Tax Rate and Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-muted-foreground">Tax Rate (%):</Label>
              {isEditable ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={localCalculations.taxRate}
                    onChange={(e) => handleInputChange('taxRate', e.target.value)}
                    className={`w-20 text-right ${
                      validation.errors.taxRate || errors.taxRate ? 'border-destructive' : ''
                    }`}
                    disabled={isCalculating}
                  />
                  <span className="text-sm">%</span>
                </div>
              ) : (
                <span className="font-medium">{localCalculations.taxRate}%</span>
              )}
            </div>
            {(validation.errors.taxRate || errors.taxRate || validation.warnings.taxRate) && (
              <p className={`text-xs ${
                validation.errors.taxRate || errors.taxRate ? 'text-destructive' : 'text-yellow-600'
              }`}>
                {validation.errors.taxRate || errors.taxRate || validation.warnings.taxRate}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Label className="text-sm text-muted-foreground">Tax Amount:</Label>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${
                validation.warnings.taxAmount ? 'text-yellow-600' : ''
              }`}>
                {formatCurrencyPHP(localCalculations.taxAmount)}
              </span>
              {autoCalculate && (
                <Badge variant="outline" className="text-xs">Auto</Badge>
              )}
            </div>
          </div>

          {/* Discount Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-muted-foreground">Discount:</Label>
              {isEditable ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localCalculations.discountAmount}
                  onChange={(e) => handleInputChange('discountAmount', e.target.value)}
                  className={`w-32 text-right ${
                    validation.errors.discountAmount || errors.discountAmount ? 'border-destructive' : ''
                  }`}
                  disabled={isCalculating}
                />
              ) : (
                <span className="font-medium">-{formatCurrencyPHP(localCalculations.discountAmount)}</span>
              )}
            </div>
            {(validation.errors.discountAmount || errors.discountAmount || validation.warnings.discountAmount) && (
              <p className={`text-xs ${
                validation.errors.discountAmount || errors.discountAmount ? 'text-destructive' : 'text-yellow-600'
              }`}>
                {validation.errors.discountAmount || errors.discountAmount || validation.warnings.discountAmount}
              </p>
            )}
          </div>

          <Separator />

          {/* Total Amount */}
          <div className="flex justify-between items-center">
            <Label className="font-semibold">Total Amount:</Label>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg ${
                validation.errors.totalAmount ? 'text-destructive' : 
                validation.warnings.totalAmount ? 'text-yellow-600' : ''
              }`}>
                {formatCurrencyPHP(localCalculations.totalAmount)}
              </span>
              {autoCalculate && (
                <Badge variant="outline" className="text-xs">Auto</Badge>
              )}
            </div>
          </div>

          {/* Net Amount */}
          <div className="flex justify-between items-center">
            <Label className="font-semibold">Net Amount:</Label>
            <span className="font-bold text-lg text-green-600">
              {formatCurrencyPHP(localCalculations.netAmount)}
            </span>
          </div>

          {/* Calculation Actions */}
          {isEditable && autoCalculate && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={isCalculating}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Recalculate
              </Button>
            </div>
          )}
        </div>

        {/* Calculation Summary */}
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Effective Tax Rate: {localCalculations.subtotal > 0 ? 
              ((localCalculations.taxAmount / localCalculations.subtotal) * 100).toFixed(2) : 0}%</div>
            <div>Discount Rate: {localCalculations.subtotal > 0 ? 
              ((localCalculations.discountAmount / localCalculations.subtotal) * 100).toFixed(2) : 0}%</div>
            {autoCalculate && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Auto-calculation enabled
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}