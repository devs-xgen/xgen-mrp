// // src/components/module/worker/tasks/edit-operation-dialog.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { Status } from "@prisma/client";
// import { Loader2, Pencil } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { updateOperation } from "@/lib/actions/worker/production-order";

// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";


// interface WorkCenter {
//   id: string;
//   name: string;
//   capacityPerHour: number;
// }

// interface Operation {
//   id: string;
//   workCenterId: string;
//   startTime: Date;
//   endTime: Date;
//   status: Status;
//   notes?: string | null;
//   workCenter: {
//     name: string;
//   };
// }

// interface EditOperationDialogProps {
//   operation: Operation;
//   workCenters: WorkCenter[];
//   onOperationUpdated?: () => Promise<void>;
//   children?: React.ReactNode;
// }

// export function EditOperationDialog({
//   operation,
//   workCenters,
//   onOperationUpdated,
//   children,
// }: EditOperationDialogProps) {
//   const [open, setOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { toast } = useToast();

//   // Form state
//   const [workCenterId, setWorkCenterId] = useState(operation.workCenterId);
//   const [startTime, setStartTime] = useState("");
//   const [endTime, setEndTime] = useState("");
//   const [notes, setNotes] = useState(operation.notes || "");

//   // Initialize datetime-local values when dialog opens
//   useEffect(() => {
//     if (open) {
//       // Convert Date to datetime-local format (YYYY-MM-DDTHH:mm)
//       const formatDateTimeLocal = (date: Date) => {
//         const d = new Date(date);
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         const hours = String(d.getHours()).padStart(2, '0');
//         const minutes = String(d.getMinutes()).padStart(2, '0');
//         return `${year}-${month}-${day}T${hours}:${minutes}`;
//       };

//       setStartTime(formatDateTimeLocal(operation.startTime));
//       setEndTime(formatDateTimeLocal(operation.endTime));
//       setWorkCenterId(operation.workCenterId);
//       setNotes(operation.notes || "");
//     }
//   }, [open, operation]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validation
//     if (!workCenterId) {
//       toast({
//         title: "Validation Error",
//         description: "Please select a work center",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!startTime || !endTime) {
//       toast({
//         title: "Validation Error",
//         description: "Please provide both start and end times",
//         variant: "destructive",
//       });
//       return;
//     }

//     const start = new Date(startTime);
//     const end = new Date(endTime);

//     if (end <= start) {
//       toast({
//         title: "Validation Error",
//         description: "End time must be after start time",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       await updateOperation(operation.id, {
//         workCenterId,
//         startTime: start,
//         endTime: end,
//         notes: notes.trim() || null,
//       });

//       toast({
//         title: "Operation Updated",
//         description: "The operation has been successfully updated",
//       });

//       setOpen(false);
      
//       if (onOperationUpdated) {
//         await onOperationUpdated();
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description:
//           error instanceof Error ? error.message : "Failed to update operation",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         {children || (
//           <Button variant="outline" size="sm">
//             <Pencil className="h-4 w-4" />
//             <span className="sr-only">Edit</span>
//           </Button>
//         )}
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[500px]">
//         <form onSubmit={handleSubmit}>
//           <DialogHeader>
//             <DialogTitle>Edit Operation</DialogTitle>
//             <DialogDescription>
//               Update the operation details for this production order
//             </DialogDescription>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             <div className="grid gap-2">
//               <Label htmlFor="workCenter">Work Center</Label>
//               <Select value={workCenterId} onValueChange={setWorkCenterId}>
//                 <SelectTrigger id="workCenter">
//                   <SelectValue placeholder="Select work center" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {workCenters.map((wc) => (
//                     <SelectItem key={wc.id} value={wc.id}>
//                       {wc.name} ({wc.capacityPerHour} units/hr)
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="grid gap-2">
//               <Label htmlFor="startTime">Start Time</Label>
//               <Input
//                 id="startTime"
//                 type="datetime-local"
//                 value={startTime}
//                 onChange={(e) => setStartTime(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="grid gap-2">
//               <Label htmlFor="endTime">End Time</Label>
//               <Input
//                 id="endTime"
//                 type="datetime-local"
//                 value={endTime}
//                 onChange={(e) => setEndTime(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="grid gap-2">
//               <Label htmlFor="notes">Notes (Optional)</Label>
//               <Textarea
//                 id="notes"
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 placeholder="Add any notes about this operation..."
//                 rows={3}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => setOpen(false)}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Updating...
//                 </>
//               ) : (
//                 "Update Operation"
//               )}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }


// src/components/module/worker/tasks/edit-operation-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Status } from "@prisma/client";
import { Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Updated import path to match your provided actions file structure
import { updateOperation } from "@/lib/actions/production-order"; 

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";


interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

interface Operation {
  id: string;
  workCenterId: string;
  startTime: Date;
  endTime: Date;
  status: Status;
  notes?: string | null;
  workCenter: {
    name: string;
  };
}

interface EditOperationDialogProps {
  operation: Operation;
  workCenters: WorkCenter[];
  onOperationUpdated?: () => Promise<void>;
  children?: React.ReactNode;
}

export function EditOperationDialog({
  operation,
  workCenters,
  onOperationUpdated,
  children,
}: EditOperationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [workCenterId, setWorkCenterId] = useState(operation.workCenterId);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState(operation.notes || "");

  // Initialize datetime-local values when dialog opens
  useEffect(() => {
    if (open) {
      // Function to convert Date to datetime-local format (YYYY-MM-DDTHH:mm)
      const formatDateTimeLocal = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setStartTime(formatDateTimeLocal(operation.startTime));
      setEndTime(formatDateTimeLocal(operation.endTime));
      setWorkCenterId(operation.workCenterId);
      setNotes(operation.notes || "");
    }
  }, [open, operation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Validation ---
    if (!workCenterId) {
      toast({
        title: "Validation Error",
        description: "Please select a work center",
        variant: "destructive",
      });
      return;
    }

    if (!startTime || !endTime) {
      toast({
        title: "Validation Error",
        description: "Please provide both start and end times",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    // --- End Validation ---

    try {
      setIsSubmitting(true);

      // Call the server action with updated data
      await updateOperation(operation.id, {
        workCenterId,
        startTime: start,
        endTime: end,
        notes: notes.trim() || null, // Pass notes, trimming and converting empty string to null
      });

      toast({
        title: "Operation Updated",
        description: "The operation has been successfully updated",
      });

      setOpen(false);
      
      if (onOperationUpdated) {
        await onOperationUpdated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update operation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Render the children (likely a button) or default button */}
        {children || (
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Operation</DialogTitle>
            <DialogDescription>
              Update the operation details for this production order
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workCenter">Work Center</Label>
              <Select 
                value={workCenterId} 
                onValueChange={setWorkCenterId}
                // Disable if the operation is not PENDING (as enforced by server action)
                disabled={operation.status !== 'PENDING'} 
              >
                <SelectTrigger id="workCenter">
                  <SelectValue placeholder="Select work center" />
                </SelectTrigger>
                <SelectContent>
                  {workCenters.map((wc) => (
                    <SelectItem key={wc.id} value={wc.id}>
                      {wc.name} ({wc.capacityPerHour} units/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                // Disable if the operation is not PENDING (as enforced by server action)
                disabled={operation.status !== 'PENDING'} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                // Disable if the operation is not PENDING (as enforced by server action)
                disabled={operation.status !== 'PENDING'} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this operation..."
                rows={3}
                // Allow notes editing even if not PENDING, though the server will prevent save if other fields change
                // However, given the server only allows PENDING edits, disabling this field for non-PENDING is safer
                disabled={operation.status !== 'PENDING'} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || operation.status !== 'PENDING'}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Operation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}