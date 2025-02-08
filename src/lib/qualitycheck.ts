import * as z from "zod";
import { Status } from "@prisma/client";

export const qualityCheckSchema = z.object({
    productionOrderId: z.string().min(1, "Production Order ID is required"),
    inspectorId: z.string().min(1, "Inspector ID is required"),
    checkDate: z.coerce.date(), // Ensures checkDate is a valid Date object
    status: z.nativeEnum(Status).default(Status.ACTIVE),
    defectsFound: z.string().max(1000, "Defects found must not exceed 1000 characters").optional().nullable(),
    actionTaken: z.string().max(1000, "Action taken must not exceed 1000 characters").optional().nullable(),
    notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional().nullable(),
});

// Schema for updating quality check, making all fields optional
export const qualityCheckUpdateSchema = qualityCheckSchema.partial();

// Type for `QualityCheck`
export type QualityCheckFormValues = z.infer<typeof qualityCheckSchema>;
