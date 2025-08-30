// import { z } from "zod";

// // Order line validation schema
// export const orderLineSchema = z.object({
//   productId: z.string().min(1, "Product is required"),
//   productVariantId: z.string().optional(),
//   quantity: z.number().min(1, "Quantity must be at least 1"),
//   unitPrice: z.number().min(0, "Unit price must be non-negative"),
// });

// // Main customer order creation schema
// export const customerOrderCreateSchema = z.object({
//   customerId: z.string().min(1, "Customer is required"),
//   requiredDate: z.string().min(1, "Required date is required"),
//   notes: z.string().optional(),
//   orderLines: z.array(orderLineSchema).min(1, "At least one order line is required"),
// });

// export type CustomerOrderCreateForm = z.infer<typeof customerOrderCreateSchema>;
// export type OrderLineForm = z.infer<typeof orderLineSchema>;

// // Input type for the API
// export interface CreateCustomerOrderInput {
//   customerId: string;
//   requiredDate: string;
//   notes?: string;
//   orderLines: Array<{
//     productId: string;
//     productVariantId?: string | null;
//     quantity: number;
//     unitPrice: number;
//   }>;
// }
import { z } from "zod";

// Order line validation schema
export const orderLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.union([
    z.string().min(1, "Invalid variant ID"),
    z.literal(""), // Allow empty string meaning no variant selected
    z.null(),     // Allow null to represent no variant
    z.undefined() // Also allow undefined as optional
  ]).optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

// Main customer order creation schema
export const customerOrderCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  requiredDate: z.string().min(1, "Required date is required"),
  notes: z.string().optional(),
  orderLines: z.array(orderLineSchema).min(1, "At least one order line is required"),
});

export type CustomerOrderCreateForm = z.infer<typeof customerOrderCreateSchema>;
export type OrderLineForm = z.infer<typeof orderLineSchema>;

// Input type for the API
export interface CreateCustomerOrderInput {
  customerId: string;
  requiredDate: string;
  notes?: string;
  orderLines: Array<{
    productId: string;
    productVariantId?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}
