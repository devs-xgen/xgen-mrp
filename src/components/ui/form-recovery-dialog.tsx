"use client";

import { useState } from "react";
import { AlertTriangle, Clock, FileText, CheckCircle, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { FormPersistenceData } from "@/lib/utils/form-persistence";
import { formatTimeDuration } from "@/lib/utils/form-persistence";

// ==============================================
// FORM RECOVERY DIALOG COMPONENT
// ==============================================

interface FormRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryData: FormPersistenceData | null;
  onRecover: () => void;
  onDiscard: () => void;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export function FormRecoveryDialog({
  open,
  onOpenChange,
  recoveryData,
  onRecover,
  onDiscard,
  validationResult,
}: FormRecoveryDialogProps) {
  const [isRecovering, setIsRecovering] = useState(false);

  if (!recoveryData) {
    return null;
  }

  const age = Date.now() - recoveryData.timestamp;
  const ageText = formatTimeDuration(age);

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      onRecover();
      onOpenChange(false);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  // Get form completion status
  const getFormCompletionStatus = () => {
    const formData = recoveryData.formData;
    const completedSections: string[] = [];
    const totalSections = 4; // billing type, customer, details, items

    if (formData.billingType) {
      completedSections.push('Billing Type');
    }

    if (formData.customerName) {
      completedSections.push('Customer Information');
    }

    if (formData.subtotal !== undefined && formData.subtotal > 0) {
      completedSections.push('Billing Details');
    }

    if (formData.invoiceItems && formData.invoiceItems.length > 0) {
      const validItems = formData.invoiceItems.filter(item => 
        item && item.description && item.quantity > 0
      );
      if (validItems.length > 0) {
        completedSections.push('Invoice Items');
      }
    }

    return {
      completed: completedSections,
      percentage: Math.round((completedSections.length / totalSections) * 100),
    };
  };

  const completionStatus = getFormCompletionStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Recover Previous Session
          </DialogTitle>
          <DialogDescription>
            We found unsaved changes from a previous session. Would you like to recover them?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last saved {ageText}</span>
          </div>

          {/* Form Completion Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Form Progress</span>
              <Badge variant="secondary">
                {completionStatus.percentage}% complete
              </Badge>
            </div>
            
            <div className="space-y-1">
              {completionStatus.completed.map((section) => (
                <div key={section} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{section}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-2">
              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Data Issues Found:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Please Review:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Recovery Info */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Recovering this data will replace any current form entries. 
              Make sure to save your current work if needed.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={isRecovering}
          >
            Start Fresh
          </Button>
          <Button
            onClick={handleRecover}
            disabled={isRecovering || (validationResult && !validationResult.isValid)}
            className="min-w-[100px]"
          >
            {isRecovering ? "Recovering..." : "Recover Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==============================================
// AUTO-SAVE STATUS INDICATOR
// ==============================================

interface AutoSaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveText: string;
  className?: string;
}

export function AutoSaveStatus({ status, lastSaveText, className }: AutoSaveStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />;
      case 'saved':
        return <div className="h-2 w-2 bg-green-500 rounded-full" />;
      case 'error':
        return <div className="h-2 w-2 bg-red-500 rounded-full" />;
      default:
        return <div className="h-2 w-2 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return lastSaveText;
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}

// ==============================================
// UNSAVED CHANGES WARNING
// ==============================================

interface UnsavedChangesWarningProps {
  show: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  className?: string;
}

export function UnsavedChangesWarning({
  show,
  onSave,
  onDiscard,
  className,
}: UnsavedChangesWarningProps) {
  if (!show) {
    return null;
  }

  return (
    <Alert className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>You have unsaved changes</span>
        <div className="flex gap-2">
          {onDiscard && (
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              Discard
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={onSave}>
              Save Now
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ==============================================
// FORM PERSISTENCE INFO
// ==============================================

interface FormPersistenceInfoProps {
  storageInfo: {
    used: number;
    available: number;
    percentage: number;
  };
  autoSaveEnabled: boolean;
  className?: string;
}

export function FormPersistenceInfo({
  storageInfo,
  autoSaveEnabled,
  className,
}: FormPersistenceInfoProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`text-xs text-muted-foreground space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span>Auto-save:</span>
        <Badge variant={autoSaveEnabled ? "default" : "secondary"} className="text-xs">
          {autoSaveEnabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <span>Storage used:</span>
        <span>{formatBytes(storageInfo.used)} ({storageInfo.percentage.toFixed(1)}%)</span>
      </div>
      
      {storageInfo.percentage > 80 && (
        <Alert className="mt-2">
          <AlertTriangle className="h-3 w-3" />
          <AlertDescription className="text-xs">
            Storage is {storageInfo.percentage.toFixed(1)}% full. Consider clearing old data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}