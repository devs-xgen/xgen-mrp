"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  CheckCircle, 
  Play, 
  Pause, 
  Settings, 
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Zap
} from "lucide-react";
import { Status } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import { updateTaskStatus } from "@/lib/actions/worker/tasks";
import { formatDistanceToNow, format } from "date-fns";

interface Operation {
  id: string;
  status: Status;
  startTime: Date | string;
  endTime: Date | string;
  notes?: string | null;
  workCenter: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

interface ProductionOrderTask {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    description?: string;
  };
  productVariant?: {
    id: string;
    sku: string;
    displayName: string;
    sizeName?: string | null;
    colorName?: string | null;
  } | null;
  quantity: number;
  completedQuantity: number;
  status: Status;
  priority: string;
  startDate: Date | string;
  dueDate: Date | string;
  notes?: string | null;
  operations: Operation[];
  customerOrder?: {
    id: string;
    orderNumber: string;
    customer: {
      name: string;
    };
  } | null;
}

interface OperationTaskManagerProps {
  productionOrder: ProductionOrderTask;
  onTaskUpdate?: (operationId: string, newStatus: Status, notes?: string) => void;
}

export function OperationTaskManager({ productionOrder, onTaskUpdate }: OperationTaskManagerProps) {
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [taskNotes, setTaskNotes] = useState("");
  const [taskStatus, setTaskStatus] = useState<Status>(Status.PENDING);

  const handleOperationClick = (operation: Operation) => {
    setSelectedOperation(operation);
    setTaskNotes(operation.notes || "");
    setTaskStatus(operation.status);
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOperation) return;

    setIsUpdating(true);
    try {
      await updateTaskStatus({
        id: selectedOperation.id,
        status: taskStatus,
        notes: taskNotes,
      });

      toast({
        title: "Task Updated",
        description: `Operation status updated to ${taskStatus}`,
      });

      onTaskUpdate?.(selectedOperation.id, taskStatus, taskNotes);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return "bg-gray-100 text-gray-800 border-gray-300";
      case Status.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case Status.COMPLETED:
        return "bg-green-100 text-green-800 border-green-300";
      case Status.CANCELLED:
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return <Clock className="h-4 w-4" />;
      case Status.IN_PROGRESS:
        return <Play className="h-4 w-4" />;
      case Status.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case Status.CANCELLED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  };

  const getTimeRemaining = (dueDate: Date | string) => {
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const now = new Date();
    
    if (due < now) {
      return { text: `Overdue by ${formatDistanceToNow(due)}`, isOverdue: true };
    } else {
      return { text: `Due in ${formatDistanceToNow(due)}`, isOverdue: false };
    }
  };

  const timeRemaining = getTimeRemaining(productionOrder.dueDate);

  return (
    <div className="space-y-6">
      {/* Production Order Header */}
      <Card className="border-l-4 border-l-blue-500">
                 <CardHeader className="pb-4">
           <div className="production-order-header">
             <div className="production-order-info space-y-2">
               <CardTitle className="text-xl flex items-center gap-2">
                 <Package className="h-5 w-5 text-blue-600" />
                 {productionOrder.product.name}
               </CardTitle>
               <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                 <span className="font-medium">SKU: {productionOrder.product.sku}</span>
                 {productionOrder.productVariant && (
                   <Badge variant="outline" className="text-xs">
                     {productionOrder.productVariant.displayName}
                   </Badge>
                 )}
                 {productionOrder.customerOrder && (
                   <span>• Order: {productionOrder.customerOrder.orderNumber}</span>
                 )}
               </div>
             </div>
             
             <div className="production-order-badges">
               <Badge className={`${getPriorityColor(productionOrder.priority)} border status-badge`}>
                 <Zap className="h-3 w-3 mr-1" />
                 {productionOrder.priority}
               </Badge>
               <Badge variant="outline" className="border-blue-300 status-badge">
                 <Package className="h-3 w-3 mr-1" />
                 {productionOrder.completedQuantity}/{productionOrder.quantity}
               </Badge>
               <div className={`text-sm ${timeRemaining.isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                 <Calendar className="h-4 w-4 inline mr-1" />
                 {timeRemaining.text}
               </div>
             </div>
           </div>
         </CardHeader>
      </Card>

      {/* Operations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Your Operations ({productionOrder.operations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productionOrder.operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No operations assigned to you for this production order</p>
            </div>
          ) : (
                         <div className="operations-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {productionOrder.operations.map((operation) => (
                 <Dialog key={operation.id} open={isDialogOpen && selectedOperation?.id === operation.id} onOpenChange={setIsDialogOpen}>
                   <DialogTrigger asChild>
                     <Card 
                       className={`operation-card ${
                         operation.status === Status.COMPLETED 
                           ? 'bg-green-50 border-green-200' 
                           : operation.status === Status.IN_PROGRESS 
                           ? 'bg-blue-50 border-blue-200' 
                           : 'hover:bg-gray-50'
                       }`}
                       onClick={() => handleOperationClick(operation)}
                     >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Work Center */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-sm">{operation.workCenter.name}</span>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(operation.status)}`}>
                              {getStatusIcon(operation.status)}
                              <span className="capitalize">{operation.status.toLowerCase()}</span>
                            </div>
                          </div>

                          {/* Timing */}
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Start: {formatDateTime(operation.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>End: {formatDateTime(operation.endTime)}</span>
                            </div>
                          </div>

                          {/* Assigned Worker */}
                          {operation.assignedTo && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>
                                {operation.assignedTo.profile 
                                  ? `${operation.assignedTo.profile.firstName} ${operation.assignedTo.profile.lastName}`
                                  : operation.assignedTo.email
                                }
                              </span>
                            </div>
                          )}

                          {/* Notes Preview */}
                          {operation.notes && (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3 mt-0.5" />
                              <span className="truncate">{operation.notes}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                                     <DialogContent className="task-dialog max-w-md mx-auto">
                     <DialogHeader>
                       <DialogTitle className="flex items-center gap-2">
                         <Settings className="h-5 w-5" />
                         Update Operation
                       </DialogTitle>
                     </DialogHeader>

                    <div className="space-y-4">
                      {/* Operation Details */}
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Work Center</Label>
                          <p className="text-sm">{operation.workCenter.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Current Status</Label>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(operation.status)}`}>
                            {getStatusIcon(operation.status)}
                            <span className="capitalize">{operation.status.toLowerCase()}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Schedule</Label>
                          <p className="text-sm">{formatDateTime(operation.startTime)} - {formatDateTime(operation.endTime)}</p>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium">
                          New Status
                        </Label>
                        <Select value={taskStatus} onValueChange={(value) => setTaskStatus(value as Status)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Status.PENDING}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pending
                              </div>
                            </SelectItem>
                            <SelectItem value={Status.IN_PROGRESS}>
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                In Progress
                              </div>
                            </SelectItem>
                            <SelectItem value={Status.COMPLETED}>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Completed
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium">
                          Notes
                        </Label>
                        <Textarea
                          id="notes"
                          value={taskNotes}
                          onChange={(e) => setTaskNotes(e.target.value)}
                          placeholder="Add notes about this operation..."
                          className="mt-1 min-h-[80px] resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                                             <div className="flex gap-2 pt-2">
                         <Button
                           onClick={() => setIsDialogOpen(false)}
                           variant="outline"
                           className="flex-1 task-operation-button"
                         >
                           Cancel
                         </Button>
                         <Button
                           onClick={handleStatusUpdate}
                           disabled={isUpdating}
                           className="flex-1 task-operation-button"
                         >
                           {isUpdating ? "Updating..." : "Update Status"}
                         </Button>
                       </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 