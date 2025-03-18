"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  ShoppingCart, 
  Truck, 
  Package,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CURRENCY_SYMBOLS } from "@/lib/constant";

// Define the types for our materials and related data
export interface Material {
  id: string;
  name: string;
  materialTypeId: string;
  sku: string;
  unitOfMeasureId: string;
  costPerUnit: number;
  currentStock: number;
  minimumStockLevel: number;
  leadTime: number;
  supplierId: string;
}

export interface MaterialType {
  id: string;
  name: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Supplier {
  id: string;
  name: string;
}

// Props interface for our dashboard component
interface MaterialsDashboardProps {
  materials: Material[];
  materialTypes: MaterialType[];
  unitOfMeasures: UnitOfMeasure[];
  suppliers: Supplier[];
}

const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return `${CURRENCY_SYMBOLS.PESO}0.00`;
    return `${CURRENCY_SYMBOLS.PESO}${Number(value).toFixed(2)}`;
  };

// Dashboard component
const MaterialsDashboard: React.FC<MaterialsDashboardProps> = ({
  materials,
  materialTypes,
  unitOfMeasures,
  suppliers
}) => {
  // State for expanded lists
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);

  // Calculate summary data
  const totalMaterials = materials.length;
  const lowStockMaterials = materials.filter(m => m.currentStock < m.minimumStockLevel).length;

  //Calculate total value
  const totalValue = materials.reduce((sum, m) => {
    const cost = m.costPerUnit || 0;
    const stock = m.currentStock || 0;
    return sum + (cost * stock);
  }, 0);

  const avgLeadTime = materials.length > 0 
    ? Math.round(materials.reduce((sum, m) => sum + m.leadTime, 0) / materials.length) 
    : 0;

  // Determine how many items to display based on state
  const displayedMaterials = showAllMaterials ? materials : materials.slice(0, 5);
  const displayedTypes = showAllTypes ? materialTypes : materialTypes.slice(0, 5);
  const displayedSuppliers = showAllSuppliers ? suppliers : suppliers.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterials}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockMaterials}</div>
            <p className="text-xs text-muted-foreground">Below minimum levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Based on current stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgLeadTime} days
            </div>
            <p className="text-xs text-muted-foreground">Average replenishment time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="inventory">Inventory Levels</TabsTrigger>
          <TabsTrigger value="categories">Material Types</TabsTrigger>
          <TabsTrigger value="details">Material Details</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>Current stock vs. minimum required levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-auto flex flex-col items-center justify-center text-center">
                <BarChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Stock Level Analysis</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Overview of current stock levels compared to minimum required levels
                </p>
                <div className="mt-2 border rounded-md p-4 w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Material</th>
                        <th className="text-right p-2">Current Stock</th>
                        <th className="text-right p-2">Minimum Level</th>
                        <th className="text-right p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedMaterials.map((material) => {
                        const uom = unitOfMeasures.find(u => u.id === material.unitOfMeasureId);
                        const isLowStock = (material.currentStock || 0) < (material.minimumStockLevel || 0);
                        
                        return (
                          <tr key={material.id} className="border-b">
                            <td className="p-2 font-medium">{material.name}</td>
                            <td className="p-2 text-right">{material.currentStock} {uom?.abbreviation}</td>
                            <td className="p-2 text-right">{material.minimumStockLevel} {uom?.abbreviation}</td>
                            <td className="p-2 text-right">
                              <Badge variant={isLowStock ? "warning" : "success"}>
                                {isLowStock ? "Low Stock" : "In Stock"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {materials.length > 5 && (
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllMaterials(!showAllMaterials)}
                        className="flex items-center gap-1"
                      >
                        {showAllMaterials ? (
                          <>Show Less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>Show All {materials.length} Materials <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Materials by Type</CardTitle>
                <CardDescription>Distribution of material categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-auto flex flex-col items-center justify-center text-center">
                  <PieChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Type Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Summary of materials by type
                  </p>
                  <div className="w-full grid grid-cols-1 gap-2">
                    {displayedTypes.map(type => {
                      const count = materials.filter(m => m.materialTypeId === type.id).length;
                      const percentage = materials.length > 0 
                        ? Math.round((count / materials.length) * 100) 
                        : 0;
                      
                      return (
                        <div key={type.id} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="font-medium">{type.name}</span>
                          <span className="flex items-center">
                            <span className="mr-2">{count} items</span>
                            <Badge variant="outline">{percentage}%</Badge>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {materialTypes.length > 5 && (
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllTypes(!showAllTypes)}
                        className="flex items-center gap-1"
                      >
                        {showAllTypes ? (
                          <>Show Less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>Show All {materialTypes.length} Types <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materials by Supplier</CardTitle>
                <CardDescription>Distribution by supplier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-auto flex flex-col items-center justify-center text-center">
                  <PieChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Supplier Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Summary of materials by supplier
                  </p>
                  <div className="w-full grid grid-cols-1 gap-2">
                    {displayedSuppliers.map(supplier => {
                      const count = materials.filter(m => m.supplierId === supplier.id).length;
                      const percentage = materials.length > 0 
                        ? Math.round((count / materials.length) * 100) 
                        : 0;
                      
                      return (
                        <div key={supplier.id} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="font-medium">{supplier.name}</span>
                          <span className="flex items-center">
                            <span className="mr-2">{count} items</span>
                            <Badge variant="outline">{percentage}%</Badge>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {suppliers.length > 5 && (
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllSuppliers(!showAllSuppliers)}
                        className="flex items-center gap-1"
                      >
                        {showAllSuppliers ? (
                          <>Show Less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>Show All {suppliers.length} Suppliers <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Details</CardTitle>
              <CardDescription>Complete overview of all materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-left p-2">Cost</th>
                      <th className="text-left p-2">Stock</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => {
                      const materialType = materialTypes.find(t => t.id === material.materialTypeId);
                      const uom = unitOfMeasures.find(u => u.id === material.unitOfMeasureId);
                      const supplier = suppliers.find(s => s.id === material.supplierId);
                      const isLowStock = (material.currentStock || 0) < (material.minimumStockLevel || 0);
                      
                      return (
                        <tr key={material.id} className="border-b">
                          <td className="p-2">{material.id}</td>
                          <td className="p-2 font-medium">{material.name}</td>
                          <td className="p-2">{materialType?.name}</td>
                          <td className="p-2">{material.sku}</td>
                          <td className="p-2">{uom?.abbreviation}</td>
                          <td className="p-2">${formatCurrency(material.costPerUnit)}</td>
                          <td className="p-2">
                            {material.currentStock || 0} {uom?.abbreviation}
                          </td>
                          <td className="p-2">
                            <Badge variant={isLowStock ? "warning" : "success"}>
                              {isLowStock ? "Low Stock" : "In Stock"}
                            </Badge>
                          </td>
                          <td className="p-2">{supplier?.name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaterialsDashboard;