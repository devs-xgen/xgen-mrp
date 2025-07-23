import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldErrorProps {
  error?: string | string[];
  className?: string;
  showIcon?: boolean;
}

export function FormFieldError({ 
  error, 
  className,
  showIcon = true 
}: FormFieldErrorProps) {
  if (!error) return null;

  const errorMessages = Array.isArray(error) ? error : [error];
  
  if (errorMessages.length === 0) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {errorMessages.map((message, index) => (
        <div
          key={index}
          className="flex items-start gap-2 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {showIcon && (
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <span className="leading-5">{message}</span>
        </div>
      ))}
    </div>
  );
}

export interface FormFieldErrorInlineProps extends FormFieldErrorProps {
  field?: string;
}

export function FormFieldErrorInline({ 
  error, 
  field,
  className,
  showIcon = false 
}: FormFieldErrorInlineProps) {
  if (!error) return null;

  const errorMessages = Array.isArray(error) ? error : [error];
  
  if (errorMessages.length === 0) return null;

  return (
    <div className={cn("mt-1", className)}>
      {errorMessages.map((message, index) => (
        <p
          key={index}
          className="text-sm text-destructive flex items-center gap-1"
          role="alert"
          aria-live="polite"
          id={field ? `${field}-error` : undefined}
        >
          {showIcon && (
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
          )}
          {message}
        </p>
      ))}
    </div>
  );
}