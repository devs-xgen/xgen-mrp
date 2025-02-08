import * as z from "zod";
import { Status } from "@prisma/client";

export const workCenterSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
    code: z.string()
        .min(2, "Code must be at least 2 characters")
        .max(50, "Code must not exceed 50 characters")
        .regex(/^[A-Za-z0-9-_]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
    location: z.string()
        .min(2, "Location must be at least 2 characters")
        .max(255, "Location must not exceed 255 characters"),
    capacity: z.number()
        .int("Capacity must be a whole number")
        .min(1, "Capacity must be at least 1"),
    unitOfMeasureId: z.string()
        .min(1, "Unit of measure is required"),
    notes: z.string()
        .max(1000, "Notes must not exceed 1000 characters")
        .optional()
        .nullable(),
    status: z.nativeEnum(Status)
        .default(Status.ACTIVE),
});

export type WorkCenterFormValues = z.infer<typeof workCenterSchema>;

// Schema for updating work center, making all fields optional
export const workCenterUpdateSchema = workCenterSchema.partial();

// Schema for bulk operations
export const workCenterBulkOperationSchema = z.object({
    ids: z.array(z.string()).min(1, "Select at least one work center"),
    operation: z.enum(["delete", "archive", "activate"]),
});

// Type for work center with relations
export interface WorkCenterWithRelations extends z.infer<typeof workCenterSchema> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string | null;
    modifiedBy?: string | null;
}
