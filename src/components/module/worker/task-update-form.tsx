"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateWorkerTask } from "@/lib/actions/worker-tasks";
import { Task } from "@/lib/actions/worker-tasks";

interface TaskUpdateFormProps {
  task: Task;
  workerId: string;
}

export function TaskUpdateForm({ task, workerId }: TaskUpdateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(task.status);
  const [notes, setNotes] = useState(task.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateWorkerTask(task.id, workerId, {
        status,
        notes: notes || undefined,
        startTime:
          status === "IN_PROGRESS" && task.status !== "IN_PROGRESS"
            ? new Date()
            : task.startTime,
        endTime:
          status === "COMPLETED" && task.status !== "COMPLETED"
            ? new Date()
            : task.endTime,
      });

      toast.success("Task updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update task");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as Status)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about the task..."
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Task"}
      </Button>
    </form>
  );
}
