# Product QR Code Sharing Feature

## Overview
Admins can now share product information with public users via secure shareable links and QR codes. This feature allows you to generate time-limited, trackable links that give external users view-only access to product details without requiring authentication.

## Features Implemented

### 1. **Database Schema**
- Added `PRODUCT` to `ShareableDocType` enum in Prisma schema
- Leverages existing `ShareableLink` model with:
  - Unique secure tokens
  - Expiration dates (default: 30 days)
  - Access tracking (view count, last accessed)
  - Revocation capability

### 2. **Server Actions** (`src/lib/actions/shareable-link.ts`)
- `createProductShareableLink(productId, expiryDays)` - Create or retrieve existing link
- `getProductByShareableToken(token)` - Public endpoint to fetch product data
- `revokeShareableLink(linkId)` - Revoke an active link
- `getProductShareableLinks(productId)` - View share history

### 3. **Public Share Page** (`/share/products/[token]`)
- Clean, public-facing product view at `/share/products/{token}`
- Displays:
  - Product name, SKU, category, description
  - Pricing information
  - All variants with their attributes and prices
  - Share link metadata (expiry date, view count)
- Beautiful gradient design optimized for mobile and desktop
- No authentication required

### 4. **Admin Share Dialog**
Component: `ProductShareDialog` (`src/components/module/admin/products/product-share-dialog.tsx`)

Features:
- **QR Code Generation** - Scannable QR code for easy mobile access
- **Download QR** - Save QR code as PNG image
- **Copy Link** - One-click copy to clipboard
- **Link Management**:
  - View active links
  - Track view counts
  - Revoke links instantly
  - View share history
- **Auto-reuse** - Reuses existing valid links instead of creating duplicates

### 5. **Integration**
- Share button added to product detail page (`/admin/products/[id]`)
- Available in both desktop and mobile views
- Accessible via dropdown menu on mobile

## How to Use

### As an Admin:

1. **Navigate to a Product**
   - Go to `/admin/products`
   - Click on any product to view details

2. **Open Share Dialog**
   - Click the **"Share"** button (desktop) or select **"Share Product"** from the menu (mobile)

3. **Generate Link**
   - If no active link exists, click **"Create Share Link"**
   - An existing valid link will be reused automatically

4. **Share the Product**
   - **Option 1: QR Code** - Click "Download QR" to save and share the QR code
   - **Option 2: Copy Link** - Click "Copy Link" to share the URL directly
   - The link is valid for 30 days by default

5. **Manage Links**
   - View access count in real-time
   - Revoke links at any time
   - View share history at the bottom of the dialog

### As a Public User:

1. **Scan QR Code** or open the shared link
2. View product information including:
   - Product details
   - Pricing
   - Variants (if applicable)
3. No login required!

## Security Features

- **Token-based authentication** - 64-character secure random tokens
- **Time-limited access** - Links expire after 30 days
- **Revocable** - Admins can revoke links instantly
- **Access tracking** - Monitor view counts and last access
- **Read-only** - Public users cannot modify any data
- **No sensitive data** - Only public-facing product information is shared

## File Structure

```
src/
├── lib/
│   └── actions/
│       └── shareable-link.ts          # Server actions
├── app/
│   ├── admin/(protected)/products/[id]/
│   │   └── client-page.tsx            # Share button integration
│   └── share/products/[token]/
│       ├── page.tsx                   # Public share page
│       └── product-share-view.tsx     # Public view component
├── components/
│   └── module/admin/products/
│       └── product-share-dialog.tsx   # Share dialog component
└── prisma/
    └── schema.prisma                  # Database schema (PRODUCT added to ShareableDocType)
```

## Dependencies Used

- **qrcode.react** - QR code generation (already in package.json)
- **lucide-react** - Icons
- **Radix UI** - Dialog and UI components

## URLs

- **Admin Product Detail**: `/admin/products/{productId}`
- **Public Share Page**: `/share/products/{token}`
- **Example**: `https://yourdomain.com/share/products/abc123...xyz789`

## Future Enhancements (Optional)

- [ ] Custom expiry dates per link
- [ ] Password-protected shares
- [ ] Email sharing directly from dialog
- [ ] Analytics dashboard for share metrics
- [ ] Bulk link generation
- [ ] Custom branding for shared pages

## Notes

- Links are automatically reused if a valid one exists for the product
- Expired links cannot be accessed by public users
- Revoked links show in history but cannot be reactivated
- View counts increment on each access
- The feature follows the existing pattern used for billing statements, sales invoices, and delivery receipts

---

**Status**: ✅ Fully Implemented and Ready to Use
