import { Suspense } from "react";
import { InventoryStats } from "./inventory-stats";
import { InventoryList } from "./inventory-list";
import { InventorySearch } from "./inventory-search";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InventoryPageProps = {
  searchParams?: {
    search?: string;
  };
};

export function InventoryPage({ searchParams }: InventoryPageProps) {
  const search = searchParams?.search || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">
          Check inventory levels and manage stock
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </div>
        }
      >
        <InventoryStats />
      </Suspense>

      <div className="flex justify-between items-center">
        <InventorySearch />
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        }
      >
        <InventoryList search={search} />
      </Suspense>
    </div>
  );
}
