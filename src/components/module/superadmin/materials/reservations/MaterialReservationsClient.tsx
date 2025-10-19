"use client";

import { useState } from "react";
import { MaterialReservationsTable } from "./MaterialReservationsTable";
import { BulkReleaseReservationsDialog } from "./BulkReleaseReservationsDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Unlock, CheckCircle2, Clock } from "lucide-react";

interface MaterialReservationsClientProps {
  initialReservations: any[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    totalReservedQuantity: number;
    totalConsumedQuantity: number;
    totalReleasedQuantity: number;
    partiallyConsumed: number;
  };
}

export function MaterialReservationsClient({
  initialReservations,
  stats,
}: MaterialReservationsClientProps) {
  const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([]);
  const [showBulkReleaseDialog, setShowBulkReleaseDialog] = useState(false);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedReservationIds(ids);
  };

  const handleBulkReleaseSuccess = () => {
    setSelectedReservationIds([]);
    setShowBulkReleaseDialog(false);
    // Table will refresh via router.refresh() in dialog
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All material reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reservations</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus.ACTIVE || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently reserved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partially Consumed</CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partiallyConsumed}</div>
            <p className="text-xs text-muted-foreground">
              Have some material used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus.RELEASED || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Materials returned to stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Material Reservations</CardTitle>
              <CardDescription>
                Manage material reservations across all production orders
              </CardDescription>
            </div>
            {selectedReservationIds.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {selectedReservationIds.length} selected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MaterialReservationsTable
            initialData={initialReservations}
            onSelectionChange={handleSelectionChange}
            onBulkReleaseClick={() => setShowBulkReleaseDialog(true)}
          />
        </CardContent>
      </Card>

      {/* Bulk Release Dialog */}
      {selectedReservationIds.length > 0 && (
        <BulkReleaseReservationsDialog
          open={showBulkReleaseDialog}
          onOpenChange={setShowBulkReleaseDialog}
          selectedReservationIds={selectedReservationIds}
          reservations={initialReservations.filter(r =>
            selectedReservationIds.includes(r.id)
          )}
          onSuccess={handleBulkReleaseSuccess}
        />
      )}
    </>
  );
}
