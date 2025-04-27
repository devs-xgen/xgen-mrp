Try To create the best worker side of the system


# Suggested Organization for Worker-Side Features

Here's how I recommend organizing the worker-side functionality more clearly:

```
src/
├── app/
│   └── worker/
│       ├── (protected)/       # Protected routes
│       │   ├── dashboard/     # Worker dashboard
│       │   ├── inventory/     # Inventory management
│       │   ├── tasks/         # Task management (renamed from task for consistency)
│       │   ├── production/    # Production management
│       │   │   ├── quality/   # Quality control tasks
│       │   │   └── wip/       # Work in progress tracking
│       │   ├── orders/        # Orders management
│       │   │   └── shipments/ # Shipment management
│       │   ├── profile/       # User profile
│       │   └── settings/      # User settings
│       └── (public)/          # Public routes
│           └── login/         # Worker login page
├── components/
│   └── module/
│       └── worker/           # Worker-specific components
│           ├── dashboard/    # Dashboard components
│           ├── inventory/    # Inventory components
│           ├── tasks/        # Task components
│           ├── production/   # Production components
│           │   ├── quality/  # Quality control components
│           │   └── wip/      # Work in progress components
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

# Worker-Side Features and Navigation

Based on your navigation config (`src/config/nav.ts`) and the available worker pages, here are the key features that should be available to workers:

## 1. Dashboard
- Overview of assigned tasks
- Daily metrics
- Notifications for new tasks or updates
- Quick links to common actions
- Summary of work progress

## 2. Production Tasks
- Production orders assigned to the worker
- Task status management (Not Started, In Progress, Completed)
- Operation details and instructions
- Time tracking for tasks
- Priority indicators for urgent tasks

## 3. Quality Control
- Quality check forms
- Defect reporting
- Quality metrics and standards
- Approval workflows

## 4. Work in Progress (WIP)
- Current production status
- Materials being used
- Progress tracking
- Bottleneck identification

## 5. Inventory Management
- Material availability checking
- Stock level reporting
- Inventory location information
- Material requests/requisitions

## 6. Orders Management
- Customer order visibility
- Order fulfillment tasks
- Packaging and shipping instructions
- Order priority information

## 7. Profile Management
- Personal information
- Work history
- Skills and certifications
- Preferences

# Implementation Guide for Worker Actions

To keep your code organized when implementing worker-specific server actions, I recommend:

1. Create dedicated files in `src/lib/actions/worker/` for each feature area
2. Implement clear types in `src/types/worker/` 
3. Use consistent naming patterns

Here's a practical example for implementing task management for workers:

## Example: Task Management

1. First, define the types in `src/types/worker/tasks.ts`:

```typescript
// src/types/worker/tasks.ts
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
}
```

2. Then, implement the server actions in `src/lib/actions/worker/tasks.ts`:

```typescript
// src/lib/actions/worker/tasks.ts
'use server'

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import { TaskUpdateInput } from "@/types/worker/tasks";

// Get tasks assigned to the current worker
export async function getMyTasks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Find the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true }
    });

    const workCenterIds = userWorkCenters.map(uwc => uwc.workCenterId);

    // Get operations for these work centers
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] }
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        workCenter: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return operations.map(op => ({
      id: op.id,
      description: `${op.productionOrder.product.name} (${op.productionOrder.product.sku})`,
      startDate: op.startTime,
      dueDate: op.endTime,
      status: op.status,
      priority: op.productionOrder.priority,
      notes: op.notes,
      productionOrderId: op.productionOrderId,
      workCenterId: op.workCenterId,
      workCenterName: op.workCenter.name,
      quantity: op.productionOrder.quantity
    }));
  } catch (error) {
    console.error("Error fetching worker tasks:", error);
    throw new Error("Failed to fetch tasks");
  }
}

// Update task status
export async function updateTaskStatus(data: TaskUpdateInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Update the operation
    await prisma.operation.update({
      where: { id: data.id },
      data: {
        status: data.status,
        notes: data.notes,
        performedById: session.user.id,
        modifiedBy: session.user.id
      }
    });

    revalidatePath("/worker/tasks");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating task status:", error);
    throw new Error("Failed to update task status");
  }
}
```

3. Implement the Tasks page component in `src/app/worker/(protected)/tasks/page.tsx`:

```tsx
// src/app/worker/(protected)/tasks/page.tsx
import { Metadata } from "next";
import { TasksList } from "@/components/module/worker/tasks/TasksList";
import { getMyTasks } from "@/lib/actions/worker/tasks";

export const metadata: Metadata = {
  title: "My Tasks",
  description: "View and manage your assigned tasks",
};

export default async function TasksPage() {
  const tasks = await getMyTasks();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
        <p className="text-muted-foreground">
          View and manage your assigned production tasks
        </p>
      </div>
      
      <TasksList tasks={tasks} />
    </div>
  );
}
```

4. Create the tasks list component in `src/components/module/worker/tasks/TasksList.tsx`:

```tsx
// src/components/module/worker/tasks/TasksList.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTaskStatus } from "@/lib/actions/worker/tasks";
import { WorkerTask } from "@/types/worker/tasks";
import { Status } from "@prisma/client";
import { Clock, CheckCircle, Play, Pause } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface TasksListProps {
  tasks: WorkerTask[];
}

export function TasksList({ tasks }: TasksListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    try {
      setLoading(taskId);
      await updateTaskStatus({
        id: taskId,
        status: newStatus,
      });
      toast({
        title: "Task updated",
        description: `Task status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Group tasks by status
  const notStarted = tasks.filter(task => task.status === Status.PENDING);
  const inProgress = tasks.filter(task => task.status === Status.IN_PROGRESS);
  const completed = tasks.filter(task => task.status === Status.COMPLETED);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStarted.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Work Center</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b">
                    <td className="py-3">{task.description}</td>
                    <td className="py-3">{task.workCenterName}</td>
                    <td className="py-3">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          task.status === Status.IN_PROGRESS
                            ? "outline"
                            : task.status === Status.COMPLETED
                            ? "default"
                            : "secondary"
                        }
                      >
                        {task.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          task.priority === "URGENT"
                            ? "destructive"
                            : task.priority === "HIGH"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        {task.status === Status.PENDING && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            disabled={loading === task.id}
                            onClick={() => handleStatusChange(task.id, Status.IN_PROGRESS)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {task.status === Status.IN_PROGRESS && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              disabled={loading === task.id}
                              onClick={() => handleStatusChange(task.id, Status.PENDING)}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              disabled={loading === task.id}
                              onClick={() => handleStatusChange(task.id, Status.COMPLETED)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

# Summary and Recommendations

Based on your codebase and requirements, here are my recommendations for implementing the worker-side of your MRP system:

1. **Organize by Feature**: Structure your code by feature area (tasks, production, inventory, etc.) rather than by technical role (components, actions, etc.)

2. **Implement Worker-Specific Actions**: Create dedicated server actions for worker functionality in `src/lib/actions/worker/`

3. **Develop Clear Types**: Define clear TypeScript interfaces for all worker-related data in `src/types/worker/`

4. **Create Reusable Components**: Build worker-specific UI components in `src/components/module/worker/`

5. **Use Role-Based Authorization**: Ensure all worker actions validate the user's role and permissions

6. **Keep UI Task-Oriented**: Make the worker interface focused on daily tasks and current priorities

7. **Implement Real-Time Updates**: Consider adding real-time updates for important notifications

8. **Add Mobile Optimization**: Ensure the worker interface works well on tablets and mobile devices used on the production floor

By following these guidelines, you'll have a well-organized, maintainable codebase for the worker side of your MRP system. The key is to keep the worker functionality task-oriented and focused on the specific needs of production staff.