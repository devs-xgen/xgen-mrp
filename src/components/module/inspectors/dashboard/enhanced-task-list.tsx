"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  RefreshCw,
  Ban,
  PlayCircle,
  Factory,
} from "lucide-react";
import { getInspectorTasksWithDependencies } from "@/lib/actions/inspector/tasks";
import { updateTaskStatus } from "@/lib/actions/inspector/tasks";
import { Status } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface EnhancedTask {
  id: string;
  type: "quality_check" | "operation";
  description: string;
  status: Status;
  dueDate: Date;
  productionOrderId: string;
  quantity: number;
  canStart: boolean;
  dependencyStatus: {
    allCompleted: boolean;
    completionPercentage: number;
    completedCount: number;
    totalOperations: number;
  };
  currentPhase: "work_centers" | "inspection" | "delivery" | "completed";
  blocked: boolean;
  blockingReason: string | null;
}

interface TasksData {
  qualityChecks: EnhancedTask[];
  operations: EnhancedTask[];
  totalTasks: number;
  blockedTasks: number;
}

export function EnhancedTaskList() {
  const [tasksData, setTasksData] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getInspectorTasksWithDependencies();
      setTasksData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch tasks";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskAction = async (taskId: string, newStatus: Status) => {
    setProcessingTaskId(taskId);
    
    try {
      const result = await updateTaskStatus({
        id: taskId,
        status: newStatus,
      });

      if (result.success) {
        toast({
          title: "Task Updated",
          description: result.message || "Task status updated successfully",
        });
        await fetchTasks(); // Refresh the data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update task";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const getStatusBadge = (status: Status, blocked: boolean) => {
    if (blocked) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Ban className="w-3 h-3 mr-1" />
          Blocked
        </Badge>
      );
    }

    switch (status) {
      case Status.PENDING:
        return <Badge variant="outline" className="text-xs">⏳ Pending</Badge>;
      case Status.IN_PROGRESS:
        return <Badge variant="secondary" className="text-xs">🕐 In Progress</Badge>;
      case Status.COMPLETED:
        return <Badge variant="default" className="text-xs">✅ Completed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getTaskTypeIcon = (type: "quality_check" | "operation") => {
    return type === "quality_check" ? "🔍" : "⚙️";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading Tasks...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">Loading your tasks with dependency status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Error Loading Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={fetchTasks} className="w-full mt-3">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!tasksData) return null;

  const allTasks = [...tasksData.qualityChecks, ...tasksData.operations].sort((a, b) => {
    // Sort by: not blocked first, then by status (pending first), then by due date
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    if (a.status !== b.status) {
      const statusOrder = { [Status.PENDING]: 0, [Status.IN_PROGRESS]: 1, [Status.COMPLETED]: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const readyTasks = allTasks.filter(task => !task.blocked && task.status !== Status.COMPLETED);
  const blockedTasks = allTasks.filter(task => task.blocked);
  const completedTasks = allTasks.filter(task => task.status === Status.COMPLETED);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ready Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{readyTasks.length}</div>
            <p className="text-sm text-gray-600">Tasks ready to work on</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Blocked Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedTasks.length}</div>
            <p className="text-sm text-gray-600">Waiting for dependencies</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedTasks.length}</div>
            <p className="text-sm text-gray-600">Finished tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Ready Tasks */}
      {readyTasks.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-green-600" />
              Ready Tasks ({readyTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {readyTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
                      <h4 className="font-medium">{task.description}</h4>
                      {getStatusBadge(task.status, task.blocked)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Due:</span>{" "}
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span> {task.quantity} units
                      </div>
                      <div>
                        <span className="font-medium">Current Phase:</span>{" "}
                        {task.currentPhase.replace("_", " ").toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Work Centers:</span>{" "}
                        {task.dependencyStatus.completionPercentage}% complete
                      </div>
                    </div>

                    {/* Dependency Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Work Center Progress</span>
                        <span>{task.dependencyStatus.completedCount} / {task.dependencyStatus.totalOperations}</span>
                      </div>
                      <Progress value={task.dependencyStatus.completionPercentage} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {task.status === Status.PENDING && (
                      <Button
                        size="sm"
                        onClick={() => handleTaskAction(task.id, Status.IN_PROGRESS)}
                        disabled={processingTaskId === task.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {processingTaskId === task.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Start"
                        )}
                      </Button>
                    )}
                    
                    {task.status === Status.IN_PROGRESS && (
                      <Button
                        size="sm"
                        onClick={() => handleTaskAction(task.id, Status.COMPLETED)}
                        disabled={processingTaskId === task.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingTaskId === task.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Complete"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Blocked Tasks */}
      {blockedTasks.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              Blocked Tasks ({blockedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {blockedTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
                      <h4 className="font-medium">{task.description}</h4>
                      {getStatusBadge(task.status, task.blocked)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Due:</span>{" "}
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span> {task.quantity} units
                      </div>
                    </div>

                    {/* Blocking Information */}
                    <Alert className="border-orange-200 bg-orange-50">
                      <Factory className="h-4 w-4 text-orange-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Blocking Issue:</p>
                          <p className="text-xs">{task.blockingReason}</p>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Work Center Progress Required</span>
                              <span>{task.dependencyStatus.completedCount} / {task.dependencyStatus.totalOperations}</span>
                            </div>
                            <Progress value={task.dependencyStatus.completionPercentage} className="h-1" />
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Completed Tasks ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getTaskTypeIcon(task.type)}</span>
                  <span className="text-sm font-medium">{task.description}</span>
                  {getStatusBadge(task.status, task.blocked)}
                </div>
                <span className="text-xs text-gray-600">
                  {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                </span>
              </div>
            ))}
            {completedTasks.length > 5 && (
              <p className="text-xs text-gray-600 text-center">
                ... and {completedTasks.length - 5} more completed tasks
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Tasks Message */}
      {allTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Assigned</h3>
            <p className="text-gray-600">You don&apos;t have any tasks assigned at the moment.</p>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchTasks} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Tasks
        </Button>
      </div>
    </div>
  );
} 