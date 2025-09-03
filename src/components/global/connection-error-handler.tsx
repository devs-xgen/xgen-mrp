"use client";

import { useEffect } from "react";

interface ErrorDetails {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  errorType: 'javascript' | 'promise-rejection' | 'resource' | 'network';
  source?: string;
  line?: number;
  column?: number;
}

/**
 * Enhanced global client-side error handler
 * Captures and reports all types of client-side errors for production debugging
 */
export function ConnectionErrorHandler() {
  useEffect(() => {
    // Send error report to our API
    const reportError = async (errorDetails: ErrorDetails) => {
      try {
        // Only report in production or if explicitly enabled
        if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true') {
          await fetch('/api/error-reporting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...errorDetails,
              errorId: `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              buildInfo: {
                version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
                nodeEnv: process.env.NODE_ENV || 'unknown',
              },
            }),
          });
        }
      } catch (reportingError) {
        console.warn('Failed to report error:', reportingError);
      }
    };

    // Handle global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      const errorDetails: ErrorDetails = {
        message: event.error?.message || event.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorType: 'javascript',
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      };

      // Enhanced logging for debugging
      console.group('🚨 Global JavaScript Error');
      console.error('Error:', event.error);
      console.error('Message:', event.message);
      console.error('Source:', event.filename);
      console.error('Line:', event.lineno, 'Column:', event.colno);
      console.error('Stack:', event.error?.stack);
      console.groupEnd();
      
      // Check if this is a connection-related error that should be silenced
      const isConnectionError = event.error?.message?.includes('Connection closed') ||
                               event.error?.message?.includes('Failed to fetch') ||
                               event.error?.message?.includes('NetworkError') ||
                               event.error?.message?.includes('Load failed');

      if (isConnectionError) {
        event.preventDefault();
        console.warn('🌐 Connection error prevented from crashing app:', event.error);
        
        // Still report connection errors but don't crash the app
        errorDetails.errorType = 'network';
        reportError(errorDetails);
        return false;
      }

      // Report all other JavaScript errors
      reportError(errorDetails);
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorDetails: ErrorDetails = {
        message: reason?.message || reason?.toString() || 'Unhandled promise rejection',
        stack: reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorType: 'promise-rejection',
      };

      console.group('🚨 Unhandled Promise Rejection');
      console.error('Reason:', reason);
      console.error('Type:', typeof reason);
      if (reason?.stack) {
        console.error('Stack:', reason.stack);
      }
      console.groupEnd();
      
      // Check if this is a connection-related rejection
      const isConnectionError = reason?.message?.includes('Connection closed') || 
                               reason?.message?.includes('Failed to fetch') ||
                               reason?.message?.includes('NetworkError') ||
                               reason?.name === 'AbortError' ||
                               reason?.message?.includes('Load failed');

      if (isConnectionError) {
        event.preventDefault();
        console.warn('🌐 Network promise rejection prevented from crashing app:', reason);
        
        errorDetails.errorType = 'network';
        reportError(errorDetails);
        return;
      }

      // Report all other promise rejections
      reportError(errorDetails);
    };

    // Handle resource loading errors (images, scripts, stylesheets)
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const errorDetails: ErrorDetails = {
        message: `Resource failed to load: ${target.tagName}`,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorType: 'resource',
        source: (target as any).src || (target as any).href,
      };

      console.warn('📦 Resource loading error:', {
        element: target.tagName,
        source: (target as any).src || (target as any).href,
        outerHTML: target.outerHTML.substring(0, 200),
      });

      // Only report critical resource errors (not images)
      if (target.tagName !== 'IMG') {
        reportError(errorDetails);
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true); // Capture phase for resource errors

    // Log successful initialization
    console.info('🛡️ Enhanced error handler initialized');

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
