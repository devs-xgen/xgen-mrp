"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bug, Clock, Trash2, Download, RefreshCw, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface StoredError {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  errorId: string;
  errorType?: string;
  buildInfo?: {
    version: string;
    nodeEnv: string;
  };
}

export function ErrorDebugPanel() {
  const [errors, setErrors] = useState<StoredError[]>([]);
  const [manualErrors, setManualErrors] = useState<StoredError[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadStoredErrors();
  }, [isOpen]);

  const loadStoredErrors = () => {
    if (typeof window === 'undefined') return;

    try {
      const appErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      const manualErrors = JSON.parse(localStorage.getItem('manual_errors') || '[]');
      
      setErrors(appErrors);
      setManualErrors(manualErrors);
    } catch (error) {
      console.warn('Failed to load stored errors:', error);
    }
  };

  const clearErrors = (type: 'app' | 'manual' | 'all') => {
    if (typeof window === 'undefined') return;

    try {
      if (type === 'app' || type === 'all') {
        localStorage.removeItem('app_errors');
        setErrors([]);
      }
      if (type === 'manual' || type === 'all') {
        localStorage.removeItem('manual_errors');
        setManualErrors([]);
      }
      
      toast({
        title: "Errors cleared",
        description: `${type === 'all' ? 'All' : type} errors have been cleared from local storage.`,
      });
    } catch (error) {
      toast({
        title: "Clear failed",
        description: "Could not clear errors from local storage.",
        variant: "destructive",
      });
    }
  };

  const exportErrors = () => {
    const allErrors = {
      appErrors: errors,
      manualErrors: manualErrors,
      exportTimestamp: new Date().toISOString(),
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
    };

    const dataStr = JSON.stringify(allErrors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Error data has been exported to a JSON file.",
    });
  };

  const copyErrorToClipboard = (error: StoredError) => {
    const errorText = `
Error Report
============
Error ID: ${error.errorId}
Timestamp: ${error.timestamp}
URL: ${error.url}
Type: ${error.errorType || 'unknown'}

Message: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

${error.componentStack ? `Component Stack:\n${error.componentStack}` : ''}

User Agent: ${error.userAgent}
App Version: ${error.buildInfo?.version || 'unknown'}
Environment: ${error.buildInfo?.nodeEnv || 'unknown'}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      toast({
        title: "Error copied",
        description: "Error details have been copied to your clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Could not copy error details to clipboard.",
        variant: "destructive",
      });
    });
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getErrorTypeColor = (errorType?: string) => {
    switch (errorType) {
      case 'network': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'javascript': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'promise-rejection': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'resource': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const ErrorList = ({ errorList, title }: { errorList: StoredError[], title: string }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <Badge variant="outline">{errorList.length} errors</Badge>
      </div>
      
      {errorList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No errors recorded</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {errorList.map((error, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getErrorTypeColor(error.errorType)}>
                          {error.errorType || 'unknown'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(error.timestamp)}
                        </div>
                      </div>
                      <p className="font-mono text-sm break-all">{error.message}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {error.url}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyErrorToClipboard(error)}
                      className="shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {error.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View stack trace
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  // Only show in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_ENABLE_ERROR_DEBUG !== 'true') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="fixed top-4 right-4 z-50 bg-background/20 hover:bg-background/40 backdrop-blur-sm rounded-full p-2 opacity-30 hover:opacity-100 transition-opacity duration-200"
          title={`Debug Errors${(errors.length + manualErrors.length) > 0 ? ` (${errors.length + manualErrors.length})` : ''}`}
        >
          <Bug className="h-4 w-4" />
          {(errors.length + manualErrors.length) > 0 && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-[10px] text-destructive-foreground font-bold">
                {errors.length + manualErrors.length > 9 ? '9+' : errors.length + manualErrors.length}
              </span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Error Debug Panel
          </DialogTitle>
          <DialogDescription>
            View and manage client-side errors captured during this session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadStoredErrors}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportErrors}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => clearErrors('all')}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Error Tabs */}
          <Tabs defaultValue="app-errors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="app-errors">
                App Errors ({errors.length})
              </TabsTrigger>
              <TabsTrigger value="manual-errors">
                Manual Errors ({manualErrors.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="app-errors" className="mt-4">
              <ErrorList 
                errorList={errors} 
                title="Application Errors" 
              />
              {errors.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearErrors('app')}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear App Errors
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manual-errors" className="mt-4">
              <ErrorList 
                errorList={manualErrors} 
                title="Manual Errors" 
              />
              {manualErrors.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearErrors('manual')}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Manual Errors
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
