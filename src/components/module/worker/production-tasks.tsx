"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Check,
  Clock,
  AlertTriangle,
  Eye,
  Package,
} from "lucide-react";
import { Status } from "@prisma/client";
import { WorkerTask } from "@/types/worker/tasks";
import { updateTaskStatus, startTaskTimer, stopTaskTimer } from "@/lib/actions/worker/tasks";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkerProductionTasksProps {
  initialTasks: WorkerTask[];
}

export function WorkerProductionTasks({ initialTasks }: WorkerProductionTasksProps) {
  const [tasks, setTasks] = useState<WorkerTask[]>(initialTasks);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleStartTask = async (taskId: string) => {
    setIsUpdating(taskId);
    try {
      await updateTaskStatus({
        id: taskId,
        status: Status.IN_PROGRESS,
        notes: "Task started by worker"
      });
      
      await startTaskTimer(taskId);

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: Status.IN_PROGRESS }
          : task
      ));

      toast({
        title: "Task Started",
        description: "Task has been marked as in progress.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePauseTask = async (taskId: string) => {
    setIsUpdating(taskId);
    try {
      await updateTaskStatus({
        id: taskId,
        status: Status.PENDING,
        notes: "Task paused by worker"
      });

      await stopTaskTimer(taskId);

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: Status.PENDING }
          : task
      ));

      toast({
        title: "Task Paused",
        description: "Task has been paused and can be resumed later.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setIsUpdating(taskId);
    try {
      await updateTaskStatus({
        id: taskId,
        status: Status.COMPLETED,
        notes: "Task completed by worker"
      });

      await stopTaskTimer(taskId);

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: Status.COMPLETED }
          : task
      ));

      toast({
        title: "Task Completed",
        description: "Task has been marked as completed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadgeVariant = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return "secondary";
      case Status.IN_PROGRESS:
        return "outline";
      case Status.COMPLETED:
        return "default";
      case Status.CANCELLED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "outline";
      case "LOW":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Separate tasks by active status
  const activeTasks = tasks.filter(task => task.isActive === true);
  const inactiveTasks = tasks.filter(task => task.isActive === false);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active Tasks ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            On Hold ({inactiveTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Production Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active production tasks assigned</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium">Product</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Priority</th>
                        <th className="pb-3 font-medium">Due Date</th>
                        <th className="pb-3 font-medium">Work Center</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTasks.map((task) => (
                        <tr key={task.id} className="border-b">
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{task.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.quantity && `Qty: ${task.quantity}`}
                                {task.productionOrderId && ` • Order: ${task.productionOrderId.slice(-8)}`}
                              </p>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge variant={getStatusBadgeVariant(task.status)}>
                              {task.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant={getPriorityBadgeVariant(task.priority)}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm">
                            {formatDateTime(task.dueDate)}
                          </td>
                          <td className="py-3 text-sm">
                            {task.workCenterName}
                          </td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              {task.status === Status.PENDING && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleStartTask(task.id)}
                                  disabled={isUpdating === task.id}
                                  title="Start Task"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {task.status === Status.IN_PROGRESS && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handlePauseTask(task.id)}
                                    disabled={isUpdating === task.id}
                                    title="Pause Task"
                                  >
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleCompleteTask(task.id)}
                                    disabled={isUpdating === task.id}
                                    title="Complete Task"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Task Details</DialogTitle>
                                    <DialogDescription>
                                      Production task information
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Product</label>
                                      <p className="text-sm text-muted-foreground">{task.description}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Production Order</label>
                                      <p className="text-sm text-muted-foreground">{task.productionOrderId}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Quantity</label>
                                      <p className="text-sm text-muted-foreground">{task.quantity || "Not specified"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Work Center</label>
                                      <p className="text-sm text-muted-foreground">{task.workCenterName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Due Date</label>
                                      <p className="text-sm text-muted-foreground">{formatDateTime(task.dueDate)}</p>
                                    </div>
                                    {task.notes && (
                                      <div>
                                        <label className="text-sm font-medium">Notes</label>
                                        <p className="text-sm text-muted-foreground">{task.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks On Hold</CardTitle>
            </CardHeader>
            <CardContent>
              {inactiveTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks on hold</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inactiveTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <p className="font-medium">{task.description}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Production order not yet started by admin
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          {task.productionStatus}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {task.workCenterName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 