"use client";

import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyPHP } from "@/lib/constant";

interface InvoiceItemValidationProps {
  errors: string[];
  warnings?: string[];
  showSuccess?: boolean;
}

export function InvoiceItemValidation({ 
  errors, 
  warnings = [], 
  showSuccess = false 
}: InvoiceItemValidationProps) {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isValid = !hasErrors && !hasWarnings;

  if (showSuccess && isValid) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          All invoice items are valid and ready for submission.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Errors */}
      {hasErrors && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Invoice Items Validation Errors</span>
                <Badge variant="destructive" className="text-xs">
                  {errors.length} error{errors.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Invoice Items Warnings</span>
                <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                  {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface InvoiceItemValidationSummaryProps {
  totalItems: number;
  validItems: number;
  totalAmount: number;
  errors: string[];
  warnings?: string[];
}

export function InvoiceItemValidationSummary({
  totalItems,
  validItems,
  totalAmount,
  errors,
  warnings = [],
}: InvoiceItemValidationSummaryProps) {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isValid = !hasErrors;

  return (
    <Card className={`${hasErrors ? 'border-red-300 dark:border-red-700' : hasWarnings ? 'border-yellow-300 dark:border-yellow-700' : 'border-green-300 dark:border-green-700'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          Invoice Items Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{validItems}</div>
            <div className="text-xs text-muted-foreground">Valid Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalItems - validItems}</div>
            <div className="text-xs text-muted-foreground">Invalid Items</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{formatCurrencyPHP(totalAmount)}</div>
            <div className="text-xs text-muted-foreground">Total Amount</div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? "Valid" : "Invalid"}
          </Badge>
          {hasErrors && (
            <Badge variant="destructive">
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasWarnings && (
            <Badge variant="outline" className="border-yellow-300 text-yellow-700">
              {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Validation Messages */}
        {(hasErrors || hasWarnings) && (
          <InvoiceItemValidation 
            errors={errors} 
            warnings={warnings} 
            showSuccess={false}
          />
        )}
      </CardContent>
    </Card>
  );
}