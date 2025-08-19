"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Package, 
  Factory, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MoreHorizontal,
  RefreshCcw 
} from "lucide-react";
import { toast } from "sonner";

import { FulfillmentType, FulfillmentStatus } from "@prisma/client";

interface FulfillmentTracker {
  orderId: string;
  orderNumber: string;
  orderLines: OrderLineFulfillment[];
  overallCompletion: number;
}

interface OrderLineFulfillment {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    displayName?: string;
  };
  quantity: number;
  stockAllocated: number;
  productionQuantity: number;
  fulfillmentType: FulfillmentType | null;
  fulfillmentStatus: FulfillmentStatus | null;
  allocatedAt: Date | null;
  fulfilledAt: Date | null;
  completionPercentage: number;
}

interface FulfillmentTrackerProps {
  initialData: FulfillmentTracker;
  onRefresh?: () => void;
}

export function FulfillmentTracker({
  initialData,
  onRefresh,
}: FulfillmentTrackerProps) {
  const [fulfillmentData, setFulfillmentData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    if (!onRefresh) return;
    
    setIsLoading(true);
    try {
      await onRefresh();
      toast.success("Fulfillment data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  const getFulfillmentStatusBadge = (status: FulfillmentStatus | null) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    
    const variants = {
      [FulfillmentStatus.PENDING]: { variant: "secondary" as const, icon: Clock, color: "text-gray-600" },
      [FulfillmentStatus.ALLOCATED]: { variant: "default" as const, icon: Package, color: "text-blue-600" },
      [FulfillmentStatus.PARTIALLY_FULFILLED]: { variant: "outline" as const, icon: AlertTriangle, color: "text-orange-600" },
      [FulfillmentStatus.FULFILLED]: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      [FulfillmentStatus.CANCELLED]: { variant: "destructive" as const, icon: AlertTriangle, color: "text-red-600" },
    };

    const config = variants[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className={`h-3 w-3 ${config.color}`} />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getFulfillmentTypeBadge = (type: FulfillmentType | null) => {
    if (!type) return <Badge variant="outline">Pending</Badge>;
    
    const variants = {
      [FulfillmentType.PENDING]: { variant: "outline" as const, icon: Clock },
      [FulfillmentType.STOCK]: { variant: "secondary" as const, icon: Package },
      [FulfillmentType.PRODUCTION]: { variant: "default" as const, icon: Factory },
      [FulfillmentType.HYBRID]: { variant: "outline" as const, icon: Package },
    };

    const config = variants[type];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {type === FulfillmentType.HYBRID ? "Mixed" : type}
      </Badge>
    );
  };

  const handleStatusUpdate = async (orderLineId: string, newStatus: FulfillmentStatus) => {
    try {
      const { updateFulfillmentStatus } = await import("@/lib/actions/stock-allocation");
      const result = await updateFulfillmentStatus(orderLineId, newStatus);
      
      if (result.success) {
        toast.success(result.message);
        await refreshData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getOverallStatusColor = (completion: number) => {
    if (completion >= 100) return "text-green-600";
    if (completion >= 50) return "text-orange-600";
    return "text-gray-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Fulfillment Tracker - {fulfillmentData.orderNumber}
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-sm font-medium ${getOverallStatusColor(fulfillmentData.overallCompletion)}`}>
              {fulfillmentData.overallCompletion}% Complete
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        
        <div className="space-y-2">
          <Progress value={fulfillmentData.overallCompletion} className="w-full" />
          <div className="text-sm text-muted-foreground">
            {fulfillmentData.orderLines.filter(line => line.fulfillmentStatus === FulfillmentStatus.FULFILLED).length} of {fulfillmentData.orderLines.length} items fulfilled
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fulfillmentData.orderLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{line.product.displayName || line.product.name}</div>
                      <div className="text-sm text-muted-foreground">SKU: {line.product.sku}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{line.quantity}</div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {line.stockAllocated > 0 && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-blue-600" />
                            {line.stockAllocated} from stock
                          </div>
                        )}
                        {line.productionQuantity > 0 && (
                          <div className="flex items-center gap-1">
                            <Factory className="h-3 w-3 text-orange-600" />
                            {line.productionQuantity} from production
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>{getFulfillmentTypeBadge(line.fulfillmentType)}</TableCell>
                  
                  <TableCell>{getFulfillmentStatusBadge(line.fulfillmentStatus)}</TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={line.completionPercentage} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-xs font-medium min-w-10">
                          {line.completionPercentage}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {line.allocatedAt && (
                        <div>Allocated: {line.allocatedAt.toLocaleDateString()}</div>
                      )}
                      {line.fulfilledAt && (
                        <div>Fulfilled: {line.fulfilledAt.toLocaleDateString()}</div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {line.fulfillmentStatus === FulfillmentStatus.ALLOCATED && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(line.id, FulfillmentStatus.FULFILLED)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Fulfilled
                          </DropdownMenuItem>
                        )}
                        
                        {line.fulfillmentStatus === FulfillmentStatus.PENDING && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(line.id, FulfillmentStatus.ALLOCATED)}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Mark as Allocated
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {line.fulfillmentStatus !== FulfillmentStatus.CANCELLED && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(line.id, FulfillmentStatus.CANCELLED)}
                            className="text-red-600"
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {fulfillmentData.orderLines.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No order lines found</h3>
            <p className="text-muted-foreground">
              This order doesn't have any items to track.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
