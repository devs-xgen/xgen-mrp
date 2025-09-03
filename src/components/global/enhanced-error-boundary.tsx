"use client";

import React, { Component, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Copy, RefreshCw, Bug, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  enableErrorReporting?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  errorId: string;
  buildInfo?: {
    version: string;
    nodeEnv: string;
  };
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReportingEnabled: boolean;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.errorReportingEnabled = props.enableErrorReporting ?? true;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Enhanced error logging
    this.logError(error, errorInfo, errorId);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async logError(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      errorId,
      buildInfo: {
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'unknown',
      },
    };

    // Console logging with detailed information
    console.group(`🚨 Error Boundary - ${errorId}`);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.table({
      'Error ID': errorId,
      'Timestamp': errorDetails.timestamp,
      'URL': errorDetails.url,
      'User Agent': errorDetails.userAgent,
      'App Version': errorDetails.buildInfo?.version,
      'Environment': errorDetails.buildInfo?.nodeEnv,
    });
    console.groupEnd();

    // Store error in localStorage for debugging
    if (typeof window !== 'undefined') {
      try {
        const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        storedErrors.push(errorDetails);
        
        // Keep only last 10 errors to prevent storage overflow
        const recentErrors = storedErrors.slice(-10);
        localStorage.setItem('app_errors', JSON.stringify(recentErrors));
      } catch (e) {
        console.warn('Failed to store error in localStorage:', e);
      }
    }

    // Send to error reporting service if enabled
    if (this.errorReportingEnabled && typeof window !== 'undefined') {
      try {
        await this.sendErrorReport(errorDetails);
      } catch (reportError) {
        console.warn('Failed to send error report:', reportError);
      }
    }
  }

  private async sendErrorReport(errorDetails: ErrorDetails): Promise<void> {
    try {
      // Send to your error reporting endpoint
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      });
    } catch (error) {
      console.warn('Error reporting service unavailable:', error);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private copyErrorDetails = () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorText = `
Error ID: ${this.state.errorId}
Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== 'undefined' ? window.location.href : 'unknown'}

Error Message: ${this.state.error.message}

Stack Trace:
${this.state.error.stack}

Component Stack:
${this.state.errorInfo.componentStack}

User Agent: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'}
App Version: ${process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'}
Environment: ${process.env.NODE_ENV || 'unknown'}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      toast({
        title: "Error details copied",
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-xl">Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Our team has been notified and we&apos;re working to fix this issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Summary */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4" />
                  <span className="font-medium">Error Details</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span className="text-muted-foreground">Error ID:</span>
                    <code className="bg-background px-1 rounded text-xs">{this.state.errorId}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Message:</span>{' '}
                    <span className="font-mono text-xs">{this.state.error?.message}</span>
                  </div>
                </div>
              </div>

              {/* Development Mode - Show Full Error */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted/30 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-sm mb-2">
                    Development Info (Click to expand)
                  </summary>
                  <div className="text-xs font-mono space-y-2">
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded mt-1 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded mt-1 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline">
                  Reload Page
                </Button>
                <Button onClick={this.copyErrorDetails} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Error Details
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-sm text-muted-foreground">
                <p>If this problem persists:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Contact support with the Error ID above</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for easy error boundary usage
export function useErrorHandler() {
  return {
    captureError: (error: Error, context?: string) => {
      console.error(`Manual error capture${context ? ` (${context})` : ''}:`, error);
      
      // You can extend this to send to error reporting service
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      };

      // Store in localStorage for debugging
      if (typeof window !== 'undefined') {
        try {
          const storedErrors = JSON.parse(localStorage.getItem('manual_errors') || '[]');
          storedErrors.push(errorDetails);
          localStorage.setItem('manual_errors', JSON.stringify(storedErrors.slice(-10)));
        } catch (e) {
          console.warn('Failed to store manual error:', e);
        }
      }
    }
  };
}
