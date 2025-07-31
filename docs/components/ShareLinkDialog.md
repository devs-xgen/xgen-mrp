# ShareLinkDialog Component

## Overview
The `ShareLinkDialog` component provides a reusable dialog interface for generating and sharing direct links to documents. It creates shareable URLs that use the document ID directly in the path, eliminating the need for token-based authentication.

## Location
`/src/components/shared/ShareLinkDialog.tsx`

## Features
- **Direct Link Generation**: Creates links using document IDs directly (e.g., `/sales-invoice/share/{documentId}`)
- **Copy to Clipboard**: One-click copying of shareable links
- **Open in New Tab**: Direct navigation to the shared document
- **Regenerate Link**: Refresh the link if needed
- **Error Handling**: User-friendly error messages for failed operations
- **Custom Triggers**: Support for custom trigger elements
- **Responsive Design**: Mobile-friendly dialog interface

## Usage

### Basic Usage
```tsx
import { ShareLinkDialog } from '@/components/shared/ShareLinkDialog'

<ShareLinkDialog
  documentType="sales-invoice"
  documentId="cmdex8rpl00egii0ved6kywf9"
  documentTitle="Sales Invoice #INV-001"
/>
```

### Custom Trigger
```tsx
<ShareLinkDialog
  documentType="billing-statement"
  documentId="cmdex8rpl00egii0ved6kywf9"
  trigger={
    <Button variant="ghost" size="sm">
      <Share2 className="h-4 w-4" />
      Custom Share
    </Button>
  }
/>
```

### In Table Actions (Sales Invoices)
```tsx
<ShareLinkDialog
  documentType="sales-invoice"
  documentId={row.original.id}
  documentTitle={`Sales Invoice ${row.original.invoiceNumber}`}
  trigger={
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <Share2 className="mr-2 h-4 w-4" />
      Share Link
    </DropdownMenuItem>
  }
/>
```

### In Table Actions (Billing Statements)
```tsx
<ShareLinkDialog
  documentType="billing-statement"
  documentId={row.original.id}
  documentTitle={`Billing Statement ${row.original.statementNumber}`}
  trigger={
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <Share2 className="mr-2 h-4 w-4" />
      Share Link
    </DropdownMenuItem>
  }
/>
```

### In Table Actions (Delivery Receipts)
```tsx
<ShareLinkDialog
  documentType="delivery-receipt"
  documentId={row.original.id}
  documentTitle={`Delivery Receipt ${row.original.receiptNumber}`}
  trigger={
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <Share2 className="mr-2 h-4 w-4" />
      Share Link
    </DropdownMenuItem>
  }
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `documentType` | `'billing-statement' \| 'sales-invoice' \| 'delivery-receipt'` | Yes | Type of document to share |
| `documentId` | `string` | Yes | Unique identifier of the document |
| `documentTitle` | `string` | No | Display title for the document |
| `trigger` | `React.ReactNode` | No | Custom trigger element (defaults to Share button) |
| `onOpenChange` | `(open: boolean) => void` | No | Callback when dialog open state changes |

## Generated Link Format

The component generates direct links based on document type:

- **Sales Invoice**: `{baseUrl}/sales-invoice/share/{documentId}`
- **Billing Statement**: `{baseUrl}/billing-statement/share/{documentId}`
- **Delivery Receipt**: `{baseUrl}/delivery-receipt/share/{documentId}`

Example: `http://localhost:3001/sales-invoice/share/cmdex8rpl00egii0ved6kywf9`

## Dependencies

- `@/components/ui/button`
- `@/components/ui/dialog`
- `@/components/ui/input`
- `@/components/ui/label`
- `lucide-react` (Copy, ExternalLink, RefreshCw, Share2 icons)
- `sonner` (for toast notifications)

## Integration Points

### Sales Invoices
- **Location**: `/src/components/module/admin/sales/sales-invoices/columns.tsx`
- **Route**: `/sales-invoice/share/{documentId}`
- **Document Type**: `sales-invoice`

### Billing Statements  
- **Location**: `/src/components/module/admin/billing/billing-statements/columns.tsx`
- **Route**: `/billing-statement/share/{documentId}`
- **Document Type**: `billing-statement`

### Delivery Receipts
- **Location**: `/src/components/module/admin/billing/delivery-receipts/columns.tsx`
- **Route**: `/delivery-receipt/share/{documentId}`
- **Document Type**: `delivery-receipt`

## Implementation Notes

1. **Direct ID Approach**: Unlike token-based systems, this component uses document IDs directly in URLs for simplicity
2. **No Expiration**: Generated links do not expire and remain accessible as long as the document exists
3. **Client-Side Generation**: Links are generated on the client side without API calls
4. **Security**: Links are publicly accessible - ensure proper access controls on the target pages
5. **Browser Compatibility**: Uses modern clipboard API with fallback error handling
6. **Multi-Document Support**: Consistent implementation across all supported document types

## Integration Example

The component is integrated into multiple document table actions dropdowns:

```tsx
// In columns.tsx for any document type
<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
  <ShareLinkDialog
    documentType="sales-invoice" // or "billing-statement" or "delivery-receipt"
    documentId={row.original.id}
    documentTitle={`Sales Invoice ${row.original.invoiceNumber}`}
    trigger={
      <>
        <Share2 className="mr-2 h-4 w-4" />
        Share Link
      </>
    }
  />
</DropdownMenuItem>
```

This provides users with an intuitive way to generate and share document links directly from the data table interface across all supported document types.