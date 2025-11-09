# Extended Documentation: Detailed User Flows and Technical Implementation

## CUSTOMER ORDER DETAILED FLOWS

### Customer Order Create Flow - Step by Step

#### Page: `/admin/customer-orders-v2/create`
**File**: `src/app/admin/(protected)/customer-orders-v2/create/page.tsx`

**Server Preparation**:
```typescript
// Fetch customers and products with variants
const [customers, products] = await Promise.all([
  getAllCustomers(),
  getProductsWithVariantsForOrders(),
]);

// Serialize Prisma Decimals for client compatibility
const serializableCustomers = customers.map(customer => ({
  ...customer,
  creditLimit: customer.creditLimit?.toString() ?? null,
}));
```

**Multi-Step Form Component**:
**File**: `src/components/module/admin/customer-order-ver/CustomerOrderCreateV2Client.tsx`

**Step 1 - Customer Selection**:
- Searchable dropdown with customer names
- Displays customer code, contact info, credit limit
- Validates customer exists before proceeding

**Step 2 - Product Line Items**:
- Dynamic table with add/remove rows
- Each row has:
  - Product selector (cascading to variants)
  - Quantity input with validation
  - Unit price (pre-filled from product, editable)
  - Line total calculation
- Real-time order total at bottom
- Must have at least 1 line item

**Step 3 - Order Details**:
- Order date (defaults to today)
- Required date (must be future)
- Payment terms dropdown
- Shipping address selection
- Notes textarea
- Order review summary

**Server Action - createCustomerOrder**:
**File**: `src/lib/actions/customer-order.ts` (lines 864-1100)

```typescript
export async function createCustomerOrder(data: CustomerOrderInput) {
  // 1. Validate session and permissions
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  // 2. Generate sequential order number
  const lastOrder = await prisma.customerOrder.findFirst({
    orderBy: { orderNumber: 'desc' }
  });
  const orderNumber = generateNextOrderNumber(lastOrder?.orderNumber);

  // 3. Create order and lines in transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.customerOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        orderDate: data.orderDate,
        requiredDate: data.requiredDate,
        totalAmount: data.totalAmount,
        paymentTerms: data.paymentTerms,
        status: 'PENDING',
        createdById: session.user.id,
      }
    });

    await tx.orderLine.createMany({
      data: data.lineItems.map(item => ({
        customerOrderId: newOrder.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        fulfillmentType: 'PENDING_ANALYSIS',
        fulfillmentStatus: 'PENDING',
      }))
    });

    return newOrder;
  });

  // 4. Revalidate cache
  revalidatePath('/admin/customer-orders-v2');
  
  return { success: true, orderId: order.id };
}
```

### Customer Order Analysis Flow

#### Page: `/admin/customer-orders-v2/[id]/analyze`
**File**: `src/app/admin/(protected)/customer-orders-v2/[id]/analyze/page.tsx`

**Server Action - analyzeCustomerOrderStock**:
**File**: `src/lib/actions/order-analysis.ts`

**Analysis Process**:
1. Fetch order with all line items and product inventory
2. For each line item:
   - Check available stock for product/variant
   - If stock sufficient → Mark as "CAN_FULFILL_IMMEDIATELY"
   - If partial stock → Mark as "MIXED" (needs hybrid fulfillment)
   - If no stock → Mark as "REQUIRES_PRODUCTION"
   - For production requirements, check BOM materials
   - Identify material shortages

3. Return comprehensive analysis object:
```typescript
interface OrderAnalysis {
  orderNumber: string;
  lineAnalyses: Array<{
    orderLineId: string;
    productName: string;
    variantName?: string;
    requiredQuantity: number;
    availableStock: number;
    shortfall: number;
    overallStatus: 'CAN_FULFILL_IMMEDIATELY' | 'MIXED' | 'REQUIRES_PRODUCTION' | 'MATERIAL_SHORTAGE';
    materialShortages: Array<{
      materialName: string;
      needed: number;
      available: number;
      shortage: number;
    }>;
  }>;
}
```

**Client Component - CustomerOrderAnalysisClient**:
Shows interactive table where admin can:
- Select fulfillment strategy per line (STOCK / PRODUCTION / HYBRID)
- Input quantities for hybrid approach
- Set priority levels (URGENT / HIGH / NORMAL / LOW)
- Add production notes
- Click "Create Production Orders" button

**Production Creation from Analysis**:
**Server Action**: `createProductionOrdersForItems(selections)`

For each selected line requiring production:
1. Create `ProductionOrder` record
2. Generate default `Operation` in assigned work center
3. Update `OrderLine` with:
   - `fulfillmentType` (PRODUCTION or HYBRID)
   - `productionQuantity`
   - `stockAllocated`
   - `fulfillmentStatus` = ALLOCATED
4. Revalidate both orders and production pages

---

## PRODUCTION ORDER DETAILED FLOWS

### Admin Production Order Detail Page

#### Route: `/admin/production/[id]`
**File**: `src/app/admin/(protected)/production/[id]/page.tsx`

**Enhanced Data Loading**:
```typescript
const [orderDataRaw, workCenters, deliveryUsers] = await Promise.all([
  getProductionOrderWithPhaseStatus(id),  // Includes workflow progress calculations
  getAvailableWorkCenters(),
  getDeliveryUsers(),
]);

// Convert Decimal fields for client
const orderData = convertDecimals(orderDataRaw);

// Enrich with inspector names
const inspectors = await getActiveInspectors();
const inspectorsMap = new Map(
  inspectors.map(i => [i.inspectorId, `${i.firstName} ${i.lastName}`])
);
```

**getProductionOrderWithPhaseStatus Server Action**:
**File**: `src/lib/actions/production-order.ts` (lines 1845-1913)

Returns production order enriched with:
- `workflowProgress.workCentersComplete` (boolean)
- `workflowProgress.inspectionsComplete` (boolean)
- `workflowProgress.readyForDelivery` (boolean)
- Operations with work center details and assigned workers
- Quality checks with inspector information
- Delivery assignment details

**Header Actions Component**:
**File**: `src/app/admin/(protected)/production/[id]/production-order-header-actions.tsx`

Three main actions:
1. **Workflow Progress Button**: Advances order through statuses with validation
2. **Share Button**: Opens shareable link dialog with QR code
3. **QR Generator**: Generates downloadable QR code for warehouse scanning

**Production Order Details Tabs**:
- **Overview**: Order info, product details, quantity, dates, status
- **Operations**: List of work center operations with status and assignments
- **Quality Checks**: Inspector assignments and check results
- **Delivery**: Delivery assignment, address, scheduled date
- **History**: Audit log of all order changes

### Worker Task Management

#### Worker Dashboard: `/worker/dashboard`
Shows aggregated task statistics and today's tasks

#### Worker Production Tasks: `/worker/production`
**File**: `src/app/worker/(protected)/production/page.tsx`

**Server Data**:
```typescript
const [tasks, statistics] = await Promise.all([
  getMyTasks(),          // Operations assigned to logged-in worker
  getTaskStatistics()    // Pending, in-progress, completed counts
]);
```

**Statistics Cards**:
- Pending tasks (not started)
- In Progress (currently working)
- Completed Today (with completion rate %)
- Active Orders (production orders with operations)

**Real-Time Task List**:
**Component**: `WorkerProductionTasks`
Shows operations grouped by production order with:
- Product name and variant
- Operation details (work center, start/end times)
- Current status badge
- Quick action buttons (Start, Complete, Add Note)

#### Worker Operations Page: `/worker/tasks/operations`
**File**: `src/app/worker/(protected)/tasks/operations/page.tsx`

**Data Loading**:
```typescript
const tasks = await getMyTasks(); // Operations where assignedToId = worker.id

// Group by production order
const productionOrderGroups = new Map();
for (const task of tasks) {
  if (!productionOrderGroups.has(task.productionOrderId)) {
    const details = await getProductionOrderDetailsWithPhases(task.productionOrderId);
    productionOrderGroups.set(task.productionOrderId, details);
  }
}
```

**OperationTaskManager Component**:
**File**: `src/components/module/worker/tasks/OperationTaskManager.tsx`

Interactive operation cards that:
- Show operation sequence and work center
- Display current status with color coding
- Allow status updates (PENDING → IN_PROGRESS → COMPLETED)
- Enforce only assigned worker can update (RBAC)
- Show notes history and allow adding new notes
- Trigger phase completion checks automatically

**updateTaskStatus Server Action (Worker)**:
**File**: `src/lib/actions/worker/tasks.ts` (lines 206-400)

```typescript
export async function updateTaskStatus(data: TaskUpdateInput) {
  const session = await getServerSession(authOptions);
  
  // 1. RBAC Check: Only assigned worker can update
  const operation = await prisma.operation.findUnique({
    where: { id: data.taskId },
    include: { productionOrder: true }
  });
  
  if (operation.assignedToId !== session.user.id) {
    throw new Error('You can only update your own tasks');
  }

  // 2. Update operation status
  const updated = await prisma.operation.update({
    where: { id: data.taskId },
    data: {
      status: data.status,
      notes: data.notes,
      endTime: data.status === 'COMPLETED' ? new Date() : operation.endTime,
    }
  });

  // 3. Check if all work center operations complete
  if (data.status === 'COMPLETED') {
    const workCenterStatus = await checkWorkCenterCompletion(operation.productionOrderId);
    
    if (workCenterStatus.allCompleted) {
      // 4. Log production history
      await prisma.productionOrderHistoryLog.create({
        data: {
          productionOrderId: operation.productionOrderId,
          userId: session.user.id,
          action: 'WORK_CENTERS_COMPLETED',
          description: 'All work center operations completed',
        }
      });

      // 5. Notify inspectors
      await notifyInspectorsWorkCentersCompleted(
        operation.productionOrderId,
        session.user.id
      );
    }
  }

  revalidatePath('/worker/tasks');
  revalidatePath('/worker/production');
  
  return { success: true, triggeredInspection: workCenterStatus?.allCompleted };
}
```

---

## INSPECTOR WORKFLOW DETAILED FLOWS

### Inspector Dashboard: `/inspector/dashboard`
**File**: `src/app/inspector/(protected)/dashboard/page.tsx`

**Server Data**:
```typescript
const [tasks, stats, qualityChecks, productionOrders] = await Promise.all([
  getInspectorTasks(),        // Operations ready for inspection
  getTaskStatistics(),        // Task counts by status
  getInspectorQualityChecks(), // Completed quality checks
  getProductionOrders(),      // All production orders for context
]);
```

### Inspector Quality Checks Page: `/inspector/production`
**File**: `src/app/inspector/(protected)/production/page.tsx`

Shows table of quality checks performed by logged-in inspector with:
- Production order reference
- Product name
- Check date and status
- Defects found count
- Action taken
- Notes

**QualityChecksTable Component**:
**File**: `src/components/module/inspectors/tasks/TaskQualityCheck.tsx`

Interactive table with:
- Filter by status (PASSED, FAILED, PENDING)
- Filter by date range
- View detail button (navigates to production order)
- Export to CSV functionality

### Inspector Task Update Flow

**updateTaskStatus Server Action (Inspector)**:
**File**: `src/lib/actions/inspector/tasks.ts` (lines 199-400)

```typescript
export async function updateTaskStatus(data: TaskUpdateInput) {
  const session = await getServerSession(authOptions);
  
  // 1. Sequential Workflow Validation
  const workCenterStatus = await checkWorkCenterCompletion(
    data.productionOrderId
  );
  
  if (!workCenterStatus.allCompleted) {
    throw new Error(
      'Cannot start inspection: Work center operations not yet complete. ' +
      `${workCenterStatus.completedCount} of ${workCenterStatus.totalCount} operations finished.`
    );
  }

  // 2. Update quality check
  const check = await prisma.qualityCheck.update({
    where: { id: data.checkId },
    data: {
      status: data.status,
      defectsFound: data.defectsFound,
      actionTaken: data.actionTaken,
      notes: data.notes,
      checkDate: new Date(),
    }
  });

  // 3. Check if all inspections complete
  if (data.status === 'PASSED') {
    const inspectionStatus = await checkInspectionCompletion(
      data.productionOrderId
    );

    if (inspectionStatus.allCompleted) {
      // 4. Update production order workflow progress
      await prisma.productionOrder.update({
        where: { id: data.productionOrderId },
        data: { workflowStage: 'READY_FOR_DELIVERY' }
      });

      // 5. Notify delivery team
      await notifyDeliveryInspectionsCompleted(
        data.productionOrderId,
        session.user.id
      );

      // 6. Auto-create delivery assignment if none exists
      const existingDelivery = await prisma.deliveryAssignment.findUnique({
        where: { productionOrderId: data.productionOrderId }
      });

      if (!existingDelivery) {
        const deliveryUser = await prisma.user.findFirst({
          where: { role: 'DELIVERY' }
        });

        if (deliveryUser) {
          await createDeliveryAssignment({
            productionOrderId: data.productionOrderId,
            userId: deliveryUser.id,
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
          });
        }
      }
    }
  }

  revalidatePath('/inspector/production');
  
  return { success: true, readyForDelivery: inspectionStatus?.allCompleted };
}
```

---

## PURCHASE ORDER WORKFLOWS

### Purchase Order Index: `/admin/purchase-orders`
**File**: `src/app/admin/(protected)/purchase-orders/page.tsx`

**Server Data**:
```typescript
const [purchaseOrders, materials, suppliers] = await Promise.all([
  getPurchaseOrders(),
  getAllMaterials(),
  getAllSuppliers(),
]);
```

**Statistics Cards**:
- Total POs
- Pending (awaiting delivery)
- In Transit
- Received (completed)
- Total Value (sum of all PO amounts)

**Create PO Dialog**:
Multi-step form:
1. Select supplier
2. Add material lines (material, quantity, unit price)
3. Set expected delivery date
4. Add notes
5. Submit

**createPurchaseOrder Server Action**:
**File**: `src/lib/actions/purchase-order.ts`

```typescript
export async function createPurchaseOrder(data: PurchaseOrderInput) {
  const session = await getServerSession(authOptions);
  
  // Generate PO number
  const lastPO = await prisma.purchaseOrder.findFirst({
    orderBy: { poNumber: 'desc' }
  });
  const poNumber = generateNextPONumber(lastPO?.poNumber);

  // Create PO with lines in transaction
  const po = await prisma.$transaction(async (tx) => {
    const newPO = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        orderDate: new Date(),
        expectedDeliveryDate: data.expectedDeliveryDate,
        totalAmount: data.totalAmount,
        status: 'PENDING',
        createdById: session.user.id,
      }
    });

    await tx.purchaseOrderLine.createMany({
      data: data.lines.map(line => ({
        purchaseOrderId: newPO.id,
        materialId: line.materialId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        receivedQuantity: 0,
      }))
    });

    return newPO;
  });

  revalidatePath('/admin/purchase-orders');
  return { success: true, poId: po.id };
}
```

---

## CROSS-ROLE AUTOMATION & NOTIFICATIONS

### Phase Validation Helpers

**checkWorkCenterCompletion**:
**File**: `src/lib/actions/production-order.ts` (line 6829)

```typescript
export async function checkWorkCenterCompletion(productionOrderId: string) {
  const operations = await prisma.operation.findMany({
    where: { 
      productionOrderId,
      workCenter: { isInspectionStation: false } // Exclude inspection ops
    }
  });

  const completedCount = operations.filter(op => op.status === 'COMPLETED').length;
  const totalCount = operations.length;

  return {
    allCompleted: completedCount === totalCount,
    completedCount,
    totalCount,
    completionPercentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
  };
}
```

**checkInspectionCompletion**:
Similar logic but checks quality checks instead of operations

### Notification System

**notifyInspectorsWorkCentersCompleted**:
**File**: `src/lib/actions/notifications.ts`

```typescript
export async function notifyInspectorsWorkCentersCompleted(
  productionOrderId: string,
  completedByUserId: string
) {
  // Find inspectors assigned to this production order
  const qualityChecks = await prisma.qualityCheck.findMany({
    where: { productionOrderId },
    include: { inspector: { include: { user: true } } }
  });

  const notifications = qualityChecks.map(check => ({
    userId: check.inspector.userId,
    type: 'INSPECTION_READY',
    title: 'Production Ready for Inspection',
    message: `All work center operations completed for production order #${productionOrderId.substring(0, 8)}`,
    link: `/inspector/production/${productionOrderId}`,
    productionOrderId,
  }));

  await prisma.notification.createMany({ data: notifications });

  // Could also trigger email/SMS here
  return { notificationsSent: notifications.length };
}
```

**notifyDeliveryInspectionsCompleted**:
Similar pattern for delivery team when inspections pass

### Delivery Assignment Auto-Creation

When all inspections complete, system automatically:
1. Checks if `DeliveryAssignment` exists for production order
2. If not, finds first available `DELIVERY` role user
3. Creates assignment with:
   - `scheduledDate` = 7 days from now (configurable)
   - `status` = 'PENDING'
   - `productionOrderId` linked
4. Notifies delivery user

---

## DATA SERIALIZATION PATTERNS

### Prisma Decimal Handling

**Problem**: Prisma returns `Decimal` objects that aren't JSON-serializable

**Solution**: Universal serialization helper
```typescript
function serializeForClient(value: any): any {
  if (value === null || value === undefined) return value;
  
  // Handle Prisma Decimal
  if (value?.constructor?.name === 'Decimal') {
    return Number(value.toString());
  }
  
  // Handle Date
  if (value instanceof Date) return value.toISOString();
  
  // Handle BigInt
  if (typeof value === 'bigint') return value.toString();
  
  // Recursively handle objects and arrays
  if (Array.isArray(value)) return value.map(serializeForClient);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serializeForClient(v)])
    );
  }
  
  return value;
}
```

Used in all pages that pass server data to client components.

### convertDecimals Utility

**File**: `src/lib/convertDecimals.ts`

Specialized helper for production order data that handles nested structures.

---

## PAGE NAVIGATION FLOWS

### Customer Order Journey
1. `/admin/customer-orders-v2` (Index) → Create Button
2. `/admin/customer-orders-v2/create` (Multi-step form) → Submit
3. `/admin/customer-orders-v2/[id]` (Detail) → Analyze Button
4. `/admin/customer-orders-v2/[id]/analyze` (Analysis) → Create Production
5. `/admin/production` (Production Index) → View new orders

### Production Order Journey
1. `/admin/production` (Index) → Click order
2. `/admin/production/[id]` (Detail - Admin view)
3. Worker assigned → Notification
4. `/worker/tasks/operations` (Worker operations view) → Complete tasks
5. System triggers inspection notification
6. `/inspector/production` (Inspector view) → Perform QC
7. System triggers delivery notification
8. Delivery team picks up order

### Cross-Role Visibility
- **Admin**: Can view ALL production orders, full detail
- **Worker**: Can view orders with operations in THEIR work centers only
- **Inspector**: Can view orders assigned TO THEM for QC
- **Delivery**: Can view orders marked READY_FOR_DELIVERY

---

## KEY RBAC PATTERNS

### Server Action RBAC
Every server action starts with:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) throw new Error('Unauthorized');

// Role check
if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
  throw new Error('Insufficient permissions');
}

// Assignment check (for workers/inspectors)
if (operation.assignedToId !== session.user.id) {
  throw new Error('You can only update your own tasks');
}
```

### Component-Level RBAC
```typescript
// Show button only to admins
{session?.user.role === 'ADMIN' && (
  <Button onClick={handleDelete}>Delete</Button>
)}

// Worker-specific view
{isWorkerTask && (
  <Badge>Your Task</Badge>
)}
```

### Prisma Query Scoping
```typescript
// Worker queries
const tasks = await prisma.operation.findMany({
  where: {
    assignedToId: session.user.id,  // Only assigned operations
    workCenter: {
      id: session.user.workCenterId  // Or by work center
    }
  }
});

// Inspector queries
const checks = await prisma.qualityCheck.findMany({
  where: {
    inspectorId: session.user.inspectorId  // Only own checks
  }
});
```

---

## PERFORMANCE OPTIMIZATIONS

### Parallel Data Fetching
All pages use `Promise.all` to fetch independent data sources concurrently:
```typescript
const [orders, customers, products] = await Promise.all([
  getCustomerOrders(),
  getAllCustomers(),
  getAllProducts(),
]);
```

### Incremental Static Regeneration (ISR)
Not used due to `export const dynamic = 'force-dynamic'` on most pages (user-specific data).

### Optimistic UI Updates
Client components use `useOptimistic` for instant feedback:
```typescript
const [optimisticOrders, addOptimisticOrder] = useOptimistic(
  orders,
  (state, newOrder) => [...state, newOrder]
);
```

### Path Revalidation
Server actions call `revalidatePath()` to refresh cached data:
```typescript
revalidatePath('/admin/production');
revalidatePath('/worker/tasks');
```

This ensures all users see updated data without manual refresh.
