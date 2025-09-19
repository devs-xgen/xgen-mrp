// src/app/worker/(protected)/inventory/page.tsx
import { Metadata } from "next";
import { 
  getWorkerMaterialInventory, 
  getMaterialTypes, 
  getSuppliers 
} from "@/lib/actions/worker/inventory";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, Package, Boxes } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyPHP } from "@/lib/constant";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";
import { MaterialInventoryTable } from "@/components/module/worker/inventory/MaterialInventoryTable";
import type { MaterialInventoryItem } from "@/lib/actions/worker/inventory";

export const metadata: Metadata = {
  title: "Materials Inventory",
  description: "View materials inventory and product usage (Read-only)",
};


export default async function WorkerInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    materialType?: string;
    stockLevel?: string;
    supplier?: string;
  }>;
}) {
  const { 
    page: pageParam, 
    search, 
    materialType, 
    stockLevel, 
    supplier 
  } = await searchParams;

  // Parse params
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const pageSize = 20;

  // Build filter object
  const filter = {
    search: search || undefined,
    materialType: materialType || undefined,
    stockLevel: (stockLevel as any) || "all",
    supplierId: supplier || undefined,
    isActive: true,
  };

  // Build sort option
  const sortOption = {
    field: "name" as const,
    direction: "asc" as const,
  };

  // Fetch data
  const [inventoryResult, materialTypes, suppliers] = await Promise.all([
    getWorkerMaterialInventory(filter, sortOption, { page, pageSize }),
    getMaterialTypes(),
    getSuppliers(),
  ]);


  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Materials Inventory</PageTitle>
          <PageDescription>
            View materials inventory and product usage information (Read-only access)
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/worker/inventory/alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Alerts
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Stock Status Overview - Using SectionCard */}
        <SectionCard heading="Inventory Overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{inventoryResult.stockStatus.totalMaterials}</div>
              <p className="text-sm font-medium">Total Materials</p>
              <p className="text-xs text-muted-foreground">Active materials</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{inventoryResult.stockStatus.normalStock}</div>
              <p className="text-sm font-medium">Normal Stock</p>
              <p className="text-xs text-muted-foreground">Well stocked</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-yellow-600">{inventoryResult.stockStatus.lowStock}</div>
              <p className="text-sm font-medium">Low Stock</p>
              <p className="text-xs text-muted-foreground">Need reorder</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">{inventoryResult.stockStatus.criticalStock}</div>
              <p className="text-sm font-medium">Critical Stock</p>
              <p className="text-xs text-muted-foreground">Urgent reorder</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{formatCurrencyPHP(inventoryResult.stockStatus.totalValue)}</div>
              <p className="text-sm font-medium">Total Value</p>
              <p className="text-xs text-muted-foreground">Inventory value</p>
            </div>
          </div>
        </SectionCard>

        {/* Main Content */}
        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList>
            <TabsTrigger value="materials">
              <Package className="h-4 w-4 mr-2" />
              Materials ({inventoryResult.stockStatus.totalMaterials})
            </TabsTrigger>
            <TabsTrigger value="products">
              <Boxes className="h-4 w-4 mr-2" />
              Products Usage
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="materials" className="space-y-6">
            <SectionCard 
              heading={
                <div className="flex items-center justify-between">
                  <span>Materials List</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Showing {inventoryResult.materials.length} of {inventoryResult.pagination.totalItems} materials
                  </span>
                </div>
              }
            >
              <MaterialInventoryTable
                materials={inventoryResult.materials}
                materialTypes={materialTypes}
                suppliers={suppliers}
                pagination={inventoryResult.pagination}
                currentFilters={filter}
              />
            </SectionCard>
          </TabsContent>
          
          <TabsContent value="products" className="space-y-6">
            <SectionCard heading="Products Using Materials">
              <div className="text-center py-12">
                <Boxes className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold mb-3">Product Usage Information</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Select a material from the Materials tab to view which products use it and their quantity requirements.
                </p>
                <p className="text-sm text-muted-foreground">
                  This will show the quantity needed, waste percentage, and total requirements for each product
                </p>
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageContainer>
  );
}
