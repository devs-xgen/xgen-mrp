"use client";

import { useState } from "react";
import { WorkerTask } from "@/types/worker/tasks";
import {
  updateTaskStatus,
  startTaskTimer,
  stopTaskTimer,
  reportTaskIssue,
} from "@/lib/actions/worker/tasks";
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
  task: WorkerTask;
}

export function TaskCard({ task }: TaskCardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(task.notes || "");
  const [issueType, setIssueType] = useState<string>("QUALITY");
  const [issueSeverity, setIssueSeverity] = useState<string>("MEDIUM");
  const [issueDescription, setIssueDescription] = useState<string>("");

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
        <CardContent className="pb-3">
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

      <CardFooter className="flex justify-between pt-3">
        <div className="flex space-x-2">
          {task.status !== Status.COMPLETED && (
            <>
              {isTimerActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={handleTimerStop}
                  disabled={loading}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={handleTimerStart}
                  disabled={loading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                disabled={loading}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Report an Issue</SheetTitle>
                <SheetDescription>
                  Describe any problems you're experiencing with this task.
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
                  disabled={loading || !issueDescription.trim()}
                >
                  Submit Report
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {task.status === Status.PENDING && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => handleStatusChange(Status.IN_PROGRESS)}
              disabled={loading}
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}

          {task.status === Status.IN_PROGRESS && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => handleStatusChange(Status.COMPLETED)}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
