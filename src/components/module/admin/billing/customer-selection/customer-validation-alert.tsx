"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CustomerValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

interface CustomerValidationAlertProps {
  validation: CustomerValidationResult;
  className?: string;
}

export function CustomerValidationAlert({ 
  validation, 
  className = "" 
}: CustomerValidationAlertProps) {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Customer validation passed. Ready for billing.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {validation.errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-1">Billing Blocked:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="font-medium mb-1">Warnings:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface CustomerCreditStatusProps {
  customer: {
    creditLimit?: number;
    billingStatements?: Array<{
      totalAmount: number;
      status: string;
    }>;
  };
  className?: string;
}

export function CustomerCreditStatus({ 
  customer, 
  className = "" 
}: CustomerCreditStatusProps) {
  if (!customer.creditLimit || customer.creditLimit <= 0) {
    return null;
  }

  const outstandingAmount = customer.billingStatements
    ?.filter(stmt => stmt.status !== 'PAID' && stmt.status !== 'CANCELLED')
    .reduce((sum, stmt) => sum + stmt.totalAmount, 0) || 0;

  const creditUtilization = (outstandingAmount / customer.creditLimit) * 100;
  
  const getStatusColor = () => {
    if (creditUtilization >= 100) return "bg-red-100 text-red-800 border-red-200";
    if (creditUtilization >= 80) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusText = () => {
    if (creditUtilization >= 100) return "Credit Limit Exceeded";
    if (creditUtilization >= 80) return "Near Credit Limit";
    return "Good Standing";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Credit Status:</span>
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        Outstanding: ₱{outstandingAmount.toLocaleString()} / ₱{customer.creditLimit.toLocaleString()} 
        ({creditUtilization.toFixed(1)}%)
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            creditUtilization >= 100 ? 'bg-red-500' :
            creditUtilization >= 80 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(creditUtilization, 100)}%` }}
        />
      </div>
    </div>
  );
}