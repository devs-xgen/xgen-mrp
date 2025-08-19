"use client";

import { useState } from "react";
import { FulfillmentTracker } from "./FulfillmentTracker";
import { FulfillmentNotifications } from "./FulfillmentNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Bell, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Factory
} from "lucide-react";

interface FulfillmentDashboardProps {
  orderId: string;
  fulfillmentData: {
    orderId: string;
    orderNumber: string;
    orderLines: Array<{
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
      fulfillmentType: any;
      fulfillmentStatus: any;
      allocatedAt: Date | null;
      fulfilledAt: Date | null;
      completionPercentage: number;
    }>;
    overallCompletion: number;
  };
}

export function FulfillmentDashboard({
  orderId,
  fulfillmentData,
}: FulfillmentDashboardProps) {
  const [activeTab, setActiveTab] = useState("tracker");

  // Calculate fulfillment statistics
  const totalItems = fulfillmentData.orderLines.length;
  const fulfilledItems = fulfillmentData.orderLines.filter(
    line => line.fulfillmentStatus === "FULFILLED"
  ).length;
  const pendingItems = fulfillmentData.orderLines.filter(
    line => line.fulfillmentStatus === "PENDING"
  ).length;
  const stockItems = fulfillmentData.orderLines.filter(
    line => line.fulfillmentType === "STOCK"
  ).length;
  const productionItems = fulfillmentData.orderLines.filter(
    line => line.fulfillmentType === "PRODUCTION"
  ).length;
  const hybridItems = fulfillmentData.orderLines.filter(
    line => line.fulfillmentType === "HYBRID"
  ).length;

  const handleRefresh = async () => {
    // In a real implementation, this would refetch data from the server
    try {
      const { getOrderFulfillmentTracking } = await import("@/lib/actions/stock-allocation");
      const updatedData = await getOrderFulfillmentTracking(orderId);
      // Update the fulfillment data
      window.location.reload(); // Temporary solution - in production, use proper state management
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fulfilled</p>
                <p className="text-2xl font-bold">{fulfilledItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{fulfillmentData.overallCompletion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Fulfillment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Package className="h-3 w-3 mr-1" />
                Stock: {stockItems}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Factory className="h-3 w-3 mr-1" />
                Production: {productionItems}
              </Badge>
            </div>
            {hybridItems > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Package className="h-3 w-3 mr-1" />
                  Mixed: {hybridItems}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Fulfillment Tracker
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracker" className="mt-6">
          <FulfillmentTracker 
            initialData={fulfillmentData}
            onRefresh={handleRefresh}
          />
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <FulfillmentNotifications orderId={orderId} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="text-sm text-muted-foreground">
              Bulk actions for order fulfillment will be available here in the next phase.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
