# Role-Based Features and Permissions

This document outlines the specific features and permissions available to each user role within the XGen MRP system.

## User Roles Overview

The system implements four distinct user roles with varying levels of access:

1. **Admin** - System administrators with full access
2. **Manager** - Department managers with approval authority
3. **Operator** - Regular staff handling day-to-day operations
4. **POS_Operator** - Staff focused on point-of-sale and customer-facing operations

## Detailed Role Permissions

### Admin Role

**Access Level**: Complete system access

**Permissions**:
- User management (create, edit, delete, assign roles)
- System configuration and settings
- All modules access with full CRUD operations
- Audit log access
- Database maintenance operations
- Report generation across all modules
- Approval authority for all operations
- System backup and restore

**Dashboard Focus**:
- System health metrics
- User activity statistics
- Critical alerts across all modules
- Key performance indicators

### Manager Role

**Access Level**: Department-specific full access

**Permissions**:
- Limited user management (view, edit non-admin users)
- Department-specific configuration
- Access to assigned modules with full CRUD operations
- Approval authority for:
  - Purchase orders above threshold
  - Production orders
  - Customer orders with special terms
  - Inventory adjustments
  - Quality control exceptions
- Report generation for assigned departments
- Dashboard customization

**Dashboard Focus**:
- Department performance metrics
- Resource utilization
- Pending approvals
- Department-specific KPIs

### Operator Role

**Access Level**: Task-specific access

**Permissions**:
- No user management
- Limited configuration (personal preferences only)
- Access to assigned modules with limited CRUD:
  - Create and read operations for most entities
  - Update operations for assigned tasks
  - Delete operations generally restricted
- Can initiate but not approve:
  - Purchase orders
  - Production orders
  - Inventory adjustments
- Basic report generation
- Limited dashboard customization

**Dashboard Focus**:
- Assigned tasks and deadlines
- Work queue
- Performance metrics
- Notifications for assigned areas

### POS_Operator Role

**Access Level**: Customer-facing operations only

**Permissions**:
- No user management
- No system configuration
- Limited module access:
  - Customer management (create, read, limited update)
  - Customer orders (create, read, limited update)
  - Inventory (read-only)
  - Products (read-only)
- Can create customer orders
- Can process payments
- Limited report generation (sales-related only)
- Minimal dashboard customization

**Dashboard Focus**:
- Daily sales targets
- Customer order status
- Product availability
- Payment processing status

## Module-Specific Permissions

### User Management Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Users | ✓ | ✓ (dept) | ✗ | ✗ |
| Create Users | ✓ | ✗ | ✗ | ✗ |
| Edit Users | ✓ | ✓ (dept) | ✗ | ✗ |
| Delete Users | ✓ | ✗ | ✗ | ✗ |
| Assign Roles | ✓ | ✗ | ✗ | ✗ |
| Reset Passwords | ✓ | ✓ (dept) | ✗ | ✗ |

### Supplier Management Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Suppliers | ✓ | ✓ | ✓ | ✗ |
| Create Suppliers | ✓ | ✓ | ✓ | ✗ |
| Edit Suppliers | ✓ | ✓ | ✓ | ✗ |
| Delete Suppliers | ✓ | ✓ | ✗ | ✗ |
| Supplier Performance | ✓ | ✓ | ✓ | ✗ |

### Customer Management Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Customers | ✓ | ✓ | ✓ | ✓ |
| Create Customers | ✓ | ✓ | ✓ | ✓ |
| Edit Customers | ✓ | ✓ | ✓ | ✓ (limited) |
| Delete Customers | ✓ | ✓ | ✗ | ✗ |
| Set Credit Limits | ✓ | ✓ | ✗ | ✗ |

### Product Management Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Products | ✓ | ✓ | ✓ | ✓ |
| Create Products | ✓ | ✓ | ✓ | ✗ |
| Edit Products | ✓ | ✓ | ✓ | ✗ |
| Delete Products | ✓ | ✓ | ✗ | ✗ |
| Manage BOM | ✓ | ✓ | ✓ | ✗ |
| Set Pricing | ✓ | ✓ | ✗ | ✗ |

### Materials Management Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Materials | ✓ | ✓ | ✓ | ✗ |
| Create Materials | ✓ | ✓ | ✓ | ✗ |
| Edit Materials | ✓ | ✓ | ✓ | ✗ |
| Delete Materials | ✓ | ✓ | ✗ | ✗ |
| Set Min Levels | ✓ | ✓ | ✗ | ✗ |

### Purchase Orders Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View POs | ✓ | ✓ | ✓ | ✗ |
| Create POs | ✓ | ✓ | ✓ | ✗ |
| Edit POs | ✓ | ✓ | ✓ (draft) | ✗ |
| Delete POs | ✓ | ✓ | ✗ | ✗ |
| Approve POs | ✓ | ✓ | ✗ | ✗ |
| Receive Materials | ✓ | ✓ | ✓ | ✗ |

### Customer Orders Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Orders | ✓ | ✓ | ✓ | ✓ (assigned) |
| Create Orders | ✓ | ✓ | ✓ | ✓ |
| Edit Orders | ✓ | ✓ | ✓ (draft) | ✓ (draft) |
| Delete Orders | ✓ | ✓ | ✗ | ✗ |
| Process Payments | ✓ | ✓ | ✓ | ✓ |
| Apply Discounts | ✓ | ✓ | ✗ | ✗ |

### Production Planning Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Production Orders | ✓ | ✓ | ✓ | ✗ |
| Create Production Orders | ✓ | ✓ | ✓ | ✗ |
| Edit Production Orders | ✓ | ✓ | ✓ (draft) | ✗ |
| Delete Production Orders | ✓ | ✓ | ✗ | ✗ |
| Schedule Production | ✓ | ✓ | ✓ | ✗ |
| Update Production Status | ✓ | ✓ | ✓ | ✗ |

### Inventory Management Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View Inventory | ✓ | ✓ | ✓ | ✓ (limited) |
| Adjust Inventory | ✓ | ✓ | ✓ | ✗ |
| Approve Adjustments | ✓ | ✓ | ✗ | ✗ |
| Stock Transfers | ✓ | ✓ | ✓ | ✗ |
| Inventory Counts | ✓ | ✓ | ✓ | ✗ |

### Quality Control Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| View QC Checks | ✓ | ✓ | ✓ | ✗ |
| Create QC Checks | ✓ | ✓ | ✓ | ✗ |
| Edit QC Checks | ✓ | ✓ | ✓ (draft) | ✗ |
| Delete QC Checks | ✓ | ✓ | ✗ | ✗ |
| Approve/Reject QC | ✓ | ✓ | ✗ | ✗ |
| Corrective Actions | ✓ | ✓ | ✓ | ✗ |

### Reporting Module

| Feature | Admin | Manager | Operator | POS_Operator |
|---------|-------|---------|----------|--------------|
| Production Reports | ✓ | ✓ | ✓ (limited) | ✗ |
| Inventory Reports | ✓ | ✓ | ✓ (limited) | ✗ |
| Financial Reports | ✓ | ✓ | ✗ | ✗ |
| Sales Reports | ✓ | ✓ | ✓ (limited) | ✓ (limited) |
| Custom Reports | ✓ | ✓ | ✗ | ✗ |
| Export Reports | ✓ | ✓ | ✓ | ✓ (limited) |

## Implementation Notes

1. **Role Hierarchy**:
   - Admin > Manager > Operator > POS_Operator
   - Higher roles inherit permissions from lower roles

2. **Department Filtering**:
   - Managers should only see data relevant to their departments
   - Implement data filtering based on department assignment

3. **Approval Workflows**:
   - Implement multi-level approval for critical operations
   - Configure approval thresholds (e.g., PO value limits)

4. **Audit Logging**:
   - Log all permission-sensitive operations
   - Track who performed what action and when

5. **UI Adaptations**:
   - Hide unauthorized features from the UI
   - Disable actions that require higher permissions
   - Provide clear feedback when permission is denied 