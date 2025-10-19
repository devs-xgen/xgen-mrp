# SuperAdmin User Documentation

## Overview

The SuperAdmin interface provides **unrestricted system-wide control** over the entire XGen MRP system. Unlike regular Admin users who manage a single tenant, SuperAdmins have cross-tenant visibility, override capabilities, and direct database access for system-critical operations.

## 🎯 Primary Responsibilities

- **System-Wide Oversight**: Monitor and control ALL production orders, users, and data across all tenants
- **Override & Force Operations**: Bypass normal workflows to resolve critical issues
- **Global User Management**: Manage user accounts, reset passwords across the entire system
- **Database Administration**: Direct table exports and data management
- **Production Crisis Management**: Force status changes, cost overrides, bulk updates
- **Cross-Tenant Billing**: Manage billing statements, invoices, and delivery receipts system-wide

## 🚨 Critical Capabilities

### SuperAdmin-Only Powers

1. **Force Production Order Updates**
   - Bypass workflow validation to force status changes
   - Override costs, quantities, and dates
   - Force delete orders with comprehensive audit trails
   - Bulk update multiple orders simultaneously

2. **Unrestricted Data Access**
   - View ALL production orders without tenant restrictions
   - Access global user database with password reset capabilities
   - Export any database table directly to Excel

3. **Material Override Operations**
   - Force release material reservations immediately
   - Override consumption records retroactively
   - Modify reservation quantities directly

4. **System-Level Exports**
   - Export complete database tables
   - Generate comprehensive CSV/Excel reports
   - Access raw data for analysis

## 📋 Dashboard Overview

### Main Dashboard ([/superadmin/dashboard](../../../src/app/superadmin/(protected)/dashboard/page.tsx))

**Real-Time Metrics Display:**
- Total Users & Active Users
- Total Customers & Customer Orders
- Production Orders (all statuses)
- Total Materials & Products
- Open Support Tickets

**Quick Access:**
- Global system health indicators
- Critical alerts requiring immediate attention
- Recent system-wide activity

## 🔧 Core Features

### 1. Global Users Management

**Location:** `/superadmin/users`
**File:** [src/app/superadmin/(protected)/users/page.tsx](../../../src/app/superadmin/(protected)/users/page.tsx)

#### Capabilities

**View All Users**
- Complete user list across ALL tenants
- Full profile visibility including inspector details
- Role-based filtering and search

**Password Reset**
```typescript
// Reset any user's password (minimum 8 characters)
await updateUserPassword(userId, newPassword)
```

**User Audit**
- Track user activity across system
- View user creation and modification history
- Full audit trail visibility

#### Components
- `SuperAdminUsersClient` - Main user management interface
- `reset-password-dialog.tsx` - Password reset dialog
- `superadmin-user-view-dialog.tsx` - Detailed user information

---

### 2. Production Order Management (ADVANCED)

**Location:** `/superadmin/production`
**File:** [src/app/superadmin/(protected)/production/page.tsx](../../../src/app/superadmin/(protected)/production/page.tsx)

This is the **most powerful feature** in the SuperAdmin arsenal.

#### 2.1 View Operations

**Get All Production Orders**
```typescript
// Unrestricted access to ALL orders
const orders = await getAllProductionOrdersSuperadmin()
```

**Statistics Dashboard**
- Total orders count
- Orders by status (PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED)
- Orders by priority (CRITICAL, URGENT, HIGH, MEDIUM, LOW)
- Overdue orders count
- Average material variance
- Total cost variance with color coding

#### 2.2 Override Operations

**Force Status Update**
```typescript
await forceUpdateProductionOrderStatus(orderId, newStatus, reason)
```
- Bypasses normal workflow validation
- Can force to ANY status immediately
- **Use Cases:**
  - Emergency completion of stuck orders
  - Cancel orders with blocking dependencies
  - Resume held orders urgently

**Override Costs**
```typescript
await overrideProductionOrderCosts(orderId, {
  plannedCost: 5000,
  actualCost: 4800,
  variance: -200
}, reason)
```
- Direct cost adjustment
- Modify planned, actual, and variance independently
- **Use Cases:**
  - Correct accounting errors
  - Adjust for missed material costs
  - Fix variance calculations

**Override Quantity**
```typescript
await overrideProductionOrderQuantity(
  orderId,
  newQuantity,
  reason,
  completedQuantity?
)
```
- Change production quantities
- Adjust completed amounts
- **Use Cases:**
  - Customer order changes
  - Correct data entry errors
  - Adjust for partial completions

**Override Dates**
```typescript
await overrideProductionOrderDates(orderId, {
  startDate: new Date('2025-01-15'),
  dueDate: new Date('2025-01-30'),
  completedAt: new Date('2025-01-28')
}, reason)
```
- Bypass date validation
- **Use Cases:**
  - Correct scheduling errors
  - Adjust for customer deadline changes
  - Fix historical data

**Force Delete**
```typescript
await forceDeleteProductionOrder(orderId, reason)
```
- Complete cascade deletion
- Creates comprehensive audit log with order snapshot
- **WARNING:** Irreversible operation
- **Use Cases:**
  - Remove duplicate orders
  - Clean up test data
  - Delete corrupted orders

**Bulk Update**
```typescript
await bulkUpdateProductionOrders(
  [orderId1, orderId2, orderId3],
  { status: 'IN_PROGRESS', priority: 'HIGH' },
  reason
)
```
- Update multiple orders simultaneously
- Single audit log entry
- **Use Cases:**
  - Mass status changes
  - Emergency priority adjustments
  - Bulk cleanup operations

#### 2.3 Material Override Operations

**Force Release Reservation**
```typescript
await forceReleaseMaterialReservation(reservationId, reason)
```
- Release reserved materials immediately
- Auto-updates committed stock

**Override Material Consumption**
```typescript
await overrideMaterialConsumption(consumptionId, {
  actualQuantity: 50,
  wasteQuantity: 2,
  totalCost: 1200
}, reason)
```
- Modify consumption records retroactively

**Override Reservation Quantity**
```typescript
await overrideMaterialReservationQuantity(reservationId, newQuantity, reason)
```
- Change reserved quantities
- Auto-updates material committed stock

#### 2.4 Export Operations

**CSV Export**
```typescript
await exportProductionOrdersCSV(filters)
```
- 21 columns including costs and status
- Filtered by status, priority, date range

**Excel Export**
```typescript
await exportProductionOrdersExcel(filters)
```
- Formatted Excel with:
  - Styled headers
  - Currency formatting
  - Progress indicators
  - Color-coded status

#### UI Components

- `SuperadminProductionOrdersTable` - Main data table
- `SuperadminOverrideStatusDialog` - Force status updates
- `SuperadminOverrideCostsDialog` - Cost adjustments
- `SuperadminOverrideQuantityDialog` - Quantity adjustments
- `SuperadminOverrideDatesDialog` - Date adjustments
- `SuperadminDeleteProductionOrderDialog` - Delete confirmation
- `SuperadminBulkUpdateDialog` - Bulk operations
- `SuperadminProductionOrderDetail` - Detail view ([/superadmin/production/[id]](../../../src/app/superadmin/(protected)/production/[id]/page.tsx))

---

### 3. Materials Management

**Location:** `/superadmin/materials`
**Note:** Enhanced admin materials with SuperAdmin-specific functions

#### Operations

**Read Operations**
- Get all materials with types, UOM, suppliers
- Get archived materials
- List material types and units of measure

**Write Operations**
```typescript
// Update any material
await updateMaterialForSuperAdmin({
  id: materialId,
  name: "Updated Material",
  costPerUnit: 150,
  currentStock: 1000
})

// Archive with reason
await archiveMaterialForSuperAdmin(materialId, "Discontinued by supplier")
```

**Material Type Management**
```typescript
// Create type
await createMaterialTypeForSuperAdmin({ name: "New Type", description: "..." })

// Update type
await updateMaterialTypeForSuperAdmin(typeId, { name: "Updated Type" })

// Delete type (validates no usage)
await deleteMaterialTypeForSuperAdmin(typeId)
```

**Unit of Measure Management**
```typescript
// Create UOM
await createUnitOfMeasureForSuperAdmin({
  name: "Kilogram",
  abbreviation: "kg"
})

// Update UOM
await updateUnitOfMeasureForSuperAdmin(uomId, { name: "Updated UOM" })

// Delete UOM (validates no usage)
await deleteUnitOfMeasureForSuperAdmin(uomId)
```

#### Export Operations

**CSV Export**
```typescript
await exportSuperAdminMaterialsData({
  search: "fabric",
  status: "active",
  typeId: materialTypeId,
  supplierId: supplierId
})
```

**Excel Export**
- 10-column export with automatic width calculation
- Number formatting for costs and quantities
- Bold headers

---

### 4. Billing Management Suite

#### 4.1 Billing Statements

**Location:** `/superadmin/billing/billing-statements`
**File:** [src/app/superadmin/(protected)/billing/billing-statements/page.tsx](../../../src/app/superadmin/(protected)/billing/billing-statements/page.tsx)

**Features:**
- View all billing statements across all tenants
- Create new statements with multi-step wizard
- Edit existing statements
- Update statement status
- Export to CSV/Excel

**Operations:**
```typescript
// Get paginated statements
await getAllBillingStatements(filters, page, pageSize)

// Create statement
await createBillingStatement({
  customerOrderId,
  totalAmount,
  paidAmount,
  status: 'PENDING'
})

// Update status
await updateBillingStatementStatus(id, 'PAID')
```

**Pages:**
- `/superadmin/billing/billing-statements` - List view
- `/superadmin/billing/billing-statements/create` - Create wizard
- `/superadmin/billing/billing-statements/[id]` - View details

#### 4.2 Sales Invoices

**Location:** `/superadmin/billing/sales-invoices`
**File:** [src/app/superadmin/(protected)/billing/sales-invoices/page.tsx](../../../src/app/superadmin/(protected)/billing/sales-invoices/page.tsx)

**Features:**
- Create and manage sales invoices
- Auto-generate from customer orders or production orders
- View invoice details with line items
- Export invoices

**Operations:**
```typescript
// Generate from customer order
await generateInvoiceFromCustomerOrder(customerOrderId)

// Generate from production order
await generateInvoiceFromProductionOrder(productionOrderId)

// Update status
await updateSalesInvoiceStatus(invoiceId, 'PAID')
```

**Pages:**
- `/superadmin/billing/sales-invoices` - List view
- `/superadmin/billing/sales-invoices/create` - Create new
- `/superadmin/billing/sales-invoices/[id]` - View/edit details

#### 4.3 Delivery Receipts

**Location:** `/superadmin/billing/delivery-receipts`
**File:** [src/app/superadmin/(protected)/billing/delivery-receipts/page.tsx](../../../src/app/superadmin/(protected)/billing/delivery-receipts/page.tsx)

**Features:**
- Manage delivery confirmations
- Create receipts from orders
- Confirm delivery with signature/photos
- Mark deliveries as failed with reasons
- Delivery analytics

**Operations:**
```typescript
// Create from customer order
await createDeliveryReceiptFromCustomerOrder(customerOrderId, {
  deliveryDate: new Date(),
  recipientName: "John Doe"
})

// Confirm delivery
await confirmDelivery(receiptId, signature?, photoEvidence?)

// Mark failed
await markDeliveryFailed(receiptId, "Customer not available")

// Get analytics
await getDeliveryAnalytics()
```

**Pages:**
- `/superadmin/billing/delivery-receipts` - List view
- `/superadmin/billing/delivery-receipts/create` - Create wizard
- `/superadmin/billing/delivery-receipts/[id]` - View/edit details

---

### 5. Data Export Feature

**Location:** `/superadmin/export-data`
**File:** [src/app/superadmin/(protected)/export-data/page.tsx](../../../src/app/superadmin/(protected)/export-data/page.tsx)

**Unique Capability:** Export any database table directly to Excel

#### Operations

**Get Available Tables**
```typescript
const tables = await getDatabaseTables()
// Returns: [{ name: "User", rowCount: 150 }, { name: "Product", rowCount: 500 }, ...]
```

**Export Table to Excel**
```typescript
const excelFile = await exportTableToExcel("User")
// Returns base64-encoded Excel file with:
// - Automatic column detection
// - All rows from table
// - Auto-calculated column widths
// - Timestamp-based filename
```

**Security Features:**
- Table name validation (regex)
- Table existence verification
- SQL injection prevention
- Parameterized queries

**Use Cases:**
- Emergency data backup
- Data analysis and reporting
- Migration preparation
- Debugging production issues

---

## 🛡️ Security & Audit

### Audit Trail

**All override operations are logged:**
- `productionOrderHistoryLog` - Production order changes
- `activityLog` - System-wide activity
- Captures: user ID, timestamp, change details, reason

### Required Reason Fields

Most override operations require a reason (minimum 10 characters):
```typescript
await forceUpdateProductionOrderStatus(
  orderId,
  'COMPLETED',
  'Emergency completion due to customer deadline'  // Required
)
```

### Authentication

- Role enforcement via `ensureSuperAdmin()` utility
- JWT session-based (NextAuth.js)
- Redirects non-SuperAdmin users automatically
- 8-hour session expiration

---

## 📊 Best Practices

### When to Use Override Operations

**FORCE STATUS UPDATE**
- ✅ Emergency completion of stuck orders
- ✅ Cancel orders with blocking dependencies
- ❌ Regular workflow progression (use normal workflow)

**OVERRIDE COSTS**
- ✅ Correct accounting errors
- ✅ Adjust for missed material costs
- ❌ Regular cost updates (use normal production workflow)

**FORCE DELETE**
- ✅ Remove duplicate orders
- ✅ Clean up test data
- ⚠️ Last resort only - irreversible

**BULK UPDATE**
- ✅ Mass status changes during system issues
- ✅ Emergency priority adjustments
- ❌ Individual order updates (use normal interface)

### Audit Trail Best Practices

1. **Always provide detailed reasons** - Minimum 10 characters but be descriptive
2. **Document external context** - Reference ticket numbers, customer requests
3. **Review audit logs regularly** - Check for unusual patterns
4. **Export critical operations** - Keep records of bulk changes

---

## 🚨 Troubleshooting

### Common Scenarios

**Stuck Production Order**
1. Navigate to `/superadmin/production/[orderId]`
2. Check current status and blocking issues
3. Use "Force Status Update" dialog
4. Provide detailed reason
5. Verify audit trail created

**Material Reservation Issues**
1. Identify reservation ID from production order
2. Use `forceReleaseMaterialReservation()`
3. Check material committed stock updated
4. Review activity log

**User Password Reset**
1. Navigate to `/superadmin/users`
2. Find user in table
3. Click password reset icon
4. Enter new password (8+ characters)
5. Confirm operation

**Bulk Order Status Change**
1. Navigate to `/superadmin/production`
2. Select multiple orders using checkboxes
3. Click "Bulk Update" button
4. Choose new status/priority
5. Provide detailed reason
6. Confirm batch operation

---

## 🔗 Navigation Reference

### Main Navigation

1. **Dashboard** - System overview with KPIs
2. **Products** - (Coming soon)
3. **Materials** - Material management with override capabilities
4. **Production** - Full production control with override operations
5. **Global Users** - User management and password resets
6. **Billing** (submenu):
   - Billing Statements
   - Sales Invoices
   - Delivery Receipts
   - Billing Reports (Coming soon)
7. **Export Data** - Database table exports

---

## 📚 Related Documentation

- **[Main Documentation Home](../../README.md)** - Back to documentation index
- **[Admin Documentation](../admin/README.md)** - Regular admin capabilities
- **[Worker Documentation](../worker/README.md)** - Production execution
- **[Inspector Documentation](../inspector/README.md)** - Quality control
- **[Technical Documentation](../../technical/README.md)** - System architecture

---

## 🎓 Training Resources

### Recommended Learning Path

1. **Week 1**: Dashboard familiarization and user management
2. **Week 2**: Production order viewing and basic exports
3. **Week 3**: Override operations (supervised)
4. **Week 4**: Independent override operations with audit review
5. **Week 5**: Bulk operations and emergency procedures

### Key Skills

- Understanding production workflow states
- Reading audit trails and activity logs
- Identifying when to use override vs normal workflow
- Writing clear, descriptive reason fields
- Export data analysis

---

## ⚠️ Important Warnings

1. **Override operations bypass validation** - Use with caution
2. **Force delete is irreversible** - Always verify before deletion
3. **Bulk updates affect multiple orders** - Double-check selection
4. **Cost overrides affect financial reports** - Coordinate with accounting
5. **Password resets notify users** - Communicate with affected users

---

## 📞 Support & Escalation

For issues beyond SuperAdmin capabilities:
1. Database-level corruption - Contact system administrator
2. Multi-tenant data isolation issues - Contact development team
3. Authentication/authorization failures - Check NextAuth configuration
4. Audit trail investigation - Export relevant logs for review

---

*Last Updated: 2025-10-19*
*For technical details, see the [CLAUDE.md](../../../CLAUDE.md) project documentation.*
