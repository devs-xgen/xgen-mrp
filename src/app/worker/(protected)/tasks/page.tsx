import { Metadata } from "next";
import { getMyTasks, getTaskStatistics } from "@/lib/actions/worker/tasks";
import { TasksList } from "@/components/module/worker/tasks";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertTriangle, ClipboardList } from "lucide-react";
import { Status } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Tasks",
  description: "View and manage your assigned tasks",
};

export default async function TasksPage() {
  const [tasks, stats] = await Promise.all([getMyTasks(), getTaskStatistics()]);

  // Group tasks by status for summary
  const notStarted = tasks.filter((task) => task.status === Status.PENDING);
  const inProgress = tasks.filter((task) => task.status === Status.IN_PROGRESS);
  const completed = tasks.filter((task) => task.status === Status.COMPLETED);

  // Get urgent tasks
  const urgentTasks = tasks.filter((task) => task.priority === "URGENT");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
        <p className="text-muted-foreground">
          View and manage your assigned production tasks
        </p>
      </div>

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
              {inProgress.length} tasks being worked on
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
