# Decimal Serialization Fixes - Billing Statements

## Overview
This document outlines the comprehensive fixes implemented to resolve `Decimal` object serialization issues in the billing statements system, particularly when passing data from server components to client components in Next.js.

## Problem Statement
The application was encountering serialization errors when trying to pass `Decimal` objects from Prisma database queries to client components. The error manifested as:
```
Error: Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
```

## Root Cause
- Prisma returns `Decimal` objects for decimal fields in the database
- Next.js cannot serialize `Decimal` objects when passing data from server to client components
- The billing statements system extensively uses decimal fields for monetary amounts

## Implemented Solutions

### 1. Decimal Serializer Utility (`src/lib/utils/decimal-serializer.ts`)
Created a comprehensive utility to handle `Decimal` serialization:

```typescript
export type SerializableData<T> = {
  [K in keyof T]: T[K] extends Decimal
    ? string
    : T[K] extends Decimal | null
    ? string | null
    : T[K] extends (infer U)[]
    ? SerializableData<U>[]
    : T[K] extends object | null
    ? T[K] extends null
      ? null
      : SerializableData<T[K]>
    : T[K];
};
```

**Key Features:**
- Recursively converts `Decimal` objects to strings
- Handles nested objects and arrays
- Preserves null values
- Maintains type safety with TypeScript

### 2. Server Actions Updates

#### Updated Return Types
Modified all billing statement server actions to return serialized data:

**Files Updated:**
- `src/lib/actions/billing-statements.ts`

**Key Changes:**
- `getAllBillingStatements`: Returns `PaginatedResponse<SerializableData<BillingStatementWithRelations>>`
- `getBillingAnalytics`: Returns `SerializableData<BillingAnalytics>`
- `getMonthlyRevenue`: Fixed array serialization and type casting

#### Specific Fixes Applied:

1. **Array Serialization Fix:**
```typescript
// Before: Object.values(monthlyData) - caused type issues
// After: Explicit array conversion with proper typing
return Object.values(monthlyData) as Array<{
  month: string;
  year: number;
  revenue: number;
  invoiceCount: number;
}>;
```

2. **Pagination Response Serialization:**
```typescript
return {
  data: serializedData,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  },
};
```

### 3. Component Architecture Updates

#### Page Component (`src/app/admin/(protected)/billing/billing-statements/page.tsx`)
**Changes:**
- Added `await` for `searchParams` to handle Next.js async requirements
- Separated data fetching: `getAllBillingStatements` and `getBillingAnalytics`
- Pass both data and analytics to client component

#### Client Component (`src/components/module/admin/billing/billing-statements/billing-statements-client.tsx`)
**Changes:**
- Updated props interface to accept `SerializableData<BillingStatementWithRelations>[]`
- Added separate `analytics` prop of type `BillingAnalytics`
- Properly destructured paginated response (`data.data` and `data.pagination`)

#### Data Table Component (`src/components/module/admin/billing/billing-statements/data-table.tsx`)
**Changes:**
- Updated to handle serialized data types
- Added pagination prop support
- Type-safe column casting for serialized data

#### Dashboard Component
**Changes:**
- Receives analytics data separately instead of trying to derive from billing statements
- Maintains proper typing for dashboard metrics

### 4. Type Safety Improvements

#### New Type Definitions:
```typescript
// Type alias for better readability
type SerializedBillingStatement = SerializableData<BillingStatementWithRelations>;

// Updated component props
interface BillingStatementsClientProps {
  data: PaginatedResponse<SerializableData<BillingStatementWithRelations>>;
  analytics: BillingAnalytics;
}
```

## Benefits of the Implementation

### 1. **Complete Serialization Support**
- All `Decimal` objects are properly converted to strings
- Nested objects and arrays are handled recursively
- No more serialization errors when passing data to client components

### 2. **Type Safety**
- Full TypeScript support with proper type inference
- Compile-time checks for data structure consistency
- Clear interfaces for component props

### 3. **Performance Optimization**
- Efficient serialization process
- Minimal overhead in data transformation
- Proper pagination support

### 4. **Maintainability**
- Centralized serialization logic
- Reusable utility functions
- Clear separation of concerns between server and client components

### 5. **Scalability**
- Pattern can be applied to other modules with `Decimal` fields
- Consistent approach across the application
- Easy to extend for additional data types

## Testing Results

### Before Fixes:
- ❌ `Decimal` serialization errors
- ❌ Page crashes on data loading
- ❌ TypeScript compilation errors

### After Fixes:
- ✅ No serialization errors
- ✅ Billing statements page loads successfully
- ✅ Data displays correctly in tables and dashboards
- ✅ Proper pagination functionality
- ✅ Type-safe component interactions

## Future Considerations

### 1. **Client-Side Decimal Handling**
If client-side decimal calculations are needed:
```typescript
// Convert string back to Decimal for calculations
import { Decimal } from 'decimal.js';
const amount = new Decimal(serializedAmount);
```

### 2. **Global Application**
This pattern should be applied to other modules that use `Decimal` fields:
- Sales invoices
- Purchase orders
- Inventory valuations
- Financial reports

### 3. **Performance Monitoring**
Monitor the performance impact of serialization on large datasets and optimize if necessary.

## Additional Fixes - Billing Statement Detail Page

### Problem
The billing statement detail page was also experiencing serialization issues with `Decimal` objects and date fields when passing data from server to client components.

### Solution Implemented

#### Files Updated:
- `src/app/admin/(protected)/billing/billing-statements/[id]/page.tsx`
- `src/app/admin/(protected)/billing/billing-statements/[id]/client.tsx`

#### Key Changes:

1. **Server Component Updates:**
   - Updated to pass `SerializableData<BillingStatementWithRelations>` to client component
   - Applied serialization to billing statement data before passing to client

2. **Client Component Updates:**
   - Updated props interface to accept serialized data
   - Fixed all `Decimal` field access by converting to `Number` before use
   - Fixed date field serialization issues by casting to string
   - Updated financial summary to use `formatCurrencyPHP` for consistent formatting
   - Fixed optional chaining for nested objects like `salesInvoice`
   - Updated delivery receipts handling (changed from singular to plural)
   - Fixed form field mappings for serialized data
   - Added proper type casting for dates in timestamps and payment information

3. **Type Safety Improvements:**
   - Created `SerializedBillingStatement` type alias for better readability
   - Ensured proper type checking for serialized vs non-serialized data
   - Added type casting where necessary for date and decimal conversions

#### Testing Results:
- ✅ Billing statement detail page loads without errors
- ✅ Currency values display correctly with PHP formatting
- ✅ Date fields display properly
- ✅ Form interactions work as expected
- ✅ Nested object access functions correctly

## Conclusion
The implemented fixes provide a robust, type-safe solution for handling `Decimal` serialization in Next.js applications. The solution maintains data integrity while ensuring compatibility with React's serialization requirements. Both the billing statements list and detail pages now function correctly with proper serialization handling.