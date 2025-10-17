// // components/module/worker/tasks/worker-production-details-component.tsx

// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Factory, ClipboardList, Clock, Layers3, Play, CheckCircle, XCircle } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { useState, useTransition, useEffect } from 'react'; 
// import { updateOperationStatus } from "@/lib/actions/worker/task-worker";

// // Assuming these imports are available in your project setup (Shadcn UI components)
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// // --- TYPE DEFINITIONS ---
// type OperationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"; 

// interface OrderPhase {
//     id: string;
//     name: string;
//     isCompleted: boolean;
//     startDate: string | null;
//     completionDate: string | null;
//     status: OperationStatus; 
// }

// interface WorkerProductionDetailsProps {
//     order: {
//         id: string;
//         product: {
//             name: string;
//             sku: string;
//         };
//         workCenter: { 
//             name: string;
//         };
//         status: string;
//         quantity: number;
//         startDate: string;
//         dueDate: string; 
//         notes: string;
//         productionPhases: OrderPhase[];
//         [key: string]: any; 
//     };
// }

// // =======================================================================
// // LOCALIZED DATE COMPONENT (To prevent Hydration Error)
// // =======================================================================

// interface LocalizedDateProps {
//     dateString: string | null | undefined;
//     placeholder?: string;
// }

// const LocalizedDate = ({ dateString, placeholder = "N/A" }: LocalizedDateProps) => {
//     const [displayDate, setDisplayDate] = useState(placeholder);

//     useEffect(() => {
//         if (dateString) {
//             const formattedDate = new Date(dateString).toLocaleDateString(undefined, {
//                 year: 'numeric',
//                 month: 'numeric',
//                 day: 'numeric',
//             });
//             setDisplayDate(formattedDate);
//         } else {
//             setDisplayDate(placeholder);
//         }
//     }, [dateString, placeholder]);

//     return <>{displayDate}</>;
// };


// // --- HELPER FUNCTION ---

// const getStatusBadgeVariant = (status: OperationStatus) => {
//     switch (status) {
//         case "COMPLETED":
//             return "bg-green-500 hover:bg-green-600 text-white";
//         case "IN_PROGRESS": 
//             return "bg-blue-500 hover:bg-blue-600 text-white";
//         case "FAILED":
//         case "PENDING":
//         default:
//             return "bg-yellow-500 hover:bg-yellow-600 text-white";
//     }
// };

// // =======================================================================
// // OPERATION EDIT MODAL COMPONENT 
// // =======================================================================

// interface OperationEditModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     operation: OrderPhase;
//     orderQuantity: number;
//     onSubmit: (operationId: string, newStatus: OperationStatus, actualQuantity: number, notes?: string) => void;
//     isSubmitting: boolean;
//     submitError: string | null;
//     initialStatus: OperationStatus;
// }

// const statusOptions: { label: string, value: OperationStatus }[] = [
//     { label: "In Progress", value: "IN_PROGRESS" }, 
//     { label: "Completed", value: "COMPLETED" },
//     { label: "Failed", value: "FAILED" },
// ];

// function OperationEditModal({ 
//     isOpen, 
//     onClose, 
//     operation, 
//     orderQuantity, 
//     onSubmit, 
//     isSubmitting,
//     submitError,
//     initialStatus,
// }: OperationEditModalProps) {
    
//     // Robust Quantity Initialization: Default to order quantity for completion, otherwise 0
//     const initialQuantity = (initialStatus === 'COMPLETED' || initialStatus === 'FAILED') 
//         ? orderQuantity 
//         : 0;

//     const [status, setStatus] = useState<OperationStatus>(initialStatus);
//     const [actualQuantity, setActualQuantity] = useState<number>(initialQuantity);
//     const [notes, setNotes] = useState<string>('');
//     const [localError, setLocalError] = useState<string | null>(null);

//     if (!isOpen) return null;

//     const handleSubmit = () => {
//         setLocalError(null);
        
//         const isCompleteOrFail = status === 'COMPLETED' || status === 'FAILED';
        
//         // 1. Validation: Quantity must be POSITIVE for COMPLETED or FAILED
//         if (isCompleteOrFail) {
//             // ⭐ CRITICAL SERVER ERROR FIX: Checks for positive quantity (> 0)
//             if (actualQuantity === undefined || actualQuantity === null || isNaN(actualQuantity) || actualQuantity <= 0) {
//                 setLocalError("Actual quantity is required and must be a **positive number** for completion/failure.");
//                 return;
//             }
//         }
        
//         // 2. Quantity Handling: Pass 0 for 'IN_PROGRESS', or the user input quantity
//         const quantityToSubmit = isCompleteOrFail ? actualQuantity : 0; 

//         // Call the parent submit handler
//         onSubmit(operation.id, status, quantityToSubmit, notes || undefined);
//     };

//     const isCompleteOrFail = status === 'COMPLETED' || status === 'FAILED';
//     const isInProgress = status === 'IN_PROGRESS';
    
//     const availableStatusOptions = statusOptions; 


//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="sm:max-w-[425px]">
//                 <DialogHeader>
//                     <DialogTitle className="flex items-center gap-2">
//                         <Factory className="w-5 h-5" />
//                         Update Operation: **{operation.name}**
//                     </DialogTitle>
//                 </DialogHeader>
//                 <div className="grid gap-4 py-4">
                    
//                     {/* Operation Details */}
//                     <div className="text-sm text-gray-500 border-b pb-2 mb-2">
//                         {/* ⭐ HYDRATION ERROR FIX: Changed <p> to <div> for lines containing <Badge> */}
//                         <div className="mb-1">Order Quantity: **{orderQuantity}**</div>
//                         <div className="flex items-center">
//                             Current Status: 
//                             <Badge className={`${getStatusBadgeVariant(operation.status)} ml-1`}>
//                                 {operation.status.replace('_', ' ')}
//                             </Badge>
//                         </div>
//                     </div>

//                     {/* Status Field */}
//                     <div className="grid grid-cols-4 items-center gap-4">
//                         <Label htmlFor="status" className="text-right">
//                             New Status
//                         </Label>
//                         <Select value={status} onValueChange={(value) => {
//                             const newStatus = value as OperationStatus;
//                             setStatus(newStatus);
                            
//                             // Ensure Quantity is reset/defaulted on status change
//                             if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
//                                 setActualQuantity(orderQuantity); // Default to full order quantity
//                             } else if (newStatus === 'IN_PROGRESS' || newStatus === 'PENDING') {
//                                 setActualQuantity(0); 
//                             }
//                         }}>
//                             <SelectTrigger id="status" className="col-span-3">
//                                 <SelectValue placeholder="Select Status" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {availableStatusOptions.map(opt => (
//                                     <SelectItem key={opt.value} value={opt.value}>
//                                         {opt.label}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {/* Actual Quantity Field (Visible only for Complete/Fail) */}
//                     {isCompleteOrFail && (
//                         <div className="grid grid-cols-4 items-center gap-4">
//                             <Label htmlFor="actualQuantity" className="text-right">
//                                 Actual Qty
//                             </Label>
//                             <Input
//                                 id="actualQuantity"
//                                 type="number"
//                                 value={actualQuantity}
//                                 onChange={(e) => setActualQuantity(Number(e.target.value))}
//                                 min="1" // ⭐ Set min to 1 to guide user and help validation
//                                 className="col-span-3"
//                                 placeholder={`Required: > 0`}
//                             />
//                         </div>
//                     )}
                    
//                     {/* Notes Field */}
//                     <div className="grid grid-cols-4 items-start gap-4">
//                         <Label htmlFor="notes" className="text-right pt-2">
//                             Notes (Opt.)
//                         </Label>
//                         <Textarea
//                             id="notes"
//                             value={notes}
//                             onChange={(e) => setNotes(e.target.value)}
//                             placeholder="Add any relevant notes..."
//                             rows={3}
//                             className="col-span-3"
//                         />
//                     </div>
                    
//                     {/* Error Display */}
//                     {(localError || submitError) && (
//                         <div className="col-span-4 text-sm text-red-600 bg-red-50 p-2 rounded">
//                             **Error:** {localError || submitError}
//                         </div>
//                     )}
//                 </div>
//                 <DialogFooter>
//                     <Button 
//                         onClick={handleSubmit} 
//                         disabled={isSubmitting || availableStatusOptions.length === 0}
//                         className={isCompleteOrFail ? "bg-green-600 hover:bg-green-700" : isInProgress ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"}
//                     >
//                         {isSubmitting ? 'Updating...' : `Update to ${status.replace('_', ' ')}`}
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }

// // =======================================================================
// // MAIN COMPONENT (WorkerProductionDetails)
// // =======================================================================

// export function WorkerProductionDetails({ order }: WorkerProductionDetailsProps) {
//     const [isPending, startTransition] = useTransition(); 
//     const [error, setError] = useState<string | null>(null);
    
//     // State for the modal
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [currentOperation, setCurrentOperation] = useState<OrderPhase | null>(null);
//     const [initialModalStatus, setInitialModalStatus] = useState<OperationStatus>('IN_PROGRESS');

//     if (!order) return null; 

//     // Unified Handler to call the Server Action
//     const handleServerUpdate = (
//         operationId: string, 
//         newStatus: OperationStatus, 
//         actualQuantity: number, 
//         notes?: string
//     ) => {
//         setError(null);
//         startTransition(async () => {
//             // Note: The structure of updateOperationStatus must match this call signature:
//             // updateOperationStatus({ operationId, newStatus, actualQuantity, notes })
//             const result = await updateOperationStatus({
//                 operationId,
//                 newStatus,
//                 actualQuantity, 
//                 notes,
//             });

//             if (result.error) {
//                 setError(result.error);
//             } else {
//                 // If successful, you should ideally refresh the data displayed to the user
//                 // For now, we only close the modal.
//                 setIsModalOpen(false); 
//                 setCurrentOperation(null);
//             }
//         });
//     };

//     // Handler to open the modal
//     const openModal = (phase: OrderPhase, targetStatus: OperationStatus) => {
//         setCurrentOperation(phase);
//         setInitialModalStatus(targetStatus);
//         setIsModalOpen(true);
//     }
    
//     return (
//         <div className="max-w-5xl mx-auto p-0 space-y-6">
            
//             {/* Job Overview Card */}
//             <Card className="shadow-sm border border-gray-100">
//                 <CardHeader>
//                     <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-600">
//                         <ClipboardList className="w-5 h-5 text-blue-500" />
//                         Job Overview
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent className="grid md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
//                     <div><span className="font-semibold text-gray-700">Order ID:</span> **{order.id.substring(0, 8)}**</div>
//                     <div><span className="font-semibold text-gray-700">Product:</span> {order.product?.name}</div>
//                     <div><span className="font-semibold text-gray-700">Work Center:</span> **{order.workCenter?.name || 'N/A'}**</div>
                    
//                     <div><span className="font-semibold text-gray-700">Quantity:</span> {order.quantity}</div>
//                     <div>
//                         <span className="font-semibold text-gray-700">Status:</span> 
//                         <Badge className="ml-2 bg-green-500 hover:bg-green-600">
//                             {order.status}
//                         </Badge>
//                     </div>
//                     <div>
//                         <span className="font-semibold text-gray-700">Due Date:</span> 
//                         <LocalizedDate dateString={order.dueDate} />
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Production Phases/Operations */}
//             <Card className="shadow-sm border border-gray-100">
//                 <CardHeader>
//                     <CardTitle className="flex items-center gap-2 text-lg font-bold text-indigo-600">
//                         <Layers3 className="w-5 h-5 text-indigo-500" />
//                         Production Steps (Operations)
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     {error && <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg">{error}</div>} 
//                     {order.productionPhases?.length > 0 ? (
//                         <div className="space-y-4">
//                             {order.productionPhases.map((phase: OrderPhase, index: number) => {
//                                 const phaseStatusDisplay = phase.status.replace('_', ' ');

//                                 return (
//                                     <div
//                                         key={phase.id || index}
//                                         className={`p-4 rounded-lg border transition ${
//                                             phase.isCompleted ? 'border-green-300 bg-green-50' : 
//                                             phase.status === 'IN_PROGRESS' ? 'border-blue-300 bg-blue-50' : 
//                                             'border-gray-200 bg-white'
//                                         }`}
//                                     >
//                                         <div className="flex justify-between items-start mb-2">
//                                             <p className="font-bold text-gray-800 flex items-center gap-2">
//                                                 <Factory className="w-4 h-4 text-gray-600" /> **{index + 1}. {phase.name}**
//                                             </p>
//                                             <div className="flex items-center gap-2">
//                                                 <Badge className={getStatusBadgeVariant(phase.status)}>
//                                                     {phaseStatusDisplay}
//                                                 </Badge>

//                                                 {/* --- ACTION BUTTONS --- */}
                                                
//                                                 {/* PENDING -> IN_PROGRESS (Start) */}
//                                                 {phase.status === 'PENDING' && (
//                                                     <Button 
//                                                         size="sm"
//                                                         disabled={isPending || isModalOpen}
//                                                         onClick={() => openModal(phase, "IN_PROGRESS")} 
//                                                         className="bg-blue-600 hover:bg-blue-700 text-white"
//                                                     >
//                                                         <Play className="w-4 h-4 mr-1" /> Start
//                                                     </Button>
//                                                 )}

//                                                 {/* IN_PROGRESS -> COMPLETE/FAIL */}
//                                                 {phase.status === 'IN_PROGRESS' && (
//                                                     <div className="flex gap-2">
//                                                         <Button 
//                                                             size="sm"
//                                                             disabled={isPending || isModalOpen}
//                                                             onClick={() => openModal(phase, "COMPLETED")} 
//                                                             className="bg-green-600 hover:bg-green-700 text-white"
//                                                         >
//                                                             <CheckCircle className="w-4 h-4 mr-1" /> Complete
//                                                         </Button>
//                                                         <Button 
//                                                             size="sm"
//                                                             disabled={isPending || isModalOpen}
//                                                             onClick={() => openModal(phase, "FAILED")}
//                                                             variant="destructive"
//                                                         >
//                                                             <XCircle className="w-4 h-4 mr-1" /> Fail
//                                                         </Button>
//                                                     </div>
//                                                 )}
//                                                 {/* --- END ACTION BUTTONS --- */}
//                                             </div>
//                                         </div>
//                                         <div className="grid grid-cols-2 text-sm text-gray-600 mt-2">
//                                             <p className="flex items-center gap-1">
//                                                 <Clock className="w-3.5 h-3.5 text-gray-500" /> 
//                                                 Start: **<LocalizedDate dateString={phase.startDate} placeholder="Pending" />**
//                                             </p>
//                                             <p className="flex items-center gap-1">
//                                                 <Clock className="w-3.5 h-3.5 text-gray-500" /> 
//                                                 End: **<LocalizedDate dateString={phase.completionDate} />**
//                                             </p>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     ) : (
//                         <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
//                             <p className="text-gray-600 font-medium">No production phases defined for this job.</p>
//                             <p className="text-gray-500 text-sm mt-1">This job may be a simple delivery or requires routing setup by an administrator.</p>
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
            
//             {/* Notes/Instructions */}
//             {order.notes && (
//                 <Card className="shadow-sm border border-gray-100">
//                     <CardHeader>
//                         <CardTitle className="text-lg font-bold text-purple-600">
//                             Notes
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
//                     </CardContent>
//                 </Card>
//             )}
            
//             {/* Render the Modal */}
//             {currentOperation && (
//                 <OperationEditModal 
//                     isOpen={isModalOpen}
//                     onClose={() => {
//                         setIsModalOpen(false);
//                         setCurrentOperation(null);
//                         setError(null); 
//                     }}
//                     operation={currentOperation}
//                     orderQuantity={order.quantity}
//                     onSubmit={handleServerUpdate}
//                     isSubmitting={isPending}
//                     submitError={error}
//                     initialStatus={initialModalStatus}
//                 />
//             )}
//         </div>
//     );
// }

// src/components/module/worker/tasks/worker-production-details-component.tsx
"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Status } from "@prisma/client"
import { OperationsManagement } from "@/components/module/admin/production/operations-management" // Re-using Admin's component
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Factory, PackageOpen, RefreshCw, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getProductionOrder } from "@/lib/actions/production-order"
import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order"
import { convertDecimals } from "@/lib/convertDecimals"
import { formatDate } from "@/lib/utils"

// --- Interface Definitions (Matching the data passed from the Server Component) ---

interface WorkCenter {
  id: string
  name: string
  capacityPerHour: number
}

interface Operation {
  id: string
  workCenterId: string
  startTime: Date
  endTime: Date
  status: Status
  notes?: string | null
  workCenter: {
    name: string
    // Add other workCenter fields if needed by OperationsManagement
  }
}

interface ProductionOrderWorker {
  id: string
  quantity: number
  status: Status
  startDate: Date
  dueDate: Date
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  operations: Operation[]
  product: { name: string; sku: string }
  productVariant?: { displayName: string; sku: string }
  // Add other properties if needed for display
}

interface WorkerProductionDetailsComponentProps {
  order: ProductionOrderWorker
  workCenters: WorkCenter[]
  // deliveryUsers is included but may not be used in the worker view
  deliveryUsers: { id: string; email: string; name?: string }[] 
}

// Utility to convert Decimal fields to numbers on the client after fetch
// This should match the logic in the server component's convertDecimals but for nested fields
function convertOrderForClient(prismaOrder: any): ProductionOrderWorker {
  // Assuming convertDecimals on the server already handled top-level fields.
  // We re-process operations to ensure client-side compatibility
  return {
    ...prismaOrder,
    operations: prismaOrder.operations.map((op: any) => ({
      ...op,
      // If any Decimal fields exist inside operation or workCenter, convert them here
      workCenter: {
        ...op.workCenter,
        capacityPerHour: Number(op.workCenter?.capacityPerHour || 0),
      },
    })) || [],
  }
}


export function WorkerProductionDetailsComponent({
  order: initialOrder,
  workCenters: initialWorkCenters,
}: WorkerProductionDetailsComponentProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [order, setOrder] = useState<ProductionOrderWorker>(initialOrder)
  const [workCenters, setWorkCenters] = useState(initialWorkCenters)
  const [loadingOperations, setLoadingOperations] = useState(false)

  // Function to re-fetch only the necessary data
  const refreshOperations = useCallback(async () => {
    try {
      setLoadingOperations(true)
      const updatedOrderRaw = await getProductionOrder(order.id)
      const updatedWorkCenters = await getAvailableWorkCenters()

      if (updatedOrderRaw) {
        // Apply server-side decimal conversion logic on the re-fetched data
        const updatedOrderData = convertDecimals(updatedOrderRaw)
        const processedOrder = convertOrderForClient(updatedOrderData)
        
        // Update both the order and work centers state
        setOrder(processedOrder)
        
        toast({
          title: "Operations Refreshed",
          description: "The operations list and status are up to date.",
        })
      }
      
      if (updatedWorkCenters) {
        setWorkCenters(updatedWorkCenters)
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh production data.",
        variant: "destructive",
      })
    } finally {
      setLoadingOperations(false)
    }
  }, [order.id, toast])
  
  // Helper to get a consistent badge style for the main status
  const getStatusBadgeClass = (status: Status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500 hover:bg-green-500/80';
      case 'IN_PROGRESS': return 'bg-blue-500 hover:bg-blue-500/80';
      case 'CANCELLED': return 'bg-red-500 hover:bg-red-500/80';
      case 'PENDING':
      default: return 'bg-gray-500 hover:bg-gray-500/80';
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Production Overview Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Overview</CardTitle>
            <Button
                variant="outline"
                size="icon"
                onClick={refreshOperations}
                disabled={loadingOperations}
                className="h-8 w-8"
            >
                <RefreshCw className={`h-4 w-4 ${loadingOperations ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh Operations</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="text-xl font-bold">{order.quantity} units</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`text-sm ${getStatusBadgeClass(order.status)}`}>
                  {order.status.toLowerCase().replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-base font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary/80" />
                  {formatDate(order.startDate, { time: true })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-base font-medium flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  {formatDate(order.dueDate, { time: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Variant / Priority Card */}
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Product Details</CardTitle>
                <CardDescription>Product Variant & Priority</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Variant</p>
                    <p className="text-base font-medium">
                        {order.productVariant?.displayName || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground pt-1">Priority</p>
                    <Badge variant={order.priority === 'HIGH' ? 'destructive' : 'default'}>
                        {order.priority}
                    </Badge>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Tabs for Operations (Worker's Focus) */}
      <Tabs defaultValue="operations">
        <TabsList>
          <TabsTrigger value="operations" className="flex items-center gap-1">
            <Factory className="h-4 w-4" />
            Operations ({order.operations.length})
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-1">
            <PackageOpen className="h-4 w-4" />
            Materials (WIP)
          </TabsTrigger>
        </TabsList>
        
        {/* Operations Content */}
        <TabsContent value="operations" className="mt-4">
          <OperationsManagement
            productionOrderId={order.id}
            operations={order.operations}
            workCenters={workCenters}
            onRefresh={refreshOperations} // Pass the refresh function to OperationsManagement
            isLoading={loadingOperations}
          />
        </TabsContent>
        
        {/* Materials (WIP) Content - Placeholder for worker material view */}
        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Materials Used (WIP)</CardTitle>
              <CardDescription>Track material consumption for this order.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                Material tracking feature under development for the worker view.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}