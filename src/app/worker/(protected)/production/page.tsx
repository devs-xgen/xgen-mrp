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
  Package,
} from "lucide-react";
import { getMyTasks, getTaskStatistics } from "@/lib/actions/worker/tasks";
import { WorkerProductionTasks } from "@/components/module/worker/production-tasks";

export const metadata: Metadata = {
  title: "Production Tasks",
  description: "View and manage production tasks",
};

export default async function ProductionTasksPage() {
  // Fetch real production tasks and statistics
  const [tasks, statistics] = await Promise.all([
    getMyTasks(),
    getTaskStatistics()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Production Tasks</h2>
        <p className="text-muted-foreground">
          View and manage your assigned production tasks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending}</div>
            <p className="text-xs text-muted-foreground">
              Tasks ready to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completed}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              From {statistics.inactiveTasks} on hold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time production tasks component */}
      <WorkerProductionTasks initialTasks={tasks} />
    </div>
  );
}
