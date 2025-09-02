// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Status } from "@prisma/client";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { toast } from "sonner";
// import { updateTask } from "@/lib/actions/inspectors";
// import { Task } from "@/lib/actions/inspectors";

// interface TaskUpdateFormProps {
//   task: Task;
//   inspectorId: string; // Changed from workerId to inspectorId
// }

// export function TaskUpdateForm({ task, inspectorId }: TaskUpdateFormProps) {
//   const router = useRouter();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [status, setStatus] = useState<Status>(task.status);
//   const [notes, setNotes] = useState(task.notes || "");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     try {
//       // Pass inspectorId instead of workerId
//       await updateTask(task.id, inspectorId, {
//         status,
//         notes: notes || undefined,
//         startTime:
//           status === "IN_PROGRESS" && task.status !== "IN_PROGRESS"
//             ? new Date()
//             : task.startTime,
//         endTime:
//           status === "COMPLETED" && task.status !== "COMPLETED"
//             ? new Date()
//             : task.endTime,
//       });

//       toast.success("Task updated successfully");
//       router.refresh();
//     } catch (error) {
//       toast.error("Failed to update task");
//       console.error(error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div className="space-y-2">
//         <label htmlFor="status" className="text-sm font-medium">
//           Status
//         </label>
//         <Select
//           value={status}
//           onValueChange={(value) => setStatus(value as Status)}
//         >
//           <SelectTrigger id="status">
//             <SelectValue placeholder="Select status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="PENDING">Pending</SelectItem>
//             <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
//             <SelectItem value="COMPLETED">Completed</SelectItem>
//             <SelectItem value="CANCELLED">Cancelled</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="space-y-2">
//         <label htmlFor="notes" className="text-sm font-medium">
//           Notes
//         </label>
//         <Textarea
//           id="notes"
//           value={notes}
//           onChange={(e) => setNotes(e.target.value)}
//           placeholder="Add notes about the task..."
//           className="min-h-[100px]"
//         />
//       </div>

//       <Button type="submit" disabled={isSubmitting}>
//         {isSubmitting ? "Updating..." : "Update Task"}
//       </Button>
//     </form>
//   );
// }
// src/components/module/inspectors/task-update-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Status } from "@prisma/client";
import { useNotifications } from "@/hooks/use-notification";
import type { UpdateFormData } from "@/types/inspector/inspector";
import { InspectorsTask } from "./dashboard/InspectorDashboardClient"; // Import the interface

interface TaskUpdateFormProps {
  task: InspectorsTask; // Change to accept the full task object
  onSubmit: (data: UpdateFormData) => void;
  onClose: () => void;
}

export const TaskUpdateForm: React.FC<TaskUpdateFormProps> = ({
  task,
  onSubmit,
  onClose,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(task.status);
  const [notes, setNotes] = useState(task.notes || "");
  const { showSuccess, showError, showInfo } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    showInfo("Updating Task", "Saving your changes...");

    try {
      // Simulate API call or action
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSubmit({
        taskId: task.id,
        status,
        notes,
      });
      showSuccess("Task Updated", "Task status and notes have been saved successfully.");
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      showError("Update Failed", "Failed to update the task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Task: {task.title || task.description}</DialogTitle>
          <DialogDescription>
            Make changes to the task status and add notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value: Status) => setStatus(value)} value={status}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Status.PENDING}>Not Started</SelectItem>
                <SelectItem value={Status.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={Status.COMPLETED}>Completed</SelectItem>
                <SelectItem value={Status.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};