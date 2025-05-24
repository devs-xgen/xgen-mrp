"use client";

import { useState, useCallback, useEffect } from "react";
import { Status, Priority } from "@prisma/client";
import { ProductionOrder } from "@/types/admin/production-order";
import { OperationsManagement } from "./operations-management";
import { QualityChecks } from "./quality-checks";
import { DeliveryAssignment } from "./delivery-assignment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Pause, CheckCircle, HelpCircle, Info, CalendarClock, User, ShoppingCart, AlertTriangle, PackageOpen, PackageX, Settings, CheckSquare, Truck, History, StickyNote, Clock, RefreshCw, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  updateProductionOrder, 
  getProductionOrder,
  getAvailableWorkCenters,
  updateProductionOrderStatus,
  getProductionLogs,
  createInitialProductionLog
} from "@/lib/actions/production-order";
import { getActiveInspectors } from "@/lib/actions/inspector";
import { getDeliveryUsers, getDeliveryAssignment } from "@/lib/actions/delivery/delivery-assignment";
import { QualityCheck } from "@/types/admin/quality-checks";
import { formatDate } from "@/lib/utils";
import { LinkCustomerOrderDialog } from "./link-customer-order-dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductBOM } from '@/types/admin/bom';
import { ProductionOrderControlButtons } from './ProductionOrderControlButtons';
import { formatCurrencyPHP } from '@/lib/constant';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

interface DeliveryUser {
  id: string;
  email: string;
  name?: string;
}

interface ProductionOrderDetailsProps {
  order: ProductionOrder;
  workCenters: WorkCenter[];
  deliveryUsers?: DeliveryUser[];
  isLoading?: boolean;
}

// Allow the order prop to have a 'bom' property
// This type is used for the details page where BOM is included
export type ProductionOrderWithBOM = ProductionOrder & { bom?: ProductBOM };

const deliveryAssignmentFormSchema = z.object({
  userId: z.string().min(1, "Please select a delivery personnel"),
  scheduledDate: z
    .date()
    .min(new Date(), "Scheduled date must be in the future"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  notes: z.string().optional(),
});

function ensureDeliveryAssignmentHasProductionOrder(
  assignment: any,
  order: any
) {
  if (!assignment) return null;
  if ('productionOrder' in assignment && assignment.productionOrder) {
    return assignment;
  }
  return {
    ...assignment,
    productionOrder: {
      id: order.id,
      product: order.product,
      customerOrder: order.customerOrder || null,
    },
  };
}

// Utility function to convert Prisma result to TypeScript-compatible format
function convertPrismaOrderToTypescript(prismaOrder: any): ProductionOrderWithBOM {
  return {
    ...prismaOrder,
    plannedMaterialCost: Number(prismaOrder.plannedMaterialCost || 0),
    actualMaterialCost: Number(prismaOrder.actualMaterialCost || 0),
    materialVariance: Number(prismaOrder.materialVariance || 0),
    // Convert any nested Decimal fields in operations if they exist
    operations: prismaOrder.operations?.map((op: any) => ({
      ...op,
      cost: Number(op.cost || 0),
      workCenter: {
        ...op.workCenter,
        capacityPerHour: Number(op.workCenter?.capacityPerHour || 0),
        costPerHour: Number(op.workCenter?.costPerHour || 0),
        efficiencyRate: Number(op.workCenter?.efficiencyRate || 1),
      }
    })) || [],
  };
}

export function ProductionOrderDetails({
  order: initialOrder,
  workCenters: initialWorkCenters,
  deliveryUsers: initialDeliveryUsers = [],
  isLoading: initialLoading = false,
}: ProductionOrderDetailsProps) {
  // State for the main order data and loading state
  const [order, setOrder] = useState(initialOrder as ProductionOrderWithBOM);
  const [updating, setUpdating] = useState(false);
  
  // Separate loading states for each section
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [loadingQualityChecks, setLoadingQualityChecks] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  
  // Resources needed by components
  const [workCenters, setWorkCenters] = useState(initialWorkCenters);
  const [deliveryUsers, setDeliveryUsers] = useState(initialDeliveryUsers);
  
  const { toast } = useToast();

  // Add this function to the component to fetch production logs
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchProductionLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      // Use server action instead of API endpoint
      const logs = await getProductionLogs(order.id);
      setProductionLogs(logs);
      return logs;
    } catch (error) {
      console.error("Failed to fetch production logs:", error);
      throw error; // Re-throw to allow the caller to handle it
    } finally {
      setLoadingLogs(false);
    }
  }, [order.id]);

  // Add this useEffect to load logs when the component mounts
  useEffect(() => {
    fetchProductionLogs();
  }, [fetchProductionLogs]);

  // Function to refresh the main order status without page reload
  const handleStatusUpdate = async (newStatus: Status) => {
    try {
      setUpdating(true);
      await updateProductionOrder({
        id: order.id,
        status: newStatus,
      });
      
      // Fetch the updated order
      const updatedOrder = await getProductionOrder(order.id);
      if (updatedOrder) {
        // Convert Decimal fields to numbers to match ProductionOrder interface
        const processedOrder = convertPrismaOrderToTypescript(updatedOrder);
        setOrder(processedOrder);
      }

      toast({
        title: "Status Updated",
        description: `Production order status updated to ${newStatus
          .toLowerCase()
          .replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Function to start or pause production
  const handleProductionControl = async (action: 'start' | 'pause') => {
    try {
      setUpdating(true);
      const newStatus = action === 'start' ? Status.IN_PROGRESS : Status.PENDING;
      const actionText = action === 'start' ? 'started' : 'paused';
      
      await updateProductionOrderStatus(
        order.id, 
        newStatus, 
        `Production ${actionText} by admin on ${new Date().toLocaleString()}`
      );
      
      // Fetch the updated order
      const updatedOrder = await getProductionOrder(order.id);
      if (updatedOrder) {
        const processedOrder = convertPrismaOrderToTypescript(updatedOrder);
        setOrder(processedOrder);
      }

      toast({
        title: `Production ${action === 'start' ? 'Started' : 'Paused'}`,
        description: `Production order has been ${actionText}. Workers will be notified.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Section-specific refresh functions
  const refreshOperations = useCallback(async () => {
    try {
      setLoadingOperations(true);
      const updatedOrder = await getProductionOrder(order.id);
      const updatedWorkCenters = await getAvailableWorkCenters();
      
      if (updatedOrder) {
        // Convert Decimal fields to numbers and only update the operations part of the order with proper typing
        const processedOrder = convertPrismaOrderToTypescript(updatedOrder);
        setOrder((prev: ProductionOrder) => ({
          ...prev,
          operations: processedOrder.operations as typeof prev.operations,
          status: processedOrder.status as typeof prev.status
        }));
      }
      
      if (updatedWorkCenters) {
        setWorkCenters(updatedWorkCenters);
      }
      
      toast({
        title: "Operations Updated",
        description: "The operations section has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh operations",
        variant: "destructive",
      });
    } finally {
      setLoadingOperations(false);
    }
  }, [order.id, toast]);

  const refreshQualityChecks = useCallback(async () => {
    try {
      setLoadingQualityChecks(true);
      const updatedOrder = await getProductionOrder(order.id);
      const allInspectors = await getActiveInspectors();
      
      if (updatedOrder && allInspectors) {
        // Create a map of inspector names
        const inspectorsMap = new Map();
        for (const inspector of allInspectors) {
          inspectorsMap.set(inspector.inspectorId, `${inspector.firstName} ${inspector.lastName}`);
        }
        
        // Transform the quality checks with inspector names
        const transformedQualityChecks = updatedOrder.qualityChecks.map((check: any) => ({
          id: check.id,
          productionOrderId: check.productionOrderId,
          inspectorId: check.inspectorId,
          inspectorName: inspectorsMap.get(check.inspectorId) || "Unknown",
          checkDate: check.checkDate.toISOString(),
          status: check.status,
          defectsFound: check.defectsFound,
          actionTaken: check.actionTaken,
          notes: check.notes,
          createdAt: check.createdAt,
          updatedAt: check.updatedAt,
          productionOrder: {
            product: {
              name: updatedOrder.product.name,
              sku: updatedOrder.product.sku,
            },
          },
        }));
        
        // Update only the quality checks part of the order
        setOrder((prev: ProductionOrder) => ({
          ...prev,
          qualityChecks: transformedQualityChecks as unknown as typeof prev.qualityChecks
        }));
      }
      
      toast({
        title: "Quality Checks Updated",
        description: "The quality checks section has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh quality checks",
        variant: "destructive",
      });
    } finally {
      setLoadingQualityChecks(false);
    }
  }, [order.id, toast]);

  const refreshDelivery = useCallback(async () => {
    try {
      setLoadingDelivery(true);
      const updatedDeliveryUsers = await getDeliveryUsers();
      const updatedDeliveryAssignment = await getDeliveryAssignment(order.id);
      
      if (updatedDeliveryUsers) {
        setDeliveryUsers(updatedDeliveryUsers);
      }
      
      if (updatedDeliveryAssignment) {
        // Type-safe update by creating a properly transformed assignment
        const processedAssignment = ensureDeliveryAssignmentHasProductionOrder(updatedDeliveryAssignment, order);
        
        // Update only the delivery assignment part of the order
        setOrder((prev: ProductionOrder) => ({
          ...prev,
          deliveryAssignment: processedAssignment as typeof prev.deliveryAssignment
        }));
      }
      
      toast({
        title: "Delivery Assignment Updated",
        description: "The delivery assignment section has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh delivery assignment",
        variant: "destructive",
      });
    } finally {
      setLoadingDelivery(false);
    }
  }, [order, toast]);

  const getNextStatus = (currentStatus: Status): Status | null => {
    switch (currentStatus) {
      case "PENDING":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "COMPLETED";
      default:
        return null;
    }
  };

  const qualityChecks = (order.qualityChecks || []) as unknown as QualityCheck[];
  const nextStatus = getNextStatus(order.status);

  // Determine if the production can be started or paused
  const hasBOM = order.bom && order.bom.entries && order.bom.entries.length > 0;
  const canStartProduction = order.status === Status.PENDING && hasBOM;
  const canPauseProduction = order.status === Status.IN_PROGRESS;

  // Add a function to handle creating initial logs
  const handleCreateInitialLog = async () => {
    try {
      setLoadingLogs(true);
      await createInitialProductionLog(order.id);
      toast({
        title: "Initial log created",
        description: "Production history has been initialized",
      });
      fetchProductionLogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create initial log",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  // Update the ProductionHistory component to handle errors and add a refresh button
  function ProductionHistory() {
    const [error, setError] = useState<string | null>(null);

    const refreshLogs = async () => {
      try {
        setLoadingLogs(true);
        setError(null);
        await fetchProductionLogs();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh logs');
      } finally {
        setLoadingLogs(false);
      }
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Production History</CardTitle>
              <CardDescription>
                Log of status changes and important events
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshLogs}
                disabled={loadingLogs}
              >
                {loadingLogs ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                Refresh
              </Button>
              {productionLogs.length === 0 && !loadingLogs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateInitialLog}
                  disabled={loadingLogs}
                >
                  {loadingLogs ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : null}
                  Initialize History
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {loadingLogs ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center p-4 text-red-500">
                <p>Error loading logs: {error}</p>
                <Button variant="ghost" size="sm" onClick={refreshLogs} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : productionLogs.length > 0 ? (
              <div className="space-y-4">
                {productionLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-sm border-l-2 pl-4 py-1 border-muted">
                    <div className="flex-1">
                      <p className="font-medium">{log.action}</p>
                      {log.details && (
                        <p className="text-muted-foreground">{log.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        By {log.userName || "Unknown user"}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No production history available
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-2 shadow-sm">
        <CardHeader className="bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                {order.product.name}
              </CardTitle>
              <CardDescription className="text-base mt-1 flex items-center gap-2">
                <span className="font-medium text-foreground">{order.product.sku}</span> 
                • 
                <span>{order.quantity} units</span>
              </CardDescription>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <Badge
                variant={
                  order.status === "COMPLETED"
                    ? "default"
                    : order.status === "IN_PROGRESS"
                    ? "secondary"
                    : "outline"
                }
                className="text-lg py-1.5 px-4 uppercase font-medium"
              >
                {order.status.toLowerCase().replace("_", " ")}
              </Badge>
              <Badge
                variant={
                  order.priority === "HIGH" || order.priority === "URGENT"
                    ? "destructive"
                    : order.priority === "MEDIUM"
                    ? "secondary"
                    : "outline"
                }
              >
                {order.priority.toLowerCase()} priority
              </Badge>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-muted/10 rounded-lg">
              <h3 className="font-medium text-primary mb-2 text-sm flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  Timeline
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      <span className="sr-only">View Calendar</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Production Timeline</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Production Duration</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="font-medium">Start: {formatDate(order.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                            <span className="font-medium">Due: {formatDate(order.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-muted/10">
                        <CalendarView startDate={order.startDate} dueDate={order.dueDate} />
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-xs">Start date</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                            <span className="text-xs">Due date</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs">Today</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-amber-100"></div>
                            <span className="text-xs">Production period</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <div>Total production time: {calculateDuration(order.startDate, order.dueDate)}</div>
                          {(() => {
                            // Calculate month difference inline
                            const start = new Date(order.startDate);
                            const due = new Date(order.dueDate);
                            const monthDiff = (due.getFullYear() - start.getFullYear()) * 12 + 
                                             (due.getMonth() - start.getMonth()) + 1;
                            
                            return monthDiff > 1 ? (
                              <div className="mt-1 text-xs font-medium">
                                Use the month navigation to view different months in the production timeline.
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Start:</span>{" "}
                  {formatDate(order.startDate)}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Due:</span>{" "}
                  {formatDate(order.dueDate)}
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg">
              <h3 className="font-medium text-primary mb-2 text-sm">
                Order Information
              </h3>
              {order.customerOrder ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Order Details:</span>
                    Customer Order
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Order #:</span>
                    {order.customerOrder.orderNumber}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-muted-foreground flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    No customer order linked
                  </div>
                  <LinkCustomerOrderDialog
                    productionOrderId={order.id}
                    onRefresh={refreshOperations}
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-muted/10 rounded-lg">
              <h3 className="font-medium text-primary mb-2 text-sm">
                Status Info
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Created:</span>
                  {formatDate(order.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Updated:</span>
                  {formatDate(order.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* BOM/Material Requirements Section */}
          <div className="mt-8">
            <div className="flex items-center mb-3">
              <PackageOpen className="h-5 w-5 mr-2 text-muted-foreground" />
              <h3 className="font-medium text-lg">Material Requirements (BOM)</h3>
            </div>
            <div className="bg-muted/10 p-4 rounded-lg">
              {order.bom && order.bom.entries && order.bom.entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-semibold">Material Name</th>
                        <th className="px-3 py-2 text-left font-semibold">SKU</th>
                        <th className="px-3 py-2 text-right font-semibold">Required Qty</th>
                        <th className="px-3 py-2 text-left font-semibold">Unit</th>
                        <th className="px-3 py-2 text-right font-semibold">Cost/Unit</th>
                        <th className="px-3 py-2 text-right font-semibold">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.bom.entries.map((entry: any) => (
                        <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2">{entry.materialName}</td>
                          <td className="px-3 py-2">{entry.materialSku}</td>
                          <td className="px-3 py-2 text-right">{entry.quantityNeeded}</td>
                          <td className="px-3 py-2">{entry.unitOfMeasure}</td>
                          <td className="px-3 py-2 text-right">{formatCurrencyPHP(entry.costPerUnit)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrencyPHP(entry.totalCost)}</td>
                        </tr>
                      ))}
                      <tr className="font-semibold bg-muted/30">
                        <td className="px-3 py-2" colSpan={5}>Total Material Cost</td>
                        <td className="px-3 py-2 text-right">{formatCurrencyPHP(order.bom.totalMaterialCost)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted-foreground italic p-4 flex items-center justify-center">
                  <PackageX className="h-5 w-5 mr-2" />
                  No bill of materials defined for this product.
                </div>
              )}
            </div>
          </div>

          {/* Production Control Buttons */}
          <div className="mt-8">
            <ProductionOrderControlButtons
              order={order}
              updating={updating}
              onStart={() => handleProductionControl('start')}
              onPause={() => handleProductionControl('pause')}
              onComplete={() => handleStatusUpdate(Status.COMPLETED)}
            />
          </div>

          {order.notes && (
            <div className="mt-6 p-4 bg-muted/10 rounded-lg">
              <h3 className="font-medium text-primary mb-2 text-sm flex items-center">
                <StickyNote className="h-4 w-4 mr-2" />
                Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for sections */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="operations" className="space-y-4 mt-2">
          <OperationsManagement
            productionOrderId={order.id}
            operations={order.operations}
            workCenters={workCenters}
            onRefresh={refreshOperations}
            isLoading={loadingOperations}
          />
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-4 mt-2">
          <QualityChecks
            productionOrderId={order.id}
            checks={qualityChecks}
            onRefresh={refreshQualityChecks}
            isLoading={loadingQualityChecks}
          />
        </TabsContent>
        
        <TabsContent value="delivery" className="space-y-4 mt-2">
          <DeliveryAssignment
            productionOrderId={order.id}
            deliveryAssignment={ensureDeliveryAssignmentHasProductionOrder(order.deliveryAssignment, order)}
            deliveryUsers={deliveryUsers}
            onRefresh={refreshDelivery}
            isLoading={loadingDelivery}
          />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 mt-2">
          <ProductionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function DeliveryAssignmentForm({
  onSubmit,
  deliveryUsers,
  defaultValues,
  customerAddress,
}: {
  onSubmit: (data: any) => void;
  deliveryUsers: { id: string; name: string }[];
  defaultValues?: {
    userId?: string;
    scheduledDate?: Date;
    deliveryAddress?: string;
    notes?: string;
  };
  customerAddress?: string;
}) {
  const form = useForm({
    defaultValues: {
      userId: defaultValues?.userId || "",
      scheduledDate: defaultValues?.scheduledDate
        ? new Date(defaultValues.scheduledDate)
        : new Date(),
      deliveryAddress: defaultValues?.deliveryAddress || customerAddress || "",
      notes: defaultValues?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Personnel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery personnel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {deliveryUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Date</FormLabel>
              <FormControl>
                <DateTimePicker date={field.value} setDate={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliveryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter delivery address" {...field} />
              </FormControl>
              <FormDescription>
                Default is customer&apos;s shipping address. You can specify a
                different address if needed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any delivery notes or instructions"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {defaultValues ? "Update Assignment" : "Create Assignment"}
        </Button>
      </form>
    </Form>
  );
}

function calculateDuration(startDate: Date, dueDate: Date): string {
  const start = new Date(startDate);
  const due = new Date(dueDate);
  const diffTime = Math.abs(due.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 1 ? '1 day' : `${diffDays} days`;
}

function CalendarView({ startDate, dueDate }: { startDate: Date, dueDate: Date }) {
  // Convert to Date objects if they're strings
  const start = new Date(startDate);
  const due = new Date(dueDate);
  const today = new Date();
  
  // Create calendar grid
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // State for the currently displayed month and year
  const [displayMonth, setDisplayMonth] = useState(start.getMonth());
  const [displayYear, setDisplayYear] = useState(start.getFullYear());
  
  // Calculate how many months the production spans
  const monthDiff = (due.getFullYear() - start.getFullYear()) * 12 + (due.getMonth() - start.getMonth()) + 1;
  
  // Handle month navigation
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };
  
  // Check if this is the start month or due month
  const isStartMonth = displayMonth === start.getMonth() && displayYear === start.getFullYear();
  const isDueMonth = displayMonth === due.getMonth() && displayYear === due.getFullYear();
  
  // Get first day of month and number of days in month
  const firstDay = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  
  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(displayYear, displayMonth, day);
    
    // Determine if this day is the start date, due date, today, or in between
    const isStartDate = currentDate.getDate() === start.getDate() && 
                         currentDate.getMonth() === start.getMonth() &&
                         currentDate.getFullYear() === start.getFullYear();
    
    const isDueDate = currentDate.getDate() === due.getDate() && 
                       currentDate.getMonth() === due.getMonth() &&
                       currentDate.getFullYear() === due.getFullYear();
    
    const isToday = currentDate.getDate() === today.getDate() && 
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear();
    
    // Check if date is between start and due - more precise comparison
    const isBetween = currentDate >= start && currentDate <= due && !isStartDate && !isDueDate;
    
    // Set appropriate styling based on date status
    let className = "h-8 w-8 rounded-full flex items-center justify-center text-xs";
    if (isStartDate) {
      className += " bg-green-500 text-white font-bold";
    } else if (isDueDate) {
      className += " bg-red-500 text-white font-bold";
    } else if (isToday) {
      className += " bg-blue-500 text-white font-bold";
    } else if (isBetween) {
      className += " bg-amber-100";
    }
    
    calendarDays.push(
      <div key={day} className="p-1 flex justify-center">
        <div className={className}>{day}</div>
      </div>
    );
  }

  // Determine if navigation buttons should be disabled
  const isPrevDisabled = displayYear < start.getFullYear() || 
                         (displayYear === start.getFullYear() && displayMonth < start.getMonth());
                         
  const isNextDisabled = displayYear > due.getFullYear() || 
                         (displayYear === due.getFullYear() && displayMonth > due.getMonth());
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={goToPreviousMonth}
          disabled={isPrevDisabled}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        
        <div className="text-center">
          <span className="font-medium">{months[displayMonth]} {displayYear}</span>
          {monthDiff > 1 && (
            <div className="text-xs text-muted-foreground mt-1">
              {isStartMonth && "Start month"} 
              {isDueMonth && "Due month"}
              {!isStartMonth && !isDueMonth && "Production in progress"}
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={goToNextMonth}
          disabled={isNextDisabled}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>
      
      {/* Month progress indicator for multi-month productions */}
      {monthDiff > 1 && (
        <div className="mb-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ 
                width: `${((displayYear * 12 + displayMonth) - (start.getFullYear() * 12 + start.getMonth())) / (monthDiff - 1) * 100}%` 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{`${months[start.getMonth()].slice(0,3)} ${start.getFullYear()}`}</span>
            <span>{`${months[due.getMonth()].slice(0,3)} ${due.getFullYear()}`}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>
    </div>
  );
}
