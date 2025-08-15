import { z } from "zod";

// Base schema without refinements (for .pick() operations)
const baseProductionCreateSchema = z.object({
  // Step 1: Source
  source: z.enum(["standalone", "customer_order"]),
  
  // Step 2a: Customer Order (if source = customer_order)
  customerId: z.string().optional(),
  customerOrderId: z.string().optional(),
  orderLineId: z.string().optional(), // For future use
  
  // Step 2b/3: Product & Variant
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().optional(),
  
  // Step 4: Details
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]),
  notes: z.string().optional(),
  
  // Step 5: Options
  generateBOM: z.boolean().default(false),
  reserveMaterials: z.boolean().default(false),
});

// Main schema with refinements
export const productionCreateSchema = baseProductionCreateSchema.refine((data) => {
  // Validate dates
  const startDate = new Date(data.startDate);
  const dueDate = new Date(data.dueDate);
  return dueDate > startDate;
}, {
  message: "Due date must be after start date",
  path: ["dueDate"],
}).refine((data) => {
  // If source is customer_order, require customerId and customerOrderId
  if (data.source === "customer_order") {
    return data.customerId && data.customerOrderId;
  }
  return true;
}, {
  message: "Customer and order are required when linking to customer order",
  path: ["customerOrderId"],
});

export type ProductionCreateForm = z.infer<typeof baseProductionCreateSchema>;

// Individual step schemas for validation (using base schema for .pick())
export const sourceStepSchema = baseProductionCreateSchema.pick({
  source: true,
});

export const customerOrderStepSchema = baseProductionCreateSchema.pick({
  customerId: true,
  customerOrderId: true,
  orderLineId: true,
});

export const productStepSchema = baseProductionCreateSchema.pick({
  productId: true,
});

export const variantStepSchema = baseProductionCreateSchema.pick({
  productVariantId: true,
});

export const detailsStepSchema = baseProductionCreateSchema.pick({
  quantity: true,
  startDate: true,
  dueDate: true,
  priority: true,
  notes: true,
});

export const optionsStepSchema = baseProductionCreateSchema.pick({
  generateBOM: true,
  reserveMaterials: true,
});
