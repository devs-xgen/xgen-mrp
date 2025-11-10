// // src/components/module/inspectors/dashboard/InspectorDashboardClient.tsx
// "use client";

// import { useState, useCallback, useMemo, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   ClipboardList,
//   AlertTriangle,
//   CheckCircle,
//   Clock,
//   Search,
//   RefreshCw,
//   Factory,
//   Edit,
// } from "lucide-react";
// import { format } from "date-fns";
// import { Status } from "@prisma/client";
// import Link from "next/link";
// import { useNotifications } from "@/hooks/use-notification";
// import type { UpdateFormData } from "@/types/inspector/inspector";
// import type { TaskStatistics } from "@/types/worker";
// import { TaskUpdateForm } from "../task-update-form";
// import { NotificationContainer } from "./notification-container";
// import { ProductionStatusCard } from "./ProductionStatusCard";
// import { getMyQualityChecks, createQualityCheck, updateQualityCheck } from "@/lib/actions/inspector/production-order";
// import { useRouter } from "next/navigation";
// import { handleTaskUpdate } from "@/lib/actions/inspector/tasks";

// // Using the InspectorsTask interface
// export interface InspectorsTask {
//   id: string;
//   title?: string;
//   description: string;
//   startDate: string | null;
//   dueDate: string | null;
//   status: Status;
//   priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
//   notes?: string | null;
//   productionOrderId: string;
//   workCenterId: string;
//   workCenterName: string;
//   quantity: number;
//   productionStatus: Status;
//   isActive: boolean;
// }

// // Interface for the production orders from your getProductionOrders() action
// export interface ProductionOrder {
//   id: string;
//   orderNumber: string;
//   quantity: number;
//   status: Status;
//   startDate: string | null;
//   dueDate: string | null;
//   product: {
//     name: string;
//     sku: string;
//   };
//   productVariant: {
//     displayName: string;
//     sku: string;
//     sizeName: string;
//     colorName: string;
//   };
//   customerOrder: {
//     orderNumber: string;
//   } | null;
//   materialVariance: number | null;
//   plannedMaterialCost: number | null;
//   actualMaterialCost: number | null;
// }

// export interface QualityCheck {
//   id: string;
//   checkDate: string;
//   status: Status;
//   notes?: string | null;
//   defectsFound?: string | null;
//   actionTaken?: string | null;
//   inspectorId: string;
//   productionOrderId: string;
//   productionOrder: {
//     orderNumber: string;
//     product: {
//       name: string;
//     };
//   };
//   // Add other nested properties if needed for display
// }

// interface InspectorDashboardClientProps {
//   initialInspectorTasks: InspectorsTask[];
//   initialStats: TaskStatistics;
//   productionOrders: ProductionOrder[];
//   initialQualityChecks: QualityCheck[];
// }

// export function InspectorDashboardClient({
//   initialInspectorTasks,
//   initialStats,
//   productionOrders,
//   initialQualityChecks,
// }: InspectorDashboardClientProps) {
//   const router = useRouter();
//   const { notifications, showSuccess, showError, showInfo } = useNotifications();

//   // State initialization with props
//   const [inspectorTasks, setInspectorTasks] = useState<InspectorsTask[]>(initialInspectorTasks);
//   const [stats, setStats] = useState<TaskStatistics>(initialStats);
//   const [productionOrdersState, setProductionOrdersState] = useState<ProductionOrder[]>(productionOrders);
//   const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>(initialQualityChecks);
//   const [selectedTask, setSelectedTask] = useState<InspectorsTask | null>(null);
//   const [selectedQualityCheck, setSelectedQualityCheck] = useState<QualityCheck | null>(null);
//   const [showUpdateForm, setShowUpdateForm] = useState(false);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   const getStatusBadgeVariant = (status: string) => {
//     switch (status) {
//       case "PENDING":
//         return "secondary";
//       case "COMPLETED":
//         return "default";
//       case "FAILED":
//         return "destructive";
//       case "ACTIVE":
//         return "outline";
//       default:
//         return "secondary";
//     }
//   };

//   const filteredInspectorTasks = useMemo(() => {
//     if (!inspectorTasks) return [];
//     const lowerCaseSearch = searchTerm.toLowerCase();
//     return inspectorTasks.filter(
//       (task) =>
//         task.description.toLowerCase().includes(lowerCaseSearch) ||
//         task.workCenterName.toLowerCase().includes(lowerCaseSearch) ||
//         (task.title && task.title.toLowerCase().includes(lowerCaseSearch)) ||
//         task.productionOrderId.toLowerCase().includes(lowerCaseSearch),
//     );
//   }, [inspectorTasks, searchTerm]);

//   const filteredProductionOrders = useMemo(() => {
//     if (!productionOrdersState) return [];
//     const lowerCaseSearch = searchTerm.toLowerCase();
//     return productionOrdersState.filter((order) => {
//       const orderNumber = order?.orderNumber?.toLowerCase() ?? '';
//       const productName = order.product?.name?.toLowerCase() ?? '';
//       const variantDisplayName = order.productVariant?.displayName?.toLowerCase() ?? '';
//       const variantSku = order.productVariant?.sku?.toLowerCase() ?? '';
//       const customerOrderNumber = order.customerOrder?.orderNumber?.toLowerCase() ?? '';
//       return (
//         orderNumber.includes(lowerCaseSearch) ||
//         productName.includes(lowerCaseSearch) ||
//         variantDisplayName.includes(lowerCaseSearch) ||
//         variantSku.includes(lowerCaseSearch) ||
//         customerOrderNumber.includes(lowerCaseSearch)
//       );
//     });
//   }, [productionOrdersState, searchTerm]);

//   const filteredQualityChecks = useMemo(() => {
//     if (!qualityChecks) return [];
//     const lowerCaseSearch = searchTerm.toLowerCase();
//     return qualityChecks.filter(
//       (check) =>
//         check.productionOrder?.orderNumber?.toLowerCase().includes(lowerCaseSearch) ||
//         (check.defectsFound && check.defectsFound.toLowerCase().includes(lowerCaseSearch)) ||
//         (check.notes && check.notes.toLowerCase().includes(lowerCaseSearch))
//     );
//   }, [qualityChecks, searchTerm]);

//   const handleRefresh = () => {
//     setLoading(true);
//     showInfo("Refreshing Data", "Updating dashboard data...");
//     router.refresh();
//     setLoading(false);
//     showSuccess("Data Refreshed", "Dashboard data has been updated");
//   };

//   const handleQualityCheckSubmit = useCallback(
//     async (data: UpdateFormData, qualityCheckId?: string) => {
//       showInfo("Processing Quality Check", "Your quality check update is being processed...");
//       try {
//         let result;
//         // Use the correct actions directly from the import statement
//         if (qualityCheckId) {
//           result = await updateQualityCheck(qualityCheckId, {
//             defectsFound: data.defectsFound,
//             actionTaken: data.actionTaken,
//             notes: data.notes,
//             status: data.status,
//           });
//         } else {
//           result = await createQualityCheck({
//             productionOrderId: data.taskId,
//             defectsFound: data.defectsFound,
//             actionTaken: data.actionTaken,
//             notes: data.notes,
//             status: data.status,
//           });
//         }
        
//         if (result.success) {
//           showSuccess(qualityCheckId ? "Quality Check Updated" : "Quality Check Added", `Quality check for task ${data.taskId} has been recorded.`);
//           setShowUpdateForm(false);
//           setSelectedTask(null);
//           setSelectedQualityCheck(null);
//           router.refresh(); // Refresh the page to get the latest data
//         } else {
//           showError("Update Failed", result.message || "Failed to save the quality check. Please try again.");
//         }
//       } catch (error) {
//         console.error("Error saving quality check:", error);
//         showError("Update Failed", "Failed to save the quality check. Please try again.");
//       }
//     },
//     [showSuccess, showError, showInfo, router],
//   );

//   const handleCloseUpdateForm = () => {
//     setShowUpdateForm(false);
//     setSelectedQualityCheck(null);
//   };

//   const handleOpenQualityCheckForm = (task: InspectorsTask) => {
//     setSelectedTask(task);
//     setSelectedQualityCheck(null);
//     setShowUpdateForm(true);
//   };

//   const handleEditQualityCheck = (qualityCheck: QualityCheck) => {
//     setSelectedQualityCheck(qualityCheck);
//     setSelectedTask({
//       id: qualityCheck.productionOrderId,
//       productionOrderId: qualityCheck.productionOrderId,
//       title: `Quality Check for Order ${qualityCheck.productionOrder.orderNumber}`,
//       description: "Editing quality check...",
//     } as InspectorsTask);
//     setShowUpdateForm(true);
//   };

//   const getStatusColor = (status: Status) => {
//     switch (status) {
//       case Status.COMPLETED:
//         return "bg-green-100 text-green-800 hover:bg-green-100";
//       case Status.IN_PROGRESS:
//         return "bg-amber-100 text-amber-800 hover:bg-amber-100";
//       case Status.PENDING:
//         return "bg-gray-100 text-gray-800";
//       case Status.CANCELLED:
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case "URGENT":
//         return "bg-red-100 text-red-800";
//       case "HIGH":
//         return "bg-orange-100 text-orange-800 hover:bg-orange-100";
//       case "MEDIUM":
//         return "bg-yellow-100 text-yellow-800";
//       case "LOW":
//         return "bg-green-100 text-green-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Inspector Dashboard</h1>
//           <p className="text-gray-600">Your work overview and assigned tasks</p>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" onClick={handleRefresh} disabled={loading}>
//             <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
//             Refresh
//           </Button>
//         </div>
//       </div>
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="production-orders">Production Orders</TabsTrigger>
//           <TabsTrigger value="tasks">Quality Checks</TabsTrigger>
//           <TabsTrigger value="analytics">Analytics</TabsTrigger>
//         </TabsList>
//         <TabsContent value="overview" className="space-y-6">
//           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Not Started</CardTitle>
//                 <ClipboardList className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.pending}</div>
//                 <p className="text-xs text-muted-foreground">Tasks pending to be started</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">In Progress</CardTitle>
//                 <Clock className="h-4 w-4 text-amber-500" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.inProgress}</div>
//                 <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
//                 <CheckCircle className="h-4 w-4 text-green-500" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.completed}</div>
//                 <p className="text-xs text-muted-foreground">Tasks completed today</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
//                 <AlertTriangle className="h-4 w-4 text-red-500" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.urgentTasks}</div>
//                 <p className="text-xs text-muted-foreground">High priority tasks requiring attention</p>
//               </CardContent>
//             </Card>
//           </div>
//           <Card>
//             <CardHeader>
//               <CardTitle>Daily Progress</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div>
//                   <div className="flex justify-between items-center mb-2">
//                     <span className="text-sm font-medium">Completion Rate</span>
//                     <span className="text-sm font-medium">{stats.completionRate.toFixed(0)}%</span>
//                   </div>
//                   <Progress value={stats.completionRate} className="h-2" />
//                   <p className="text-xs text-muted-foreground mt-2">
//                     {stats.completed} of {stats.total} tasks completed today
//                   </p>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4 pt-4 border-t">
//                   <div>
//                     <h4 className="text-sm font-medium mb-1">Tasks Breakdown</h4>
//                     <div className="text-xs text-muted-foreground space-y-1">
//                       <div className="flex justify-between">
//                         <span>Not Started:</span>
//                         <span>{stats.pending}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>In Progress:</span>
//                         <span>{stats.inProgress}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Completed:</span>
//                         <span>{stats.completed}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <div>
//                     <h4 className="text-sm font-medium mb-1">Priority Distribution</h4>
//                     <div className="flex items-center gap-2 mt-2">
//                       <Badge variant="destructive" className="gap-1">
//                         <AlertTriangle className="h-3 w-3" />
//                         {stats.urgentTasks} Urgent
//                       </Badge>
//                       <Badge variant="outline" className="gap-1">
//                         <Clock className="h-3 w-3" />
//                         {stats.inProgress} Active
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <CardTitle>Inspector Tasks Preview</CardTitle>
//               <Button variant="ghost" size="sm" className="gap-1" onClick={() => setActiveTab("tasks")}>
//                 <span>View All</span>
//                 <ClipboardList className="h-4 w-4" />
//               </Button>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {inspectorTasks.length === 0 ? (
//                   <div className="p-4 text-center text-muted-foreground">No inspector tasks available.</div>
//                 ) : (
//                   inspectorTasks.slice(0, 3).map((task) => (
//                     <div
//                       key={task.id}
//                       className={`flex items-center justify-between border-b pb-4 ${
//                         task.priority === "URGENT" ? "bg-red-50 p-3 rounded-md border-red-200" : ""
//                       }`}
//                     >
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <h3 className="font-medium">{task.title || task.description}</h3>
//                           <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
//                           {!task.isActive && (
//                             <Badge variant="outline" className="text-xs">
//                               Inactive
//                             </Badge>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
//                           <span>{task.workCenterName}</span>
//                           <span>•</span>
//                           <span>Order: {task.productionOrderId}</span>
//                           <span>•</span>
//                           <span>
//                             {task.dueDate
//                               ? format(new Date(task.dueDate), 'p')
//                               : "No due time"}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <Badge className={getStatusColor(task.status)}>
//                           {task.status === Status.PENDING && "Not Started"}
//                           {task.status === Status.IN_PROGRESS && "In Progress"}
//                           {task.status === Status.COMPLETED && "Completed"}
//                         </Badge>
//                         <Badge className={getStatusColor(task.productionStatus)} variant="outline">
//                           Prod: {task.productionStatus}
//                         </Badge>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//         <TabsContent value="production-orders" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Factory className="h-5 w-5" />
//                 Production Orders
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {filteredProductionOrders.length === 0 ? (
//                   <div className="p-4 text-center text-muted-foreground">
//                     {searchTerm ? "No orders match your search" : "No production orders available"}
//                   </div>
//                 ) : (
//                   filteredProductionOrders.map((order) => (
//                     <div key={order.id} className="border-b pb-4">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
//                           <p className="text-sm text-muted-foreground">
//                             {order.product.name} ({order.quantity} units)
//                           </p>
//                           <p className="text-sm text-muted-foreground">
//                             Variant: {order.productVariant?.displayName ?? "N/A"}
//                           </p>
//                         </div>
//                         <div className="flex flex-col gap-1">
//                           <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
//                           {order.customerOrder && (
//                             <Badge variant="outline" className="text-xs">
//                               Cust Order: {order.customerOrder.orderNumber}
//                             </Badge>
//                           )}
//                         </div>
//                       </div>
//                       <div className="flex items-center justify-between text-sm mt-2 text-muted-foreground">
//                         <span>
//                           Due Date: {order.dueDate ? format(new Date(order.dueDate), 'PPP') : "N/A"}
//                         </span>
//                         <Link href={`/inspector/production/${order.id}`}>
//                           <Button variant="outline" size="sm">
//                             View Details
//                           </Button>
//                         </Link>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//         <TabsContent value="tasks" className="space-y-6">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-xl font-bold text-gray-900">Quality Checks</h2>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <Input
//                 placeholder="Search quality checks..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//           </div>
//           {showUpdateForm && selectedTask && (
//             <TaskUpdateForm
//               // Pass the server action from the client component
//               onSubmit={handleQualityCheckSubmit}
//               onClose={handleCloseUpdateForm}
//               task={{
//                 id: selectedTask.id,
//                 title: selectedTask.title,
//                 productionOrderId: selectedTask.productionOrderId,
//               }}
//               initialData={selectedQualityCheck ? {
//                 defectsFound: selectedQualityCheck.defectsFound || "",
//                 actionTaken: selectedQualityCheck.actionTaken || "",
//                 notes: selectedQualityCheck.notes || "",
//                 status: selectedQualityCheck.status,
//                 id: selectedQualityCheck.id,
//               } : undefined}
//             />
//           )}
//           <Card>
//             <CardContent className="p-0">
//               <Table className="dark:bg-gray-800">
//                 <TableHeader>
//                   <TableRow className="dark:bg-gray-900">
//                     <TableHead className="text-gray-900 dark:text-gray-50">Production Order</TableHead>
//                     <TableHead className="text-gray-900 dark:text-gray-50">Status</TableHead>
//                     <TableHead className="text-gray-900 dark:text-gray-50">Defects Found</TableHead>
//                     <TableHead className="text-gray-900 dark:text-gray-50">Action Taken</TableHead>
//                     <TableHead className="text-gray-900 dark:text-gray-50">Notes</TableHead>
//                     <TableHead className="text-right text-gray-900 dark:text-gray-50">Check Date</TableHead>
//                     <TableHead className="text-right text-gray-900 dark:text-gray-50">Action</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredQualityChecks && filteredQualityChecks.length > 0 ? (
//                     filteredQualityChecks.map((check) => (
//                       <TableRow key={check.id} className="dark:bg-gray-800 hover:dark:bg-gray-700">
//                         <TableCell className="font-medium text-gray-900 dark:text-gray-50">
//                           {check.productionOrder?.id ?? 'N/A'}
//                         </TableCell>
//                         <TableCell className="text-gray-900 dark:text-gray-50">
//                           <Badge variant={getStatusBadgeVariant(check.status)}>{check.status}</Badge>
//                         </TableCell>
//                         <TableCell className="text-gray-900 dark:text-gray-50">
//                           {check.defectsFound ? (
//                             <ul className="list-disc pl-5">
//                               {check.defectsFound.split(',').map((defect, index) => (
//                                 <li key={index} dangerouslySetInnerHTML={{ __html: defect.trim() }} />
//                               ))}
//                             </ul>
//                           ) : "None"}
//                         </TableCell>
//                         <TableCell className="text-gray-900 dark:text-gray-50">
//                           {check.actionTaken ? (
//                             <ul className="list-disc pl-5">
//                               {check.actionTaken.split(',').map((action, index) => (
//                                 <li key={index} dangerouslySetInnerHTML={{ __html: action.trim() }} />
//                               ))}
//                             </ul>
//                           ) : "None"}
//                         </TableCell>
//                         <TableCell className="text-gray-900 dark:text-gray-50">
//                           {check.notes ?? "None"}
//                         </TableCell>
//                         <TableCell className="text-right text-gray-900 dark:text-gray-50">
//                           {check.checkDate ? format(new Date(check.checkDate), 'PPP p') : 'N/A'}
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <Button variant="ghost" size="sm" onClick={() => handleEditQualityCheck(check)}>
//                             <Edit className="w-4 h-4" />
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
//                         {searchTerm ? "No quality checks match your search." : "No quality checks found."}
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </TabsContent>
//         <TabsContent value="analytics" className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Task Performance</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <div className="flex justify-between">
//                     <span>Completion Rate</span>
//                     <span className="font-semibold">{stats.completionRate.toFixed(1)}%</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Active Tasks</span>
//                     <span className="font-semibold">{stats.activeTasks}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Inactive Tasks</span>
//                     <span className="font-semibold">{stats.inactiveTasks}</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader>
//                 <CardTitle>Work Distribution</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <div className="flex justify-between">
//                     <span>Total Tasks</span>
//                     <span className="font-semibold">{stats.total}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Urgent Priority</span>
//                     <span className="font-semibold text-red-600">{stats.urgentTasks}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Inspector Tasks</span>
//                     <span className="font-semibold">{inspectorTasks.length}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Active Tasks</span>
//                     <span className="font-semibold text-green-600">
//                       {inspectorTasks.filter((task) => task.isActive).length}
//                     </span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//             <ProductionStatusCard />
//           </div>
//         </TabsContent>
//       </Tabs>
//       <NotificationContainer notifications={notifications} onHideNotification={function (id: string): void {
//         throw new Error("Function not implemented.");
//       } } />
//     </div>
//   );
// }


"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  Factory,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { Status } from "@prisma/client";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notification";
import type { UpdateFormData } from "@/types/inspector/inspector";
import type { TaskStatistics } from "@/types/worker";
import { TaskUpdateForm } from "../task-update-form";
import { NotificationContainer } from "./notification-container";
import { ProductionStatusCard } from "./ProductionStatusCard";
import { getMyQualityChecks, updateQualityCheck } from "@/lib/actions/inspector/production-order";
import { useRouter } from "next/navigation";


// Using the InspectorsTask interface
export interface InspectorsTask {
  id: string;
  title?: string;
  description: string;
  startDate: string | null;
  dueDate: string | null;
  status: Status;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  notes?: string | null;
  productionOrderId: string;
  workCenterId: string;
  workCenterName: string;
  quantity: number;
  productionStatus: Status;
  isActive: boolean;
}


export interface ProductionOrder {
  id: string;
  orderNumber: string;
  quantity: number;
  status: Status;
  startDate: string | null;
  dueDate: string | null;
  product: {
    name: string;
    sku: string;
  };
  productVariant: {
    displayName: string;
    sku: string;
    sizeName: string;
    colorName: string;
  };
  customerOrder: {
    orderNumber: string;
  } | null;
  materialVariance: number | null;
  plannedMaterialCost: number | null;
  actualMaterialCost: number | null;
}

export interface QualityCheck {
  id: string;
  checkDate: string;
  status: Status;
  notes?: string | null;
  defectsFound?: string | null;
  actionTaken?: string | null;
  inspectorId: string;
  productionOrderId: string;
  productionOrder: {
    id: string;
    orderNumber: string;
    product: {
      name: string;
    };
  };
  // Add other nested properties if needed for display
}

interface InspectorDashboardClientProps {
  initialInspectorTasks: InspectorsTask[];
  initialStats: TaskStatistics;
  productionOrders: ProductionOrder[];
  initialQualityChecks: QualityCheck[];
}

export function InspectorDashboardClient({
  initialInspectorTasks,
  initialStats,
  productionOrders,
  initialQualityChecks,
}: InspectorDashboardClientProps) {
  const router = useRouter();
  const { notifications, showSuccess, showError, showInfo } = useNotifications();

  // State initialization with props
  const [inspectorTasks, setInspectorTasks] = useState<InspectorsTask[]>(initialInspectorTasks);
  const [stats, setStats] = useState<TaskStatistics>(initialStats);
  const [productionOrdersState, setProductionOrdersState] = useState<ProductionOrder[]>(productionOrders);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>(initialQualityChecks);
  const [selectedTask, setSelectedTask] = useState<InspectorsTask | null>(null);
  const [selectedQualityCheck, setSelectedQualityCheck] = useState<QualityCheck | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "COMPLETED":
        return "default";
      case "FAILED":
        return "destructive";
      case "ACTIVE":
        return "outline";
      default:
        return "secondary";
    }
  };

  const filteredInspectorTasks = useMemo(() => {
    if (!inspectorTasks) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return inspectorTasks.filter(
      (task) =>
        task.description.toLowerCase().includes(lowerCaseSearch) ||
        task.workCenterName.toLowerCase().includes(lowerCaseSearch) ||
        (task.title && task.title.toLowerCase().includes(lowerCaseSearch)) ||
        task.productionOrderId.toLowerCase().includes(lowerCaseSearch),
    );
  }, [inspectorTasks, searchTerm]);

  const filteredProductionOrders = useMemo(() => {
    if (!productionOrdersState) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return productionOrdersState.filter((order) => {
      const orderNumber = order?.orderNumber?.toLowerCase() ?? '';
      const productName = order.product?.name?.toLowerCase() ?? '';
      const variantDisplayName = order.productVariant?.displayName?.toLowerCase() ?? '';
      const variantSku = order.productVariant?.sku?.toLowerCase() ?? '';
      const customerOrderNumber = order.customerOrder?.orderNumber?.toLowerCase() ?? '';
      return (
        orderNumber.includes(lowerCaseSearch) ||
        productName.includes(lowerCaseSearch) ||
        variantDisplayName.includes(lowerCaseSearch) ||
        variantSku.includes(lowerCaseSearch) ||
        customerOrderNumber.includes(lowerCaseSearch)
      );
    });
  }, [productionOrdersState, searchTerm]);

  const filteredQualityChecks = useMemo(() => {
    if (!qualityChecks) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return qualityChecks.filter(
      (check) =>
        check.productionOrder?.orderNumber?.toLowerCase().includes(lowerCaseSearch) ||
        (check.defectsFound && check.defectsFound.toLowerCase().includes(lowerCaseSearch)) ||
        (check.notes && check.notes.toLowerCase().includes(lowerCaseSearch))
    );
  }, [qualityChecks, searchTerm]);

  const handleRefresh = () => {
    setLoading(true);
    showInfo("Refreshing Data", "Updating dashboard data...");
    router.refresh();
    setLoading(false);
    showSuccess("Data Refreshed", "Dashboard data has been updated");
  };

  // 1. Updated `handleQualityCheckSubmit` function
  const handleQualityCheckSubmit = useCallback(
    async (data: UpdateFormData, qualityCheckId?: string) => {
      showInfo("Processing Quality Check", "Your quality check update is being processed...");
      
      // Ensure a quality check ID is provided for an update
      if (!qualityCheckId) {
        showError("Update Failed", "No quality check ID was provided for the update.");
        return;
      }
      
      try {
        const result = await updateQualityCheck(qualityCheckId, {
          defectsFound: data.defectsFound,
          actionTaken: data.actionTaken,
          notes: data.notes,
          status: data.status,
        });
        
        if (result.success) {
          showSuccess("Quality Check Updated", `Quality check for task ${data.taskId} has been updated.`);
          setShowUpdateForm(false);
          setSelectedTask(null);
          setSelectedQualityCheck(null);
          router.refresh(); // Refresh the page to get the latest data
        } else {
          showError("Update Failed", result.message || "Failed to save the quality check. Please try again.");
        }
      } catch (error) {
        console.error("Error saving quality check:", error);
        showError("Update Failed", "Failed to save the quality check. Please try again.");
      }
    },
    [showSuccess, showError, showInfo, router],
  );

  const handleCloseUpdateForm = () => {
    setShowUpdateForm(false);
    setSelectedQualityCheck(null);
  };

  // 2. Removed `handleOpenQualityCheckForm` since we only want to update, not create.
  // The functionality to edit is handled by `handleEditQualityCheck` below.

  const handleEditQualityCheck = (qualityCheck: QualityCheck) => {
    setSelectedQualityCheck(qualityCheck);
    setSelectedTask({
      id: qualityCheck.productionOrderId,
      productionOrderId: qualityCheck.productionOrderId,
      title: `Quality Check for Order ${qualityCheck.productionOrder.orderNumber}`,
      description: "Editing quality check...",
    } as InspectorsTask);
    setShowUpdateForm(true);
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.COMPLETED:
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case Status.IN_PROGRESS:
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case Status.PENDING:
        return "bg-gray-100 text-gray-800";
      case Status.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Compute counts for production order statuses
  const getProductionOrderCounts = useCallback(() => {
    const counts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    productionOrdersState.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      }
    });

    return counts;
  }, [productionOrdersState]);

  const productionCounts = useMemo(() => getProductionOrderCounts(), [getProductionOrderCounts]);


  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspector Dashboard</h1>
          <p className="text-gray-600">Your work overview and assigned tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production-orders">Production Orders</TabsTrigger>
          <TabsTrigger value="tasks">Quality Checks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* PENDING */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <ClipboardList className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productionCounts.PENDING}</div>
                <p className="text-xs text-muted-foreground">Orders waiting to start production</p>
              </CardContent>
            </Card>

            {/* IN PROGRESS */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productionCounts.IN_PROGRESS}</div>
                <p className="text-xs text-muted-foreground">Orders currently in production</p>
              </CardContent>
            </Card>

            {/* COMPLETED */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productionCounts.COMPLETED}</div>
                <p className="text-xs text-muted-foreground">Orders successfully finished</p>
              </CardContent>
            </Card>

            {/* CANCELLED */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productionCounts.CANCELLED}</div>
                <p className="text-xs text-muted-foreground">Orders that were cancelled</p>
              </CardContent>
            </Card>
          </div>
          {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Started</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Tasks pending to be started</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Tasks completed today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.urgentTasks}</div>
                <p className="text-xs text-muted-foreground">High priority tasks requiring attention</p>
              </CardContent>
            </Card>
          </div> */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-medium">{stats.completionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.completed} of {stats.total} tasks completed today
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Tasks Breakdown</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Not Started:</span>
                        <span>{stats.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In Progress:</span>
                        <span>{stats.inProgress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span>{stats.completed}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Priority Distribution</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.urgentTasks} Urgent
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {stats.inProgress} Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inspector Tasks Preview</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setActiveTab("tasks")}>
                <span>View All</span>
                <ClipboardList className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspectorTasks.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No inspector tasks available.</div>
                ) : (
                  inspectorTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between border-b pb-4 ${
                        task.priority === "URGENT" ? "bg-red-50 p-3 rounded-md border-red-200" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.title || task.description}</h3>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          {!task.isActive && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{task.workCenterName}</span>
                          <span>•</span>
                          <span>Order: {task.productionOrderId}</span>
                          <span>•</span>
                          <span>
                            {task.dueDate
                              ? format(new Date(task.dueDate), 'p')
                              : "No due time"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === Status.PENDING && "Not Started"}
                          {task.status === Status.IN_PROGRESS && "In Progress"}
                          {task.status === Status.COMPLETED && "Completed"}
                        </Badge>
                        <Badge className={getStatusColor(task.productionStatus)} variant="outline">
                          Prod: {task.productionStatus}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="production-orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Production Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProductionOrders.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchTerm ? "No orders match your search" : "No production orders available"}
                  </div>
                ) : (
                  filteredProductionOrders.map((order) => (
                    <div key={order.id} className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.product.name} ({order.quantity} units)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Variant: {order.productVariant?.displayName ?? "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          {order.customerOrder && (
                            <Badge variant="outline" className="text-xs">
                              Cust Order: {order.customerOrder.orderNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2 text-muted-foreground">
                        <span>
                          Due Date: {order.dueDate ? format(new Date(order.dueDate), 'PPP') : "N/A"}
                        </span>
                        <Link href={`/inspector/production/${order.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Quality Checks</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search quality checks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {showUpdateForm && selectedTask && (
            <TaskUpdateForm
              // Pass the server action from the client component
              onSubmit={handleQualityCheckSubmit}
              onClose={handleCloseUpdateForm}
              task={{
                id: selectedTask.id,
                title: selectedTask.title,
                productionOrderId: selectedTask.productionOrderId,
              }}
              initialData={selectedQualityCheck ? {
                defectsFound: selectedQualityCheck.defectsFound || "",
                actionTaken: selectedQualityCheck.actionTaken || "",
                notes: selectedQualityCheck.notes || "",
                status: selectedQualityCheck.status,
                id: selectedQualityCheck.id,
              } : undefined}
            />
          )}
          <Card>
            <CardContent className="p-0">
              <Table className="dark:bg-gray-800">
                <TableHeader>
                  <TableRow className="dark:bg-gray-900">
                    <TableHead className="text-gray-900 dark:text-gray-50">Production Order</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-50">Status</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-50">Defects Found</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-50">Action Taken</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-50">Notes</TableHead>
                    <TableHead className="text-right text-gray-900 dark:text-gray-50">Check Date</TableHead>
                    <TableHead className="text-right text-gray-900 dark:text-gray-50">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQualityChecks && filteredQualityChecks.length > 0 ? (
                    filteredQualityChecks.map((check) => (
                      <TableRow key={check.id} className="dark:bg-gray-800 hover:dark:bg-gray-700">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                          {check.productionOrder?.id ?? 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-50">
                          <Badge variant={getStatusBadgeVariant(check.status)}>{check.status}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-50">
                          {check.defectsFound ? (
                            <ul className="list-disc pl-5">
                              {check.defectsFound.split(',').map((defect, index) => (
                                <li key={index} dangerouslySetInnerHTML={{ __html: defect.trim() }} />
                              ))}
                            </ul>
                          ) : "None"}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-50">
                          {check.actionTaken ? (
                            <ul className="list-disc pl-5">
                              {check.actionTaken.split(',').map((action, index) => (
                                <li key={index} dangerouslySetInnerHTML={{ __html: action.trim() }} />
                              ))}
                            </ul>
                          ) : "None"}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-50">
                          {check.notes ?? "None"}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-50">
                          {check.checkDate ? format(new Date(check.checkDate), 'PPP p') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditQualityCheck(check)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {searchTerm ? "No quality checks match your search." : "No quality checks found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-semibold">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tasks</span>
                    <span className="font-semibold">{stats.activeTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive Tasks</span>
                    <span className="font-semibold">{stats.inactiveTasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Work Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Tasks</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgent Priority</span>
                    <span className="font-semibold text-red-600">{stats.urgentTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inspector Tasks</span>
                    <span className="font-semibold">{inspectorTasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tasks</span>
                    <span className="font-semibold text-green-600">
                      {inspectorTasks.filter((task) => task.isActive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ProductionStatusCard />
          </div>
        </TabsContent>
      </Tabs>
      <NotificationContainer notifications={notifications} onHideNotification={function (id: string): void {
        throw new Error("Function not implemented.");
      } } />
    </div>
  );
}