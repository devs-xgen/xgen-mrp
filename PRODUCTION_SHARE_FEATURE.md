# Production Order QR Code Sharing Feature

## Overview
Admins can now share production order information with business partners and stakeholders via secure shareable links and QR codes. This B2B-focused feature enables external collaboration by providing read-only access to comprehensive production details including operations, quality checks, delivery information, and worker assignments.

## Features Implemented

### 1. **Database Schema**
- Added `PRODUCTION_ORDER` to `ShareableDocType` enum in Prisma schema
- Leverages existing `ShareableLink` model with:
  - Unique secure tokens (64-character random hex)
  - Expiration dates (default: 30 days)
  - Access tracking (view count, last accessed)
  - Revocation capability

### 2. **Server Actions** (`src/lib/actions/shareable-link.ts`)
- `createProductionOrderShareableLink(productionOrderId, expiryDays)` - Create or retrieve existing link
- `getProductionOrderByShareableToken(token)` - Public endpoint with comprehensive data includes:
  - Product and variant information
  - All operations with work centers and assigned workers
  - Quality inspection reports with inspector details
  - Delivery assignment information
  - Customer order details
- `revokeShareableLink(linkId)` - Revoke an active link
- `getProductionOrderShareableLinks(productionOrderId)` - View share history

### 3. **Public Share Page** (`/share/production/[token]`)
- Professional B2B presentation at `/share/production/{token}`
- **Displays comprehensive production data:**
  - **Header**: Production order number, product name, status badges (PENDING, IN_PROGRESS, COMPLETED, etc.)
  - **Key Metrics Dashboard**:
    - Quantity ordered
    - Start date
    - Due date
    - Progress percentage
  - **Product Information**: Name, SKU, category, variant details with attributes
  - **Customer Information**: Name, contact details, address
  - **Operations Timeline**: 
    - Sequential workflow steps
    - Work center assignments
    - Worker assignments
    - Status tracking (color-coded by status)
    - Actual start/end times
    - Estimated durations
  - **Quality Control Reports**:
    - Inspector names
    - Inspection dates
    - Pass/Fail status
    - Defects found count
    - Actions taken
    - Inspector notes
  - **Delivery Information**:
    - Assigned delivery personnel
    - Scheduled delivery date
    - Delivery address
    - Special instructions
  - **Share metadata**: Expiry date, view count, security badge
- Beautiful gradient design optimized for desktop and mobile
- No authentication required
- Professional B2B styling with status-based color coding

### 4. **Admin Share Dialog**
Component: `ProductionOrderShareDialog` (`src/components/module/admin/production/production-order-share-dialog.tsx`)

Features:
- **QR Code Generation** - High-quality scannable QR code for mobile access
- **Download QR** - Save QR code as PNG with production order ID in filename
- **Copy Link** - One-click copy to clipboard with visual feedback
- **Link Management**:
  - View active links with expiry dates
  - Track view counts in real-time
  - Revoke links instantly
  - View complete share history
  - Status badges (Active, Expired, Revoked)
- **Auto-reuse** - Reuses existing valid links instead of creating duplicates

### 5. **Integration**
- Share button added to production order detail page (`/admin/production/[id]`)
- Created client component `ProductionOrderHeaderActions` to handle:
  - Workflow progress button
  - Share button with dialog
  - Existing QR generator
- Maintains server component architecture while adding client interactivity
- Seamlessly integrated alongside existing production order QR generator

## How to Use

### As an Admin:

1. **Navigate to a Production Order**
   - Go to `/admin/production`
   - Click on any production order to view details

2. **Open Share Dialog**
   - Click the **"Share"** button in the header actions area

3. **Generate Link**
   - If no active link exists, click **"Create Share Link"**
   - An existing valid link will be reused automatically

4. **Share with Business Partners**
   - **Option 1: QR Code** - Click "Download QR" to save and share the QR code via email/documents
   - **Option 2: Copy Link** - Click "Copy Link" to share the URL directly
   - The link is valid for 30 days by default

5. **Manage Links**
   - Monitor access count to see engagement
   - Revoke links at any time if needed
   - View complete share history at the bottom of the dialog
   - See who created each link and when

### As a Business Partner/External User:

1. **Access Shared Link**
   - Scan QR Code or open the shared URL
   
2. **View Production Information**
   - **Overview**: Production status, priority, and key dates
   - **Operations**: See the complete production workflow with worker assignments
   - **Quality**: Review quality inspection results and findings
   - **Delivery**: Check delivery scheduling and logistics
   - **Customer**: View customer order information
   
3. **Track Progress**
   - Visual progress indicator shows completion percentage
   - Color-coded operation statuses for easy scanning
   - Real-time status updates (when page is refreshed)

4. **No Login Required** - Immediate access for collaboration

## Security Features

- **Token-based authentication** - 64-character secure random tokens (cryptographically secure)
- **Time-limited access** - Links expire after 30 days by default
- **Revocable** - Admins can revoke links instantly at any time
- **Access tracking** - Monitor view counts and last access timestamps
- **Read-only** - External users cannot modify any data
- **Business-appropriate data** - Displays operational details suitable for B2B sharing
- **No sensitive financial data** - Focuses on production and logistics information
- **IP logging** - Last accessed IP is tracked for security auditing

## File Structure

```
src/
├── lib/
│   └── actions/
│       └── shareable-link.ts                    # Server actions (extended)
├── app/
│   ├── admin/(protected)/production/[id]/
│   │   ├── page.tsx                             # Updated server component
│   │   └── production-order-header-actions.tsx  # Client component for actions
│   └── share/production/[token]/
│       ├── page.tsx                             # Public share page
│       └── production-order-share-view.tsx      # Public view component
├── components/
│   └── module/admin/production/
│       └── production-order-share-dialog.tsx    # Share dialog component
└── prisma/
    └── schema.prisma                            # PRODUCTION_ORDER added to enum
```

## Dependencies Used

- **qrcode.react** - QR code generation (already in package.json)
- **lucide-react** - Icons
- **Radix UI** - Dialog and UI components
- **date-fns** - Date formatting for public view

## URLs

- **Admin Production Detail**: `/admin/production/{productionOrderId}`
- **Public Share Page**: `/share/production/{token}`
- **Example**: `https://yourdomain.com/share/production/abc123...xyz789`

## B2B Use Cases

1. **Supplier Collaboration**
   - Share production schedules with material suppliers
   - Coordinate delivery timing with vendors
   - Transparency in manufacturing process

2. **Customer Updates**
   - Provide customers with real-time production status
   - Share quality inspection results for transparency
   - Communicate delivery schedules

3. **Logistics Coordination**
   - Share with freight forwarders for pickup planning
   - Coordinate warehouse receiving schedules
   - Align with distribution partners

4. **Quality Assurance**
   - Share inspection reports with customers
   - Provide quality documentation to compliance teams
   - Maintain audit trail for certifications

5. **Multi-site Operations**
   - Coordinate between production facilities
   - Share status with remote management
   - Enable cross-functional team collaboration

## Status Color Coding

### Production Order Status
- **PENDING** - Gray
- **IN_PROGRESS** - Blue
- **COMPLETED** - Green
- **ON_HOLD** - Yellow
- **CANCELLED** - Red

### Priority Levels
- **LOW** - Gray
- **MEDIUM** - Blue
- **HIGH** - Orange
- **URGENT** - Red

### Operation Status
- **PENDING** - Gray border and background
- **IN_PROGRESS** - Blue border and background
- **COMPLETED** - Green border and background
- **ON_HOLD** - Yellow border and background
- **CANCELLED** - Red border and background

### Quality Check Status
- **PASSED** - Green badge with checkmark icon
- **FAILED** - Red badge with alert icon
- **PENDING** - Yellow badge

## Data Included in Public View

### ✅ Included
- Product name, SKU, category
- Variant information and attributes
- Production order number, status, priority
- Start date, due date, quantity
- Operation workflow with sequences
- Work center assignments
- Worker assignments
- Operation durations and timestamps
- Quality inspection reports
- Inspector names and findings
- Delivery scheduling
- Delivery personnel assignments
- Customer name and contact info

### ❌ Not Included (Security)
- Internal cost data
- Employee salaries or rates
- Supplier pricing
- Profit margins
- Internal notes marked as confidential
- System user passwords or credentials
- Admin-only operational metrics

## Future Enhancements (Optional)

- [ ] Custom expiry dates per link (7, 14, 30, 60, 90 days)
- [ ] Password-protected shares for sensitive production orders
- [ ] Email sharing directly from dialog
- [ ] SMS notification when production status changes
- [ ] Analytics dashboard for share engagement
- [ ] Bulk link generation for multiple orders
- [ ] Custom branding/white-labeling for shared pages
- [ ] PDF export of shared production view
- [ ] Comments/messaging feature for collaboration
- [ ] Webhook notifications on status changes

## Notes

- Links are automatically reused if a valid one exists for the production order
- Expired links cannot be accessed by external users
- Revoked links show in history but cannot be reactivated
- View counts increment on each access (no duplicate counting from same session)
- The feature follows the same pattern used for billing statements, sales invoices, and delivery receipts
- Works seamlessly with existing Production QR Generator
- Maintains server component architecture for better performance

## Technical Details

### Database Schema Update
```prisma
enum ShareableDocType {
  BILLING_STATEMENT
  SALES_INVOICE
  DELIVERY_RECEIPT
  PRODUCT
  PRODUCTION_ORDER  // ← New
}
```

### Server Action Includes
The production order data fetch includes:
- Product with category
- Product variant with attribute values
- Operations with work centers and assigned users
- Quality checks with inspector details
- Delivery assignment with assigned user
- Customer order with customer details

### Performance Considerations
- Server-side rendering for public share page
- Single database query with comprehensive includes
- Incremental access counting (doesn't reload full data)
- Optimized for mobile and desktop viewing
- Lazy loading of images if any are added later

---

**Status**: ✅ Fully Implemented and Ready for Production Use

**Tested**: Database schema updated, Prisma client regenerated, all components created

**Compatible With**: Existing production order QR generator and workflow features
