import { Status } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface CustomerOrder {
  [x: string]: number;
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: Date;
  deliveryDate: Date;
  status: Status;
  totalAmount: Decimal;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  orderLines: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: Decimal;
    status: Status;
    product: {
      id: string;
      name: string;
      sku: string;
      stock: number;
      unitOfMeasure: {
        symbol: string;
      };
    };
  }>;
}

export interface CustomerOrderLine {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: Decimal;
  status: Status;
  notes?: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    unitOfMeasure: {
      symbol: string;
    };
  };
}

export interface CreateCustomerOrderInput {
  [x: string]: any;
  customerId: string;
  deliveryDate: Date;
  notes?: string;
  orderLines: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateCustomerOrderInput {
  id: string;
  deliveryDate?: Date;
  status?: Status;
  notes?: string;
}
