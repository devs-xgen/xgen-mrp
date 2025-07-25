# Design Document

## Overview

This design addresses critical technical issues in the billing system by implementing proper data serialization, Next.js compatibility updates, and functional export/download capabilities. The solution focuses on maintaining data integrity while ensuring all user-facing features work correctly.

## Architecture

### Data Serialization Layer
- **Decimal Conversion Utilities**: Convert Prisma Decimal objects to serializable formats
- **Server Action Wrappers**: Ensure all server actions return serializable data
- **Type-Safe Converters**: Maintain type safety while handling conversions

### Export/Download System
- **PDF Generation Service**: Unified PDF generation for all billing documents
- **Export Data Formatters**: Convert database records to export-ready formats
- **File Download Handlers**: Manage file generation and download triggers

### Next.js Compatibility Layer
- **Params Handling Utilities**: Wrapper functions for proper params access
- **Route Parameter Types**: Type definitions for dynamic route parameters
- **Migration Helpers**: Gradual migration from direct params access

## Components and Interfaces

### Data Conversion Components

```typescript
// Decimal serialization utilities
interface SerializableDecimal {
  value: string;
  precision: number;
}

interface BillingDataConverter {
  serializeDecimals(data: any): any;
  deserializeDecimals(data: any): any;
}

// Server action wrapper
interface SerializableServerAction<T, R> {
  (input: T): Promise<Serializable<R>>;
}
```

### Export System Components

```typescript
// PDF generation interface
interface PDFGenerator {
  generateDeliveryReceipt(id: string): Promise<Buffer>;
  generateSalesInvoice(id: string): Promise<Buffer>;
  generateBillingStatement(id: string): Promise<Buffer>;
}

// Export data interface
interface ExportService {
  exportDeliveryReceipts(filters?: ExportFilters): Promise<ExportResult>;
  exportSalesInvoices(filters?: ExportFilters): Promise<ExportResult>;
  exportBillingStatements(filters?: ExportFilters): Promise<ExportResult>;
}
```

### Next.js Params Handling

```typescript
// Params wrapper utilities
interface ParamsHandler {
  getParams<T>(params: Promise<T>): Promise<T>;
  useParams<T>(params: Promise<T>): T;
}

// Route parameter types
interface BillingRouteParams {
  id: string;
}

interface DeliveryRouteParams {
  id: string;
}
```

## Data Models

### Serializable Data Structures

```typescript
// Serializable billing statement
interface SerializableBillingStatement {
  id: string;
  customerId: string;
  totalAmount: string; // Decimal as string
  taxAmount: string;   // Decimal as string
  discountAmount: string; // Decimal as string
  items: SerializableInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

// Serializable invoice item
interface SerializableInvoiceItem {
  id: string;
  description: string;
  quantity: string;    // Decimal as string
  unitPrice: string;   // Decimal as string
  totalPrice: string;  // Decimal as string
  discountPercent: string; // Decimal as string
}
```

### Export Data Models

```typescript
// Export configuration
interface ExportConfig {
  format: 'pdf' | 'csv' | 'xlsx';
  includeItems: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Export result
interface ExportResult {
  filename: string;
  data: Buffer;
  mimeType: string;
}
```

## Error Handling

### Serialization Error Recovery
- **Decimal Conversion Fallbacks**: Handle edge cases in decimal conversion
- **Type Validation**: Validate data types before serialization
- **Error Logging**: Comprehensive logging for serialization issues

### Export Error Handling
- **PDF Generation Errors**: Handle template and data errors gracefully
- **File System Errors**: Manage temporary file creation and cleanup
- **Network Errors**: Handle download interruptions and retries

### Next.js Compatibility Errors
- **Params Access Errors**: Handle Promise rejection in params access
- **Route Parameter Validation**: Validate route parameters before use
- **Migration Warnings**: Log deprecation warnings during transition

## Testing Strategy

### Unit Testing
- **Decimal Conversion Tests**: Verify accuracy of decimal serialization
- **PDF Generation Tests**: Test PDF output for all document types
- **Params Handling Tests**: Verify proper Promise handling

### Integration Testing
- **End-to-End Export Tests**: Test complete export workflows
- **Server-Client Data Flow**: Verify serialization across boundaries
- **Route Parameter Integration**: Test dynamic route handling

### Performance Testing
- **Large Dataset Exports**: Test export performance with large datasets
- **PDF Generation Performance**: Measure PDF generation times
- **Memory Usage**: Monitor memory usage during data conversion

## Implementation Phases

### Phase 1: Data Serialization Fixes
1. Create decimal conversion utilities
2. Update server actions to return serializable data
3. Implement client-side data handling

### Phase 2: Next.js Params Migration
1. Create params handling utilities
2. Update dynamic route components
3. Implement gradual migration strategy

### Phase 3: Export System Implementation
1. Implement PDF generation service
2. Create export data formatters
3. Add download handlers to UI components

### Phase 4: UI Component Fixes
1. Update component state management
2. Implement proper loading states
3. Add error boundaries and recovery