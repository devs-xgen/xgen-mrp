"use client";

import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Layers,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { VariantCreationDialog } from "./variant-creation-dialog";
import { getGroupedProductsWithVariants } from "@/lib/actions/bulk-variant-creation";
import type { GroupedProductForDisplay } from "@/types/admin/product-variants";

interface GroupedProductsTableProps {
  onProductEdit?: (productId: string) => void;
  onProductDelete?: (productId: string) => void;
  onVariantEdit?: (variantId: string) => void;
  onVariantDelete?: (variantId: string) => void;
  onRefresh?: () => Promise<void>;
}

export function GroupedProductsTable({
  onProductEdit,
  onProductDelete,
  onVariantEdit,
  onVariantDelete,
  onRefresh,
}: GroupedProductsTableProps) {
  const [products, setProducts] = useState<GroupedProductForDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Load grouped products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getGroupedProductsWithVariants();
      setProducts(data);
    } catch (error) {
      console.error("Error loading grouped products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Toggle row expansion
  const toggleExpanded = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.variants.some(variant => 
      variant.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Get stock status color
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-100 text-green-800";
      case "LOW_STOCK":
        return "bg-yellow-100 text-yellow-800";
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await loadProducts();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
            <p className="mt-2 text-muted-foreground">Loading products...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products & Variants</h2>
          <p className="text-muted-foreground">
            Manage your products and their variants in one place
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <Package className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search products and variants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Variants</p>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + p.variantCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${products.reduce((sum, p) => sum + p.totalValue, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + p.lowStockVariants, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products & Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <>
                  {/* Main Product Row */}
                  <TableRow 
                    key={product.id} 
                    className="font-medium bg-muted/50 hover:bg-muted/80"
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(product.id)}
                        className="p-0 h-8 w-8"
                      >
                        {expandedRows.has(product.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{product.variantCount}</Badge>
                        {product.hasVariants && (
                          <Badge variant="outline" className="text-green-600">
                            <Layers className="mr-1 h-3 w-3" />
                            Variants
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.totalStock}</span>
                        {product.lowStockVariants > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {product.lowStockVariants} variants with low stock
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ${product.totalValue.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={product.lowStockVariants > 0 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-green-100 text-green-800"
                        }
                      >
                        {product.lowStockVariants > 0 ? "Attention" : "Good"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <VariantCreationDialog
                          productId={product.id}
                          productName={product.name}
                          onSuccess={handleRefresh}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onProductEdit?.(product.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onProductDelete?.(product.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Variant Rows (Expandable) */}
                  {expandedRows.has(product.id) && product.variants.map((variant) => (
                    <TableRow 
                      key={variant.id} 
                      className="bg-blue-50/50 border-l-4 border-blue-300"
                    >
                      <TableCell></TableCell>
                      <TableCell>
                        <div className="pl-4">
                          <div className="font-medium">└ {variant.displayName}</div>
                          <div className="text-sm text-muted-foreground">{variant.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {variant.sizeName && (
                            <Badge variant="outline" className="text-xs">
                              {variant.sizeName}
                            </Badge>
                          )}
                          {variant.colorName && (
                            <Badge variant="outline" className="text-xs">
                              {variant.colorName}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {variant.boms.length} materials
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{variant.currentStock}</span>
                          <Badge 
                            variant="outline" 
                            className={getStockStatusColor(variant.stockStatus)}
                          >
                            {variant.stockStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>${variant.sellingPrice.toFixed(2)} each</div>
                          <div className="text-muted-foreground">
                            ${(variant.currentStock * variant.unitCost).toFixed(2)} total
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={getStockStatusColor(variant.stockStatus)}
                        >
                          {variant.availableStock} available
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                View variant details
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onVariantEdit?.(variant.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Variant
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Package className="mr-2 h-4 w-4" />
                                Manage BOM
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onVariantDelete?.(variant.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Variant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No products match your search criteria." : "Start by creating your first product."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 