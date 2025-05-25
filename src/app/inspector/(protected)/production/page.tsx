import { Metadata } from "next";
import { getProductionTasks, getProductionTaskStatistics } from "@/lib/actions/inspector/tasks";
import { TasksList } from "@/components/module/inspectors/tasks";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertTriangle, ClipboardList, AlertCircle } from "lucide-react";
import { Status } from "@prisma/client";

export const metadata: Metadata = {
  title: "Production Tasks",
  description: "View and manage production tasks",
};

export default async function ProductionTasksPage() {
  const [tasks, stats] = await Promise.all([getProductionTasks(), getProductionTaskStatistics()]);

  // Group tasks by status
  const notStarted = tasks.filter((task) => task.status === Status.PENDING);
  const inProgress = tasks.filter((task) => task.status === Status.IN_PROGRESS);
  const completed = tasks.filter((task) => task.status === Status.COMPLETED);

  // Get urgent tasks
  const urgentTasks = tasks.filter((task) => task.priority === "URGENT");
  
  // Count active vs inactive tasks
  const activeTasks = tasks.filter(task => task.isActive === true);
  const inactiveTasks = tasks.filter(task => task.isActive === false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Production Tasks</h2>
        <p className="text-muted-foreground">
          View and manage all production tasks
        </p>
      </div>

      {inactiveTasks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Inactive Production Tasks</p>
              <p className="text-sm text-amber-700 mt-1">
                {stats.inactiveTasks || inactiveTasks.length} task(s) are paused or awaiting materials.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {notStarted.length} tasks to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {inProgress.length} active tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {completed.length} tasks finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentTasks}</div>
            <p className="text-xs text-muted-foreground">
              {urgentTasks.length} high priority tasks
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Loading tasks...</div>}>
        <TasksList tasks={tasks} />
      </Suspense>
    </div>
  );
}
 