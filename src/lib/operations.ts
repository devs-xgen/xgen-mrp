import * as z from "zod";
import { Status } from "@prisma/client";

export const operationSchema = z.object({
    workCenterId: z.string()
        .min(1, "Work center ID is required"),
    productionOrderId: z.string()
        .min(1, "Production order ID is required"),
    startTime: z.date(),
    endTime: z.date(),
    status: z.nativeEnum(Status)
        .default(Status.ACTIVE),
    notes: z.string()
        .max(1000, "Notes must not exceed 1000 characters")
        .optional()
        .nullable(),
});

export type OperationFormValues = z.infer<typeof operationSchema>;

// Schema for updating operation, making all fields optional
export const operationUpdateSchema = operationSchema.partial();

// Schema for bulk operations
export const operationBulkOperationSchema = z.object({
    ids: z.array(z.string()).min(1, "Select at least one operation"),
    operation: z.enum(["delete", "archive", "activate"]),
});

// Type for operation with relations
export interface OperationWithRelations extends z.infer<typeof operationSchema> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string | null;
    modifiedBy?: string | null;
}
