"use client";

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CustomerOrderErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class CustomerOrderErrorBoundary extends React.Component<
  CustomerOrderErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: CustomerOrderErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('Customer Order Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Failed to Load Customer Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error while loading the customer order details. This might be due to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Network connectivity issues</li>
              <li>Data formatting problems</li>
              <li>Missing order information</li>
              <li>Server-side processing errors</li>
            </ul>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button 
                onClick={() => this.setState({ hasError: false })} 
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                size="sm"
              >
                Go Back
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-red-100 rounded">
                <summary className="text-sm font-medium cursor-pointer text-red-800">
                  Error Details (Development)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong className="text-xs">Error:</strong>
                    <pre className="text-xs bg-white p-2 rounded overflow-auto mt-1">
                      {this.state.error.message}
                    </pre>
                  </div>
                  <div>
                    <strong className="text-xs">Stack:</strong>
                    <pre className="text-xs bg-white p-2 rounded overflow-auto mt-1 max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-xs">Component Stack:</strong>
                      <pre className="text-xs bg-white p-2 rounded overflow-auto mt-1 max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default CustomerOrderErrorBoundary;
