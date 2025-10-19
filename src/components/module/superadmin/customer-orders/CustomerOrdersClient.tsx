"use client";

import { useState } from "react";
import { CustomerOrdersTable } from "./CustomerOrdersTable";
import { BulkStatusUpdateDialog } from "./BulkStatusUpdateDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle2, Clock, XCircle, DollarSign, Plus } from "lucide-react";
import Link from "next/link";

interface CustomerOrdersClientProps {
  initialOrders: any[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    topTenants: Array<{
      tenantId: string;
      count: number;
    }>;
    totalRevenue: number;
  };
}

export function CustomerOrdersClient({
  initialOrders,
  stats,
}: CustomerOrdersClientProps) {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedOrderIds(ids);
  };

  const handleBulkStatusSuccess = () => {
    setSelectedOrderIds([]);
    setShowBulkStatusDialog(false);
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus.PENDING || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byStatus.APPROVED || 0) + (stats.byStatus.IN_PROGRESS || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved or in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Orders</CardTitle>
              <CardDescription>
                Manage customer orders across all tenants with bulk operations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedOrderIds.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {selectedOrderIds.length} selected
                </Badge>
              )}
              <Button asChild>
                <Link href="/superadmin/customer-orders/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CustomerOrdersTable
            initialData={initialOrders}
            onSelectionChange={handleSelectionChange}
            onBulkStatusClick={() => setShowBulkStatusDialog(true)}
          />
        </CardContent>
      </Card>

      {/* Bulk Status Update Dialog */}
      {selectedOrderIds.length > 0 && (
        <BulkStatusUpdateDialog
          open={showBulkStatusDialog}
          onOpenChange={setShowBulkStatusDialog}
          selectedOrderIds={selectedOrderIds}
          orders={initialOrders.filter(o => selectedOrderIds.includes(o.id))}
          onSuccess={handleBulkStatusSuccess}
        />
      )}
    </>
  );
}
