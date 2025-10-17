// "use client";

// import { useState, useEffect } from "react";
// import { Status } from "@prisma/client";
// import { formatDate } from "@/lib/utils";
// import { Loader2, Trash2, ChevronDown, Pencil, Eye } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import {
//   updateQualityCheck,
//   deleteQualityCheck,
// } from "@/lib/actions/quality-checks";
// import { getInspector } from "@/lib/actions/inspector";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { CreateQualityCheckDialog } from "./create-quality-check-dialog";
// import { EditQualityCheckDialog } from "./edit-quality-check-dialog";
// import { QualityCheck } from "@/types/admin/quality-checks";
// import { useParams } from "next/navigation";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// // View rich text content dialog component
// interface ViewRichTextDialogProps {
//   title: string;
//   content: string;
//   children: React.ReactNode;
// }

// function ViewRichTextDialog({ title, content, children }: ViewRichTextDialogProps) {
//   const [open, setOpen] = useState(false);
  
//   // Function to determine if content is empty or contains only HTML tags
//   const hasContent = content && content.replace(/<[^>]*>/g, '').trim() !== '';
  
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>{children}</DialogTrigger>
//       <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-0 border-2">
//         <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 bg-background z-10 border-b">
//           <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
//         </DialogHeader>
//         <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
//           {hasContent ? (
//             <div 
//               className="prose prose-sm max-w-none dark:prose-invert bg-muted/10 p-4 rounded-lg border animate-in fade-in duration-300"
//               dangerouslySetInnerHTML={{ __html: content }}
//             />
//           ) : (
//             <div className="text-center p-8 text-muted-foreground italic">
//               No content available
//             </div>
//           )}
//         </div>
//         <div className="p-4 bg-muted/10 border-t flex justify-end">
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={() => setOpen(false)}
//           >
//             Close
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

// // Valid statuses for quality checks
// const QUALITY_CHECK_STATUSES: Status[] = [
//   "PENDING",
//   "IN_PROGRESS",
//   "COMPLETED",
//   "CANCELLED"
// ];

// interface QualityChecksProps {
//   productionOrderId: string;
//   checks: QualityCheck[];
//   onAddCheck?: () => void | undefined;
//   onRefresh?: () => Promise<void>;
//   isLoading?: boolean;
// }

// export function QualityChecks({
//   productionOrderId: propId,
//   checks,
//   onRefresh,
//   isLoading = false,
// }: QualityChecksProps) {
//   const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>(
//     checks || []
//   );
//   const [updatingId, setUpdatingId] = useState<string | null>(null);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const { toast } = useToast();
//   const params = useParams();

//   const productionOrderId = propId || (params?.id as string);

//   // Update local state when checks prop changes
//   useEffect(() => {
//     // Only update if checks is provided
//     if (checks) {
//       console.log("Quality checks received from props:", checks);
//       console.log("Production order ID:", productionOrderId);
//       setQualityChecks(checks);
//     }
//   }, [checks, productionOrderId]);

//   const handleStatusUpdate = async (
//     id: string,
//     newStatus: Status,
//     defectsFound: string | null = null,
//     actionTaken: string | null = null,
//     notes: string | null = null
//   ) => {
//     try {
//       setUpdatingId(id);
//       const data = {
//         id,
//         status: newStatus,
//         defectsFound: defectsFound === null ? undefined : defectsFound,
//         actionTaken: actionTaken === null ? undefined : actionTaken,
//         notes: notes === null ? undefined : notes,
//       };
//       const updatedCheck = await updateQualityCheck(id, newStatus, data);

//       if (updatedCheck) {
//         setQualityChecks((prevChecks) =>
//           prevChecks.map((check) =>
//             check.id === updatedCheck.id ? updatedCheck : check
//           )
//         );
//       }

//       if (onRefresh) await onRefresh();

//       toast({
//         title: "Quality Check Updated",
//         description: `Quality check status updated to ${formatStatus(newStatus)}`,
//       });
//     } catch (error) {
//       toast({
//         title: "Error",
//         description:
//           error instanceof Error
//             ? error.message
//             : "Failed to update quality check",
//         variant: "destructive",
//       });
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const handleDeleteQualityCheck = async (id: string) => {
//     try {
//       setDeletingId(id);
//       await deleteQualityCheck(id);

//       // Remove from local state
//       setQualityChecks((prevChecks) =>
//         prevChecks.filter((check) => check.id !== id)
//       );

//       // Refresh from server if needed
//       if (onRefresh) await onRefresh();

//       toast({
//         title: "Quality Check Deleted",
//         description: "The quality check has been successfully removed",
//       });
//     } catch (error) {
//       toast({
//         title: "Error",
//         description:
//           error instanceof Error
//             ? error.message
//             : "Failed to delete quality check",
//         variant: "destructive",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const getStatusBadgeVariant = (
//     status: Status
//   ): "default" | "secondary" | "outline" | "destructive" => {
//     switch (status) {
//       case "COMPLETED":
//         return "default";
//       case "IN_PROGRESS":
//         return "secondary";
//       case "CANCELLED":
//         return "destructive";
//       default:
//         return "outline";
//     }
//   };

//   // Function to format status for display
//   const formatStatus = (status: Status): string => {
//     return status.toLowerCase().replace("_", " ");
//   };

//   // Status indicator dot color
//   const getStatusDotColor = (status: Status): string => {
//     switch (status) {
//       case "COMPLETED":
//         return "bg-green-500";
//       case "IN_PROGRESS":
//         return "bg-blue-500";
//       case "CANCELLED":
//         return "bg-red-500";
//       default:
//         return "bg-gray-400";
//     }
//   };

//   // Row background color based on status and defects
//   const getRowBackgroundClass = (status: Status, hasDefects: boolean): string => {
//     if (status === "COMPLETED" && hasDefects) {
//       return "bg-red-50";
//     } else if (status === "COMPLETED") {
//       return "bg-green-50";
//     } else if (status === "IN_PROGRESS") {
//       return "bg-secondary/10";
//     } else if (status === "CANCELLED") {
//       return "bg-destructive/10";
//     }
//     return "";
//   };

//   const handleQualityCheckCreated = async () => {
//     console.log("Quality check created - refreshing data");
//     // Simply refresh the data when a new check is created
//     if (onRefresh) {
//       await onRefresh();
//     }
//   };

//   // Filter checks for this specific production order
//   const filteredChecks =
//     qualityChecks?.filter(
//       (check) => check.productionOrderId === productionOrderId
//     ) || [];

//   console.log("Filtered quality checks:", filteredChecks);
//   console.log("All quality checks:", qualityChecks);

//   return (
//     <Card className="border-2 border-muted">
//       <CardHeader className="pb-3">
//         <div className="flex justify-between items-center">
//           <div>
//             <CardTitle className="text-xl font-bold">
//               Quality Inspections
//             </CardTitle>
//             <CardDescription className="text-sm mt-1">
//               Quality control checks and inspection results
//             </CardDescription>
//           </div>
//           <CreateQualityCheckDialog
//             productionOrderId={productionOrderId}
//             onRefresh={onRefresh || handleQualityCheckCreated}
//           />
//         </div>
//       </CardHeader>
//       <CardContent className="pt-4">
//         {isLoading ? (
//           <div className="flex justify-center items-center py-8">
//             <Loader2 className="h-8 w-8 animate-spin text-primary" />
//             <span className="ml-2">Loading quality checks...</span>
//           </div>
//         ) : (
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Inspector</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead className="text-center">Defects</TableHead>
//                 <TableHead className="text-center">Action</TableHead>
//                 <TableHead className="text-center">Notes</TableHead>
//                 <TableHead className="text-right font-bold bg-muted/30">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredChecks.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} className="text-center py-8">
//                     <div className="flex flex-col items-center justify-center text-muted-foreground">
//                       <div className="h-12 w-12 rounded-full border-2 border-dashed flex items-center justify-center mb-2">
//                         <Eye className="h-6 w-6 opacity-50" />
//                       </div>
//                       <p>No quality checks recorded for this production order.</p>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredChecks.map((check) => {
//                   const hasDefects = Boolean(
//                     check.defectsFound && check.defectsFound.trim() !== ""
//                   );

//                   return (
//                     <TableRow
//                       key={check.id}
//                       className={getRowBackgroundClass(check.status, hasDefects)}
//                     >
//                       <TableCell>{formatDate(check.checkDate)}</TableCell>
//                       <TableCell className="font-medium">
//                         {check.inspectorName || check.inspectorId || "Unknown"}
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center">
//                           <div
//                             className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(check.status)}`}
//                           />
//                           <DropdownMenu>
//                             <DropdownMenuTrigger asChild>
//                               <Button 
//                                 variant="ghost" 
//                                 size="sm"
//                                 className="h-8 p-0 font-normal"
//                               >
//                                 <Badge
//                                   variant={getStatusBadgeVariant(check.status)}
//                                   className="mr-1"
//                                 >
//                                   {updatingId === check.id ? (
//                                     <Loader2 className="mr-1 h-3 w-3 animate-spin" />
//                                   ) : null}
//                                   {formatStatus(check.status)}
//                                 </Badge>
//                                 <ChevronDown className="h-3 w-3 opacity-70" />
//                               </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align="center">
//                               {QUALITY_CHECK_STATUSES.map((status) => (
//                                 <DropdownMenuItem
//                                   key={status}
//                                   onClick={() => handleStatusUpdate(
//                                     check.id,
//                                     status,
//                                     check.defectsFound || null,
//                                     check.actionTaken || null,
//                                     check.notes || null
//                                   )}
//                                   disabled={check.status === status}
//                                   className={check.status === status ? "bg-muted" : ""}
//                                 >
//                                   {formatStatus(status)}
//                                 </DropdownMenuItem>
//                               ))}
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center justify-center">
//                           {hasDefects ? (
//                             <ViewRichTextDialog 
//                               title="Defects Found" 
//                               content={check.defectsFound || ''}
//                             >
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
//                                 title="View defects found"
//                               >
//                                 <Eye className="h-4 w-4" />
//                               </Button>
//                             </ViewRichTextDialog>
//                           ) : (
//                             <span className="text-sm text-muted-foreground">
//                               None
//                             </span>
//                           )}
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center justify-center">
//                           {check.actionTaken ? (
//                             <ViewRichTextDialog 
//                               title="Action Taken" 
//                               content={check.actionTaken}
//                             >
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
//                                 title="View action taken"
//                               >
//                                 <Eye className="h-4 w-4" />
//                               </Button>
//                             </ViewRichTextDialog>
//                           ) : (
//                             <span className="text-sm text-muted-foreground">
//                               None
//                             </span>
//                           )}
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center justify-center">
//                           {check.notes ? (
//                             <ViewRichTextDialog 
//                               title="Notes" 
//                               content={check.notes}
//                             >
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
//                                 title="View notes"
//                               >
//                                 <Eye className="h-4 w-4" />
//                               </Button>
//                             </ViewRichTextDialog>
//                           ) : (
//                             <span className="text-sm text-muted-foreground">
//                               None
//                             </span>
//                           )}
//                         </div>
//                       </TableCell>
//                       <TableCell className="text-right border border-dashed border-gray-200 p-2">
//                         <div className="flex flex-col space-y-2">
//                           <EditQualityCheckDialog
//                             qualityCheck={check}
//                             onRefresh={onRefresh}
//                           >
//                             <Button 
//                               variant="outline" 
//                               className="w-full h-9 px-3"
//                             >
//                               <Pencil className="h-4 w-4 mr-2" />
//                               Edit
//                             </Button>
//                           </EditQualityCheckDialog>

//                           <AlertDialog>
//                             <AlertDialogTrigger asChild>
//                               <Button
//                                 variant="destructive"
//                                 className="w-full h-9 px-3"
//                                 disabled={deletingId === check.id || isLoading}
//                               >
//                                 {deletingId === check.id ? (
//                                   <Loader2 className="h-5 w-5 animate-spin mr-2" />
//                                 ) : (
//                                   <Trash2 className="h-4 w-4 mr-2" />
//                                 )}
//                                 Delete
//                               </Button>
//                             </AlertDialogTrigger>
//                             <AlertDialogContent>
//                               <AlertDialogHeader>
//                                 <AlertDialogTitle>
//                                   Delete Quality Check
//                                 </AlertDialogTitle>
//                                 <AlertDialogDescription>
//                                   Are you sure you want to delete this quality
//                                   check? This will remove the task assigned to the inspector.
//                                   This action cannot be undone.
//                                 </AlertDialogDescription>
//                               </AlertDialogHeader>
//                               <AlertDialogFooter>
//                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
//                                 <AlertDialogAction
//                                   onClick={() =>
//                                     handleDeleteQualityCheck(check.id)
//                                   }
//                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//                                 >
//                                   Delete
//                                 </AlertDialogAction>
//                               </AlertDialogFooter>
//                             </AlertDialogContent>
//                           </AlertDialog>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })
//               )}
//             </TableBody>
//           </Table>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Loader2, Trash2, ChevronDown, Pencil, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateQualityCheck,
  deleteQualityCheck,
} from "@/lib/actions/quality-checks";
import { getInspector } from "@/lib/actions/inspector";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateQualityCheckDialog } from "./create-quality-check-dialog";
// import { EditQualityCheckDialog } from "./edit-quality-check-dialog";
import { QualityCheck } from "@/types/admin/quality-checks";
import { useParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// View rich text content dialog component
interface ViewRichTextDialogProps {
  title: string;
  content: string;
  children: React.ReactNode;
}

function ViewRichTextDialog({ title, content, children }: ViewRichTextDialogProps) {
  const [open, setOpen] = useState(false);
  
  // Function to determine if content is empty or contains only HTML tags
  const hasContent = content && content.replace(/<[^>]*>/g, '').trim() !== '';
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-0 border-2">
        <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 bg-background z-10 border-b">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {hasContent ? (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert bg-muted/10 p-4 rounded-lg border animate-in fade-in duration-300"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-center p-8 text-muted-foreground italic">
              No content available
            </div>
          )}
        </div>
        <div className="p-4 bg-muted/10 border-t flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reusable component for displaying rich text content within a table cell
interface RichTextCellProps {
  content: string | null | undefined;
  title: string;
}

const RichTextCell: React.FC<RichTextCellProps> = ({ content, title }) => {
  // Function to determine if content is empty or contains only HTML tags
  const hasContent = content && content.replace(/<[^>]*>/g, '').trim() !== '';

  return (
    <TableCell>
      <div className="flex items-center justify-center">
        {hasContent ? (
          <ViewRichTextDialog 
            title={title} 
            content={content || ''}
          >
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
              title={`View ${title.toLowerCase()}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </ViewRichTextDialog>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        )}
      </div>
    </TableCell>
  );
};

// Valid statuses for quality checks
const QUALITY_CHECK_STATUSES: Status[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
];

interface QualityChecksProps {
  productionOrderId: string;
  checks: QualityCheck[];
  onAddCheck?: () => void | undefined;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

// --- Utility Functions ---

// Function to format status for display
const formatStatus = (status: Status): string => {
  return status.toLowerCase().replace("_", " ");
};

// Status indicator dot color
const getStatusDotColor = (status: Status): string => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "CANCELLED":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
};

const getStatusBadgeVariant = (
  status: Status
): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
};

// Row background color based on status and defects
const getRowBackgroundClass = (status: Status, hasDefects: boolean): string => {
  if (status === "COMPLETED" && hasDefects) {
    return "bg-red-50 dark:bg-red-950/20";
  } else if (status === "COMPLETED") {
    return "bg-green-50 dark:bg-green-950/20";
  } else if (status === "IN_PROGRESS") {
    return "bg-secondary/10";
  } else if (status === "CANCELLED") {
    return "bg-destructive/10";
  }
  return "";
};


export function QualityChecks({
  productionOrderId: propId,
  checks,
  onRefresh,
  isLoading = false,
}: QualityChecksProps) {
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>(
    checks || []
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const params = useParams();

  const productionOrderId = propId || (params?.id as string);

  // Update local state when checks prop changes
  useEffect(() => {
    // Only update if checks is provided
    if (checks) {
      console.log("Quality checks received from props:", checks);
      console.log("Production order ID:", productionOrderId);
      setQualityChecks(checks);
    }
  }, [checks, productionOrderId]);

  const handleStatusUpdate = async (
    id: string,
    newStatus: Status,
    defectsFound: string | null = null,
    actionTaken: string | null = null,
    notes: string | null = null
  ) => {
    try {
      setUpdatingId(id);
      
      // Find the existing check to ensure we send the most current rich text content
      const existingCheck = qualityChecks.find(c => c.id === id);

      const data = {
        id,
        status: newStatus,
        // Use existing check data if null is passed (e.g., from status dropdown click)
        defectsFound: defectsFound === null ? existingCheck?.defectsFound || undefined : defectsFound,
        actionTaken: actionTaken === null ? existingCheck?.actionTaken || undefined : actionTaken,
        notes: notes === null ? existingCheck?.notes || undefined : notes,
      };

      // Ensure that we pass the full data object, but clean up the undefined fields
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      ) as unknown as Omit<QualityCheck, 'createdAt' | 'updatedAt' | 'checkDate' | 'productionOrderId' | 'inspectorId'>;
      
      const updatedCheck = await updateQualityCheck(id, newStatus, updateData);

      if (updatedCheck) {
        setQualityChecks((prevChecks) =>
          prevChecks.map((check) =>
            check.id === updatedCheck.id ? updatedCheck : check
          )
        );
      }

      if (onRefresh) await onRefresh();

      toast({
        title: "Quality Check Updated",
        description: `Quality check status updated to ${formatStatus(newStatus)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update quality check",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteQualityCheck = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteQualityCheck(id);

      // Remove from local state
      setQualityChecks((prevChecks) =>
        prevChecks.filter((check) => check.id !== id)
      );

      // Refresh from server if needed
      if (onRefresh) await onRefresh();

      toast({
        title: "Quality Check Deleted",
        description: "The quality check has been successfully removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete quality check",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };


  const handleQualityCheckCreated = async () => {
    console.log("Quality check created - refreshing data");
    // Simply refresh the data when a new check is created
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Filter checks for this specific production order
  const filteredChecks =
    qualityChecks?.filter(
      (check) => check.productionOrderId === productionOrderId
    ) || [];

  console.log("Filtered quality checks:", filteredChecks);
  console.log("All quality checks:", qualityChecks);

  return (
    <Card className="border-2 border-muted">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">
              Quality Inspections
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Quality control checks and inspection results
            </CardDescription>
          </div>
          <CreateQualityCheckDialog
            productionOrderId={productionOrderId}
            onRefresh={onRefresh || handleQualityCheckCreated}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading quality checks...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Defects</TableHead>
                <TableHead className="text-center">Action</TableHead>
                <TableHead className="text-center">Notes</TableHead>
                <TableHead className="text-right font-bold bg-muted/30">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="h-12 w-12 rounded-full border-2 border-dashed flex items-center justify-center mb-2">
                        <Eye className="h-6 w-6 opacity-50" />
                      </div>
                      <p>No quality checks recorded for this production order.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredChecks.map((check) => {
                  const hasDefects = Boolean(
                    check.defectsFound && check.defectsFound.trim() !== ""
                  );

                  return (
                    <TableRow
                      key={check.id}
                      className={getRowBackgroundClass(check.status, hasDefects)}
                    >
                      <TableCell>{formatDate(check.checkDate)}</TableCell>
                      <TableCell className="font-medium">
                        {check.inspectorName || check.inspectorId || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(check.status)}`} />
                          <Badge variant={getStatusBadgeVariant(check.status)} className="mr-1">
                            {formatStatus(check.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      {/* Using the new RichTextCell component for cleaner table rows */}
                      <RichTextCell 
                        title="Defects Found" 
                        content={check.defectsFound} 
                      />
                      <RichTextCell 
                        title="Action Taken" 
                        content={check.actionTaken} 
                      />
                      <RichTextCell 
                        title="Notes" 
                        content={check.notes} 
                      />

                      <TableCell className="text-right border border-dashed border-gray-200 p-2">
                        <div className="flex flex-col space-y-2 text-muted-foreground italic text-sm">
                          View only
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
