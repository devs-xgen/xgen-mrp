"use client";

import { useEffect } from "react";

/**
 * Global client-side error handler for connection issues
 * Prevents "Connection closed" errors from crashing the app
 */
export function ConnectionErrorHandler() {
  useEffect(() => {
    // Handle global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      
      // Prevent connection closed errors from crashing the app
      if (event.error?.message?.includes('Connection closed') ||
          event.error?.message?.includes('Failed to fetch') ||
          event.error?.message?.includes('NetworkError')) {
        event.preventDefault();
        console.warn('Connection error prevented from crashing app:', event.error);
        return false; // Prevent default error handling
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent connection-related promise rejections from crashing the app
      if (event.reason?.message?.includes('Connection closed') || 
          event.reason?.message?.includes('Failed to fetch') ||
          event.reason?.message?.includes('NetworkError') ||
          event.reason?.name === 'AbortError') {
        event.preventDefault();
        console.warn('Network error prevented from crashing app:', event.reason);
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
