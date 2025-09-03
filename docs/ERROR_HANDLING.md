# Production Error Handling & Debugging Guide

This document explains the comprehensive error handling system implemented to capture and debug errors in production environments.

## Overview

The application now includes multiple layers of error handling to ensure that errors in production provide meaningful debugging information instead of generic "Something went wrong" messages.

## Components

### 1. Enhanced Error Boundary (`EnhancedErrorBoundary`)

**Location:** `src/components/global/enhanced-error-boundary.tsx`

**Features:**
- Captures React component errors with detailed context
- Provides user-friendly error UI with recovery options
- Logs errors with stack traces, component stacks, and environment info
- Automatically reports errors to the backend API
- Stores errors locally for debugging
- Shows detailed error information in development mode

**Usage:**
```tsx
<EnhancedErrorBoundary enableErrorReporting={true}>
  <YourComponent />
</EnhancedErrorBoundary>
```

### 2. Global Error Handler (`ConnectionErrorHandler`)

**Location:** `src/components/global/connection-error-handler.tsx`

**Features:**
- Captures global JavaScript errors and unhandled promise rejections
- Handles resource loading errors (scripts, stylesheets)
- Differentiates between network errors and application errors
- Prevents connection errors from crashing the app
- Reports all errors to the backend API

### 3. Error Reporting API

**Location:** `src/app/api/error-reporting/route.ts`

**Features:**
- Receives error reports from client-side handlers
- Enhances error data with server-side context (session info, IP)
- Logs errors with detailed formatting
- Can integrate with external error tracking services
- Stores critical errors for analysis

### 4. Next.js Error Pages

**Files:**
- `src/app/error.tsx` - Page-level error boundary
- `src/app/global-error.tsx` - Application-level error boundary

**Features:**
- Custom error pages with detailed error information
- User-friendly recovery options
- Automatic error reporting
- Development vs production error display modes

### 5. Error Debug Panel (`ErrorDebugPanel`)

**Location:** `src/components/global/error-debug-panel.tsx`

**Features:**
- Development tool for viewing captured errors
- Displays stored errors from localStorage
- Export error data for analysis
- Clear error storage
- Only visible in development or when explicitly enabled

## Environment Variables

Add these to your `.env.local` or production environment:

```env
# Enable error reporting in production
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true

# Enable error debug panel in production (optional)
NEXT_PUBLIC_ENABLE_ERROR_DEBUG=true

# Enable production source maps for better stack traces (optional)
ENABLE_SOURCE_MAPS=true

# Enable stack traces in production error logs (optional, security consideration)
ENABLE_PRODUCTION_STACK_TRACES=true
```

## Configuration

### 1. Next.js Configuration

The following has been added to `next.config.js`:

```javascript
{
  // Enhanced error handling configuration
  productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === 'true',
  
  // Error handling improvements
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  env: {
    NEXT_PUBLIC_ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
  },
}
```

### 2. Root Layout Updates

The main layout (`src/app/layout.tsx`) now includes:
- `EnhancedErrorBoundary` wrapping the entire application
- `ConnectionErrorHandler` for global error capture
- `ErrorDebugPanel` for development debugging

## Error Types Captured

1. **React Component Errors**
   - Component render errors
   - Lifecycle method errors
   - Event handler errors

2. **JavaScript Runtime Errors**
   - Uncaught exceptions
   - Syntax errors
   - Reference errors

3. **Promise Rejections**
   - Unhandled async/await errors
   - Network request failures
   - API call failures

4. **Resource Loading Errors**
   - Script loading failures
   - Stylesheet loading failures
   - Critical resource errors

5. **Network Errors**
   - Connection timeouts
   - Failed fetch requests
   - Server errors

## Error Data Collected

Each error report includes:

```typescript
{
  message: string;           // Error message
  stack?: string;           // Stack trace
  componentStack?: string;  // React component stack
  timestamp: string;        // ISO timestamp
  userAgent: string;        // Browser info
  url: string;             // Page URL where error occurred
  errorId: string;         // Unique error identifier
  errorType: string;       // Type of error
  buildInfo: {
    version: string;        // App version
    nodeEnv: string;       // Environment
  };
  sessionInfo?: {          // User session (if available)
    userId?: string;
    userEmail?: string;
    userRole?: string;
  };
}
```

## Debugging in Production

### 1. Browser Console

All errors are logged to the browser console with detailed information, even in production:

```
🚨 Global JavaScript Error
Error: Network request failed
Message: Failed to fetch user data
Source: https://yourapp.com/api/users
Line: 42 Column: 15
Stack: [full stack trace]
```

### 2. Local Storage

Errors are stored in browser localStorage for debugging:
- `app_errors` - Application and global errors
- `manual_errors` - Manually captured errors

### 3. Error Debug Panel

In development or when `NEXT_PUBLIC_ENABLE_ERROR_DEBUG=true`:
- Access via "Debug Errors" button (bottom-left corner)
- View all captured errors
- Export error data
- Clear error storage

### 4. Server Logs

All errors are logged on the server with enhanced information:

```
🚨 Client Error Report - error_1234567890_abc123
Error: Network request failed
Error ID: error_1234567890_abc123
Timestamp: 2024-01-01T12:00:00.000Z
URL: https://yourapp.com/dashboard
User Agent: Mozilla/5.0...
Session Info: { userId: 'user123', userRole: 'ADMIN' }
```

## Integration with Error Tracking Services

The error reporting API can be easily integrated with external services:

### Sentry
```typescript
if (process.env.SENTRY_DSN) {
  Sentry.captureException(new Error(errorReport.message), {
    tags: { errorId: errorReport.errorId },
    extra: enhancedReport,
  });
}
```

### LogRocket
```typescript
if (process.env.LOGROCKET_ID) {
  LogRocket.captureException(error);
}
```

### Custom Logging Service
```typescript
if (process.env.LOGGING_ENDPOINT) {
  await fetch(process.env.LOGGING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enhancedReport),
  });
}
```

## Best Practices

### 1. Error Boundaries
- Wrap critical components with error boundaries
- Provide meaningful fallback UI
- Include recovery actions for users

### 2. Error Messages
- Use descriptive error messages
- Include context about what the user was trying to do
- Avoid exposing sensitive information

### 3. Error Reporting
- Don't report every minor error (e.g., network timeouts)
- Focus on critical errors that affect user experience
- Include enough context for debugging

### 4. User Experience
- Always provide a way for users to recover
- Show helpful error messages, not technical details
- Include contact information for support

## Security Considerations

1. **Stack Traces in Production**
   - Stack traces can expose sensitive information
   - Only enable with `ENABLE_PRODUCTION_STACK_TRACES=true` if needed
   - Consider sanitizing stack traces before logging

2. **Error Messages**
   - Avoid exposing internal system details
   - Don't include sensitive data in error messages
   - Sanitize user input in error contexts

3. **Error Reporting**
   - Ensure error reporting endpoint is secured
   - Don't log authentication tokens or passwords
   - Consider rate limiting error reports

## Troubleshooting

### Common Issues

1. **Errors not being reported**
   - Check `NEXT_PUBLIC_ENABLE_ERROR_REPORTING` is set
   - Verify network connectivity to `/api/error-reporting`
   - Check browser console for error reporting failures

2. **Too many error reports**
   - Implement error deduplication
   - Add rate limiting to error reporting
   - Filter out non-critical errors

3. **Debug panel not visible**
   - Ensure you're in development mode or `NEXT_PUBLIC_ENABLE_ERROR_DEBUG=true`
   - Check browser console for component errors

### Manual Error Capture

Use the `useErrorHandler` hook for manual error reporting:

```typescript
import { useErrorHandler } from '@/components/global/enhanced-error-boundary';

function MyComponent() {
  const { captureError } = useErrorHandler();
  
  const handleOperation = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      captureError(error, 'user-operation-failed');
      // Handle error gracefully
    }
  };
}
```

## Future Enhancements

1. **Error Analytics Dashboard**
   - Build admin interface for error analysis
   - Group similar errors
   - Track error trends over time

2. **Automated Error Alerts**
   - Send notifications for critical errors
   - Set up error thresholds and monitoring

3. **Error Recovery Strategies**
   - Implement automatic retry mechanisms
   - Add offline error handling
   - Improve user recovery flows

4. **Performance Monitoring**
   - Track error impact on performance
   - Monitor error rates by feature
   - Correlate errors with user actions

This error handling system provides comprehensive coverage for production debugging while maintaining a good user experience and security posture.
