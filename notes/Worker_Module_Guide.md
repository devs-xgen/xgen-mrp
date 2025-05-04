# Worker Module Implementation Guide

**Last Updated:** 2023-05-23  
**Status:** In Progress  

## Overview

The Worker Module provides factory floor workers with the tools they need to manage production tasks, track inventory, report quality issues, and manage their work assignments. This document provides comprehensive guidance on the structure, features, and implementation details for the Worker module within the XGen MRP system.

## Module Structure

The Worker module follows a structured organization pattern aligned with the overall system architecture:

```
src/
├── app/
│   └── worker/
│       ├── (protected)/       # Protected worker routes
│       │   ├── dashboard/     # Worker dashboard
│       │   ├── inventory/     # Inventory management
│       │   │   ├── alerts/    # Inventory alerts
│       │   │   ├── export/    # Inventory export
│       │   │   └── request/   # Material requests
│       │   ├── tasks/         # Task management
│       │   │   └── [id]/      # Task details
│       │   ├── production/    # Production management
│       │   ├── profile/       # User profile
│       │   ├── settings/      # User settings
│       │   ├── qr-scanner/    # QR code scanner
│       │   └── orders/        # Orders management
│       └── (public)/          # Public routes
│           └── login/         # Worker login page
├── components/
│   └── module/
│       └── worker/           # Worker-specific components
│           ├── dashboard/    # Dashboard components
│           ├── inventory/    # Inventory components
│           ├── tasks/        # Task components
│           ├── production/   # Production components
│           ├── orders/       # Order components
│           └── profile/      # Profile components
├── lib/
│   └── actions/
│       └── worker/          # Worker-specific server actions
│           ├── tasks.ts     # Task management actions
│           ├── production.ts # Production-related actions
│           ├── inventory.ts  # Inventory-related actions
│           └── profile.ts    # Profile-related actions
└── types/
    └── worker/
        ├── index.ts         # Re-export all worker types
        ├── tasks.ts         # Task-related types
        ├── production.ts    # Production-related types
        ├── inventory.ts     # Inventory-related types
        └── profile.ts       # Profile-related types
```

## Key Features

### 1. Dashboard

The Worker Dashboard serves as the primary entry point for worker activities:

- **Task Summary**: Overview of assigned tasks and their statuses
- **Today's Schedule**: Timeline of tasks scheduled for the current day
- **Notifications**: Alerts for new tasks, inventory issues, and quality checks
- **Performance Metrics**: Personal productivity metrics and KPIs
- **Quick Actions**: Shortcuts to common activities like inventory checks

#### Implementation Details

- Use Server Components for the dashboard layout and data fetching
- Implement Client Components for interactive elements
- Fetch data using worker-specific server actions
- Update in real-time using Next.js streaming and revalidation

### 2. Task Management

The Tasks module allows workers to:

- **View Tasks**: See all assigned tasks with status, priority, and deadlines
- **Task Details**: View comprehensive information about each task
- **Update Status**: Mark tasks as in-progress, completed, or blocked
- **Time Tracking**: Log time spent on tasks
- **Notes & Documentation**: Add notes and attach photos/documents

#### Implementation Details

```typescript
// Example: Task Management Types (src/types/worker/tasks.ts)
import { Status } from "@prisma/client";

export interface WorkerTask {
  id: string;
  description: string;
  dueDate: Date;
  status: Status;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  notes?: string;
  productionOrderId?: string;
  workCenterId?: string;
}

export interface TaskUpdateInput {
  id: string;
  status: Status;
  notes?: string;
  startTime?: Date;
  endTime?: Date;
}
```

```typescript
// Example: Task Management Server Action (src/lib/actions/worker/tasks.ts)
'use server'

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TaskUpdateInput } from "@/types/worker/tasks";

export async function updateWorkerTask(
  taskId: string, 
  workerId: string, 
  data: TaskUpdateInput
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Update the operation/task
    await prisma.operation.update({
      where: { id: taskId },
      data: {
        status: data.status,
        notes: data.notes,
        startTime: data.startTime,
        endTime: data.endTime,
        performedById: workerId,
        modifiedBy: session.user.id
      }
    });

    revalidatePath("/worker/tasks");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}
```

### 3. Inventory Management

The Inventory module for workers provides:

- **Stock Checking**: View current inventory levels and location
- **Stock Movement**: Record material movements between locations
- **Low Stock Alerts**: View and respond to low stock situations
- **Material Requests**: Request materials needed for production
- **Inventory Reports**: Generate and export inventory reports

#### Key Components

- **InventoryList**: Displays paginated inventory items with filtering and sorting
- **InventoryFilters**: Provides filtering options by material type, stock level, etc.
- **StockStatusDashboard**: Visual overview of inventory health
- **InventoryExportButton**: Allows export of inventory data

### 4. Production Management

The Production module enables workers to:

- **Production Orders**: View and manage assigned production orders
- **Operation Steps**: Track progress through defined operation steps
- **Material Consumption**: Record materials used in production
- **Quality Reporting**: Report quality issues during production
- **Efficiency Tracking**: Track production efficiency and output

### 5. Worker Profile

The Profile section allows workers to:

- **Personal Information**: View and update personal details
- **Skills & Certifications**: Manage skills and certifications
- **Work History**: View historical work performance
- **Preferences**: Set notification and UI preferences

#### Profile Enhancements Roadmap

1. **Phase 1**: Basic profile with personal information
2. **Phase 2**: Add skills tracking and certification management
3. **Phase 3**: Implement performance history and metrics
4. **Phase 4**: Add gamification elements and achievements

### 6. QR Scanner

The QR Scanner feature allows workers to:

- **Scan Materials**: Quickly identify materials by scanning QR/barcodes
- **Scan Locations**: Identify storage locations via QR codes
- **Scan Production Orders**: Access production order details via QR codes
- **Scan Equipment**: Access equipment information and maintenance history

## Workflow Examples

### Task Completion Workflow

1. Worker views assigned tasks on dashboard
2. Selects a task to view details
3. Marks task as "In Progress" when starting work
4. Updates progress as work continues
5. Reports any issues encountered
6. Marks task as "Completed" when finished
7. System updates production order status accordingly

### Inventory Movement Workflow

1. Worker scans material QR code or searches for material
2. Enters quantity to be moved and destination location
3. System validates the movement (sufficient quantity, valid location)
4. Worker confirms the movement
5. System updates inventory records and transaction history
6. Movement is reflected in real-time inventory data

## Implementation Guidelines

### State Management

- Use React Context for global worker module state where appropriate
- Prefer server components for static content
- Use client components with useState/useReducer for interactive elements
- Implement optimistic UI updates for immediate feedback

### Performance Considerations

- Implement pagination for all list views (tasks, inventory, etc.)
- Use skeleton loaders for better perceived performance
- Implement debouncing for search/filter inputs
- Optimize for mobile devices and potentially poor connectivity

### Mobile Optimization

- Design mobile-first for all worker interfaces
- Implement touch-friendly UI elements
- Support offline functionality where possible
- Optimize for varying screen sizes and orientations

### Security Considerations

- Enforce strict permissions for worker module actions
- Implement data validation for all user inputs
- Log all critical operations for audit purposes
- Prevent access to data outside worker's assigned areas

## Related Documents

- [System Architecture](./System_Architecture.md)
- [Development Guidelines](./Development_Guidelines.md)
- [Role-Based Features](./Role_Based_Features.md)

## Change History

| Date | Description of Change |
|------|------------------------|
| 2023-05-23 | Initial document creation |

## Open Issues and Future Enhancements

1. **Offline Support**: Implement service workers for offline capabilities
2. **Push Notifications**: Add push notification support for task assignments
3. **Voice Commands**: Explore voice command integration for hands-free operation
4. **AR Integration**: Consider augmented reality for location finding
5. **Wearable Integration**: Explore integration with wearable devices 