'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console with enhanced information
    console.group('🚨 Next.js Error Page');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Digest:', error.digest);
    console.error('Stack:', error.stack);
    console.error('URL:', window.location.href);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();

    // Send error to our reporting API
    const reportError = async () => {
      try {
        await fetch('/api/error-reporting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            digest: error.digest,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            errorId: `nextjs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            errorType: 'nextjs-error-page',
            buildInfo: {
              version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
              nodeEnv: process.env.NODE_ENV || 'unknown',
            },
          }),
        });
      } catch (reportingError) {
        console.warn('Failed to report error to API:', reportingError);
      }
    };

    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true') {
      reportError();
    }
  }, [error]);

  const copyErrorDetails = () => {
    const errorText = `
Error Report
============
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
App Version: ${process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'}

Error Message: ${error.message}
Error Digest: ${error.digest || 'N/A'}

Stack Trace:
${error.stack}
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

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-xl">Application Error</CardTitle>
          </div>
          <CardDescription>
            Something went wrong with this page. Our team has been automatically notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium">Error:</span>{' '}
                <span className="font-mono text-sm">{error.message}</span>
              </div>
              {error.digest && (
                <div>
                  <span className="font-medium">Error ID:</span>{' '}
                  <code className="bg-background px-1 rounded text-xs">{error.digest}</code>
                </div>
              )}
              <div>
                <span className="font-medium">Time:</span>{' '}
                <span className="text-muted-foreground">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Development Details */}
          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="bg-muted/30 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-sm mb-2">
                Development Details (Click to expand)
              </summary>
              <pre className="whitespace-pre-wrap text-xs font-mono bg-background p-2 rounded overflow-auto max-h-48">
                {error.stack}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={reset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={goHome} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            <Button onClick={copyErrorDetails} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy Details
            </Button>
          </div>

          {/* Help Information */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>What happened?</strong></p>
            <p>An unexpected error occurred while processing your request. This has been automatically logged and our development team will investigate.</p>
            
            <p className="mt-3"><strong>What can you do?</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click &quot;Try Again&quot; to retry the operation</li>
              <li>Go back to the home page and try a different route</li>
              <li>If the problem persists, copy the error details and contact support</li>
              <li>Try clearing your browser cache and cookies</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
