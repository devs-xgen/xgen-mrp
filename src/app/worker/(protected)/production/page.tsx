// src/app/worker/(protected)/production/page.tsx
import { Metadata } from "next";
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

export default function ProductionTasksPage() {
  // Sample data for production tasks
  const productionTasks = [
    {
      id: "PT-001",
      description: "Assemble Product X23",
      status: "Not Started",
      priority: "High",
      dueDate: "Today, 4:00 PM",
      quantity: 50,
      workCenter: "Assembly Line 2",
    },
    {
      id: "PT-002",
      description: "Quality Check - Batch B789",
      status: "In Progress",
      priority: "Medium",
      dueDate: "Today, 5:30 PM",
      quantity: 100,
      workCenter: "QC Station 1",
    },
    {
      id: "PT-003",
      description: "Prepare Materials for Tomorrow",
      status: "Not Started",
      priority: "Low",
      dueDate: "Today, 6:00 PM",
      quantity: null,
      workCenter: "Prep Area",
    },
    {
      id: "PT-004",
      description: "Pack Finished Goods",
      status: "In Progress",
      priority: "High",
      dueDate: "Today, 3:30 PM",
      quantity: 75,
      workCenter: "Packaging Line 1",
    },
  ];

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
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
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
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Due</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productionTasks.map((task) => (
                  <tr key={task.id} className="border-b">
                    <td className="py-3">{task.id}</td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{task.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.quantity && `Qty: ${task.quantity}`}{" "}
                          {task.workCenter && `• ${task.workCenter}`}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          task.status === "In Progress"
                            ? "outline"
                            : task.status === "Completed"
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
                          task.priority === "High"
                            ? "destructive"
                            : task.priority === "Medium"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="py-3">{task.dueDate}</td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        {task.status === "Not Started" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {task.status === "In Progress" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
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
