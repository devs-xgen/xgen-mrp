// // src/app/worker/(protected)/tasks/page.tsx
// import { Metadata } from "next";
// import { getProductionOrdersForInspector } from "@/lib/actions/inspectors"; // adjust the path!
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ClipboardList } from "lucide-react";
// import { Key } from "react";

// export const metadata: Metadata = {
//   title: "Worker Tasks",
//   description: "Manage your assigned tasks",
// };

// export default async function TasksPage() {
//   const productionOrders = await getProductionOrdersForInspector();

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
//         <p className="text-muted-foreground">
//           View and manage your assigned tasks
//         </p>
//       </div>

//       <Card className="mt-6">
//         <CardHeader>
//           <CardTitle>My Tasks</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {productionOrders.length === 0 ? (
//               <p className="text-muted-foreground">No tasks assigned yet.</p>
//             ) : (
//               productionOrders.map((order: { dueDate: string | number | Date; id: Key | null | undefined; orderNumber: any; status: any; }) => {
//                 const dueDate = order.dueDate
//                   ? new Date(order.dueDate).toLocaleDateString()
//                   : "No due date";

//                 return (
//                   <div
//                     key={order.id}
//                     className="flex items-center justify-between border-b pb-3"
//                   >
//                     <div className="flex items-center space-x-4">
//                       <ClipboardList className="h-5 w-5 text-muted-foreground" />
//                       <div>
//                         <h4 className="font-medium">
//                           {order.orderNumber ? `Order #${order.orderNumber}` : "Production Order"}
//                         </h4>
//                         <p className="text-sm text-muted-foreground">
//                           {dueDate}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
//                       {order.status || "Pending"}
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


// src/app/inspector/(protected)/production/page.tsx
import { Metadata } from "next";
import { getInspectorTasks } from "@/lib/actions/inspector-tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Production Tasks",
  description: "View and manage production tasks",
};

export default async function ProductionTasksPage() {
  const tasks = await getInspectorTasks();

  const counts = {
    "Not Started": tasks.filter(t => t.status === "Not Started").length,
    "In Progress": tasks.filter(t => t.status === "In Progress").length,
    Completed: tasks.filter(t => t.status === "Completed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Production Tasks</h2>
        <p className="text-muted-foreground">
          View and manage your assigned production tasks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts["Not Started"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts["In Progress"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.Completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Assigned Production Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b">
                    <td className="py-3">{task.orderNumber || "N/A"}</td>
                    <td className="py-3">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "No due date"}
                    </td>
                    <td className="py-3">
                      <Badge>{task.status}</Badge>
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

