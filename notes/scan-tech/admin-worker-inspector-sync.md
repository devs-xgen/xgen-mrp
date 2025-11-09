# Admin–Worker–Inspector Sync: Complete Technical Reference

## Purpose & Scope
This comprehensive reference documents the **end-to-end flow** of Customer Orders, Production Orders, and Purchase Orders across the XGen MRP system. It traces data propagation, role handoffs, UI interactions, server actions, database models, automation hooks, and sequential workflow validations that orchestrate production from initial order intake through quality assurance and delivery.

### What This Document Covers
- **Complete user journeys** from admin order creation to worker execution to inspector quality checks
- **Detailed page-by-page flows** showing how data moves between routes and components
- **Server action deep-dives** with parameter signatures, validation logic, and side effects
- **Database model relationships** and how they enforce workflow sequencing
- **Real-time UI patterns** including optimistic updates, loading states, and data serialization
- **Cross-role notifications** and automation triggers that coordinate handoffs
- **RBAC enforcement** at layout, page, and action levels

## Role Entry Points & RBAC
- **Admin Portal** – `UnifiedLayout` grants access to `ADMIN`, `SUPER_ADMIN`, and `DEVELOPER`, redirecting others to the worker dashboard and wiring shared theming.@src/app/admin/(protected)/layout.tsx#1-18
- **Worker Portal** – Restricted to the `WORKER` role; other roles fall back to the admin dashboard.@src/app/worker/(protected)/layout.tsx#1-18
- **Inspector Portal** – Protected scaffold for `INSPECTOR` users, mirroring shared layout primitives and RBAC enforcement.@src/app/inspector/(protected)/layout.tsx#1-75

## End-to-End Workflow: Customer Order → Production → Inspection

### 1. Customer Order Intake (Admin)
1. **Landing Surface** – `/admin/customer-orders-v2` loads orders, customers, and products in parallel, rendering `CustomerOrderV2Client` for filtering, exports, and actions.@src/app/admin/(protected)/customer-orders-v2/page.tsx#1-48
2. **Client Workspace** – `CustomerOrderV2Client` applies multi-dimensional filters, manages optimistic updates, and surfaces bulk actions (create, analytics, archives, production planning).@src/components/module/admin/customer-order-ver/CustomerOrderV2Client.tsx#32-217
3. **Create & Edit Flows** – Multi-step forms normalize line items and invoke `createCustomerOrder` / `updateCustomerOrderWithLines`, generating sequential order numbers and storing order lines with fulfillment metadata.@src/components/module/admin/customer-order-ver/CustomerOrderCreateV2Client.tsx#74-281 @src/components/module/admin/customer-order-ver/CustomerOrderEditClient.tsx#1-100 @src/lib/actions/customer-order.ts#864-1100
4. **Analytics & Planning** – Dedicated routes expose fulfillment KPIs and production readiness:
   - `/analytics` aggregates status counts and fulfillment ratios using `getCustomerOrdersWithFulfillment` and order analysis helpers.@src/app/admin/(protected)/customer-orders-v2/analytics/page.tsx#1-100
   - `/production-planning` consumes `getOrdersRequiringAnalysis` and `getOrderAnalysisSummary` to prioritize which order lines require manufacturing vs stock fulfillment.@src/app/admin/(protected)/customer-orders-v2/production-planning/page.tsx#1-60 @src/lib/actions/order-analysis.ts#17-310
5. **Archival & Lifecycle** – Archive actions capture reasons and revalidation hooks so historical orders stay accessible while active queues remain current.@src/components/module/admin/customer-order-ver/CustomerOrderV2Table.tsx#248-384

### 2. Production Planning & Execution (Admin → Worker)
1. **Production Order Registry** – `/admin/production` lists orders with analytics and quick filters, transforming Prisma decimals for client rendering and linking to detail routes.@src/app/admin/(protected)/production/page.tsx#1-182
2. **Order Analysis to Production Creation** – `createProductionOrdersForItems` (called from planning UI) iterates order-line selections, creates `ProductionOrder` records, seeds default `Operation` rows, and updates order-line fulfillment flags (stock vs production).@src/lib/actions/order-analysis.ts#303-400 @prisma/schema.prisma#449-678
3. **Detail View & Workflow Controls** – `/admin/production/[id]` hydrates phase status (`getProductionOrderWithPhaseStatus`), inspector rosters, delivery assignments, and wraps header actions (workflow progress, QR share, analytics).@src/app/admin/(protected)/production/[id]/page.tsx#171-320 @src/lib/actions/production-order.ts#1845-1913
4. **Worker Task Surfaces** – Workers receive assignments via:
   - `/worker/production` metrics + `WorkerProductionTasks` real-time list, sourced from `getMyTasks` and `getTaskStatistics`.@src/app/worker/(protected)/production/page.tsx#1-107 @src/lib/actions/worker/tasks.ts#709-837
   - `/worker/tasks` table view of orders influencing their work centers.@src/app/worker/(protected)/tasks/page.tsx#1-181
   - `/worker/tasks/operations` interactive management of assigned operations using `getProductionOrderDetailsWithPhases` and `OperationTaskManager`, enforcing RBAC on status updates.@src/app/worker/(protected)/tasks/operations/page.tsx#1-200 @src/components/module/worker/tasks/OperationTaskManager.tsx#1-416
5. **Worker Progress & Phase Automation** – When workers complete operations, `updateTaskStatus` checks work-center completion (`checkWorkCenterCompletion`) and logs milestone activity. Completion events trigger inspection readiness and optional notifications to inspectors.@src/lib/actions/worker/tasks.ts#199-400

### 3. Quality Assurance & Delivery Enablement (Inspector)
1. **Inspector Task Deck** – `/inspector/production` consolidates assigned inspections, statistics, and completed checks, relying on `getProductionTasks`, `getProductionTaskStatistics`, and `getMyQualityChecks` server actions.@src/app/inspector/(protected)/production/page.tsx#1-122 @src/lib/actions/inspector/tasks.ts#1-258 @src/lib/actions/inspector/production-order.ts#1-220
2. **Sequential Gatekeeping** – Inspector task updates call into `updateTaskStatus` (inspector flavor) which validates that work centers are complete before inspections begin and logs delivery readiness when all checks pass.@src/lib/actions/inspector/tasks.ts#198-400
3. **Phase Aggregation** – `getProductionOrderWithPhaseStatus` augments orders with `workflowProgress` (work centers complete, inspections complete, ready for delivery).@src/lib/actions/production-order.ts#1845-1913
4. **Delivery Handoff** – When inspections finish, automation attempts to notify delivery personnel and optionally creates a `DeliveryAssignment`, closing the loop from admin authorization to downstream logistics.@src/lib/actions/inspector/tasks.ts#295-400 @prisma/schema.prisma#569-600 @src/lib/actions/production-order.ts#1359-1550

## Supporting Workflow: Material Procurement (Admin)
1. **Purchase Order Management** – `/admin/purchase-orders` loads POs, material catalogs, and supplier directory concurrently, pairing statistics with a TanStack table and modal creation flow.@src/app/admin/(protected)/purchase-orders/page.tsx#1-69
2. **Create & Maintain POs** – `createPurchaseOrder` generates sequential PO numbers, persists lines, and revalidates the page; `updatePurchaseOrder` adjusts delivery targets and status, while delete operations cascade lines safely.@src/lib/actions/purchase-order.ts#1-238
3. **Inventory Feedback Loop** – PO line items tie back to `Material`, updating stock profiles used when order-analysis decides between stock vs production. BOM structures (`ProductionBOM`, `ProductVariantBOM`) ensure consumption data is available during production planning.@prisma/schema.prisma#367-446 @prisma/schema.prisma#400-418

## Data Model Map & Relationships
| Domain | Core Models | Notes |
| --- | --- | --- |
| Customer Orders | `CustomerOrder`, `OrderLine`, `OrderLineVariant`, `Transaction` | Capture customer, required date, fulfillment metadata, downstream production linkage.@prisma/schema.prisma#569-694
| Production | `ProductionOrder`, `Operation`, `ProductionBOM`, `WorkCenter`, `WorkCenterAssignment`, `ProductionOrderHistoryLog` | Track manufacturing lifecycle, assigned work centers, costs, and history for auditability.@prisma/schema.prisma#400-546 @prisma/schema.prisma#82-110
| Quality & Inspection | `QualityCheck`, `Inspector`, `User` (role `INSPECTOR`) | Inspector portal reads and updates these records; QA completion unlocks delivery phases.@prisma/schema.prisma#696-717
| Materials & Procurement | `Material`, `Supplier`, `PurchaseOrder`, `PurchaseOrderLine`, `MaterialReservation` | Admin purchase workflows ensure material availability for production BOM consumption.@prisma/schema.prisma#367-600 @prisma/schema.prisma#746-781

## Cross-Role Automation & Notifications
- **Phase Validation Helpers** – `checkWorkCenterCompletion`, `checkInspectionCompletion`, and `getProductionPhaseStatus` coordinate readiness across roles and protect sequential dependencies.@src/lib/actions/production-order.ts#1678-1734 @src/lib/actions/worker/tasks.ts#250-310
- **Notifications** – Worker completion triggers inspector notifications (`notifyInspectorsWorkCentersCompleted`), and inspector completion notifies delivery teams (`notifyDeliveryInspectionsCompleted`).@src/lib/actions/worker/tasks.ts#295-310 @src/lib/actions/inspector/tasks.ts#295-320
- **Delivery Assignment Bootstrap** – If no assignment exists when inspections finish, automation attempts to create one and assign the first available delivery user, ensuring continuity to logistics teams.@src/lib/actions/inspector/tasks.ts#327-387

## Key Route & Component Index
| Route | Responsibilities | Key Components / Actions |
| --- | --- | --- |
| `/admin/customer-orders-v2` | Intake, filtering, analytics entry, production planning launch | `CustomerOrderV2Client`, `CustomerOrderV2HeaderActions`, `createCustomerOrder`@
| `/admin/production` | Portfolio oversight, analytics, order drilling | `DataTable` (production), `getProductionOrders`, `AnalyticsCard`@
| `/admin/production/[id]` | Full workflow control, inspector coordination, delivery assignment | `ProductionOrderHeaderActions`, `ProductionOrderDetails`, `getProductionOrderWithPhaseStatus`@
| `/worker/production`, `/worker/tasks`, `/worker/tasks/operations` | Worker dashboards and operation management | `WorkerProductionTasks`, `OperationTaskManager`, `getMyTasks`, `getProductionOrderDetailsWithPhases`@
| `/inspector/production` | Inspector queue, QA history, readiness signaling | `QualityChecksTable`, `getProductionTasks`, `updateTaskStatus`@
| `/admin/purchase-orders` | Material procurement pipeline | `PurchaseOrdersStats`, `DataTable`, `CreatePurchaseOrderDialog`, `createPurchaseOrder`@

## Usage Tips
- Treat order analysis as the coordination hub—admins decide stock vs production, which cascades to worker WIP and inspector tasks.
- Monitor phase status from production order detail pages to understand where hand-offs are blocked (work centers vs inspections vs delivery).
- Keep supplier and material data current; order analysis relies on accurate `Material` and BOM records to recommend production or stock fulfillment.
- Encourage inspectors to resolve tasks promptly; delivery readiness and automatic assignments hinge on inspection completion logs.

---

## DETAILED TECHNICAL FLOWS

### Customer Order Creation: Complete Step-by-Step

#### 1. Admin Navigates to Create Page
**URL**: `/admin/customer-orders-v2/create`  
**Server Component** loads and serializes data:
```typescript
// Parallel fetch for form data
const [customers, products] = await Promise.all([
  getAllCustomers(),                      // All customers for dropdown
  getProductsWithVariantsForOrders(),     // Products with variants
]);

// Serialize Prisma Decimals for client
const serializableCustomers = customers.map(c => ({
  ...c,
  creditLimit: c.creditLimit?.toString() ?? null
}));
```

#### 2. Multi-Step Form Interaction
**Component**: `CustomerOrderCreateV2Client`  
**File**: `src/components/module/admin/customer-order-ver/CustomerOrderCreateV2Client.tsx`

**Step 1 - Customer Selection**:
- User searches/selects customer from dropdown
- Form validates customer exists
- Displays customer credit limit for reference

**Step 2 - Add Product Lines**:
- User clicks "Add Line Item"
- For each line:
  - Select Product → triggers variant dropdown
  - Select Variant (optional, if product has variants)
  - Enter Quantity (validates > 0)
  - Unit Price auto-fills from product, editable
  - Line total calculates automatically
- Order total updates with each line change
- User can remove lines with delete button

**Step 3 - Order Details**:
- Order Date (default: today)
- Required Date (must be future date)
- Payment Terms (dropdown: NET_30, NET_60, COD, ADVANCE)
- Shipping Address (from customer or custom)
- Notes (optional special instructions)

**Step 4 - Review & Submit**:
- Read-only summary of all data
- Submit button calls server action
- Loading spinner during submission
- On success: Navigate to order detail page
- On error: Display inline error messages

#### 3. Server Action Execution
**Function**: `createCustomerOrder(data)`  
**File**: `src/lib/actions/customer-order.ts` (lines 864-1100)

```typescript
export async function createCustomerOrder(data: CustomerOrderInput) {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new Error('Unauthorized - Admin access required');
  }

  // Generate sequential order number
  const lastOrder = await prisma.customerOrder.findFirst({
    orderBy: { orderNumber: 'desc' }
  });
  const orderNumber = lastOrder?.orderNumber 
    ? `CO-${String(Number(lastOrder.orderNumber.split('-')[1]) + 1).padStart(6, '0')}`
    : 'CO-000001';

  // Transaction for atomicity
  const order = await prisma.$transaction(async (tx) => {
    // Create order header
    const newOrder = await tx.customerOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        orderDate: data.orderDate,
        requiredDate: data.requiredDate,
        totalAmount: data.totalAmount,
        paymentTerms: data.paymentTerms,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        status: 'PENDING',
        createdById: session.user.id,
      }
    });

    // Create order lines
    await tx.orderLine.createMany({
      data: data.lineItems.map(item => ({
        customerOrderId: newOrder.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        fulfillmentType: 'PENDING_ANALYSIS',
        fulfillmentStatus: 'PENDING',
        stockAllocated: 0,
        productionQuantity: 0,
      }))
    });

    return newOrder;
  });

  // Cache invalidation
  revalidatePath('/admin/customer-orders-v2');
  
  return { success: true, orderId: order.id, orderNumber: order.orderNumber };
}
```

#### 4. Post-Creation Navigation
- Form shows success toast
- Redirects to `/admin/customer-orders-v2/${orderId}`
- Order appears in main index table
- Status badge shows "PENDING"

### Order Analysis & Production Planning Flow

#### 1. Admin Clicks "Analyze" on Order
**URL**: `/admin/customer-orders-v2/[id]/analyze`  
**Server Component** performs stock analysis:

```typescript
const orderAnalysis = await analyzeCustomerOrderStock(orderId);
```

**analyzeCustomerOrderStock Function**:
**File**: `src/lib/actions/order-analysis.ts`

```typescript
export async function analyzeCustomerOrderStock(orderId: string) {
  // Fetch order with all relationships
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      orderLines: {
        include: {
          product: {
            include: {
              inventory: true,
              productionBOM: {
                include: {
                  material: { include: { inventory: true } }
                }
              }
            }
          },
          productVariant: {
            include: {
              inventory: true,
              productVariantBOM: {
                include: {
                  material: { include: { inventory: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  // Analyze each line
  const lineAnalyses = [];
  for (const line of order.orderLines) {
    const analysis = {
      orderLineId: line.id,
      productName: line.product.name,
      variantName: line.productVariant?.displayName,
      requiredQuantity: line.quantity,
      availableStock: 0,
      shortfall: 0,
      canFulfillFromStock: false,
      needsProduction: false,
      materialShortages: [],
      overallStatus: '',
    };

    // Check inventory
    const inventory = line.productVariantId
      ? line.productVariant?.inventory
      : line.product.inventory;
    
    const availableStock = inventory?.quantity || 0;
    analysis.availableStock = availableStock;

    if (availableStock >= line.quantity) {
      // Can fulfill entirely from stock
      analysis.canFulfillFromStock = true;
      analysis.overallStatus = 'CAN_FULFILL_IMMEDIATELY';
    } else if (availableStock > 0) {
      // Partial stock available
      analysis.shortfall = line.quantity - availableStock;
      analysis.needsProduction = true;
      analysis.overallStatus = 'MIXED';
    } else {
      // No stock, full production needed
      analysis.shortfall = line.quantity;
      analysis.needsProduction = true;
      analysis.overallStatus = 'REQUIRES_PRODUCTION';
    }

    // Check BOM materials if production needed
    if (analysis.needsProduction) {
      const bom = line.productVariantId
        ? line.productVariant?.productVariantBOM
        : line.product.productionBOM;

      for (const bomItem of bom || []) {
        const materialNeeded = bomItem.quantity * analysis.shortfall;
        const materialAvailable = bomItem.material.inventory?.quantity || 0;

        if (materialAvailable < materialNeeded) {
          analysis.materialShortages.push({
            materialId: bomItem.materialId,
            materialName: bomItem.material.name,
            materialSKU: bomItem.material.sku,
            needed: materialNeeded,
            available: materialAvailable,
            shortage: materialNeeded - materialAvailable,
          });
          analysis.overallStatus = 'MATERIAL_SHORTAGE';
        }
      }
    }

    lineAnalyses.push(analysis);
  }

  // Determine overall order status
  const overallStatus = lineAnalyses.every(l => l.overallStatus === 'CAN_FULFILL_IMMEDIATELY')
    ? 'CAN_FULFILL_IMMEDIATELY'
    : lineAnalyses.some(l => l.overallStatus === 'MATERIAL_SHORTAGE')
    ? 'MATERIAL_SHORTAGE'
    : lineAnalyses.some(l => l.needsProduction)
    ? 'MIXED'
    : 'REQUIRES_PRODUCTION';

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    lineAnalyses,
    overallStatus,
  };
}
```

#### 2. Admin Makes Fulfillment Decisions
**Component**: `CustomerOrderAnalysisClient`

For each line, admin selects:
- **FULL_STOCK**: Allocate from inventory only
- **FULL_PRODUCTION**: Create production order for full quantity
- **HYBRID_APPROACH**: Part stock, part production

For HYBRID, admin inputs:
- Stock Quantity (0 to availableStock)
- Production Quantity (0 to shortfall)

Admin also sets:
- Priority (URGENT, HIGH, NORMAL, LOW)
- Production notes

#### 3. Create Production Orders
When admin clicks "Create Production Orders":

```typescript
const selections = lineItems
  .filter(item => item.decision !== 'FULL_STOCK')
  .map(item => ({
    orderLineId: item.id,
    productId: item.productId,
    productVariantId: item.productVariantId,
    decision: item.decision,
    quantityToProduce: item.productionQty,
    stockToAllocate: item.stockQty,
    priority: item.priority,
    notes: item.notes,
  }));

const result = await createProductionOrdersForItems(selections);
```

**createProductionOrdersForItems Function**:
**File**: `src/lib/actions/order-analysis.ts` (lines 303-417)

```typescript
export async function createProductionOrdersForItems(selections: ProductionSelection[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');

  const createdOrders = [];
  const errors = [];

  // Get default work center for operations
  const defaultWorkCenter = await prisma.workCenter.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!defaultWorkCenter) {
    throw new Error('No active work center found');
  }

  for (const selection of selections) {
    if (!['FULL_PRODUCTION', 'HYBRID_APPROACH'].includes(selection.decision)) {
      continue;
    }

    try {
      // Fetch order line for context
      const orderLine = await prisma.orderLine.findUnique({
        where: { id: selection.orderLineId },
        include: { customerOrder: true, product: true }
      });

      if (!orderLine) {
        errors.push(`Order line ${selection.orderLineId} not found`);
        continue;
      }

      // Calculate production dates
      const startDate = new Date();
      const dueDate = new Date(orderLine.customerOrder.requiredDate);
      dueDate.setDate(dueDate.getDate() - 1); // Buffer day

      // Create production order
      const productionOrder = await createProductionOrder({
        productId: selection.productId,
        productVariantId: selection.productVariantId,
        quantity: selection.quantityToProduce,
        startDate,
        dueDate,
        priority: selection.priority,
        customerOrderId: orderLine.customerOrder.id,
        notes: `Created from order analysis - ${selection.notes || ''}`,
        operations: [{
          workCenterId: defaultWorkCenter.id,
          startTime: startDate,
          endTime: dueDate,
          cost: 0,
        }]
      });

      createdOrders.push(productionOrder);

      // Update order line fulfillment tracking
      await prisma.orderLine.update({
        where: { id: selection.orderLineId },
        data: {
          fulfillmentType: selection.decision === 'FULL_PRODUCTION' 
            ? 'PRODUCTION' 
            : 'HYBRID',
          productionQuantity: selection.quantityToProduce,
          stockAllocated: selection.stockToAllocate,
          fulfillmentStatus: 'ALLOCATED',
          allocatedAt: new Date(),
        }
      });
    } catch (error) {
      errors.push(`Failed for ${selection.orderLineId}: ${error.message}`);
    }
  }

  revalidatePath('/admin/customer-orders-v2');
  revalidatePath('/admin/production');

  return { success: errors.length === 0, createdOrders, errors };
}
```

### Worker Operation Execution Flow

#### 1. Worker Views Assigned Tasks
**URL**: `/worker/tasks/operations`  
**Server Loading**:

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

const productionOrders = Array.from(productionOrderGroups.values());
```

#### 2. Worker Updates Operation Status
**Component**: `OperationTaskManager`  
**File**: `src/components/module/worker/tasks/OperationTaskManager.tsx`

Worker clicks on operation card → Opens dialog with:
- Current status badge
- Status dropdown (PENDING, IN_PROGRESS, COMPLETED)
- Notes textarea
- Save button

When worker clicks Save:
```typescript
await updateTaskStatus({
  taskId: operation.id,
  status: newStatus,
  notes: notes,
});
```

**updateTaskStatus Server Action (Worker)**:
**File**: `src/lib/actions/worker/tasks.ts` (lines 206-400)

```typescript
export async function updateTaskStatus(data: TaskUpdateInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');

  // Fetch operation
  const operation = await prisma.operation.findUnique({
    where: { id: data.taskId },
    include: { productionOrder: true }
  });

  if (!operation) throw new Error('Operation not found');

  // RBAC: Only assigned worker can update
  if (operation.assignedToId !== session.user.id) {
    throw new Error('You can only update your own assigned tasks');
  }

  const previousStatus = operation.status;

  // Update operation
  const updated = await prisma.operation.update({
    where: { id: data.taskId },
    data: {
      status: data.status,
      notes: data.notes,
      startTime: data.status === 'IN_PROGRESS' && !operation.startTime 
        ? new Date() 
        : operation.startTime,
      endTime: data.status === 'COMPLETED' ? new Date() : operation.endTime,
    }
  });

  let triggeredPhaseUpdate = false;

  // Check work center completion if just completed
  if (data.status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
    const workCenterStatus = await checkWorkCenterCompletion(operation.productionOrderId);
    triggeredPhaseUpdate = workCenterStatus.allCompleted;

    if (workCenterStatus.allCompleted) {
      // Log history
      await prisma.productionOrderHistoryLog.create({
        data: {
          productionOrderId: operation.productionOrderId,
          userId: session.user.id,
          action: 'WORK_CENTERS_COMPLETED',
          description: `All work center operations completed. ${workCenterStatus.completedCount}/${workCenterStatus.totalCount} operations finished.`,
        }
      });

      // Update production order workflow stage
      await prisma.productionOrder.update({
        where: { id: operation.productionOrderId },
        data: { workflowStage: 'READY_FOR_INSPECTION' }
      });

      // Notify inspectors
      try {
        await notifyInspectorsWorkCentersCompleted(
          operation.productionOrderId,
          session.user.id
        );
      } catch (error) {
        console.error('Failed to notify inspectors:', error);
      }
    }
  }

  revalidatePath('/worker/tasks');
  revalidatePath('/worker/production');
  revalidatePath(`/admin/production/${operation.productionOrderId}`);

  return {
    success: true,
    triggeredInspection: triggeredPhaseUpdate,
    message: triggeredPhaseUpdate 
      ? 'Operation completed. Inspectors have been notified.' 
      : 'Operation updated successfully.'
  };
}
```

### Inspector Quality Check Flow

#### 1. Inspector Receives Notification
When all work center operations complete, inspector gets notification via `notifyInspectorsWorkCentersCompleted`.

#### 2. Inspector Views Production Order
**URL**: `/inspector/production` or `/inspector/task`  
Shows list of production orders ready for inspection.

#### 3. Inspector Performs Quality Check
Opens production order detail, completes quality check form:
- Status (PASSED / FAILED / PENDING)
- Defects Found (count)
- Action Taken (dropdown: APPROVED, REJECTED, REWORK_REQUIRED)
- Notes (textarea for details)

Submits via `updateTaskStatus` (inspector version).

**updateTaskStatus Server Action (Inspector)**:
**File**: `src/lib/actions/inspector/tasks.ts` (lines 199-400)

```typescript
export async function updateTaskStatus(data: InspectorTaskUpdateInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');

  // Sequential Workflow Validation
  const workCenterStatus = await checkWorkCenterCompletion(data.productionOrderId);

  if (!workCenterStatus.allCompleted) {
    throw new Error(
      `Cannot start inspection: Work center operations not complete. ` +
      `${workCenterStatus.completedCount}/${workCenterStatus.totalCount} operations finished.`
    );
  }

  // Update or create quality check
  const check = await prisma.qualityCheck.upsert({
    where: { id: data.checkId || 'new' },
    update: {
      status: data.status,
      defectsFound: data.defectsFound,
      actionTaken: data.actionTaken,
      notes: data.notes,
      checkDate: new Date(),
    },
    create: {
      productionOrderId: data.productionOrderId,
      inspectorId: session.user.inspectorId,
      status: data.status,
      defectsFound: data.defectsFound,
      actionTaken: data.actionTaken,
      notes: data.notes,
      checkDate: new Date(),
    }
  });

  let readyForDelivery = false;

  // Check if all inspections complete
  if (data.status === 'PASSED') {
    const inspectionStatus = await checkInspectionCompletion(data.productionOrderId);

    if (inspectionStatus.allCompleted) {
      readyForDelivery = true;

      // Update production order
      await prisma.productionOrder.update({
        where: { id: data.productionOrderId },
        data: {
          workflowStage: 'READY_FOR_DELIVERY',
          status: 'COMPLETED',
        }
      });

      // Log history
      await prisma.productionOrderHistoryLog.create({
        data: {
          productionOrderId: data.productionOrderId,
          userId: session.user.id,
          action: 'INSPECTIONS_COMPLETED',
          description: 'All quality inspections passed',
        }
      });

      // Notify delivery
      await notifyDeliveryInspectionsCompleted(
        data.productionOrderId,
        session.user.id
      );

      // Auto-create delivery assignment
      const existingDelivery = await prisma.deliveryAssignment.findUnique({
        where: { productionOrderId: data.productionOrderId }
      });

      if (!existingDelivery) {
        const deliveryUser = await prisma.user.findFirst({
          where: { role: 'DELIVERY', isActive: true }
        });

        if (deliveryUser) {
          await createDeliveryAssignment({
            productionOrderId: data.productionOrderId,
            userId: deliveryUser.id,
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            notes: 'Auto-assigned after inspection completion',
          });
        }
      }
    }
  }

  revalidatePath('/inspector/production');
  revalidatePath(`/admin/production/${data.productionOrderId}`);

  return {
    success: true,
    readyForDelivery,
    message: readyForDelivery 
      ? 'Quality check passed. Production order ready for delivery.' 
      : 'Quality check recorded successfully.'
  };
}
```

---

## DATA SERIALIZATION & TYPE SAFETY

### Prisma Decimal Conversion
**Problem**: Prisma `Decimal` type not JSON-serializable  
**Solution**: Convert to number before passing to client

**Universal Serializer**:
```typescript
function serializeForClient(value: any): any {
  if (value === null || value === undefined) return value;
  
  // Prisma Decimal
  if (value?.constructor?.name === 'Decimal') {
    return Number(value.toString());
  }
  
  // Date objects
  if (value instanceof Date) return value.toISOString();
  
  // BigInt
  if (typeof value === 'bigint') return value.toString();
  
  // Arrays
  if (Array.isArray(value)) return value.map(serializeForClient);
  
  // Objects (recursive)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serializeForClient(v)])
    );
  }
  
  return value;
}
```

**Usage in Pages**:
```typescript
const order = await getCustomerOrderById(id);
const serializedOrder = serializeForClient(order);
return <OrderDetailClient order={serializedOrder} />;
```

### Date Handling
All dates stored as ISO strings when passed to client:
```typescript
createdAt: order.createdAt.toISOString()
```

Client components parse back to Date objects:
```typescript
const createdDate = new Date(order.createdAt);
```

---

## PERFORMANCE PATTERNS

### Parallel Data Fetching
Always use `Promise.all` for independent queries:
```typescript
const [orders, customers, products] = await Promise.all([
  getCustomerOrders(),
  getAllCustomers(),
  getAllProducts(),
]);
```

### Selective Field Loading
Include only needed relations:
```typescript
const order = await prisma.customerOrder.findUnique({
  where: { id },
  include: {
    orderLines: {
      include: {
        product: { select: { id: true, name: true, sku: true } },
        productVariant: { select: { id: true, displayName: true } }
      }
    },
    customer: { select: { id: true, name: true, contactName: true } }
  }
});
```

### Path Revalidation
Invalidate specific paths after mutations:
```typescript
revalidatePath('/admin/customer-orders-v2');
revalidatePath('/admin/production');
revalidatePath(`/worker/tasks`);
```

### Optimistic Updates
Client components use `useOptimistic` for instant feedback:
```typescript
const [optimisticOrders, addOptimisticOrder] = useOptimistic(
  orders,
  (state, newOrder) => [...state, newOrder]
);

const handleCreate = async (data) => {
  addOptimisticOrder({ ...data, id: 'temp' });
  const result = await createCustomerOrder(data);
  router.refresh(); // Fetch real data
};
```

---

## SECURITY & RBAC ENFORCEMENT

### Layout-Level Protection
All protected routes wrapped in RBAC layouts:
```typescript
// Admin layout
export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/admin/login');
  }
  
  if (!['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    redirect('/worker/dashboard');
  }
  
  return <UnifiedLayout>{children}</UnifiedLayout>;
}
```

### Server Action Protection
Every server action validates session and permissions:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) throw new Error('Unauthorized');

if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
  throw new Error('Insufficient permissions');
}
```

### Assignment-Based RBAC
Workers and inspectors can only access assigned tasks:
```typescript
// Worker tasks
const tasks = await prisma.operation.findMany({
  where: {
    assignedToId: session.user.id,
    productionOrder: { isActive: true }
  }
});

// Inspector checks
const checks = await prisma.qualityCheck.findMany({
  where: {
    inspectorId: session.user.inspectorId
  }
});
```

### Prisma Row-Level Security
All queries automatically scoped by user context:
```typescript
// No user can see other users' assignments
where: { assignedToId: session.user.id }

// No inspector can update other inspectors' checks
where: { 
  id: checkId,
  inspectorId: session.user.inspectorId 
}
```

---

## CONCLUSION & BEST PRACTICES

### Development Workflow
1. Admin creates customer order via multi-step form
2. Admin analyzes order to determine stock vs production needs
3. Admin creates production orders from analysis
4. System assigns operations to workers in designated work centers
5. Workers receive notifications and complete operations
6. Upon work center completion, inspectors are notified
7. Inspectors perform quality checks with sequential validation
8. Upon inspection completion, delivery team is notified
9. Delivery assignment auto-created if none exists
10. Full audit trail maintained via production order history logs

### Key Principles
- **Sequential Workflow Enforcement**: Inspections cannot start until work centers complete
- **Role-Based Data Scoping**: Each role sees only relevant data
- **Optimistic UI**: Instant feedback with server confirmation
- **Transaction Safety**: Multi-step operations wrapped in Prisma transactions
- **Path Revalidation**: Cache invalidation ensures fresh data
- **Comprehensive Logging**: All status changes logged for audit trail
- **Cross-Role Notifications**: Automated handoffs via notification system
- **Type Safety**: TypeScript + Zod validation throughout
- **Data Serialization**: Prisma types converted for client compatibility
- **Performance**: Parallel fetching, selective includes, efficient queries

### Common Gotchas
- Always serialize Prisma Decimals before passing to client components
- Use `export const dynamic = 'force-dynamic'` for user-specific pages
- Wrap multi-step operations in Prisma transactions
- Call `revalidatePath()` after mutations to refresh cached data
- Check RBAC at both layout and action levels for defense in depth
- Validate workflow prerequisites (e.g., work centers complete) before allowing next phase
- Handle notification failures gracefully (don't block core workflow)
- Test edge cases: empty results, partial data, concurrent updates

### Extending the System
To add new workflow phases:
1. Add new status to Prisma schema enums
2. Create phase validation helper (like `checkWorkCenterCompletion`)
3. Update status transition logic in relevant `updateTaskStatus` actions
4. Add notification triggers for new phase transitions
5. Update UI components to display new statuses
6. Add history logging for new phase completions
7. Update RBAC rules if new roles need access
8. Add tests for new workflow paths
