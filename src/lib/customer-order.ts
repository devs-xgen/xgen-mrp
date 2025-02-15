import * as z from "zod";
import { Status } from "@prisma/client";

export const CustomerOrderLineSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  productId: z.string().min(1, "Product is required"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  unitPrice: z
    .number()
    .min(0.01, "Unit price must be greater than 0")
    .multipleOf(0.01, "Unit price must have at most 2 decimal places"),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional().nullable(),
  createdBy: z.string().optional().nullable(),
  modifiedBy: z.string().optional().nullable(),
});

export type CustomerOrderLineFormValues = z.infer<typeof CustomerOrderLineSchema>;

// Schema for updating customer order line, making all fields optional
export const customerOrderLineUpdateSchema = CustomerOrderLineSchema.partial();

// Type for customer order line with relations
export interface CustomerOrderLineWithRelations extends z.infer<typeof CustomerOrderLineSchema> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
  };
  customerOrder: {
    id: string;
    orderNumber: string;
  };
}
