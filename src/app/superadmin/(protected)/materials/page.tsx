import { Suspense } from "react";
import {
  getAllMaterialReservationsSuperadmin,
  getMaterialReservationStatsSuperadmin
} from "@/lib/actions/superadmin/material-reservation";
import { MaterialReservationsClient } from "@/components/module/superadmin/materials/reservations/MaterialReservationsClient";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Material Reservations | SuperAdmin",
  description: "Manage material reservations across all production orders",
};

async function MaterialReservationsContent() {
  const [reservations, stats] = await Promise.all([
    getAllMaterialReservationsSuperadmin(),
    getMaterialReservationStatsSuperadmin(),
  ]);

  return (
    <MaterialReservationsClient
      initialReservations={reservations}
      stats={stats}
    />
  );
}

export default function MaterialReservationsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Material Reservations</h2>
          <p className="text-muted-foreground">
            View and manage material reservations across all production orders
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <MaterialReservationsContent />
      </Suspense>
    </div>
  );
}
