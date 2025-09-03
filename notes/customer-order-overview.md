# Customer Order System Overview

## What is a Customer Order?

A **Customer Order** is the foundational business entity in the XGen MRP system that represents a formal purchase request from a customer. It serves as the central coordination point that drives multiple business processes including inventory management, production planning, fulfillment, and billing.

## Customer Order Structure

### Core Entity: CustomerOrder

Based on the Prisma schema, the `CustomerOrder` model contains:

```typescript
CustomerOrder {
  id: string                    // Unique identifier (CUID)
  orderNumber: string           // Human-readable order number (unique)
  customerId: string            // Reference to Customer
  orderDate: DateTime           // When the order was placed
  requiredDate: DateTime        // When customer needs delivery
  status: Status               // Current order status
  totalAmount: Decimal         // Total monetary value
  shippingAddress?: string     // Delivery address
  billingAddress?: string      // Billing address
  notes?: string              // Additional instructions
  createdAt: DateTime         // System creation timestamp
  updatedAt: DateTime         // Last modification timestamp
  createdBy?: string          // User who created the order
  modifiedBy?: string         // User who last modified
}
```

### Related Entities

#### 1. OrderLine (Order Items)
Each customer order contains one or more order lines representing individual products:

```typescript
OrderLine {
  id: string
  orderId: string              // Links to CustomerOrder
  productId: string            // Product being ordered
  productVariantId?: string    // Specific variant if applicable
  quantity: number             // Quantity requested
  unitPrice: Decimal          // Price per unit
  status: Status              // Line-specific status
  
  // Fulfillment Tracking
  fulfillmentType?: FulfillmentType    // PENDING | STOCK | PRODUCTION | HYBRID
  stockAllocated?: number              // Quantity from existing inventory
  productionQuantity?: number          // Quantity requiring production
  fulfillmentStatus?: FulfillmentStatus // PENDING | ALLOCATED | PARTIALLY_FULFILLED | FULFILLED | CANCELLED
  allocatedAt?: DateTime              // When stock was allocated
  fulfilledAt?: DateTime              // When order was fulfilled
}
```

#### 2. OrderLineVariant
For products with multiple variants (size, color, style):

```typescript
OrderLineVariant {
  id: string
  orderLineId: string         // Links to OrderLine
  variantId: string          // Links to ProductVariant
  quantity: number           // Quantity of this specific variant
  unitPrice: Decimal        // Price for this variant
}
```

## Key Relationships

### Customer Relationship
- **Customer**: Every order belongs to a customer (`customerId`)
- **Customer Details**: Name, contact info, billing preferences
- **Order History**: Track customer's ordering patterns

### Product & Inventory Relationships
- **Products**: Items being ordered with specifications
- **Product Variants**: Size, color, material variations
- **Inventory**: Stock availability and allocation
- **Materials**: Raw materials needed for production

### Production Integration
- **Production Orders**: Generated for items requiring manufacturing
- **Material Requirements**: BOM calculations for production
- **Work Center Assignment**: Production scheduling
- **Quality Control**: Inspection requirements

### Financial Integration
- **Billing Statements**: Financial documents for payment
- **Sales Invoices**: Detailed invoicing
- **Transactions**: Payment processing
- **Delivery Receipts**: Proof of delivery

## Order Lifecycle

### 1. Order Creation
- Customer submits order request
- Order number generated automatically
- Initial status: `PENDING`
- Order lines created with product details

### 2. Order Validation
- Product availability check
- Customer credit verification
- Pricing validation
- Address verification

### 3. Fulfillment Planning
- **Stock Check**: Verify available inventory
- **Production Planning**: Identify items needing production
- **Material Availability**: Check raw material requirements
- **Capacity Planning**: Assess production capacity

### 4. Fulfillment Execution
- **Stock Allocation**: Reserve available inventory
- **Production Orders**: Create manufacturing orders
- **Material Reservation**: Reserve raw materials
- **Production Scheduling**: Assign to work centers

### 5. Order Processing
- **Production Monitoring**: Track manufacturing progress
- **Quality Control**: Inspect finished goods
- **Inventory Updates**: Update stock levels
- **Fulfillment Tracking**: Monitor completion status

### 6. Delivery & Billing
- **Delivery Scheduling**: Plan shipment
- **Billing Generation**: Create financial documents
- **Delivery Confirmation**: Track delivery status
- **Payment Processing**: Handle customer payments

## Status Management

### Order Status Values
- **PENDING**: Order received, awaiting processing
- **IN_PROGRESS**: Order being fulfilled
- **COMPLETED**: Order fully delivered
- **CANCELLED**: Order cancelled
- **ON_HOLD**: Order temporarily suspended
- **ARCHIVED**: Order moved to historical records

### Fulfillment Types
- **PENDING**: Fulfillment method not determined
- **STOCK**: Fulfilled from existing inventory
- **PRODUCTION**: Requires manufacturing
- **HYBRID**: Mix of stock and production

### Fulfillment Status
- **PENDING**: Awaiting fulfillment action
- **ALLOCATED**: Resources assigned
- **PARTIALLY_FULFILLED**: Some items delivered
- **FULFILLED**: All items delivered
- **CANCELLED**: Fulfillment cancelled

## Business Rules

### Order Creation Rules
1. Must have valid customer reference
2. Must have at least one order line
3. Required date must be in the future
4. Unit prices must be positive
5. Quantities must be positive integers

### Fulfillment Rules
1. Stock allocation on first-come, first-served basis
2. Production orders created for insufficient stock
3. Material availability checked before production
4. Quality checks required for produced items

### Financial Rules
1. Total amount calculated from order lines
2. Taxes applied based on customer location
3. Discounts applied based on customer terms
4. Payment terms based on customer agreement

## Integration Points

### Production System
- **Material Requirements Planning (MRP)**: Calculate material needs
- **Production Scheduling**: Assign orders to production slots
- **Capacity Planning**: Balance workload across work centers
- **Quality Management**: Ensure product quality standards

### Inventory System
- **Stock Allocation**: Reserve inventory for orders
- **Stock Tracking**: Monitor inventory levels
- **Reorder Triggers**: Automatic purchase order generation
- **Cycle Counting**: Maintain inventory accuracy

### Financial System
- **Billing Automation**: Generate invoices and statements
- **Payment Tracking**: Monitor payment status
- **Revenue Recognition**: Financial reporting
- **Cost Accounting**: Track order profitability

### Customer Management
- **Order History**: Track customer ordering patterns
- **Delivery Preferences**: Maintain delivery instructions
- **Communication**: Order status notifications
- **Support Integration**: Handle order-related inquiries

## Data Integrity & Audit Trail

### Audit Fields
- **createdAt/updatedAt**: System timestamps
- **createdBy/modifiedBy**: User tracking
- **version control**: Change history

### Data Validation
- **Foreign Key Constraints**: Ensure referential integrity
- **Check Constraints**: Validate business rules
- **Unique Constraints**: Prevent duplicates

### Security Considerations
- **Role-based Access**: Control order visibility
- **Data Encryption**: Protect sensitive information
- **Audit Logging**: Track all order changes

## Performance Considerations

### Database Optimization
- **Indexing Strategy**: Optimize query performance
- **Partitioning**: Handle large order volumes
- **Archiving**: Move old orders to archive tables

### Caching Strategy
- **Order Status Cache**: Frequently accessed data
- **Customer Cache**: Speed up customer lookups
- **Product Cache**: Optimize product information

### Scalability
- **Horizontal Scaling**: Support growing order volumes
- **Load Balancing**: Distribute processing load
- **Asynchronous Processing**: Handle time-intensive operations

This Customer Order system forms the backbone of the XGen MRP platform, orchestrating the flow from customer request to final delivery while maintaining complete traceability and control throughout the process.
