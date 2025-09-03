'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    // Log the critical error
    console.group('🚨 CRITICAL: Global Error Page');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Digest:', error.digest);
    console.error('Stack:', error.stack);
    console.error('URL:', typeof window !== 'undefined' ? window.location.href : 'unknown');
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();

    // Attempt to report the critical error
    const reportCriticalError = async () => {
      try {
        await fetch('/api/error-reporting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            digest: error.digest,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
            errorId: `global_critical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            errorType: 'global-critical-error',
            buildInfo: {
              version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
              nodeEnv: process.env.NODE_ENV || 'unknown',
            },
          }),
        });
      } catch (reportingError) {
        console.error('CRITICAL: Failed to report global error:', reportingError);
      }
    };

    reportCriticalError();
  }, [error]);

  const copyErrorDetails = () => {
    const errorText = `
CRITICAL ERROR REPORT
====================
Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== 'undefined' ? window.location.href : 'unknown'}
User Agent: ${typeof window !== 'undefined' ? navigator.userAgent : 'unknown'}
App Version: ${process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'}

Error Message: ${error.message}
Error Digest: ${error.digest || 'N/A'}

Stack Trace:
${error.stack}

This is a global error that caused the entire application to crash.
    `.trim();

    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(errorText).catch(() => {
        // Fallback for copy failure
        console.error('Failed to copy error details');
      });
    }
  };

  const reloadApp = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Critical Error - XGen MRP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-destructive">
            <CardHeader className="border-b border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-xl text-destructive">Critical Application Error</CardTitle>
              </div>
              <CardDescription>
                A critical error occurred that prevented the application from loading properly. 
                This issue has been automatically reported to our development team.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Error Summary */}
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
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

              {/* Development Stack Trace */}
              {process.env.NODE_ENV === 'development' && error.stack && (
                <details className="bg-muted/30 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-sm mb-2">
                    Stack Trace (Development)
                  </summary>
                  <pre className="whitespace-pre-wrap text-xs font-mono bg-background p-2 rounded overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                </details>
              )}

              {/* Recovery Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={reset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try to Recover
                </Button>
                <Button onClick={reloadApp} variant="outline">
                  Reload Application
                </Button>
                <Button onClick={copyErrorDetails} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Error Report
                </Button>
              </div>

              {/* Critical Error Information */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>What does this mean?</strong></p>
                <p>
                  This is a critical error that prevented the entire application from loading. 
                  It typically indicates a serious issue with the application code or infrastructure.
                </p>
                
                <p className="mt-3"><strong>What should you do?</strong></p>
                <ul className="list-disc list-inside space-y-1">
                                  <li>Try clicking &quot;Try to Recover&quot; first</li>
                <li>If that doesn&apos;t work, try &quot;Reload Application&quot;</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>If the problem persists, contact technical support with the error details above</li>
                </ul>

                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
                  <p className="text-amber-800 dark:text-amber-200 text-xs">
                    <strong>Note:</strong> This error has been automatically logged and our development team 
                    has been notified. We are working to resolve critical issues as quickly as possible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inline CSS to ensure styling works even if CSS fails to load */}
        <style jsx>{`
          .bg-background { background-color: hsl(0 0% 100%); }
          .text-foreground { color: hsl(222.2 84% 4.9%); }
          .border-destructive { border-color: hsl(0 84.2% 60.2%); }
          .text-destructive { color: hsl(0 84.2% 60.2%); }
          .bg-destructive\\/10 { background-color: hsla(0, 84.2%, 60.2%, 0.1); }
          .border-destructive\\/20 { border-color: hsla(0, 84.2%, 60.2%, 0.2); }
          
          @media (prefers-color-scheme: dark) {
            .bg-background { background-color: hsl(222.2 84% 4.9%); }
            .text-foreground { color: hsl(210 40% 98%); }
          }
        `}</style>
      </body>
    </html>
  );
}
