# Shareable Links Authentication Fix

## Issue
Shareable document links were being blocked by the authentication middleware, causing unauthenticated users to be redirected to login pages instead of being able to access shared documents.

**Error observed:**
```
Unauthenticated access attempt to /delivery-receipts/share/DEL-2024-001, redirecting to delivery/login
```

## Root Cause
The middleware in `src/middleware.ts` was treating all routes as protected routes requiring authentication, without excluding the shareable link routes that should be publicly accessible.

## Solution
Updated the middleware to exclude shareable document routes from authentication requirements by adding a regex pattern to identify shareable link URLs.

### Changes Made

**File:** `src/middleware.ts`

**Before:**
```typescript
// Public routes (allow access without authentication)
if (pathname === "/" || pathname.includes("/login")) {
```

**After:**
```typescript
// Public routes (allow access without authentication)
// Include shareable document routes as public
const isShareableRoute = pathname.match(/^\/(billing-statement|sales-invoice|delivery-receipt)\/share\/[^\/]+$/);

if (pathname === "/" || pathname.includes("/login") || isShareableRoute) {
```

### Pattern Explanation
The regex pattern `/^\/(billing-statement|sales-invoice|delivery-receipt)\/share\/[^\/]+$/` matches:
- `^/` - Starts with forward slash
- `(billing-statement|sales-invoice|delivery-receipt)` - One of the three document types
- `\/share\/` - Literal "/share/" path segment
- `[^\/]+` - One or more characters that are not forward slashes (the token)
- `$` - End of string

This ensures that only valid shareable link URLs are excluded from authentication, maintaining security for all other routes.

## Testing
Verified the fix by testing:
1. ✅ Sales invoice shareable links: `http://localhost:3001/sales-invoice/share/test-token`
2. ✅ Delivery receipt shareable links: `http://localhost:3001/delivery-receipt/share/test-token`
3. ✅ Protected routes still require authentication: `/admin/dashboard` correctly redirects to login

## Impact
- Shareable document links now work correctly for unauthenticated users
- Authentication is still enforced for all other protected routes
- No security vulnerabilities introduced
- Maintains existing functionality for authenticated users

## Related Files
- `src/middleware.ts` - Main fix
- `src/app/billing-statement/share/[token]/page.tsx` - Shareable billing statement page
- `src/app/sales-invoice/share/[token]/page.tsx` - Shareable sales invoice page  
- `src/app/delivery-receipt/share/[token]/page.tsx` - Shareable delivery receipt page
- `src/app/api/shared-documents/[token]/route.ts` - API endpoint (already excluded from middleware)