import { z } from "zod";

// Order line validation schema for editing (includes id for existing lines)
export const orderLineEditSchema = z.object({
  id: z.string().optional(), // Optional for new lines, required for existing lines
  productId: z.string().min(1, "Product is required"),
  productVariantId: z
    .union([
      z.string().min(1, "Invalid variant ID"),
      z.literal(""), // Allow empty string meaning no variant selected
      z.null(), // Allow null to represent no variant
      z.undefined(), // Also allow undefined as optional
    ])
    .optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  status: z.string().optional(),
  notes: z.string().optional(),
});

// Main customer order edit schema
export const customerOrderEditSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().min(1, "Order date is required"),
  requiredDate: z.string().min(1, "Required date is required"),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "ACTIVE",
  ]),
  orderLines: z
    .array(orderLineEditSchema)
    .min(1, "At least one order line is required"),
});

export type CustomerOrderEditForm = z.infer<typeof customerOrderEditSchema>;
export type OrderLineEditForm = z.infer<typeof orderLineEditSchema>;

// Input type for the API
export interface UpdateCustomerOrderInput {
  id: string;
  customerId: string;
  orderDate: string;
  requiredDate: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  status: string;
  totalAmount: number;
  orderLines: Array<{
    id?: string;
    productId: string;
    productVariantId?: string | null;
    quantity: number;
    unitPrice: number;
    status?: string;
    notes?: string;
  }>;
}
