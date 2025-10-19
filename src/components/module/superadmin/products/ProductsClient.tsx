"use client";

import { useState } from "react";
import { ProductsTable } from "./ProductsTable";
import { BulkProductOperationsDialog } from "./BulkProductOperationsDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle, Archive, TrendingUp } from "lucide-react";

interface ProductsClientProps {
  initialProducts: any[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    topCategories: Array<{
      categoryId: string;
      count: number;
    }>;
    lowStock: number;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
}

export function ProductsClient({
  initialProducts,
  stats,
  categories,
}: ProductsClientProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<"archive" | "activate" | "pricing" | null>(null);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedProductIds(ids);
  };

  const handleBulkAction = (operation: "archive" | "activate" | "pricing") => {
    setBulkOperation(operation);
    setShowBulkDialog(true);
  };

  const handleBulkSuccess = () => {
    setSelectedProductIds([]);
    setShowBulkDialog(false);
    setBulkOperation(null);
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Active products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus.ACTIVE || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lowStock}
            </div>
            <p className="text-xs text-muted-foreground">
              Below minimum level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus.INACTIVE || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Not available for orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage products, variants, and BOMs with bulk operations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedProductIds.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {selectedProductIds.length} selected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductsTable
            initialData={initialProducts}
            categories={categories}
            onSelectionChange={handleSelectionChange}
            onBulkAction={handleBulkAction}
          />
        </CardContent>
      </Card>

      {/* Bulk Operations Dialog */}
      {selectedProductIds.length > 0 && bulkOperation && (
        <BulkProductOperationsDialog
          open={showBulkDialog}
          onOpenChange={setShowBulkDialog}
          selectedProductIds={selectedProductIds}
          products={initialProducts.filter(p => selectedProductIds.includes(p.id))}
          operation={bulkOperation}
          onSuccess={handleBulkSuccess}
        />
      )}
    </>
  );
}
