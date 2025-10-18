# SuperAdmin Features Reference

Complete reference guide for all SuperAdmin portal features, organized by functional area.

---

## Table of Contents

1. [Dashboard & Overview](#dashboard--overview)
2. [Production Management](#production-management)
3. [User Management](#user-management)
4. [Materials Management](#materials-management)
5. [Billing Suite](#billing-suite)
6. [Data Export](#data-export)
7. [Coming Soon Features](#coming-soon-features)

---

## Dashboard & Overview

### System Metrics Dashboard

**Location:** `/superadmin/dashboard`
**Component:** [SuperAdminDashboardClient](../../../src/components/module/superadmin/SuperAdminDashboardClient.tsx)
**Server Action:** `getSystemMetrics()`

#### Displayed Metrics

| Metric | Description | Update Frequency |
|--------|-------------|------------------|
| Total Users | All user accounts in system | Real-time |
| Active Users | Users active in last 24 hours | Real-time |
| Total Customers | Customer count | Real-time |
| Customer Orders | Total order count | Real-time |
| Production Orders | Total production orders | Real-time |
| Total Materials | Material catalog size | Real-time |
| Total Products | Product catalog size | Real-time |
| Open Support Tickets | Pending support requests | Real-time |

#### Usage

```typescript
// Automatically called on page load
const metrics = await getSystemMetrics()

// Returns:
{
  totalUsers: number
  activeUsers: number
  totalCustomers: number
  customerOrders: number
  productionOrders: number
  totalMaterials: number
  totalProducts: number
  openTickets: number
}
```

---

## Production Management

### Overview Dashboard

**Location:** `/superadmin/production`
**Component:** [SuperadminProductionOrdersTable](../../../src/components/module/superadmin/production/)

#### Statistics Panel

Shows comprehensive production metrics:

```typescript
const stats = await getProductionOrderStatsSuperadmin()

// Returns:
{
  total: number
  byStatus: {
    PENDING: number
    IN_PROGRESS: number
    COMPLETED: number
    ON_HOLD: number
    CANCELLED: number
  }
  byPriority: {
    CRITICAL: number
    URGENT: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }
  overdue: number
  avgMaterialVariance: number
  totalCostVariance: number
}
```

**Visual Indicators:**
- 🔴 Red: Overdue orders or high negative variance
- 🟡 Yellow: At-risk orders or moderate variance
- 🟢 Green: On-track orders or positive variance

---

### Production Order Read Operations

#### Get All Orders

```typescript
const orders = await getAllProductionOrdersSuperadmin()
```

**Returns:** Array of production orders with full relationships:
- Product details (name, SKU, category)
- Customer order linkage
- Material BOM with costs
- Operations with work centers
- Quality checks
- Activity history

**No Restrictions:** Unlike regular admin, SuperAdmin sees ALL orders across all tenants.

#### Get Single Order

```typescript
const order = await getProductionOrderByIdSuperadmin(orderId)
```

**Returns:** Complete order object with all relationships loaded.

---

### Override Operations

All override operations require a `reason` parameter (minimum 10 characters) and create audit trail entries.

#### 1. Force Status Update

**Function:** `forceUpdateProductionOrderStatus(orderId, newStatus, reason)`

**Parameters:**
- `orderId`: string (UUID)
- `newStatus`: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
- `reason`: string (min 10 chars)

**Bypasses:**
- Workflow validation
- Status transition rules
- Prerequisite checks

**Use Cases:**
- Emergency completion of stuck orders
- Force cancel orders with blocking dependencies
- Resume held orders when issues resolved
- Correct erroneous status

**Example:**
```typescript
await forceUpdateProductionOrderStatus(
  'order-uuid-123',
  'COMPLETED',
  'Emergency completion per customer deadline - approved by production manager'
)
```

**Audit Trail:**
- Logged to `productionOrderHistoryLog`
- Records: previous status, new status, reason, timestamp, user

---

#### 2. Override Costs

**Function:** `overrideProductionOrderCosts(orderId, costs, reason)`

**Parameters:**
```typescript
{
  orderId: string
  costs: {
    plannedCost?: number
    actualCost?: number
    variance?: number
  }
  reason: string
}
```

**Directly Modifies:**
- `plannedCost`
- `actualCost`
- `costVariance`

**Use Cases:**
- Correct accounting errors
- Adjust for missed material costs
- Fix variance calculations
- Retroactive cost updates

**Example:**
```typescript
await overrideProductionOrderCosts(
  'order-uuid-123',
  {
    plannedCost: 5000,
    actualCost: 4800,
    variance: -200
  },
  'Correcting material cost per accounting review - invoice #5678'
)
```

**Financial Impact:**
- Updates profit/loss reports
- Affects variance analysis
- Changes margin calculations

**Coordination Required:**
- Accounting department
- Financial reporting team
- Management (for large adjustments)

---

#### 3. Override Quantity

**Function:** `overrideProductionOrderQuantity(orderId, newQuantity, reason, completedQuantity?)`

**Parameters:**
```typescript
{
  orderId: string
  newQuantity: number
  reason: string
  completedQuantity?: number
}
```

**Modifies:**
- `orderQuantity`
- `completedQuantity` (if provided)

**Use Cases:**
- Customer order changes
- Correct data entry errors
- Adjust for partial completions
- Scale production up/down

**Example:**
```typescript
await overrideProductionOrderQuantity(
  'order-uuid-123',
  500,
  'Customer increased order from 400 to 500 units - order amendment #12',
  450  // Optional: already completed 450
)
```

**Side Effects:**
- May require BOM recalculation
- Material reservations may need adjustment
- Cost calculations updated

---

#### 4. Override Dates

**Function:** `overrideProductionOrderDates(orderId, dates, reason)`

**Parameters:**
```typescript
{
  orderId: string
  dates: {
    startDate?: Date
    dueDate?: Date
    completedAt?: Date
  }
  reason: string
}
```

**Bypasses:**
- Date validation
- Schedule conflict detection
- Capacity checks

**Use Cases:**
- Correct scheduling errors
- Adjust for customer deadline changes
- Fix historical data
- Retroactive date updates

**Example:**
```typescript
await overrideProductionOrderDates(
  'order-uuid-123',
  {
    startDate: new Date('2025-01-15'),
    dueDate: new Date('2025-01-30'),
    completedAt: new Date('2025-01-28')
  },
  'Correcting dates per production log - order was actually completed early'
)
```

---

#### 5. Force Delete

**Function:** `forceDeleteProductionOrder(orderId, reason)`

**Parameters:**
- `orderId`: string (UUID)
- `reason`: string (min 10 chars, descriptive required)

**⚠️ WARNING: IRREVERSIBLE OPERATION**

**Deletes (Cascade):**
- Production order record
- Associated production BOM
- Material reservations (releases committed stock)
- Operations
- Quality checks
- Activity logs
- Historical records

**Creates Before Deletion:**
- Comprehensive audit log entry
- Order snapshot for recovery
- Deletion timestamp and reason

**Use Cases:**
- Remove duplicate orders (data corruption)
- Clean up test data (non-production only)
- Delete corrupted orders (last resort)

**Example:**
```typescript
await forceDeleteProductionOrder(
  'order-uuid-123',
  'Removing duplicate order created by system bug on 2025-01-15 - original order #456 is correct. Approved by CTO.'
)
```

**Best Practices:**
- Export order data before deletion
- Verify it's truly a duplicate/corrupted
- Get management approval
- Document in external system (ticket)
- Never delete for regular workflow

---

#### 6. Bulk Update

**Function:** `bulkUpdateProductionOrders(orderIds, updates, reason)`

**Parameters:**
```typescript
{
  orderIds: string[]  // Array of UUIDs
  updates: {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
    priority?: 'CRITICAL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  }
  reason: string
}
```

**Features:**
- Single transaction for all orders
- Single audit log entry
- Rollback on any failure

**Use Cases:**
- Mass status changes during system issues
- Emergency priority adjustments
- Bulk workflow corrections
- System-wide updates

**Example:**
```typescript
await bulkUpdateProductionOrders(
  ['order-1', 'order-2', 'order-3'],
  {
    status: 'IN_PROGRESS',
    priority: 'HIGH'
  },
  'Customer deadline moved up by 1 week - bulk priority increase for all orders in batch #45'
)
```

**Limits:**
- Recommended: 50 orders maximum
- Hard limit: 100 orders (configurable)
- For larger batches, contact dev team

---

### Material Override Operations

#### 1. Force Release Reservation

**Function:** `forceReleaseMaterialReservation(reservationId, reason)`

**Parameters:**
- `reservationId`: string (UUID)
- `reason`: string

**Actions:**
- Releases material reservation immediately
- Updates material `committedStock` (decreases)
- Updates material `availableStock` (increases)
- Creates activity log entry

**Use Cases:**
- Cancel production order materials
- Release blocked materials
- Correct reservation errors

**Example:**
```typescript
await forceReleaseMaterialReservation(
  'reservation-uuid-123',
  'Releasing materials for cancelled order #789 - customer cancelled order'
)
```

---

#### 2. Override Material Consumption

**Function:** `overrideMaterialConsumption(consumptionId, adjustments, reason)`

**Parameters:**
```typescript
{
  consumptionId: string
  adjustments: {
    actualQuantity?: number
    wasteQuantity?: number
    totalCost?: number
  }
  reason: string
}
```

**Modifies:**
- Consumption record in `ProductionMaterialConsumption`
- Does NOT update inventory directly (historical record)

**Use Cases:**
- Correct consumption reporting errors
- Adjust waste quantities
- Fix cost allocations

**Example:**
```typescript
await overrideMaterialConsumption(
  'consumption-uuid-123',
  {
    actualQuantity: 48,
    wasteQuantity: 2,
    totalCost: 1200
  },
  'Correcting consumption - worker reported 50 but actual waste was only 2 units'
)
```

---

#### 3. Override Reservation Quantity

**Function:** `overrideMaterialReservationQuantity(reservationId, newQuantity, reason)`

**Parameters:**
- `reservationId`: string (UUID)
- `newQuantity`: number
- `reason`: string

**Actions:**
- Updates reservation `quantityReserved`
- Automatically adjusts material `committedStock`
- Calculates differential and applies change

**Use Cases:**
- Production quantity changes
- Correct reservation errors
- Adjust for BOM changes

**Example:**
```typescript
await overrideMaterialReservationQuantity(
  'reservation-uuid-123',
  100,
  'Adjusting reservation from 80 to 100 per production order quantity increase'
)
```

---

### Export Operations

#### CSV Export

**Function:** `exportProductionOrdersCSV(filters?)`

**Parameters:**
```typescript
{
  status?: string
  priority?: string
  fromDate?: Date
  toDate?: Date
  search?: string
}
```

**Output Format:**
- 21 columns including:
  - Order details (number, product, quantity)
  - Dates (created, start, due, completed)
  - Status and priority
  - Costs (planned, actual, variance)
  - Customer information
  - Progress metrics

**Example:**
```typescript
const csvData = await exportProductionOrdersCSV({
  status: 'COMPLETED',
  fromDate: new Date('2025-01-01'),
  toDate: new Date('2025-01-31')
})
```

---

#### Excel Export

**Function:** `exportProductionOrdersExcel(filters?)`

**Parameters:** Same as CSV

**Output Format:**
- Same 21 columns as CSV
- Styled headers (bold, colored)
- Currency formatting for cost columns
- Colored progress indicators
- Auto-sized columns

**Example:**
```typescript
const excelFile = await exportProductionOrdersExcel({
  priority: 'HIGH'
})
// Returns base64-encoded Excel file
```

---

## User Management

### Global Users View

**Location:** `/superadmin/users`
**Component:** [SuperAdminUsersClient](../../../src/components/module/superadmin/superadmin-users-client.tsx)

#### Get All Users

**Function:** `getGlobalUsers()`

**Returns:** All users with:
- User profile details
- Role information
- Inspector linkage (if applicable)
- Active/inactive status

**No Restrictions:** Sees users across all tenants.

**Example:**
```typescript
const users = await getGlobalUsers()
// [
//   { id, email, name, role, profile: {...}, inspector: {...} },
//   ...
// ]
```

---

### Password Reset

**Function:** `updateUserPassword(userId, newPassword)`

**Parameters:**
- `userId`: string (UUID)
- `newPassword`: string (minimum 8 characters)

**Validation:**
- Password length >= 8 characters
- User must exist
- User must not be deleted/archived

**Security:**
- Password hashed using bcrypt
- Old password not verified (admin override)
- User notified (if email configured)

**Example:**
```typescript
await updateUserPassword(
  'user-uuid-123',
  'NewSecurePass123!'
)
```

**Best Practices:**
- Verify user identity before reset
- Use strong temporary passwords
- Communicate reset to user
- Log support ticket reference

---

## Materials Management

### Read Operations

#### Get All Materials

**Function:** `getMaterials()`

**Returns:** All active materials with:
- Material types
- Units of measure
- Supplier information
- Stock levels (current, committed, available)
- Cost per unit

#### Get Archived Materials

**Function:** `getArchivedMaterials()`

**Returns:** Materials marked as archived with archive reason and date.

---

### Material CRUD Operations

#### Update Material

**Function:** `updateMaterialForSuperAdmin(data)`

**Parameters:**
```typescript
{
  id: string
  name?: string
  sku?: string
  description?: string
  costPerUnit?: number
  currentStock?: number
  reorderLevel?: number
  materialTypeId?: string
  unitOfMeasureId?: string
}
```

**Example:**
```typescript
await updateMaterialForSuperAdmin({
  id: 'material-uuid-123',
  name: 'Updated Material Name',
  costPerUnit: 150,
  currentStock: 1000
})
```

---

#### Archive Material

**Function:** `archiveMaterialForSuperAdmin(id, reason?)`

**Parameters:**
- `id`: string (UUID)
- `reason`: string (optional)

**Actions:**
- Sets `archivedAt` timestamp
- Records `archivedReason`
- Material no longer appears in active lists
- Can be restored if needed

**Example:**
```typescript
await archiveMaterialForSuperAdmin(
  'material-uuid-123',
  'Discontinued by supplier - replaced by material #456'
)
```

---

### Material Type Management

#### List Material Types

**Function:** `getSuperAdminMaterialTypesList()`

**Returns:** All material types with usage count.

#### Create Material Type

**Function:** `createMaterialTypeForSuperAdmin(data)`

**Parameters:**
```typescript
{
  name: string
  description?: string
}
```

#### Update Material Type

**Function:** `updateMaterialTypeForSuperAdmin(id, data)`

#### Delete Material Type

**Function:** `deleteMaterialTypeForSuperAdmin(id)`

**Validation:**
- Checks for materials using this type
- Prevents deletion if in use
- Returns error with material count

---

### Unit of Measure Management

#### List Units of Measure

**Function:** `getSuperAdminUnitOfMeasureList()`

#### Create UOM

**Function:** `createUnitOfMeasureForSuperAdmin(data)`

**Parameters:**
```typescript
{
  name: string
  abbreviation: string
}
```

#### Update UOM

**Function:** `updateUnitOfMeasureForSuperAdmin(id, data)`

#### Delete UOM

**Function:** `deleteUnitOfMeasureForSuperAdmin(id)`

**Validation:**
- Checks for materials using this UOM
- Prevents deletion if in use

---

### Export Operations

#### CSV Export

**Function:** `exportSuperAdminMaterialsData(filters)`

**Filters:**
```typescript
{
  search?: string
  status?: 'active' | 'archived'
  typeId?: string
  supplierId?: string
  uomId?: string
}
```

**Output:** 10 columns including name, SKU, stock, cost, supplier, type, UOM.

#### Excel Export

**Function:** `exportSuperAdminMaterialsExcel(filters)`

**Features:**
- Formatted numbers
- Auto-sized columns
- Bold headers

---

## Billing Suite

### 4.1 Billing Statements

**Location:** `/superadmin/billing/billing-statements`

#### List Billing Statements

**Function:** `getAllBillingStatements(filters, page, pageSize)`

**Parameters:**
```typescript
{
  filters?: {
    status?: string
    customerId?: string
    fromDate?: Date
    toDate?: Date
  }
  page?: number
  pageSize?: number
}
```

**Returns:** Paginated billing statements with customer details.

---

#### Get Billing Statement

**Function:** `getBillingStatementById(id)`

**Returns:** Full statement with:
- Customer information
- Line items
- Payment history
- Linked sales invoice
- Linked delivery receipt

---

#### Create Billing Statement

**Function:** `createBillingStatement(data)`

**Parameters:**
```typescript
{
  customerOrderId?: string
  productionOrderId?: string
  totalAmount: number
  paidAmount?: number
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate?: Date
  notes?: string
}
```

---

#### Update Billing Statement

**Function:** `updateBillingStatement(id, data)`

#### Update Status

**Function:** `updateBillingStatementStatus(id, status)`

#### Delete

**Function:** `deleteBillingStatement(id)`

---

### 4.2 Sales Invoices

**Location:** `/superadmin/billing/sales-invoices`

#### Create Sales Invoice

**Function:** `createSalesInvoice(data)`

**Parameters:**
```typescript
{
  billingStatementId?: string
  customerOrderId?: string
  invoiceNumber: string
  issueDate: Date
  dueDate?: Date
  totalAmount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}
```

---

#### Generate from Customer Order

**Function:** `generateInvoiceFromCustomerOrder(customerOrderId)`

**Auto-generates:**
- Invoice number (auto-incremented)
- Line items from order lines
- Total amount calculation
- Issue date (current date)
- Due date (30 days default)

---

#### Generate from Production Order

**Function:** `generateInvoiceFromProductionOrder(productionOrderId)`

**Auto-generates:**
- Same as customer order
- Uses production order costs
- Links to production order

---

### 4.3 Delivery Receipts

**Location:** `/superadmin/billing/delivery-receipts`

#### Create Delivery Receipt

**Function:** `createDeliveryReceipt(data)`

**Parameters:**
```typescript
{
  billingStatementId?: string
  customerOrderId?: string
  deliveryDate: Date
  recipientName: string
  recipientSignature?: string
  notes?: string
  status: 'PENDING' | 'DELIVERED' | 'FAILED'
}
```

---

#### Create from Customer Order

**Function:** `createDeliveryReceiptFromCustomerOrder(customerOrderId, data)`

**Auto-links:**
- Customer information
- Billing statement (if exists)
- Delivery address

---

#### Confirm Delivery

**Function:** `confirmDelivery(id, signature?, photoEvidence?)`

**Actions:**
- Updates status to 'DELIVERED'
- Records signature and/or photo
- Updates delivery timestamp
- Triggers stock deduction (if configured)

---

#### Mark Failed

**Function:** `markDeliveryFailed(id, reason)`

**Actions:**
- Updates status to 'FAILED'
- Records failure reason
- Can reschedule delivery

---

#### Get Delivery Analytics

**Function:** `getDeliveryAnalytics()`

**Returns:**
```typescript
{
  totalDeliveries: number
  successRate: number
  avgDeliveryTime: number
  byStatus: {
    PENDING: number
    DELIVERED: number
    FAILED: number
  }
}
```

---

## Data Export

### Database Table Export

**Location:** `/superadmin/export-data`

#### Get Available Tables

**Function:** `getDatabaseTables()`

**Returns:** List of all database tables with:
- Table name
- Estimated row count
- Last updated timestamp

**Example:**
```typescript
const tables = await getDatabaseTables()
// [
//   { name: "User", rowCount: 150 },
//   { name: "Product", rowCount: 500 },
//   { name: "ProductionOrder", rowCount: 1250 },
//   ...
// ]
```

---

#### Export Table to Excel

**Function:** `exportTableToExcel(tableName)`

**Parameters:**
- `tableName`: string (validated against whitelist)

**Security:**
- Table name validation (regex)
- Table existence check
- SQL injection prevention
- Parameterized queries only

**Output:**
- Base64-encoded Excel file
- Automatic column detection
- All rows from table
- Auto-sized columns
- Filename: `{tableName}-export-{timestamp}.xlsx`

**Example:**
```typescript
const excelFile = await exportTableToExcel("User")
// Returns: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQABg..."
```

**Use Cases:**
- Emergency data backup
- Custom analysis
- Data migration
- Debugging production issues

---

## Coming Soon Features

These pages exist in navigation but have placeholder implementations:

### 1. Analytics (`/superadmin/analytics`)
**Planned Features:**
- System-wide performance metrics
- Production efficiency analysis
- Financial trend analysis
- User activity analytics
- Custom report builder

---

### 2. Audit Logs (`/superadmin/audit-logs`)
**Planned Features:**
- Comprehensive audit trail viewer
- Filter by user, date, action type
- Export audit logs
- Audit report generation
- Compliance reporting

---

### 3. System Health (`/superadmin/system-health`)
**Planned Features:**
- Server status monitoring
- Database performance metrics
- API response times
- Error rate tracking
- Resource utilization

---

### 4. Settings (`/superadmin/settings`)
**Planned Features:**
- System configuration
- Email templates
- Notification settings
- Backup configuration
- API key management

---

### 5. Organizations (`/superadmin/organizations`)
**Planned Features:**
- Multi-tenant management
- Organization creation and configuration
- Tenant isolation settings
- Resource allocation

---

### 6. Products (`/superadmin/products`)
**Planned Features:**
- Cross-tenant product catalog
- Global BOM management
- Product analytics

---

### 7. Billing Reports (in Billing submenu)
**Planned Features:**
- Revenue reports
- Payment tracking
- Aging reports
- Financial analytics

---

## Feature Comparison: SuperAdmin vs Admin

| Feature | Admin | SuperAdmin |
|---------|-------|-----------|
| Production Order View | Tenant-restricted | **ALL orders** |
| Force Status Update | ❌ No | ✅ Yes |
| Override Costs | ❌ No | ✅ Yes |
| Override Quantities | ❌ No | ✅ Yes |
| Force Delete | ❌ No | ✅ Yes |
| Bulk Update | ❌ No | ✅ Yes |
| Material Override | ❌ No | ✅ Yes |
| Password Reset | Own tenant | **ALL users** |
| Database Export | ❌ No | ✅ Yes |
| Cross-Tenant Billing | ❌ No | ✅ Yes |
| Audit Trail Override | ❌ No | ✅ View all |

---

## API Reference Summary

### Production Orders
- `getAllProductionOrdersSuperadmin()` - List all
- `getProductionOrderByIdSuperadmin(id)` - Get details
- `getProductionOrderStatsSuperadmin()` - Get statistics
- `forceUpdateProductionOrderStatus(id, status, reason)` - Force status
- `overrideProductionOrderCosts(id, costs, reason)` - Override costs
- `overrideProductionOrderQuantity(id, qty, reason, completed?)` - Override quantity
- `overrideProductionOrderDates(id, dates, reason)` - Override dates
- `forceDeleteProductionOrder(id, reason)` - Force delete
- `bulkUpdateProductionOrders(ids, updates, reason)` - Bulk update
- `exportProductionOrdersCSV(filters)` - CSV export
- `exportProductionOrdersExcel(filters)` - Excel export

### Materials
- `forceReleaseMaterialReservation(id, reason)` - Release reservation
- `overrideMaterialConsumption(id, adjustments, reason)` - Override consumption
- `overrideMaterialReservationQuantity(id, qty, reason)` - Override reservation qty

### Users
- `getGlobalUsers()` - List all users
- `updateUserPassword(id, password)` - Reset password

### Materials Management
- `updateMaterialForSuperAdmin(data)` - Update material
- `archiveMaterialForSuperAdmin(id, reason)` - Archive material
- `createMaterialTypeForSuperAdmin(data)` - Create type
- `updateMaterialTypeForSuperAdmin(id, data)` - Update type
- `deleteMaterialTypeForSuperAdmin(id)` - Delete type

### Billing
- `getAllBillingStatements(filters, page, size)` - List statements
- `getBillingStatementById(id)` - Get statement
- `createBillingStatement(data)` - Create statement
- `updateBillingStatementStatus(id, status)` - Update status
- `getAllSalesInvoices(filters, page, size)` - List invoices
- `generateInvoiceFromCustomerOrder(orderId)` - Generate invoice
- `getAllDeliveryReceipts(filters, page, size)` - List receipts
- `confirmDelivery(id, signature?, photo?)` - Confirm delivery
- `markDeliveryFailed(id, reason)` - Mark failed

### Data Export
- `getDatabaseTables()` - List tables
- `exportTableToExcel(tableName)` - Export table

---

*For detailed usage examples, see [QUICKSTART.md](./QUICKSTART.md)*
*For comprehensive documentation, see [README.md](./README.md)*

---

*Last Updated: 2025-10-18*
