# Dynamic Route Conflict Fix

## Issue
The application was encountering a Next.js error: "You cannot use different slug names for the same dynamic path ('documentType' !== 'linkId')" when running `npm run dev`.

## Root Cause
There were conflicting dynamic route structures in the `/api/share-links/` directory:

1. `/api/share-links/[documentType]/[documentId]/route.ts` - Unused route for getting shareable links by document type and ID
2. `/api/share-links/[linkId]/route.ts` - Active route for operations on specific links (DELETE)

Both routes were trying to use the same path level (`/api/share-links/[param]/`) but with different parameter names (`documentType` vs `linkId`), which Next.js doesn't allow.

## Solution
Removed the unused conflicting route:
- **Deleted**: `/api/share-links/[documentType]/[documentId]/route.ts`
- **Deleted**: `/api/share-links/[documentType]/` directory

The application uses the following API endpoints instead:
- `/api/share-links/list?documentType=...&documentId=...` - For fetching shareable links
- `/api/share-links/revoke?linkId=...` - For revoking links  
- `/api/share-links/[linkId]/` - For link-specific operations

## Testing Results
After the fix:
- ✅ Development server starts without errors
- ✅ Sales invoice shareable links work correctly (200 OK)
- ✅ Delivery receipt shareable links work correctly (200 OK)
- ✅ Protected routes correctly redirect to login
- ✅ Authentication middleware continues to work as expected

## Impact
- **Fixed**: Dynamic route naming conflict
- **Maintained**: All existing shareable link functionality
- **Preserved**: Authentication and security measures
- **No Breaking Changes**: All active API endpoints remain functional

## Files Modified
- **Deleted**: `src/app/api/share-links/[documentType]/[documentId]/route.ts`
- **Deleted**: `src/app/api/share-links/[documentType]/` directory

## Related Files
- `src/app/api/share-links/list/route.ts` - Active endpoint for fetching links
- `src/app/api/share-links/revoke/route.ts` - Active endpoint for revoking links
- `src/app/api/share-links/[linkId]/route.ts` - Active endpoint for link operations
- `src/components/shared/ShareLinkManager.tsx` - Uses the active endpoints