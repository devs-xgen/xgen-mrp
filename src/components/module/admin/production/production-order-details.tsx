"use client";

import { useState, useCallback, useEffect } from "react";
import { Status, Priority } from "@prisma/client";
import { ProductionOrder } from "@/types/admin/production-order";
import { OperationsManagement } from "./operations-management";
import { QualityChecks } from "./quality-checks";
import { DeliveryAssignment } from "./delivery-assignment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Pause, CheckCircle, HelpCircle, Info } from "lucide-react";
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

export function ProductionOrderDetails({
  order: initialOrder,
  workCenters: initialWorkCenters,
  deliveryUsers: initialDeliveryUsers = [],
  isLoading: initialLoading = false,
}: ProductionOrderDetailsProps) {
  // State for the main order data and loading state
  const [order, setOrder] = useState(initialOrder);
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
        setOrder(updatedOrder);
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
        setOrder(updatedOrder);
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
        // Only update the operations part of the order with proper typing
        setOrder((prev: ProductionOrder) => ({
          ...prev,
          operations: updatedOrder.operations as typeof prev.operations,
          status: updatedOrder.status as typeof prev.status
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
  const canStartProduction = order.status === Status.PENDING;
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
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">
                Production Order: {order.product.sku}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {order.product.name} - {order.quantity} units
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
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
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-muted-foreground mb-1">
                Timeline
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Start:</span>{" "}
                {formatDate(order.startDate)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Due:</span>{" "}
                {formatDate(order.dueDate)}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground mb-1">
                Priority
              </h3>
              <Badge
                variant={
                  order.priority === "HIGH" || order.priority === "URGENT"
                    ? "destructive"
                    : order.priority === "MEDIUM"
                    ? "secondary"
                    : "outline"
                }
              >
                {order.priority.toLowerCase()}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground mb-1">
                Order Information
              </h3>
              {order.customerOrder ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Customer Order:</span>
                  {order.customerOrder.orderNumber}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-muted-foreground">
                    No customer order linked
                  </div>
                  <LinkCustomerOrderDialog
                    productionOrderId={order.id}
                    onRefresh={refreshOperations}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Production Control Buttons */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-muted-foreground">Production Control</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Production Status Guide</h4>
                          <ul className="text-sm space-y-1">
                            <li className="flex gap-2">
                              <span className="font-medium">Pending</span>: Production order is created but not active. Workers cannot see tasks.
                            </li>
                            <li className="flex gap-2">
                              <span className="font-medium">In Progress</span>: Production is active. All tasks are visible to workers.
                            </li>
                            <li className="flex gap-2">
                              <span className="font-medium">Completed</span>: All production work is finished. No further changes allowed.
                            </li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click for production status guide</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex gap-4 justify-center">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={() => handleProductionControl('start')}
                        disabled={updating || !canStartProduction}
                        className="bg-green-600 hover:bg-green-700 h-14 w-14 rounded-full"
                        size="icon"
                      >
                        {updating && canStartProduction ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-64 p-3">
                    <div className="space-y-2">
                      <p className="font-medium">Start Production</p>
                      <p className="text-sm">Activates the production order and makes all tasks visible to workers.</p>
                      {!canStartProduction && (
                        <p className="text-xs text-amber-600">This order cannot be started in its current state.</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={() => handleProductionControl('pause')}
                        disabled={updating || !canPauseProduction}
                        variant="outline"
                        className="border-amber-500 text-amber-500 hover:bg-amber-50 h-14 w-14 rounded-full"
                        size="icon"
                      >
                        {updating && canPauseProduction ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Pause className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-64 p-3">
                    <div className="space-y-2">
                      <p className="font-medium">Pause Production</p>
                      <p className="text-sm">Temporarily pauses the production order and hides tasks from workers.</p>
                      {!canPauseProduction && (
                        <p className="text-xs text-amber-600">This order cannot be paused in its current state.</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="default"
                        onClick={() => handleStatusUpdate("COMPLETED")}
                        disabled={updating || nextStatus !== "COMPLETED"}
                        className={`h-14 w-14 rounded-full ${nextStatus === "COMPLETED" ? "bg-blue-600 hover:bg-blue-700" : "opacity-50"}`}
                        size="icon"
                      >
                        {updating ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <CheckCircle className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-64 p-3">
                    <div className="space-y-2">
                      <p className="font-medium">Complete Production</p>
                      <p className="text-sm">Marks the production order as completed and finalizes all tasks.</p>
                      {nextStatus !== "COMPLETED" && (
                        <p className="text-xs text-amber-600">Production must be in progress before it can be completed.</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4">
              <h3 className="font-medium text-muted-foreground mb-1">Notes</h3>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <OperationsManagement
        productionOrderId={order.id}
        operations={order.operations}
        workCenters={workCenters}
        onRefresh={refreshOperations}
        isLoading={loadingOperations}
      />

      <QualityChecks
        productionOrderId={order.id}
        checks={qualityChecks}
        onRefresh={refreshQualityChecks}
        isLoading={loadingQualityChecks}
      />

      <DeliveryAssignment
        productionOrderId={order.id}
        deliveryAssignment={ensureDeliveryAssignmentHasProductionOrder(order.deliveryAssignment, order)}
        deliveryUsers={deliveryUsers}
        onRefresh={refreshDelivery}
        isLoading={loadingDelivery}
      />

      {/* Production History */}
      <ProductionHistory />
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
