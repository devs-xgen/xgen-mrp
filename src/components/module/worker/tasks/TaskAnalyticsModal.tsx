"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Status } from "@prisma/client";
import { WorkerTask } from "@/types/worker/tasks";

interface TaskAnalyticsModalProps {
  tasks: WorkerTask[];
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
    urgentTasks: number;
    inactiveTasks?: number;
  };
}

export function TaskAnalyticsModal({ tasks, stats }: TaskAnalyticsModalProps) {
  const [open, setOpen] = useState(false);

  // Group tasks by status
  const notStarted = tasks.filter((task) => task.status === Status.PENDING);
  const inProgress = tasks.filter((task) => task.status === Status.IN_PROGRESS);
  const completed = tasks.filter((task) => task.status === Status.COMPLETED);
  const urgentTasks = tasks.filter((task) => task.priority === "URGENT");
  const inactiveTasks = tasks.filter((task) => task.isActive === false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          View Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Analytics</DialogTitle>
          <DialogDescription>
            Overview of your task performance and statistics
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Inactive Tasks Warning */}
          {inactiveTasks.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Some tasks are not active</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {stats.inactiveTasks || inactiveTasks.length} task(s) are from production orders that have not been started by admin.
                    These tasks will be available once the admin starts the production process.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Cards */}
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

          {/* Additional Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Not Started</span>
                    <span className="text-sm font-medium">{notStarted.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <span className="text-sm font-medium">{inProgress.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-medium">{completed.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Inactive</span>
                    <span className="text-sm font-medium">{inactiveTasks.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Urgent</span>
                    <span className="text-sm font-medium text-red-600">{urgentTasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High</span>
                    <span className="text-sm font-medium text-orange-600">
                      {tasks.filter(t => t.priority === "HIGH").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {tasks.filter(t => t.priority === "MEDIUM").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low</span>
                    <span className="text-sm font-medium text-green-600">
                      {tasks.filter(t => t.priority === "LOW").length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 