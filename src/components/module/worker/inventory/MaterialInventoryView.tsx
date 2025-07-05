"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyPHP } from "@/lib/constant";

// Import types from the new inventory actions
import type { 
  MaterialInventoryItem,
  MaterialWithProducts,
  ProductUsage 
} from "@/lib/actions/worker/inventory";

interface MaterialInventoryViewProps {
  materials: MaterialInventoryItem[];
  materialTypes: Array<{ id: string; name: string; description?: string }>;
  suppliers: Array<{ id: string; name: string; code: string }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  currentFilters: {
    search?: string;
    materialType?: string;
    stockLevel?: string;
    supplierId?: string;
  };
  viewOnly?: boolean;
}

export function MaterialInventoryView({
  materials,
  materialTypes,
  suppliers,
  pagination,
  currentFilters,
  viewOnly = false,
}: MaterialInventoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialInventoryItem | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [materialProducts, setMaterialProducts] = useState<ProductUsage[]>([]);

  // Get stock level badge color
  const getStockLevelBadge = (stockLevel: string) => {
    switch (stockLevel) {
      case "normal":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
      case "low":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low</Badge>;
      case "critical":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Critical</Badge>;
      case "outOfStock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{stockLevel}</Badge>;
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to first page when filtering
    router.push(`?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // View material details
  const handleViewMaterial = async (material: MaterialInventoryItem) => {
    setSelectedMaterial(material);
    // In a real implementation, you would fetch the products that use this material
    // For now, we'll show a placeholder
    setMaterialProducts([]);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              defaultValue={currentFilters.search || ""}
              className="pl-8"
              onChange={(e) => {
                const value = e.target.value;
                const timeoutId = setTimeout(() => handleSearch(value), 300);
                return () => clearTimeout(timeoutId);
              }}
            />
          </div>
        </div>
        
        <Select
          value={currentFilters.materialType || "all"}
          onValueChange={(value) => handleFilterChange("materialType", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Material Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {materialTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.stockLevel || "all"}
          onValueChange={(value) => handleFilterChange("stockLevel", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stock Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="outOfStock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.supplierId || "all"}
          onValueChange={(value) => handleFilterChange("supplier", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Min Level</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No materials found matching your criteria</p>
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-muted-foreground">{material.sku}</div>
                    </div>
                  </TableCell>
                  <TableCell>{material.materialTypeName}</TableCell>
                  <TableCell>{getStockLevelBadge(material.stockLevel)}</TableCell>
                  <TableCell>
                    {material.currentStock} {material.unitOfMeasureSymbol}
                  </TableCell>
                  <TableCell>
                    {material.availableStock} {material.unitOfMeasureSymbol}
                  </TableCell>
                  <TableCell>
                    {material.minimumStockLevel} {material.unitOfMeasureSymbol}
                  </TableCell>
                  <TableCell>{formatCurrencyPHP(material.costPerUnit)}</TableCell>
                  <TableCell>{formatCurrencyPHP(material.totalValue)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{material.supplier.name}</div>
                      <div className="text-sm text-muted-foreground">{material.supplier.code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMaterial(material)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Material Details</DialogTitle>
                          <DialogDescription>
                            View detailed information about {material.name}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedMaterial && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                                <p>{selectedMaterial.sku}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Type</label>
                                <p>{selectedMaterial.materialTypeName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                                <p>{selectedMaterial.currentStock} {selectedMaterial.unitOfMeasureSymbol}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Available Stock</label>
                                <p>{selectedMaterial.availableStock} {selectedMaterial.unitOfMeasureSymbol}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Committed Stock</label>
                                <p>{selectedMaterial.committedStock} {selectedMaterial.unitOfMeasureSymbol}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Minimum Level</label>
                                <p>{selectedMaterial.minimumStockLevel} {selectedMaterial.unitOfMeasureSymbol}</p>
                              </div>
                                                             <div>
                                 <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                                 <p>{formatCurrencyPHP(selectedMaterial.costPerUnit)}</p>
                               </div>
                               <div>
                                 <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                                 <p>{formatCurrencyPHP(selectedMaterial.totalValue)}</p>
                               </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Lead Time</label>
                                <p>{selectedMaterial.leadTime} days</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                                <p>{getStockLevelBadge(selectedMaterial.stockLevel)}</p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                              <p>{selectedMaterial.supplier.name} ({selectedMaterial.supplier.code})</p>
                            </div>

                            {selectedMaterial.notes && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                <p className="text-sm">{selectedMaterial.notes}</p>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                              <p className="text-sm">{new Date(selectedMaterial.lastUpdated).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}{" "}
            of {pagination.totalItems} materials
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNumber = pagination.page - 2 + i;
                if (pageNumber < 1 || pageNumber > pagination.totalPages) return null;
                return (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 