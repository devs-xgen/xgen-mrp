// src/app/worker/(protected)/dashboard/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { getTodaysTasks, getTaskStatistics } from "@/lib/actions/worker/tasks";
import { Status } from "@prisma/client";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Worker Dashboard",
  description: "Your work overview and daily tasks",
};

export default async function WorkerDashboard() {
  const [todaysTasks, stats] = await Promise.all([
    getTodaysTasks(),
    getTaskStatistics(),
  ]);

  // Get count of urgent tasks
  const urgentTasks = todaysTasks.filter((task) => task.priority === "URGENT");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Worker Dashboard</h2>
        <p className="text-muted-foreground">
          Your work overview and assigned tasks
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
              Tasks pending to be started
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
              Tasks currently being worked on
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
              Tasks completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentTasks}</div>
            <p className="text-xs text-muted-foreground">
              High priority tasks requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm font-medium">
                  {stats.completionRate.toFixed(0)}%
                </span>
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
                <h4 className="text-sm font-medium mb-1">
                  Priority Distribution
                </h4>
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

      {/* Today's Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Tasks</CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/worker/tasks">
              <span>View All</span>
              <ClipboardList className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading tasks...</div>}>
            <div className="space-y-4">
              {todaysTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks scheduled for today
                </div>
              ) : (
                todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between border-b pb-4 ${
                      task.priority === "URGENT"
                        ? "bg-red-50 p-3 rounded-md border-red-200"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{task.description}</h3>
                        {task.priority === "URGENT" && (
                          <Badge variant="destructive">URGENT</Badge>
                        )}
                        {task.priority === "HIGH" && (
                          <Badge
                            variant="outline"
                            className="bg-orange-100 text-orange-800 hover:bg-orange-100"
                          >
                            HIGH
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{task.workCenterName}</span>
                        <span>•</span>
                        <span>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "No due time"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === Status.PENDING && (
                        <Badge variant="secondary">Not Started</Badge>
                      )}
                      {task.status === Status.IN_PROGRESS && (
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                        >
                          In Progress
                        </Badge>
                      )}
                      {task.status === Status.COMPLETED && (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          Completed
                        </Badge>
                      )}
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Link href={`/worker/tasks?id=${task.id}`}>
                          <Clock className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Suspense>

          {todaysTasks.length > 0 && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/worker/tasks">View All Tasks</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
