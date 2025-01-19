import * as z from "zod"
import { Status } from "@prisma/client"

export const materialSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
    sku: z.string()
        .min(2, "SKU must be at least 2 characters")
        .max(50, "SKU must not exceed 50 characters")
        .regex(/^[A-Za-z0-9-_]+$/, "SKU can only contain letters, numbers, hyphens and underscores"),
    typeId: z.string()
        .min(1, "Material type is required"),
    unitOfMeasureId: z.string()
        .min(1, "Unit of measure is required"),
    notes: z.string()
        .max(1000, "Notes must not exceed 1000 characters")
        .optional()
        .nullable(),
    costPerUnit: z.number()
        .min(0, "Cost per unit must be greater than or equal to 0")
        .multipleOf(0.01, "Cost per unit must have at most 2 decimal places"),
    currentStock: z.number()
        .int("Current stock must be a whole number")
        .min(0, "Current stock must be greater than or equal to 0"),
    minimumStockLevel: z.number()
        .int("Minimum stock level must be a whole number")
        .min(0, "Minimum stock level must be greater than or equal to 0"),
    leadTime: z.number()
        .int("Lead time must be a whole number")
        .min(0, "Lead time must be greater than or equal to 0"),
    supplierId: z.string()
        .min(1, "Supplier is required"),
    status: z.nativeEnum(Status)
        .default(Status.ACTIVE),
})

export type MaterialFormValues = z.infer<typeof materialSchema>

// Schema for updating material, making all fields optional
export const materialUpdateSchema = materialSchema.partial()

// Schema for bulk operations
export const materialBulkOperationSchema = z.object({
    ids: z.array(z.string()).min(1, "Select at least one material"),
    operation: z.enum(["delete", "archive", "activate"]),
})

// Schema for updating material stock
export const materialStockUpdateSchema = z.object({
    id: z.string(),
    quantity: z.number().int(),
    type: z.enum(["increment", "decrement", "set"]),
    notes: z.string().optional(),
    operationType: z.enum(["manual", "purchase", "production", "return", "adjustment"]),
})

// Type for material with relations
export interface MaterialWithRelations extends z.infer<typeof materialSchema> {
    id: string
    createdAt: Date
    updatedAt: Date
    createdBy?: string | null
    modifiedBy?: string | null
    type: {
        id: string
        name: string
    }
    unitOfMeasure: {
        id: string
        name: string
        symbol: string
    }
    supplier: {
        id: string
        name: string
    }
}