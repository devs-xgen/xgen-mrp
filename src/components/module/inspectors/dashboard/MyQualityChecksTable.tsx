// // src/components/module/inspectors/dashboard/MyQualityChecksTable.tsx
// "use client";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { format } from "date-fns";
// import { AlertCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// // Import the necessary types, including Status
// import {
//   QualityCheck,
//   ProductionOrder,
//   Product,
//   Status,
// } from "@prisma/client";

// // Define the correct type for the data prop
// interface QualityCheckWithRelations extends QualityCheck {
//   productionOrder: ProductionOrder & {
//     product: Product;
//     orderNumber: string;
//   };
//   inspector: {
//     profile: {
//       firstName: string | null;
//       lastName: string | null;
//     };
//   };
// }

// // Update the component to accept data as a prop
// interface QualityChecksTableProps {
//   data: QualityCheckWithRelations[] | null;
//   loading: boolean;
//   error: string | null;
// }

// export function QualityChecksTable({ data, loading, error }: QualityChecksTableProps) {
//   // Change the getStatusBadgeVariant function to accept Status type
//   const getStatusBadgeVariant = (status: Status) => {
//     switch (status) {
//       case Status.PENDING:
//         return "secondary";
//       case Status.COMPLETED:
//         return "default";
//       case Status.FAILED:
//         return "destructive";
//       case Status.ACTIVE:
//         return "outline";
//       default:
//         return "secondary";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-48 text-gray-500 font-medium">
//         Loading...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-48 text-red-500">
//         <AlertCircle className="h-10 w-10 mb-2" />
//         <p>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="overflow-x-auto">
//       <Table className="dark:bg-gray-800">
//         <TableHeader>
//           <TableRow className="dark:bg-gray-900">
//             <TableHead className="text-gray-900 dark:text-gray-50">Production Order</TableHead>
//             <TableHead className="text-gray-900 dark:text-gray-50">Product</TableHead>
//             <TableHead className="text-gray-900 dark:text-gray-50">Status</TableHead>
//             <TableHead className="text-gray-900 dark:text-gray-50">Defects Found</TableHead>
//             <TableHead className="text-gray-900 dark:text-gray-50">Notes</TableHead>
//             <TableHead className="text-gray-900 dark:text-gray-50">Check Date</TableHead>
//             <TableHead className="text-right text-gray-900 dark:text-gray-50">Action</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {data && data.length > 0 ? (
//             data.map((check) => (
//               <TableRow key={check.id} className="dark:bg-gray-800 hover:dark:bg-gray-700">
//                 <TableCell className="text-gray-900 dark:text-gray-50">
//                   <Button variant="link" asChild className="p-0 h-auto text-gray-900 dark:text-gray-50">
//                     <Link href={`/inspector/production/${check.productionOrder.id}`}>
//                       {check.productionOrder.id}
//                     </Link>
//                   </Button>
//                 </TableCell>
//                 <TableCell className="text-gray-900 dark:text-gray-50">
//                   {check.productionOrder.product.name}
//                 </TableCell>
//                 <TableCell className="text-gray-900 dark:text-gray-50">
//                     {/* Access the status property directly */}
//                   <Badge variant={getStatusBadgeVariant(check.status)}>{check.status}</Badge>
//                 </TableCell>
//                 <TableCell className="text-gray-900 dark:text-gray-50">
//                   {check.defectsFound ? (
//                     <ul className="list-disc pl-5">
//                       {check.defectsFound.split(',').map((defect, index) => (
//                         <li key={index}>{defect.trim()}</li>
//                       ))}
//                     </ul>
//                   ) : (
//                     "None"
//                   )}
//                 </TableCell>
//                 <TableCell className="text-gray-900 dark:text-gray-50">
//                   {check.notes || "N/A"}
//                 </TableCell>
//                 <TableCell className="text-gray-900 dark:text-gray-50">
//                   {format(new Date(check.checkDate), "MMM d, yyyy h:mm a")}
//                 </TableCell>
//                 <TableCell className="text-right">
//                   <Button variant="outline" size="sm" asChild>
//                     <Link href={`/inspector/production/${check.productionOrder.id}`}>View</Link>
//                   </Button>
//                 </TableCell>
//               </TableRow>
//             ))
//           ) : (
//             <TableRow className="dark:bg-gray-800">
//               <TableCell colSpan={7} className="text-center py-8 text-gray-900 dark:text-gray-50">
//                 No quality checks found for your account.
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }

// src/components/module/inspectors/TasksTable.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Status } from "@prisma/client";
import { InspectorsTask } from "./dashboard/InspectorDashboardClient";

interface TasksTableProps {
  data: InspectorsTask[];
  loading: boolean;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenQualityCheckForm: (task: InspectorsTask) => void;
}

export function TasksTable({
  data,
  loading,
  onStart,
  onStop,
  onComplete,
  onOpenQualityCheckForm,
}: TasksTableProps) {
  const getStatusBadgeVariant = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return "secondary";
      case Status.IN_PROGRESS:
        return "default";
      case Status.COMPLETED:
        return "success";
      case Status.FAILED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading tasks...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No inspector tasks found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Work Center</TableHead>
            <TableHead>Production Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.description}</TableCell>
              <TableCell>{task.workCenterName}</TableCell>
              <TableCell>
                <Link href={`/inspector/production/${task.productionOrderId}`}>
                  {task.productionOrderId}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadgeVariant(task.status)}>
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.dueDate
                  ? format(new Date(task.dueDate), "MMM d, yyyy h:mm a")
                  : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {task.status === Status.PENDING && task.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStart(task.id)}
                      title="Start Task"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {task.status === Status.IN_PROGRESS && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStop(task.id)}
                        title="Pause Task"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComplete(task.id)}
                        title="Complete Task"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenQualityCheckForm(task)}
                    title="Add Quality Check"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}