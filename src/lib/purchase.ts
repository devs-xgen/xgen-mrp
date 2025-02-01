import * as z from "zod";
import { Status } from "@prisma/client";

export const PurchaseOrderLineSchema = z.object({
  poId: z.string().min(1, "Purchase Order ID is required"),
  materialId: z.string().min(1, "Material is required"),
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

export type PurchaseOrderLineFormValues = z.infer<typeof PurchaseOrderLineSchema>;

// Schema for updating purchase order line, making all fields optional
export const purchaseOrderLineUpdateSchema = PurchaseOrderLineSchema.partial();

// Type for purchase order line with relations
export interface PurchaseOrderLineWithRelations extends z.infer<typeof PurchaseOrderLineSchema> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  material: {
    id: string;
    name: string;
  };
  purchaseOrder: {
    id: string;
    poNumber: string;
  };
}
