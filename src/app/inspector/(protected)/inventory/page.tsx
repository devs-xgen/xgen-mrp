// src/app/worker/(protected)/inventory/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { getWorkerInventory } from "@/lib/actions/inspector/inventory";
import {
  InventoryList,
  InventoryFilters,
  StockStatusDashboard,
  InventoryExportButton,
  ExportStatusNotification,
} from "@/components/module/inspectors/inventory";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "View and manage inventory items",
};

// Mock data - in a real app, this would come from the database
const mockMaterialTypes = [
  { id: "raw", name: "Raw Materials" },
  { id: "component", name: "Components" },
  { id: "packaging", name: "Packaging" },
  { id: "consumable", name: "Consumables" },
  { id: "finished", name: "Finished Goods" },
];

const mockLocations = [
  { id: "warehouse", name: "Main Warehouse" },
  { id: "assembly", name: "Assembly Area" },
  { id: "packing", name: "Packing Area" },
  { id: "staging", name: "Staging Area" },
];

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    materialType?: string;
    stockLevel?: string;
    locationType?: string;
    page?: string;
    sort?: string;
    direction?: string;
    export_success?: string;
    export_error?: string;
  };
}) {
  // Parse pagination and sorting params
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const sortField = searchParams.sort || "name";
  const sortDirection = searchParams.direction === "desc" ? "desc" : "asc";

  // Convert stockLevel param to the correct format if present
  const stockLevel = searchParams.stockLevel as any;

  // Build filter from search params
  const filter = {
    search: searchParams.search,
    materialTypes: searchParams.materialType
      ? [searchParams.materialType]
      : undefined,
    stockLevels: stockLevel ? [stockLevel] : undefined,
    locationTypes: searchParams.locationType
      ? [searchParams.locationType]
      : undefined,
    isActive: true,
  };

  // Prepare sort options
  const sortOption = {
    field: sortField as any,
    direction: sortDirection as any,
  };

  // Pagination
  const pagination = {
    page,
    pageSize: 10,
  };

  // Get inventory data
  const inventoryData = await getWorkerInventory(
    filter,
    sortOption,
    pagination
  );

  return (
    <div className="space-y-6">
      {/* Notification component for export status */}
      <ExportStatusNotification />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Inventory Management
          </h2>
          <p className="text-muted-foreground">
            View inventory levels and manage stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/inspector/inventory/alerts">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alerts
            </Link>
          </Button>
          <InventoryExportButton />
          <Button asChild>
            <Link href="/inspector/inventory/request">
              <Plus className="mr-2 h-4 w-4" />
              Request Materials
            </Link>
          </Button>
        </div>
      </div>

      {/* Stock Status Dashboard */}
      <Suspense fallback={<div>Loading stock status...</div>}>
        <StockStatusDashboard stockStatus={inventoryData.stockStatus} />
      </Suspense>

      <Separator />

      {/* Filters */}
      <Suspense fallback={<div>Loading filters...</div>}>
        <InventoryFilters
          materialTypes={mockMaterialTypes}
          locations={mockLocations}
          defaultValues={{
            search: searchParams.search,
            stockLevel: stockLevel,
            materialType: searchParams.materialType,
            location: searchParams.locationType,
          }}
        />
      </Suspense>

      {/* Inventory List */}
      <Suspense fallback={<div>Loading inventory items...</div>}>
        <InventoryList
          items={inventoryData.items}
          pagination={inventoryData.pagination}
        />
      </Suspense>
    </div>
  );
}
