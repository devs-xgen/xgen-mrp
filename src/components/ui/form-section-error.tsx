import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface FormSectionError {
  field: string;
  message: string;
  type?: 'validation' | 'server' | 'network';
}

export interface FormSectionErrorProps {
  errors: FormSectionError[];
  title?: string;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  variant?: 'default' | 'destructive';
}

export function FormSectionError({ 
  errors, 
  title = "Please fix the following errors:",
  className,
  dismissible = false,
  onDismiss,
  variant = 'destructive'
}: FormSectionErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <Alert variant={variant} className={cn("border-destructive/50", className)}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className="flex items-center justify-between">
          {title}
          {dismissible && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">
                <span className="font-medium">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </div>
    </Alert>
  );
}

export interface FormGlobalErrorProps {
  error?: string;
  type?: 'validation' | 'server' | 'network';
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function FormGlobalError({ 
  error, 
  type = 'server',
  className,
  dismissible = true,
  onDismiss
}: FormGlobalErrorProps) {
  if (!error) return null;

  const getErrorTitle = () => {
    switch (type) {
      case 'validation':
        return 'Validation Error';
      case 'network':
        return 'Connection Error';
      case 'server':
      default:
        return 'Error';
    }
  };

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <AlertTriangle className="h-4 w-4" />;
      case 'validation':
      case 'server':
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Alert variant="destructive" className={cn("border-destructive/50", className)}>
      {getErrorIcon()}
      <div className="flex-1">
        <AlertTitle className="flex items-center justify-between">
          {getErrorTitle()}
          {dismissible && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </AlertTitle>
        <AlertDescription className="text-sm">
          {error}
        </AlertDescription>
      </div>
    </Alert>
  );
}

export interface FormValidationSummaryProps {
  errors: Record<string, string | string[]>;
  className?: string;
  title?: string;
  maxErrors?: number;
}

export function FormValidationSummary({ 
  errors, 
  className,
  title = "Please fix the following errors:",
  maxErrors = 10
}: FormValidationSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, value]) => value);
  
  if (errorEntries.length === 0) return null;

  const formattedErrors: FormSectionError[] = errorEntries
    .slice(0, maxErrors)
    .map(([field, message]) => ({
      field: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
      message: Array.isArray(message) ? message[0] : message,
      type: 'validation' as const
    }));

  return (
    <FormSectionError
      errors={formattedErrors}
      title={title}
      className={className}
    />
  );
}