# Worker Portal Technical Overview

## Mission & Persona Fit
The worker portal empowers production floor staff to execute assigned operations, update progress, manage material interactions, and surface issues in real time while staying focused on their specific work centers.@docs/roles/worker/README.md#1-28

## Access Control & Layout
- **Protected Layout** – Only `WORKER` role sessions can access protected routes. UnifiedLayout redirects other roles to the admin dashboard and provides consistent theming/shell behavior.@src/app/worker/(protected)/layout.tsx#1-18
- **Login Route** – `/worker/login` (shared login component) hosts the credential screen tied to the worker persona.

## Primary Responsibilities
- Execute production operations, update task status, and log notes.
- Track daily task load, completion, and urgency metrics.
- Monitor the health of assigned work centers and upcoming commitments.
- Reference read-only inventory data, alerts, and usage to avoid shortages.
- Provide immediate feedback through QR scanning, support channels, and inspection readiness.

## Navigation Structure
The worker sidebar (via `getNavItems("WORKER")`) offers quick entry to dashboard, tasks, QR scanner, inventory, support, and settings—keeping focus on mission-critical workflows.@src/config/nav.ts#184-296 @src/components/shared/AppSidebar.tsx#208-398

## Key Modules
### Dashboard (`/worker/dashboard`)
Aggregates task stats (`getTaskStatistics`), today’s tasks (`getTodaysTasks`), assigned work centers, upcoming operations, and recent activity for the logged-in worker. Layout includes:
- **StatsCards** – Pending, in-progress, completed, and urgent counts.@src/components/module/worker/dashboard/StatsCards.tsx#1-53
- **QuickActionsCard** – Jump points to Tasks, Operations, QR Scanner, and Inventory.@src/components/module/worker/dashboard/QuickActionsCard.tsx#1-43
- **WorkCentersCard / UpcomingDeadlinesCard / DailyProgressCard / RecentActivityCard** – Context-specific tiles fed by worker-focused server actions.@src/app/worker/(protected)/dashboard/page.tsx#1-83 @src/lib/actions/worker/dashboard.ts#1-113

### Tasks (`/worker/tasks`)
Server-rendered table of production orders leveraged by workers. Currently mirrors admin production table structure—showing analytics cards, quick filters, and data table for visibility of all orders impacting the worker’s stations.@src/app/worker/(protected)/tasks/page.tsx#1-181

### Task Operations (`/worker/tasks/operations`)
Interactive client experience for managing operations assigned to the worker:
- Fetches detailed production orders with phases via `getMyTasks` + `getProductionOrderDetailsWithPhases`.
- Groups operations by production order and surfaces `OperationTaskManager` cards for status updates, note logging, and schedule context.
- Enforces RBAC on update actions through `updateTaskStatus`, ensuring only assigned workers can change status.@src/app/worker/(protected)/tasks/operations/page.tsx#1-200 @src/components/module/worker/tasks/OperationTaskManager.tsx#1-416 @src/lib/actions/worker/tasks.ts#1-200

### Production Tasks (`/worker/production`)
Provides summarized metrics (pending, in progress, completed, active orders) and embeds `WorkerProductionTasks` for real-time interaction with assigned tasks.@src/app/worker/(protected)/production/page.tsx#1-107

### Task Detail (`/worker/tasks/[id]`)
Reuses production-order detail template with worker-aware gating (via `getCurrentUserRole`) and includes QR generator and workflow buttons when role permissions allow. Used for deep dives into a single production order from the worker perspective.@src/app/worker/(protected)/tasks/[id]/page.tsx#1-200

### QR Scanner (`/worker/qr-scanner`)
Client component enabling workers to scan production order QR codes for quick status updates or upload code images. Provides instructions, pro tips, and link back to operations.@src/app/worker/(protected)/qr-scanner/page.tsx#1-142 @src/components/module/worker/tasks/QRScanner.tsx

### Inventory (`/worker/inventory`)
Read-only materials inventory view tailored for workers:
- Uses `getWorkerMaterialInventory`, `getMaterialTypes`, and `getSuppliers` to build a filtered, paginated dataset.
- Presents stock status KPIs, tabbed lists, and supplier/type filters without write access.
- Links to inventory alerts.
@src/app/worker/(protected)/inventory/page.tsx#1-182 @src/lib/actions/worker/inventory.ts

### Inventory Alerts (`/worker/inventory/alerts`)
Displays read-only issue reports via `getInventoryIssueReports`, reminding workers to escalate through supervisors when necessary.@src/app/worker/(protected)/inventory/alerts/page.tsx#1-88

### Support (`/worker/support`) & Settings (`/worker/settings`)
- Support embeds the shared chat/ticket interface with worker context.
- Settings provide profile and password management using worker-specific forms.
@src/app/worker/(protected)/support/page.tsx # @src/components/module/worker/profile/*.tsx

## Data & Server Actions
- Worker task fetching honors RBAC by filtering on `assignedToId`, work centers, and production order status before exposing a task list. Paused tasks from pending orders are included but marked inactive for context.@src/lib/actions/worker/tasks.ts#1-136
- Dashboard actions (assigned work centers, upcoming operations, recent activity) rely on the authenticated worker’s session to scope Prisma queries.@src/lib/actions/worker/dashboard.ts#31-112

## UX & Interaction Patterns
- Pages adopt shared `PageContainer`, `PageHeader`, and `SectionCard` primitives to stay visually aligned with admin while simplifying content density for workers.@src/components/shared/page-layout.tsx#1-84
- Client components are reserved for high-interaction surfaces (task operations manager, QR scanner, analytics modals), keeping base pages server-rendered for performance.
- `Promise.all` batching is used across dashboards to minimize time-to-first-byte for aggregated views.@src/app/worker/(protected)/dashboard/page.tsx#31-38 @src/app/worker/(protected)/production/page.tsx#30-35

## Reference Materials
- Worker role playbook and SOPs.@docs/roles/worker/README.md#1-246
- Worker-specific server actions and task typing definitions.@src/lib/actions/worker/tasks.ts @src/types/worker/tasks.ts
- Navigation schema and layout guidelines shared with other portals.@src/config/nav.ts#184-296 @notes/AIRules/README.md#1-563
