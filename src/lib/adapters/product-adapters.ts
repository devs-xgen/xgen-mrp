// src/lib/adapters/product-adapters.ts
import { Status } from "@prisma/client";
import { 
  ProductWithNumberValues, 
  convertDecimalsToNumbers 
} from "@/types/admin/product";

/**
 * Interface for the table data structure used in the products data table
 */
export interface ExtendedProductForTable {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  description: string | null;
  status: Status;
  categoryId: string;
  currentStock: number;
  minimumStockLevel: number;
  leadTime: number;
  sizeRange: string[];
  colorOptions: string[];
  unitCost: number;
  createdAt: Date;
  updatedAt: Date;
  expectedStock: number;
  committedStock: number;
  calculatedStock: number;
  createdBy: string | null;
  modifiedBy: string | null;
  productionOrders?: Array<{
    id: string;
    status: string;
    quantity: number;
    dueDate: Date;
  }>;
  [key: string]: any; // Allow other properties
}

/**
 * Converts a Prisma Product to the internal table representation
 */
export function adaptProductForTable(product: any): ExtendedProductForTable {
  // Convert all Decimal values to regular numbers
  const converted = convertDecimalsToNumbers(product);
  
  return {
    id: converted.id,
    name: converted.name,
    sku: converted.sku,
    description: converted.description || null,
    status: converted.status,
    categoryId: converted.categoryId,
    sizeRange: converted.sizeRange || [],
    colorOptions: converted.colorOptions || [],
    unitCost: Number(converted.unitCost),
    sellingPrice: Number(converted.sellingPrice),
    minimumStockLevel: converted.minimumStockLevel,
    currentStock: converted.currentStock,
    leadTime: converted.leadTime,
    createdAt: converted.createdAt,
    updatedAt: converted.updatedAt,
    productionOrders: converted.productionOrders || [],
    // Add any missing properties with default values
    expectedStock: converted.expectedStock || 0,
    committedStock: converted.committedStock || 0,
    calculatedStock: converted.calculatedStock || 0,
    createdBy: converted.createdBy || null,
    modifiedBy: converted.modifiedBy || null,
  };
}

/**
 * Adapts a table product back to a Prisma Product format for API operations
 * Without directly using Prisma's Decimal (to avoid fs dependency)
 */
export function adaptTableProductForAPI(tableProduct: ExtendedProductForTable): any {
  return {
    id: tableProduct.id,
    name: tableProduct.name,
    sku: tableProduct.sku,
    description: tableProduct.description,
    status: tableProduct.status,
    categoryId: tableProduct.categoryId,
    sizeRange: tableProduct.sizeRange,
    colorOptions: tableProduct.colorOptions,
    // Just pass numbers - will be handled properly on the server
    unitCost: tableProduct.unitCost,
    sellingPrice: tableProduct.sellingPrice,
    minimumStockLevel: tableProduct.minimumStockLevel,
    currentStock: tableProduct.currentStock,
    leadTime: tableProduct.leadTime,
    createdAt: tableProduct.createdAt,
    updatedAt: tableProduct.updatedAt,
    expectedStock: tableProduct.expectedStock || 0,
    committedStock: tableProduct.committedStock || 0,
    calculatedStock: tableProduct.calculatedStock || 0,
    createdBy: tableProduct.createdBy || null,
    modifiedBy: tableProduct.modifiedBy || null,
  };
}

/**
 * Adapts a table product to the ProductWithNumberValues type
 * used by the ProductDetails component
 */
export function adaptTableProductForDetails(
  tableProduct: ExtendedProductForTable
): ProductWithNumberValues {
  // Create a new object that matches ProductWithNumberValues
  return {
    id: tableProduct.id,
    name: tableProduct.name,
    sku: tableProduct.sku,
    description: tableProduct.description,
    status: tableProduct.status,
    categoryId: tableProduct.categoryId,
    sizeRange: tableProduct.sizeRange,
    colorOptions: tableProduct.colorOptions,
    unitCost: tableProduct.unitCost,
    sellingPrice: tableProduct.sellingPrice,
    minimumStockLevel: tableProduct.minimumStockLevel,
    currentStock: tableProduct.currentStock,
    leadTime: tableProduct.leadTime,
    createdAt: tableProduct.createdAt,
    updatedAt: tableProduct.updatedAt,
    expectedStock: tableProduct.expectedStock,
    committedStock: tableProduct.committedStock,
    calculatedStock: tableProduct.calculatedStock,
    createdBy: tableProduct.createdBy,
    modifiedBy: tableProduct.modifiedBy,
    productionOrders: tableProduct.productionOrders,
    category: tableProduct.category,
    boms: tableProduct.boms as any,
  };
}