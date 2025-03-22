// src/types/admin/product.ts

export interface Product {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number; // Use this as unitPrice
    description?: string | null;
    status: string;
    // Other properties can be optional
    categoryId?: string;
    currentStock?: number;
    minimumStockLevel?: number;
    leadTime?: number;
    // Add any other properties you need
  }
  
  export interface ProductForOrder {
    id: string;
    name: string;
    unitPrice: number; // This is what CreateCustomerOrderDialog expects
  }