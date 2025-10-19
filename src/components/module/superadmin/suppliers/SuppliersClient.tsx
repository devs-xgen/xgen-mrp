"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, CheckCircle, Clock } from "lucide-react";
import { SuppliersTable } from "./SuppliersTable";
import { PurchaseOrdersTable } from "./PurchaseOrdersTable";
import { BulkPOOperationsDialog } from "./BulkPOOperationsDialog";

interface SuppliersClientProps {
  initialSuppliers: any[];
  initialPurchaseOrders: any[];
  stats: {
    total: number;
    active: number;
    totalPOs: number;
    pendingPOs: number;
  };
}

export function SuppliersClient({
  initialSuppliers,
  initialPurchaseOrders,
  stats,
}: SuppliersClientProps) {
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<"approve" | "cancel" | null>(null);

  const handlePOSelectionChange = (ids: string[]) => {
    setSelectedPOIds(ids);
  };

  const handleBulkAction = (operation: "approve" | "cancel") => {
    setBulkOperation(operation);
    setShowBulkDialog(true);
  };

  const handleBulkSuccess = () => {
    setSelectedPOIds([]);
    setShowBulkDialog(false);
    setBulkOperation(null);
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPOs}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending POs</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPOs}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Ready for orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers ({initialSuppliers.length})</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders ({initialPurchaseOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>
                Manage suppliers across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SuppliersTable initialData={initialSuppliers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                View and manage purchase orders with bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PurchaseOrdersTable
                initialData={initialPurchaseOrders}
                onSelectionChange={handlePOSelectionChange}
                onBulkAction={handleBulkAction}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk PO Operations Dialog */}
      {selectedPOIds.length > 0 && bulkOperation && (
        <BulkPOOperationsDialog
          open={showBulkDialog}
          onOpenChange={setShowBulkDialog}
          selectedPOIds={selectedPOIds}
          purchaseOrders={initialPurchaseOrders.filter(po => selectedPOIds.includes(po.id))}
          operation={bulkOperation}
          onSuccess={handleBulkSuccess}
        />
      )}
    </>
  );
}
