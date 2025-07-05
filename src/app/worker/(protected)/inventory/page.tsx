// src/app/worker/(protected)/inventory/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { 
  getWorkerMaterialInventory, 
  getMaterialTypes, 
  getSuppliers 
} from "@/lib/actions/worker/inventory";
import { MaterialInventoryView } from "@/components/module/worker/inventory/MaterialInventoryView";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, Eye, Package, Boxes } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyPHP } from "@/lib/constant";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials Inventory</h1>
          <p className="text-muted-foreground">
            View materials inventory and product usage information (Read-only access)
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/worker/inventory/alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Alerts
            </Link>
          </Button>
        </div>
      </div>

      {/* Stock Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryResult.stockStatus.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">Active materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Normal Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inventoryResult.stockStatus.normalStock}</div>
            <p className="text-xs text-muted-foreground">Well stocked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inventoryResult.stockStatus.lowStock}</div>
            <p className="text-xs text-muted-foreground">Need reorder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryResult.stockStatus.criticalStock}</div>
            <p className="text-xs text-muted-foreground">Urgent reorder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyPHP(inventoryResult.stockStatus.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="materials" className="space-y-4">
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
        
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materials List</CardTitle>
              <CardDescription>
                View all materials in inventory with stock levels and supplier information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialInventoryView
                materials={inventoryResult.materials}
                materialTypes={materialTypes}
                suppliers={suppliers}
                pagination={inventoryResult.pagination}
                currentFilters={filter}
                viewOnly={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products Using Materials</CardTitle>
              <CardDescription>
                View which products use specific materials and their quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Product Usage Information</h3>
                <p className="text-muted-foreground mb-4">
                  Select a material from the Materials tab to view which products use it
                </p>
                <p className="text-sm text-muted-foreground">
                  This will show the quantity needed, waste percentage, and total requirements for each product
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
