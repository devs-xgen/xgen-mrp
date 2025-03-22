// src/types/admin/customer-order.ts
import { Status } from "@prisma/client";

export interface Customer {
  id: string;
  name: string;
  email?: string;
}

export interface OrderLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  status: Status;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: Date;
  requiredDate: Date;
  status: Status;
  totalAmount: number;
  notes?: string | null;
  customer: Customer;
  orderLines: OrderLine[];
}

export interface CreateCustomerOrderInput {
  customerId: string;
  orderDate: Date;
  requiredDate: Date;
  deliveryDate?: Date;
  notes?: string;
  orderLines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}