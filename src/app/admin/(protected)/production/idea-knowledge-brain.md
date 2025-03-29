# Production System Documentation

## Overview of Manufacturing Workflow in XGen MRP

This documentation provides a comprehensive understanding of the production system implemented in XGen MRP, detailing the flow of data and processes from customer orders through production to delivery. It covers the relationships between key entities such as customers, orders, products, materials, production orders, work centers, and quality control.

## Table of Contents

1. [Core Entities and Relationships](#core-entities-and-relationships)
2. [Customer Order Process](#customer-order-process)
3. [Production Order Process](#production-order-process)
4. [Material Requirements Planning](#material-requirements-planning)
5. [Work Centers and Operations](#work-centers-and-operations)
6. [Quality Control Process](#quality-control-process)
7. [Inventory Management](#inventory-management)
8. [Complete Workflow](#complete-workflow)
9. [System Interactions](#system-interactions)

## Core Entities and Relationships

### Customer Order
- Represents a customer's request for products
- Contains multiple order lines (items ordered)
- Tracks customer information, delivery dates, payment terms
- One customer order can generate multiple production orders

### Order Line
- Individual item in a customer order
- Links to a specific product
- Contains quantity and unit price
- Each order line may trigger production if inventory is insufficient

### Product
- Finished goods that can be sold to customers
- Has a Bill of Materials (BOM) defining required materials
- Tracked in inventory with minimum stock levels
- Subject to production processes

### Production Order
- Instruction to manufacture a specific quantity of a product
- Links to a product and optionally to a customer order
- Contains one or more operations to be performed at work centers
- Tracks status, priority, and timeline

### Materials
- Raw components required to manufacture products
- Defined in the Bill of Materials (BOM) for each product
- Tracked in inventory with minimum stock levels
- Procured through purchase orders from suppliers

### Work Center
- Physical location or machine where manufacturing operations occur
- Has capacity, efficiency, and operating hours defined
- Operations are scheduled at specific work centers
- Each production order may involve multiple work centers

### Operation
- Specific manufacturing step within a production order
- Assigned to a particular work center
- Has scheduled start and end times
- Tracks status (Pending, In Progress, Completed)

### Quality Check
- Inspection carried out on production orders
- Performed by qualified inspectors
- Records defects found and corrective actions
- Influences production order completion

## Customer Order Process

### Step 1: Customer Order Creation
1. Customer places an order
2. System creates a CustomerOrder record with:
   - Unique order number
   - Customer details
   - Required date
   - Payment terms
   - Shipping information

### Step 2: Order Line Creation
1. For each product ordered:
   - Create an OrderLine record
   - Link to corresponding Product
   - Specify quantity and unit price
   - Calculate line total

### Step 3: Inventory Check
1. For each order line:
   - Check if sufficient product quantity exists in inventory
   - If yes, allocate inventory (update committedStock)
   - If no, create a production order (if product is manufactured in-house)

### Step 4: Order Confirmation
1. Total order amount calculated
2. Order status set to "PENDING"
3. Order confirmation sent to customer

### Example in Code
```typescript
// Creating Customer Order and Order Lines
const order = await prisma.customerOrder.create({
  data: {
    orderNumber,
    customerId: data.customerId,
    orderDate: new Date(),
    requiredDate: new Date(data.requiredDate),
    status: Status.PENDING,
    totalAmount: new Decimal(totalAmount),
    notes: data.notes,
    orderLines: {
      create: data.orderLines.map(line => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: new Decimal(line.unitPrice),
        status: Status.PENDING
      }))
    }
  },
  include: {
    customer: true,
    orderLines: {
      include: {
        product: true
      }
    }
  }
});
```

## Production Order Process

### Step 1: Production Order Creation
1. Created automatically from customer order lines OR
2. Created manually for inventory replenishment
3. Each production order references:
   - Single Product to be manufactured
   - Quantity needed
   - Priority level
   - Start and due dates
   - Optional reference to customer order

### Step 2: Bill of Materials Explosion
1. System retrieves BOM for the product
2. Calculates total material requirements based on:
   - Production quantity
   - Material quantities from BOM
   - Waste percentage factors

### Step 3: Operations Planning
1. Define required operations based on product
2. Assign operations to appropriate work centers
3. Schedule operations with start and end times
4. Consider work center capacity and efficiency

### Step 4: Material Reservation
1. Check material availability in inventory
2. Reserve required materials for production
3. Create purchase orders for missing materials if needed

### Step 5: Production Execution
1. Production order status changes to "IN_PROGRESS"
2. Operations move from "PENDING" to "IN_PROGRESS" to "COMPLETED"
3. Material consumption recorded during operations
4. Progress tracked through individual operation statuses

### Step 6: Quality Inspection
1. Create quality checks at specified stages
2. Inspectors perform quality assessments
3. Record defects and corrective actions
4. Approve or reject production batches

### Step 7: Production Completion
1. All operations marked as "COMPLETED"
2. All required quality checks passed
3. Finished product added to inventory
4. Production order status changed to "COMPLETED"
5. Customer order updated if linked

### Example in Code
```typescript
// Creating a Production Order
const order = await prisma.productionOrder.create({
  data: {
    productId: data.productId,
    quantity: data.quantity,
    startDate: data.startDate,
    dueDate: data.dueDate,
    priority: data.priority,
    customerOrderId: data.customerOrderId,
    notes: data.notes || null,
    status: Status.PENDING,
    createdBy: session.user.id,
    operations: {
      create: data.operations.map(op => ({
        workCenterId: op.workCenterId,
        startTime: op.startTime,
        endTime: op.endTime,
        status: Status.PENDING
      }))
    }
  },
  include: {
    product: true,
    operations: {
      include: {
        workCenter: true
      }
    }
  }
});
```

## Material Requirements Planning

### Material Definition
- Materials are defined in the Material model:
  - Name, SKU, specifications
  - Unit of measure
  - Cost per unit
  - Supplier information
  - Minimum stock levels

### Bill of Materials (BOM)
- BOM defines materials needed to produce a product
- Each BOM entry includes:
  - Material reference
  - Quantity needed per unit
  - Waste percentage (for scrap/loss calculation)

### Material Requirements Calculation
1. For each production order:
   - Get product's BOM
   - Multiply BOM quantities by production quantity
   - Add waste percentage allowance
   - Generate total material requirements

### Material Procurement
1. System compares material requirements with available inventory
2. For shortfalls, create purchase requisitions
3. Convert to purchase orders to suppliers
4. Track expected delivery against production schedule

### Material Consumption
1. Materials are issued to production
2. Actual consumption recorded against planned quantities
3. Variances captured for analysis
4. Inventory updated accordingly

### Example of Material Calculation
```typescript
// Calculating material requirements for a production order
async function calculateMaterialRequirements(productId: string, quantity: number) {
  const bom = await prisma.bOM.findMany({
    where: { productId },
    include: { material: true }
  });
  
  return bom.map(item => {
    const requiredQuantity = Number(item.quantityNeeded) * quantity;
    const wasteAmount = requiredQuantity * (Number(item.wastePercentage) / 100);
    const totalRequired = requiredQuantity + wasteAmount;
    
    return {
      materialId: item.materialId,
      materialName: item.material.name,
      quantityRequired: totalRequired,
      available: item.material.currentStock,
      shortfall: Math.max(0, totalRequired - item.material.currentStock)
    };
  });
}
```

## Work Centers and Operations

### Work Center Configuration
- Work centers represent manufacturing resources:
  - Production lines, machines, assembly stations
  - Defined capacity (units per hour)
  - Operating hours
  - Efficiency rate
  - Status (active/inactive)

### Operation Definition
- Operations are steps in the manufacturing process:
  - Assigned to specific work centers
  - Have planned start and end times
  - Estimated costs
  - Status tracking

### Capacity Planning
1. System evaluates work center availability
2. Considers existing scheduled operations
3. Accounts for operating hours and efficiency
4. Calculates viable operation schedules

### Operation Scheduling
1. Operations are sequenced based on product requirements
2. Each operation is assigned to an appropriate work center
3. Start and end times determined based on:
   - Work center capacity
   - Operation duration
   - Preceding operations

### Execution Tracking
1. Operations progress from "PENDING" to "IN_PROGRESS"
2. Actual start and end times recorded
3. Actual costs captured
4. Completion status updated

### Example in Code
```typescript
// Adding an Operation to a Production Order
export async function addOperation(
  productionOrderId: string,
  data: {
    workCenterId: string
    startTime: Date
    endTime: Date
    notes?: string
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Unauthorized');

    const operation = await prisma.operation.create({
      data: {
        workCenterId: data.workCenterId,
        productionOrderId,
        startTime: data.startTime,
        endTime: data.endTime,
        status: Status.PENDING,
        notes: data.notes || null,
        createdBy: session.user.id
      },
      include: {
        workCenter: true
      }
    });

    revalidatePath(`/admin/production/${productionOrderId}`);
    return operation;
  } catch (error) {
    console.error('Error creating operation:', error);
    throw error;
  }
}
```

## Quality Control Process

### Quality Check Definition
- Quality checks ensure product meets standards:
  - Linked to production orders
  - Performed by qualified inspectors
  - Can occur at various stages of production
  - Include detailed inspection criteria

### Inspector Management
- Inspectors are qualified personnel:
  - Have specific qualifications and certifications
  - May specialize in particular product types
  - Track performance metrics
  - Can be assigned to specific quality checks

### Quality Check Process
1. Quality check created for production order
2. Inspector assigned to perform check
3. Inspection conducted against quality standards
4. Results recorded:
   - Pass/fail status
   - Defects found
   - Corrective actions taken
   - Additional notes

### Quality Metrics
1. System tracks quality-related metrics:
   - Defect rates
   - Pass/fail percentages
   - Inspector performance
   - Recurring quality issues

### Corrective Actions
1. Failed quality checks trigger corrective actions:
   - Rework instructions
   - Material replacement
   - Process adjustments
   - Additional inspections

### Example in Code
```typescript
// Creating a Quality Check
export async function createQualityCheck(data: CreateQualityCheckInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Unauthorized');

    const check = await prisma.qualityCheck.create({
      data: {
        productionOrder: {
          connect: { 
            id: data.productionOrderId 
          },
        },
        inspectorId: data.inspectorId,
        checkDate: data.checkDate,
        status: Status.PENDING,
        defectsFound: data.defectsFound || null,
        actionTaken: data.actionTaken || null,
        notes: data.notes || null,
        createdBy: session.user.id,
      },
      include: {
        productionOrder: {
          include: {
            product: true
          }
        }
      }
    });

    revalidatePath('/admin/quality-checks');
    revalidatePath(`/admin/production/${data.productionOrderId}`);
    return check;
  } catch (error) {
    console.error('Error creating quality check:', error);
    throw error;
  }
}
```

## Inventory Management

### Product Inventory
- Tracks finished goods:
  - Current stock
  - Minimum stock levels
  - Expected stock (incoming)
  - Committed stock (reserved for orders)
  - Calculated stock (current + expected - committed)

### Material Inventory
- Tracks raw materials:
  - Current stock
  - Minimum stock levels
  - Reserved quantities
  - On-order quantities

### Inventory Transactions
1. Various transactions affect inventory:
   - Production order completion (increase product inventory)
   - Material issues to production (decrease material inventory)
   - Customer order fulfillment (decrease product inventory)
   - Supplier deliveries (increase material inventory)

### Inventory Planning
1. System monitors inventory levels against thresholds
2. Generates alerts for approaching minimum levels
3. Factors in:
   - Pending customer orders
   - In-progress production
   - Open purchase orders

### Example Inventory Update
```typescript
// Updating inventory after production completion
async function updateInventoryAfterProduction(productionOrder) {
  // Update product inventory
  await prisma.product.update({
    where: { id: productionOrder.productId },
    data: {
      currentStock: {
        increment: productionOrder.quantity
      },
      expectedStock: {
        decrement: productionOrder.quantity
      }
    }
  });
  
  // Update material inventory (consumption)
  for (const material of productionOrder.materials) {
    await prisma.material.update({
      where: { id: material.id },
      data: {
        currentStock: {
          decrement: material.quantityUsed
        }
      }
    });
  }
}
```

## Complete Workflow

### 1. Customer Order Entry
- Customer places order for products
- System creates customer order with order lines
- Availability check performed

### 2. Production Planning
- System generates production orders for unavailable items
- BOM explosion to determine material requirements
- Material availability checked

### 3. Purchase Order Creation
- Missing materials identified
- Purchase orders created to suppliers
- Delivery dates confirmed

### 4. Production Scheduling
- Operations defined for each production order
- Work centers assigned
- Operations scheduled with start/end times

### 5. Material Issue
- Materials issued to production
- Inventory updated
- Consumption tracked

### 6. Production Execution
- Operations performed in sequence
- Status updates recorded
- Completion times logged

### 7. Quality Control
- Inspections performed during and after production
- Defects identified and addressed
- Quality data recorded

### 8. Production Completion
- Finished products added to inventory
- Associated customer orders updated
- Production costs calculated

### 9. Order Fulfillment
- Products picked from inventory
- Customer orders marked for shipping
- Delivery arranged

### 10. Order Closure
- Customer confirms receipt
- Payment processed
- Order marked as completed

## System Interactions

### Database Relationships
- **CustomerOrder**:
  - Has many OrderLine records (items ordered)
  - Has many ProductionOrder records (manufacturing instructions)
  - Belongs to one Customer

- **OrderLine**:
  - Belongs to one CustomerOrder
  - References one Product

- **Product**:
  - Has many BOM entries (materials needed)
  - Has many ProductionOrder records (manufacturing instances)
  - Has many OrderLine records (instances in customer orders)

- **ProductionOrder**:
  - Belongs to one Product (item being manufactured)
  - Optionally belongs to one CustomerOrder
  - Has many Operation records (manufacturing steps)
  - Has many QualityCheck records (inspection points)

- **Material**:
  - Appears in many BOM entries (where used)
  - Has many PurchaseOrderLine records (procurement instances)
  - Belongs to one Supplier

- **WorkCenter**:
  - Has many Operation records (work performed)

- **Operation**:
  - Belongs to one ProductionOrder
  - Belongs to one WorkCenter

- **QualityCheck**:
  - Belongs to one ProductionOrder
  - Performed by an Inspector

### User Interactions

- **Manager Role**:
  - Reviews and approves customer orders
  - Plans production
  - Approves purchase orders
  - Monitors production progress
  - Reviews quality metrics

- **Operator Role**:
  - Records operation progress
  - Logs material consumption
  - Updates production status
  - Reports production issues

- **Quality Inspector Role**:
  - Performs quality checks
  - Records inspection results
  - Identifies and documents defects
  - Approves or rejects production batches

---

This documentation provides a comprehensive overview of the production system within XGen MRP. It details the relationships between different entities and the flow of processes from customer order to delivery, with special emphasis on production planning, material requirements, work center operations, and quality control.