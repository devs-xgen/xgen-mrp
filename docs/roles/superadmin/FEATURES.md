# SuperAdmin Features Reference

Complete reference guide for all SuperAdmin portal features, organized by functional area.

**Last Updated:** 2025-10-20
**Status Legend:** ✅ Complete | 🚧 In Progress | 📋 Planned | ❌ Not Started

---

## Table of Contents

1. [Role Overview & Comparison](#role-overview--comparison)
2. [Dashboard & Overview](#dashboard--overview)
3. [Production Management](#production-management) ✅
4. [User Management](#user-management) ✅
5. [Materials Management](#materials-management) ✅
6. [Customer Order Management](#customer-order-management) ✅
7. [Billing Suite](#billing-suite) ✅
8. [Data Export](#data-export) ✅
9. [Audit Logs](#audit-logs) ✅
10. [Coming Soon Features](#coming-soon-features)
11. [Feature Completion Matrix](#feature-completion-matrix)

---

## Role Overview & Comparison

### SuperAdmin vs Other Roles

The SuperAdmin role is designed for **system-wide control and emergency operations**. Unlike other roles, SuperAdmin has unrestricted access and override capabilities.

#### Key Differentiators

| Capability | Admin | Worker | Inspector | Delivery | SuperAdmin |
|------------|-------|--------|-----------|----------|------------|
| **Scope** | Single tenant | Assigned tasks | QC orders | Delivery routes | **ALL tenants** |
| **Override Powers** | None | None | QC decisions | Delivery status | **Everything** |
| **Audit Requirements** | Standard | Standard | QC reasons | Delivery notes | **Mandatory reasons (15+ chars)** |
| **Validation Bypass** | No | No | No | No | **Yes** |
| **Historical Data** | No backdating | No | No | No | **Can backdate** |
| **Force Operations** | No | No | No | No | **Yes** |
| **Cross-Tenant** | No | No | No | No | **Yes** |
| **Data Export** | Limited | No | No | No | **Full database** |

#### Technical Architecture Differences

**Admin Portal:**
- Session scoped to tenant
- Data filtered by organization
- Workflow validation enforced
- Standard CRUD operations
- Cannot bypass business rules

**SuperAdmin Portal:**
- Session has global scope
- No tenant filtering (sees all data)
- Can skip all validation
- Override-focused operations
- Comprehensive audit logging
- Emergency recovery capabilities

**Database Access Pattern:**
```typescript
// Admin Query (Filtered)
const orders = await prisma.productionOrder.findMany({
  where: { tenantId: session.user.tenantId } // Scoped
})

// SuperAdmin Query (Unrestricted)
const orders = await prisma.productionOrder.findMany({
  // No tenant filter - sees everything
})
```

#### Use Cases by Role

**When to Use Admin:**
- Day-to-day operations
- Normal production planning
- Standard order management
- Regular user management

**When to Use SuperAdmin:**
- System-wide emergencies
- Data correction across tenants
- Historical data imports
- Bypassing validation for special cases
- Bulk operations affecting multiple tenants
- Production recovery after system issues
- Force-releasing blocked resources

### Security Model

**SuperAdmin Security Principles:**
1. **Least Privilege Override** - SuperAdmin should only be used when necessary
2. **Mandatory Audit Trail** - All operations require reason (min 15 characters)
3. **No Password Sharing** - Each SuperAdmin user has unique credentials
4. **Session Monitoring** - All SuperAdmin sessions logged
5. **Two-Person Rule** - Critical operations should be verified by management
6. **Time-Limited Access** - SuperAdmin access should be granted temporarily when needed

**Audit Trail Requirements:**
- Every override operation creates audit log
- Logs are immutable (cannot be deleted)
- Includes: user, timestamp, action, reason, before/after state
- Stored in both `ActivityLog` and specific history tables
- Searchable and exportable for compliance

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

## Customer Order Management

**Status:** ✅ Complete
**Location:** `/superadmin/customer-orders`

### Overview

Comprehensive customer order management across all tenants with bulk operations, production linking, and SuperAdmin override capabilities.

### Key Features

- **Cross-Tenant View:** See all customer orders across all tenants
- **Advanced Filtering:** Filter by customer, tenant, status, date range, amount, product
- **Bulk Status Updates:** Update multiple orders at once with validation
- **Production Integration:** Auto-create and link production orders
- **Creation Wizard:** 4-step wizard for creating orders with overrides
- **Audit Trail:** Complete tracking of all order operations

### Read Operations

#### Get All Customer Orders

**Function:** `getAllCustomerOrdersSuperadmin(filters)`

**Parameters:**
```typescript
{
  filters?: {
    search?: string              // Search order number, customer name, notes
    customerId?: string          // Filter by customer
    tenantId?: string           // Filter by tenant
    status?: Status[]           // Filter by order status
    dateFrom?: Date             // Order date range start
    dateTo?: Date               // Order date range end
    minAmount?: number          // Min total amount
    maxAmount?: number          // Max total amount
    productId?: string          // Filter by product
    productVariantId?: string   // Filter by variant
  }
}
```

**Returns:** Array of customer orders with:
- Customer details (name, email, phone, tenant)
- Tenant information
- Order lines with products/variants
- Linked production orders
- Billing statements
- Status and dates

**Features:**
- Real-time data (no caching)
- Decimal serialization
- Comprehensive relationships
- Global search across fields

#### Get Customer Order Statistics

**Function:** `getCustomerOrderStatsSuperadmin()`

**Returns:**
```typescript
{
  total: number                        // Total orders
  byStatus: Record<string, number>     // Count per status
  topTenants: Array<{                  // Top 5 tenants by orders
    tenantId: string
    count: number
  }>
  totalRevenue: number                 // Sum of all order amounts
}
```

### Create Operations

#### Create Customer Order with Wizard

**Location:** `/superadmin/customer-orders/create`

**4-Step Creation Process:**

**Step 1: Customer Selection**
- Select tenant (required)
- Select customer from tenant (required)
- Auto-filters customers by selected tenant

**Step 2: Order Lines**
- Add products with quantities
- Select variants (optional)
- Override unit pricing
- Visual line item summary with totals

**Step 3: Pricing & Dates**
- Set order date (defaults to today)
- Set delivery date (optional)
- Add order notes
- SuperAdmin Overrides:
  - Skip date validation
  - Skip stock check
  - Confirm custom pricing

**Step 4: Review & Submit**
- Review order summary
- Production Options:
  - Auto-create production orders for all lines
  - Auto-approve order (skip PENDING status)
- Enter audit reason (min 15 characters)

**Function:** `createCustomerOrderSuperadmin(input)`

**Parameters:**
```typescript
{
  customerId: string
  tenantId: string
  orderDate?: string
  deliveryDate?: string
  notes?: string
  orderLines: Array<{
    productId: string
    productVariantId?: string
    quantity: number
    unitPrice: number
  }>
  overrides?: {
    skipDateValidation?: boolean
    skipStockCheck?: boolean
    customPricing?: boolean
  }
  options?: {
    createProductionOrders?: boolean
    autoApprove?: boolean
  }
  reason: string  // Min 15 characters
}
```

**Returns:**
```typescript
{
  success: true
  orderId: string
  orderNumber: string                  // Auto-generated (CO-YYYY-####)
  productionOrderIds?: string[]        // If createProductionOrders enabled
  warnings?: string[]                  // Any validation warnings
} | {
  success: false
  error: string
}
```

**Business Logic:**
- Auto-generates order number (CO-YYYY-####)
- Validates customer and tenant exist
- Calculates total amount from order lines
- Creates order lines atomically
- Optionally creates linked production orders
- Sets production priority based on delivery urgency
- Creates comprehensive audit log

### Bulk Operations

#### Bulk Update Order Status

**Function:** `bulkUpdateCustomerOrderStatus(orderIds, newStatus, reason)`

**Parameters:**
```typescript
{
  orderIds: string[]      // Max 100 orders
  newStatus: Status       // Target status
  reason: string          // Min 15 characters
}
```

**Validation Rules:**
- Cannot cancel orders with active/completed production
- Cannot update more than 100 orders at once
- Validates state transitions per order
- Skips orders with blocking constraints

**Process:**
1. Fetch all selected orders with production links
2. Validate each order for state transition
3. Filter out orders with constraints
4. Update valid orders in transaction
5. If cancelling: auto-cancel pending production orders
6. Create single audit log with all IDs
7. Return count and warnings

**Returns:**
```typescript
{
  success: true
  count: number           // Successfully updated
  warnings?: string[]     // Skipped orders with reasons
} | {
  success: false
  error: string
}
```

### Production Integration

#### Create Production Orders from Customer Order

**Function:** `createProductionOrdersFromCustomerOrder(customerOrderId, orderLineIds?, reason?)`

**Parameters:**
```typescript
{
  customerOrderId: string
  orderLineIds?: string[]     // Optional: specific lines only
  reason?: string             // Min 15 chars if provided
}
```

**Process:**
1. Get customer order with order lines
2. For each order line:
   - Check if production order already exists
   - Skip if exists (no duplicates)
   - Get product lead time
   - Calculate due date (delivery date - lead time)
   - Calculate priority (URGENT if <3 days, HIGH if <7 days, else MEDIUM)
   - Create production order linked to customer order
3. Create audit log
4. Return production order IDs

**Returns:**
```typescript
{
  success: true
  productionOrderIds: string[]
  count: number
} | {
  success: false
  error: string
}
```

#### Link Production Order

**Function:** `linkProductionOrderToCustomerOrder(customerOrderId, productionOrderId, reason)`

**Use Case:** Link existing production order to customer order

**Validation:**
- Both customer order and production order must exist
- Reason required (min 15 characters)

**Audit:** Logged as `SUPERADMIN_PRODUCTION_ORDER_LINKED`

#### Unlink Production Order

**Function:** `unlinkProductionOrderFromCustomerOrder(productionOrderId, reason)`

**Use Case:** Remove link (production order remains in system)

**Validation:**
- Production order must be linked to a customer order
- Reason required (min 15 characters)

**Audit:** Logged as `SUPERADMIN_PRODUCTION_ORDER_UNLINKED`

### Order Detail Page

**Location:** `/superadmin/customer-orders/[id]`

**Features:**
- **Order Header:** Status, total amount, production count, dates
- **Customer Info:** Name, email, phone, address
- **Order Details:** Tenant, dates, notes
- **Order Lines Table:** Products, quantities, pricing, status
- **Production Linking Panel:**
  - View all linked production orders
  - Create production orders for order lines
  - Unlink production orders with audit reason
  - Visual status badges and progress
- **Billing Statements:** Linked billing documents

**Production Linking Panel Features:**
- Table view of all linked production orders
- Shows: Product, Quantity, Completed, Due Date, Priority, Status
- Quick actions: View PO, Unlink
- Create production orders button with dialog
- Audit reason required for all operations

### Delete Operations

#### Delete Customer Order

**Function:** `deleteCustomerOrderSuperadmin(orderId, reason)`

**Validation:**
- Cannot delete orders with completed production
- Cannot delete orders with billing statements
- Cascades to order lines
- Cancels pending production orders
- Reason required (min 15 characters)

**Audit:** Logged as `SUPERADMIN_CUSTOMER_ORDER_DELETED` with full metadata

### Audit Types

All customer order operations create audit logs:

- `SUPERADMIN_CUSTOMER_ORDER_CREATED`
- `SUPERADMIN_CUSTOMER_ORDER_UPDATED`
- `SUPERADMIN_CUSTOMER_ORDER_DELETED`
- `SUPERADMIN_BULK_ORDER_STATUS_UPDATE`
- `SUPERADMIN_PRODUCTION_ORDER_LINKED`
- `SUPERADMIN_PRODUCTION_ORDER_UNLINKED`
- `SUPERADMIN_PRODUCTION_ORDER_CREATED_FROM_CUSTOMER_ORDER`

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

## Audit Logs

**Status:** ✅ COMPLETED (2025-10-19)
**Location:** `/superadmin/audit-logs`
**Components:** [AuditLogsClient](../../../src/components/module/superadmin/audit-logs/)

### Overview

Comprehensive audit trail viewer with two specialized tabs:
1. **Activity Logs** - System-wide activities
2. **Production History** - Production order changes

### Server Actions

#### Get Activity Logs
```typescript
const logs = await getActivityLogs(filters, page, pageSize)

// Filters:
{
  type?: string          // Activity type filter
  userId?: string        // Filter by user
  fromDate?: string      // Start date
  toDate?: string        // End date
  search?: string        // Search in details
}

// Returns:
{
  logs: Array<{
    id: string
    type: string
    userId: string
    user: { email, profile }
    details: JSON
    timestamp: Date
  }>
  totalCount: number
  totalPages: number
}
```

#### Get Production History
```typescript
const history = await getProductionHistoryLogs(filters, page, pageSize)

// Filters:
{
  productionOrderId?: string
  changeType?: string
  userId?: string
  fromDate?: string
  toDate?: string
}

// Returns production-specific change logs
```

#### Get Audit Statistics
```typescript
const stats = await getAuditLogStats()

// Returns:
{
  totalActivityLogs: number
  totalProductionLogs: number
  activityToday: number
  productionChangesToday: number
  topActivityTypes: Array<{ type, count }>
  topUsers: Array<{ userId, count }>
}
```

### Features

**Activity Logs Tab:**
- ✅ Real-time activity stream
- ✅ User filter dropdown
- ✅ Activity type filter
- ✅ Date range filter with presets (Today, Last 7 Days, Last 30 Days)
- ✅ Search in details (JSON)
- ✅ Copy log ID to clipboard
- ✅ Export to CSV
- ✅ Pagination (50 per page)
- ✅ Loading skeletons

**Production History Tab:**
- ✅ Production order filter
- ✅ Change type filter (Status, Cost, Quantity, Dates, etc.)
- ✅ Before/After value display
- ✅ User attribution
- ✅ Date range filtering
- ✅ Export to CSV
- ✅ Pagination

**Export Formats:**
- CSV with all fields
- Includes JSON details in readable format
- Timestamps in ISO format
- User information included

### Activity Types Tracked

**SuperAdmin Operations:**
- `SUPERADMIN_PRODUCTION_ORDER_CREATED` - New production order with overrides
- `SUPERADMIN_STATUS_OVERRIDE` - Force status update
- `SUPERADMIN_COST_OVERRIDE` - Cost override
- `SUPERADMIN_QUANTITY_OVERRIDE` - Quantity override
- `SUPERADMIN_DATE_OVERRIDE` - Date override
- `SUPERADMIN_FORCE_DELETE` - Force delete operation
- `SUPERADMIN_BULK_UPDATE` - Bulk status/priority update
- `SUPERADMIN_BULK_QUANTITY_UPDATE` - Bulk quantity update
- `SUPERADMIN_BULK_COST_UPDATE` - Bulk cost update
- `SUPERADMIN_BULK_DATE_UPDATE` - Bulk date update

**General Operations:**
- `PRODUCTION_ORDER_CREATED` - Standard creation
- `PRODUCTION_ORDER_UPDATED` - Standard update
- `USER_PASSWORD_RESET` - Password reset
- `MATERIAL_RESERVATION_RELEASED` - Material release
- And many more...

---

## Coming Soon Features

These pages exist in navigation but have placeholder implementations:

### 1. Analytics (`/superadmin/analytics`)
**Status:** ❌ NOT STARTED
**Priority:** Medium
**Planned Features:**
- System-wide performance metrics
- Production efficiency analysis
- Financial trend analysis
- User activity analytics
- Custom report builder

---

### 3. System Health (`/superadmin/system-health`)
**Status:** ✅ COMPLETE
**Features Implemented:**
- Server status monitoring
- Database performance metrics
- API response times
- Error rate tracking
- Resource utilization
- Alert rules management
- Error logging and resolution

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
**Status:** ✅ COMPLETE
**Features Implemented:**
- Organization CRUD operations
- Organization creation with contact and location details
- Organization settings management (operating hours, defaults, locale, branding)
- Resource limits configuration (max users, orders, storage, API rate limits)
- Organization status management (Active, Trial, Suspended, Archived)
- Archive/reactivate with audit trail
- Organization statistics dashboard

---

### 6. Products (`/superadmin/products`)
**Planned Features:**
- Cross-tenant product catalog
- Global BOM management
- Product analytics

---

### 7. Billing Reports (in Billing submenu)
**Status:** ❌ NOT STARTED
**Priority:** Low
**Planned Features:**
- Revenue reports
- Payment tracking
- Aging reports
- Financial analytics

---

## Feature Completion Matrix

### Production Management
| Feature | Status | Location | Server Action | UI Component |
|---------|--------|----------|---------------|--------------|
| View All Orders | ✅ Complete | `/superadmin/production` | `getAllProductionOrdersSuperadmin()` | SuperadminProductionOrdersTable |
| View Order Details | ✅ Complete | `/superadmin/production/[id]` | `getProductionOrderByIdSuperadmin()` | SuperadminProductionOrderDetails |
| Create Order (Standard) | ✅ Complete | `/superadmin/production/create` | `createProductionOrderSuperadmin()` | SuperadminProductionCreateClient |
| Create with Overrides | ✅ Complete | Same as above | Same - with override params | 5-step wizard |
| Force Status Update | ✅ Complete | Order detail page | `forceUpdateProductionOrderStatus()` | Status update dialog |
| Override Costs | ✅ Complete | Order detail page | `overrideProductionOrderCosts()` | Cost override dialog |
| Override Quantity | ✅ Complete | Order detail page | `overrideProductionOrderQuantity()` | Quantity dialog |
| Override Dates | ✅ Complete | Order detail page | `overrideProductionOrderDates()` | Dates dialog |
| Force Delete | ✅ Complete | Order detail page | `forceDeleteProductionOrder()` | Delete confirmation |
| Bulk Status/Priority | ✅ Complete | Production list | `bulkUpdateProductionOrders()` | Bulk update dialog |
| Bulk Quantity | ✅ Complete | Production list | `bulkUpdateProductionOrderQuantities()` | Bulk update dialog (Quantity tab) |
| Bulk Costs | ✅ Complete | Production list | `bulkUpdateProductionOrderCosts()` | Bulk update dialog (Costs tab) |
| Bulk Dates | ✅ Complete | Production list | `bulkUpdateProductionOrderDates()` | Bulk update dialog (Dates tab) |
| Production Statistics | ✅ Complete | Production list | `getProductionOrderStatsSuperadmin()` | Statistics cards |
| CSV Export | ✅ Complete | Production list | `exportProductionOrdersCSV()` | Export button |
| Excel Export | ✅ Complete | Production list | `exportProductionOrdersExcel()` | Export button |

### Material Management
| Feature | Status | Location | Server Action | UI Component |
|---------|--------|----------|---------------|--------------|
| Force Release Reservation | ✅ Complete | Material detail | `forceReleaseMaterialReservation()` | Release dialog |
| Override Consumption | ✅ Complete | Consumption detail | `overrideMaterialConsumption()` | Override dialog |
| Override Reservation Qty | ✅ Complete | Reservation detail | `overrideMaterialReservationQuantity()` | Quantity dialog |
| Update Material | ✅ Complete | Material edit | `updateMaterialForSuperAdmin()` | Edit form |
| Archive Material | ✅ Complete | Material detail | `archiveMaterialForSuperAdmin()` | Archive dialog |
| Material Types CRUD | ✅ Complete | Settings | `create/update/deleteMaterialTypeForSuperAdmin()` | Type management |
| UOM CRUD | ✅ Complete | Settings | `create/update/deleteUnitOfMeasureForSuperAdmin()` | UOM management |
| Material Export (CSV) | ✅ Complete | Materials list | `exportSuperAdminMaterialsData()` | Export button |
| Material Export (Excel) | ✅ Complete | Materials list | `exportSuperAdminMaterialsExcel()` | Export button |
| Bulk Material Release | 📋 Planned (Priority 1.3) | TBD | TBD | TBD |

### User Management
| Feature | Status | Location | Server Action | UI Component |
|---------|--------|----------|---------------|--------------|
| View All Users | ✅ Complete | `/superadmin/users` | `getGlobalUsers()` | SuperAdminUsersClient |
| Reset Password | ✅ Complete | User detail | `updateUserPassword()` | Password reset dialog |
| Create User | ❌ Not Started | `/superadmin/users/create` | TBD | TBD |
| Edit User | ❌ Not Started | `/superadmin/users/[id]/edit` | TBD | TBD |
| Deactivate User | ❌ Not Started | User detail | TBD | TBD |
| User Activity Logs | ✅ Complete | Audit logs (filter by user) | `getActivityLogs()` | Activity logs tab |

### Billing Suite
| Feature | Status | Location | Server Action | UI Component |
|---------|--------|----------|---------------|--------------|
| View Billing Statements | ✅ Complete | `/superadmin/billing/billing-statements` | `getAllBillingStatements()` | Billing statements table |
| Create Billing Statement | ✅ Complete | Statements create | `createBillingStatement()` | Create form |
| Update Statement | ✅ Complete | Statement detail | `updateBillingStatement()` | Edit form |
| Update Status | ✅ Complete | Statement detail | `updateBillingStatementStatus()` | Status dropdown |
| Delete Statement | ✅ Complete | Statement detail | `deleteBillingStatement()` | Delete confirmation |
| View Sales Invoices | ✅ Complete | `/superadmin/billing/sales-invoices` | `getAllSalesInvoices()` | Invoices table |
| Generate from Order | ✅ Complete | Invoice create | `generateInvoiceFromCustomerOrder()` | Generate dialog |
| View Delivery Receipts | ✅ Complete | `/superadmin/billing/delivery-receipts` | `getAllDeliveryReceipts()` | Receipts table |
| Confirm Delivery | ✅ Complete | Receipt detail | `confirmDelivery()` | Confirmation form |
| Mark Failed | ✅ Complete | Receipt detail | `markDeliveryFailed()` | Failure form |
| Delivery Analytics | ✅ Complete | Receipts page | `getDeliveryAnalytics()` | Analytics cards |

### Data Export & Audit
| Feature | Status | Location | Server Action | UI Component |
|---------|--------|----------|---------------|--------------|
| Database Table List | ✅ Complete | `/superadmin/export-data` | `getDatabaseTables()` | Table list |
| Export Table to Excel | ✅ Complete | Export page | `exportTableToExcel()` | Export button |
| Activity Logs Viewer | ✅ Complete | `/superadmin/audit-logs` | `getActivityLogs()` | Activity logs tab |
| Production History | ✅ Complete | Audit logs | `getProductionHistoryLogs()` | Production history tab |
| Audit Statistics | ✅ Complete | Audit logs | `getAuditLogStats()` | Statistics dashboard |
| Export Activity Logs | ✅ Complete | Audit logs | `exportActivityLogsCSV()` | Export button |
| Export Production History | ✅ Complete | Audit logs | `exportProductionHistoryCSV()` | Export button |
| User Filter | ✅ Complete | Audit logs | Filter param | Dropdown |
| Date Range Filter | ✅ Complete | Audit logs | Filter params | Date pickers |
| Activity Type Filter | ✅ Complete | Audit logs | Filter param | Dropdown |

### Dashboard & Analytics
| Feature | Status | Location | Server Action | UI Component |
|---------|--------|----------|---------------|--------------|
| System Metrics Dashboard | ✅ Complete | `/superadmin/dashboard` | `getSystemMetrics()` | SuperAdminDashboardClient |
| Production Analytics | ✅ Complete | `/superadmin/analytics/production` | `getProductionAnalytics()` | ProductionAnalyticsClient |
| KPI Metrics Dashboard | ✅ Complete | Production Analytics | Included in analytics | KPICards |
| Volume & Trend Charts | ✅ Complete | Production Analytics | Included in analytics | ProductionVolumeChart |
| Work Center Efficiency | ✅ Complete | Production Analytics | Included in analytics | EfficiencyMetrics |
| Cost Analysis Charts | ✅ Complete | Production Analytics | Included in analytics | CostAnalyticsChart |
| Tenant Comparison | ✅ Complete | Production Analytics | Included in analytics | TenantComparisonTable |
| Financial Analytics | ✅ Complete | `/superadmin/analytics/financial` | `getFinancialAnalytics()` | FinancialAnalyticsClient |
| Revenue Analytics | ✅ Complete | Financial Analytics | Included in analytics | RevenueAnalyticsComponent |
| Profitability Analysis | ✅ Complete | Financial Analytics | Included in analytics | ProfitabilityAnalyticsComponent |
| Billing & AR Tracking | ✅ Complete | Financial Analytics | Included in analytics | BillingAnalyticsComponent |
| Cash Flow Forecast | ✅ Complete | Financial Analytics | Included in analytics | CashFlowForecastComponent |
| Financial KPI Cards | ✅ Complete | Financial Analytics | Included in analytics | FinancialKPICards |
| User Analytics | ✅ Complete | `/superadmin/analytics/users` | `getUserAnalytics()` | UserAnalyticsClient |
| User Activity Tracking | ✅ Complete | User Analytics | Included in analytics | UserActivityAnalytics |
| Inactive Accounts | ✅ Complete | User Analytics | Included in analytics | InactiveAccountsTable |
| Worker Performance | ✅ Complete | User Analytics | Included in analytics | PerformanceMetrics |
| Inspector Performance | ✅ Complete | User Analytics | Included in analytics | PerformanceMetrics |
| User Analytics KPI Cards | ✅ Complete | User Analytics | Included in analytics | UserAnalyticsKPICards |
| Custom Report Builder | ❌ Not Started | Analytics page | TBD | TBD |

### System Management
| Feature | Status | Location | Server Action | UI Component |
|---------|--------|----------|---------------|--------------|
| System Health Monitor | ✅ Complete | `/superadmin/system-health` | `getSystemHealth()` | SystemHealthClient |
| Performance Metrics | ✅ Complete | System health | `getPerformanceMetrics()` | PerformanceCharts |
| Error Logging | ✅ Complete | System health | `getSystemErrors()` | ErrorLog |
| Alert Rules | ✅ Complete | System health | `getAlertRules()` | AlertRulesManager |
| System Settings | ❌ Not Started | `/superadmin/settings` | TBD | TBD |
| Email Templates | ❌ Not Started | Settings | TBD | TBD |
| Notification Config | ❌ Not Started | Settings | TBD | TBD |
| Organizations Management | ✅ Complete | `/superadmin/organizations` | `getAllOrganizations()`, `createOrganization()`, etc. | OrganizationsClient |

### Completion Statistics

**Overall Progress:** 68/82 features (83% complete)

**By Category:**
- Production Management: 16/16 (100%) ✅
- Material Management: 9/10 (90%) ✅
- User Management: 3/6 (50%) 🚧
- Billing Suite: 11/11 (100%) ✅
- Data Export & Audit: 10/10 (100%) ✅
- Dashboard & Analytics: 19/22 (86%) 🚧
- System Management: 5/9 (56%) 🚧

**Priority Breakdown:**
- **Priority 1 (High Impact, Quick Wins):** 2/3 complete (67%)
  - ✅ 1.1 Bulk Operations UI Enhancement
  - ✅ 1.2 Production Order Creation (SuperAdmin)
  - 📋 1.3 Material Reservation Bulk Release
- **Priority 2 (Operational):** 4/4 complete (100%) ✅
  - ✅ 2.1 Customer Order Management
  - ✅ 2.2 Product Management
  - ✅ 2.3 User Management Enhancement
  - ✅ 2.4 Supplier & Purchase Order Management
- **Priority 3 (Analytics):** 4/4 complete (100%) ✅
  - ✅ 3.1 Production Analytics Dashboard
  - ✅ 3.2 Financial Analytics Dashboard
  - ✅ 3.3 User Activity & Performance Analytics
  - ✅ 3.4 Report Builder
- **Priority 4 (Advanced):** 3/3 complete (100%) ✅
  - ✅ 4.1 System Health Monitoring
  - ✅ 4.2 Audit Reports
  - ✅ 4.3 Tenant/Org Management

---

## Feature Comparison: SuperAdmin vs Admin

| Feature | Admin | SuperAdmin |
|---------|-------|-----------|
| **Scope & Access** |||
| Production Order View | Tenant-restricted | **ALL orders (cross-tenant)** ✅ |
| User Management | Own tenant only | **ALL users (global)** ✅ |
| Material Management | Tenant-scoped | **Cross-tenant access** ✅ |
| Billing Access | Own tenant | **Cross-tenant billing** ✅ |
| Database Export | ❌ No | **Full database access** ✅ |
| Audit Trail Access | Own actions only | **View all activities** ✅ |
| **Production Operations** |||
| Production Order Creation | Standard workflow | **With override capabilities** ✅ (NEW) |
| Backdated Orders | ❌ Blocked | **Allowed with audit reason** ✅ (NEW) |
| Force Status Update | ❌ No | **Yes (bypass workflow)** ✅ |
| Override Costs | ❌ No | **Yes (planned/actual/variance)** ✅ |
| Override Quantities | ❌ No | **Yes (with BOM recalc)** ✅ |
| Override Dates | ❌ No | **Yes (start/due/completed)** ✅ |
| Force Delete Order | ❌ No | **Yes (with full audit)** ✅ |
| **Bulk Operations** |||
| Bulk Status/Priority | ❌ No | **Yes (unlimited orders)** ✅ |
| Bulk Quantity Update | ❌ No | **Yes** ✅ (NEW) |
| Bulk Cost Update | ❌ No | **Yes** ✅ (NEW) |
| Bulk Date Update | ❌ No | **Yes** ✅ (NEW) |
| **Material Operations** |||
| Force Release Reservation | ❌ No | **Yes (immediate release)** ✅ |
| Override Consumption | ❌ No | **Yes (adjust waste/cost)** ✅ |
| Override Reservation Qty | ❌ No | **Yes (auto-adjust stock)** ✅ |
| **User Management** |||
| Password Reset | Own tenant | **ANY user (global)** ✅ |
| User Creation | Tenant-scoped | **Cross-tenant** ❌ (Planned) |
| User Deactivation | Limited | **Global control** ❌ (Planned) |
| **Audit & Compliance** |||
| Audit Reason Requirement | Optional | **Mandatory (15+ chars)** ✅ |
| Activity Logs | Own actions | **All system activities** ✅ |
| Production History | Limited | **Complete changelog** ✅ |
| Export Audit Logs | ❌ No | **CSV export** ✅ |
| **Advanced Features** |||
| Custom Cost Assignment | ❌ No | **At order creation** ✅ (NEW) |
| Skip Material Check | ❌ No | **Yes (emergency mode)** ✅ (NEW) |
| Force Material Allocation | ❌ No | **Despite insufficient stock** ✅ (NEW) |
| Historical Data Import | ❌ No | **Via backdating** ✅ (NEW) |

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

*Last Updated: 2025-10-19*
