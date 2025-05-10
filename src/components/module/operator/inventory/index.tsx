"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  InventoryList,
  InventoryFilters,
  StockStatusDashboard,
  InventoryExportButton,
  ExportStatusNotification,
} from "@/components/module/worker/inventory";
import { getWorkerInventory } from "@/lib/actions/worker/inventory";

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

export function InventoryPage({
  searchParams = {},
}: {
  searchParams?: {
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
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  const [inventoryData, setInventoryData] = useState<any>({
    items: [],
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1 },
    stockStatus: { low: 0, normal: 0, high: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Parse pagination and sorting params
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const sortField = searchParams.sort || "name";
  const sortDirection = searchParams.direction === "desc" ? "desc" : "asc";

  // Convert stockLevel param to the correct format if present
  const stockLevel = searchParams.stockLevel as any;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
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
        const data = await getWorkerInventory(
          filter,
          sortOption,
          pagination
        );
        
        setInventoryData(data);
      } catch (error) {
        console.error("Failed to fetch inventory data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [urlSearchParams]);

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
        </div>
      </div>

      {/* Stock Status Dashboard */}
      {loading ? (
        <div>Loading stock status...</div>
      ) : (
        <StockStatusDashboard stockStatus={inventoryData.stockStatus} />
      )}

      <Separator />

      {/* Filters */}
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

      {/* Inventory List */}
      {loading ? (
        <div>Loading inventory items...</div>
      ) : (
        <InventoryList
          items={inventoryData.items}
          pagination={inventoryData.pagination}
        />
      )}
    </div>
  );
} 