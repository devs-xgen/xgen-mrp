"use client";

import { useState } from "react";
import { InspectorsTask } from "@/types/inspector/task";
import {
  updateTaskStatus,
  startTaskTimer,
  stopTaskTimer,
  reportTaskIssue,
} from "@/lib/actions/inspector/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Status } from "@prisma/client";
import {
  Clock,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  Timer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskCardProps {
  task: InspectorsTask;
}

export function TaskCard({ task }: TaskCardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(task.notes || "");
  const [issueType, setIssueType] = useState<string>("QUALITY");
  const [issueSeverity, setIssueSeverity] = useState<string>("MEDIUM");
  const [issueDescription, setIssueDescription] = useState<string>("");

  const isTaskInactive = task.isActive === false;
  const productionStatus = task.productionStatus || Status.PENDING;

  const getStatusBadgeVariant = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return "secondary";
      case Status.IN_PROGRESS:
        return "outline";
      case Status.COMPLETED:
        return "default";
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

  const handleStatusChange = async (newStatus: Status) => {
    try {
      setLoading(true);
      await updateTaskStatus({
        id: task.id,
        status: newStatus,
        notes,
      });
      toast({
        title: "Task updated",
        description: `Task status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimerStart = async () => {
    try {
      setLoading(true);
      await startTaskTimer(task.id);
      setIsTimerActive(true);
      toast({
        title: "Timer started",
        description: "Time tracking has started for this task",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimerStop = async () => {
    try {
      setLoading(true);
      const result = await stopTaskTimer(task.id);
      setIsTimerActive(false);
      toast({
        title: "Timer stopped",
        description: `Time logged: ${result.duration} minutes`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    try {
      setLoading(true);
      await reportTaskIssue(
        task.id,
        issueType as "QUALITY" | "MATERIAL" | "EQUIPMENT" | "OTHER",
        issueDescription,
        issueSeverity as "LOW" | "MEDIUM" | "HIGH"
      );
      toast({
        title: "Issue reported",
        description: "Your issue has been reported successfully",
      });
      setIssueDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate time remaining or overdue
  const getDueStatusText = () => {
    if (!task.dueDate) return "No due date";

    const now = new Date();
    const dueDate = new Date(task.dueDate);

    if (now > dueDate && task.status !== Status.COMPLETED) {
      return `Overdue by ${formatDistanceToNow(dueDate)}`;
    } else if (task.status === Status.COMPLETED) {
      return "Completed";
    } else {
      return `Due in ${formatDistanceToNow(dueDate)}`;
    }
  };

  const dueStatusText = getDueStatusText();
  const isDueSoon =
    task.dueDate &&
    new Date(task.dueDate).getTime() - new Date().getTime() <
      24 * 60 * 60 * 1000 &&
    task.status !== Status.COMPLETED;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < new Date().getTime() &&
    task.status !== Status.COMPLETED;

  return (
    <Card
      className={`
      ${task.priority === "URGENT" ? "border-red-500" : ""}
      ${task.priority === "HIGH" ? "border-orange-400" : ""}
      ${isOverdue ? "bg-red-50" : ""}
      ${isTaskInactive ? "opacity-70 border-dashed" : ""}
    `}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{task.description}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusBadgeVariant(task.status)}>
                {task.status}
              </Badge>

              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                {task.priority}
              </Badge>

              {isTaskInactive && (
                <Badge variant="outline" className="border-amber-500 text-amber-500">
                  {productionStatus === Status.PENDING ? "NOT STARTED" : "PAUSED"}
                </Badge>
              )}

              <span
                className={`text-xs ${
                  isOverdue
                    ? "text-red-600"
                    : isDueSoon
                    ? "text-amber-600"
                    : "text-muted-foreground"
                }`}
              >
                {dueStatusText}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pb-2">
          {isTaskInactive && (
            <div className="flex items-center gap-2 p-2 mb-4 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="text-sm text-amber-700">
                <p>This task is not active because the production order has not been started by admin.</p>
                <p className="text-xs mt-1">You will be able to work on this task once the production order is started.</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">Work Center:</span>
              <div>{task.workCenterName}</div>
            </div>

            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <div>{task.quantity || "N/A"}</div>
            </div>

            {task.completedQuantity !== undefined && task.quantity && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Progress:</span>
                <div className="mt-1">
                  <Progress
                    value={(task.completedQuantity / task.quantity) * 100}
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground mt-1 inline-block">
                    {task.completedQuantity} of {task.quantity} completed (
                    {((task.completedQuantity / task.quantity) * 100).toFixed(
                      0
                    )}
                    %)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Notes:</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                placeholder="Add notes about this task..."
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      )}

      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center gap-2">
          {task.workCenterName && (
            <Badge variant="outline" className="text-xs">
              {task.workCenterName}
            </Badge>
          )}
          {task.quantity && (
            <Badge variant="outline" className="text-xs">
              Qty: {task.quantity}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isTimerActive ? handleTimerStop : handleTimerStart}
            disabled={loading || isTaskInactive || task.status === Status.COMPLETED}
          >
            {isTimerActive ? (
              <>
                <Pause className="h-4 w-4 mr-1" /> Stop Timer
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" /> Start Timer
              </>
            )}
          </Button>

          {task.status === Status.PENDING && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(Status.IN_PROGRESS)}
              disabled={loading || isTaskInactive}
            >
              <Play className="h-4 w-4 mr-1" /> Start
            </Button>
          )}

          {task.status === Status.IN_PROGRESS && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStatusChange(Status.COMPLETED)}
              disabled={loading || isTaskInactive}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Complete
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || isTaskInactive || task.status === Status.COMPLETED}
              >
                <AlertTriangle className="h-4 w-4 mr-1" /> Report Issue
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Report an Issue</SheetTitle>
                <SheetDescription>
                  Describe any problems you&apos;re experiencing with this task.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue Type</label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUALITY">Quality Issue</SelectItem>
                      <SelectItem value="MATERIAL">Material Issue</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment Issue</SelectItem>
                      <SelectItem value="OTHER">Other Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Severity</label>
                  <Select
                    value={issueSeverity}
                    onValueChange={setIssueSeverity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  onClick={handleReportIssue}
                  disabled={loading || !issueDescription.trim() || isTaskInactive || task.status === Status.COMPLETED}
                >
                  Submit Report
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </CardFooter>
    </Card>
  );
}
