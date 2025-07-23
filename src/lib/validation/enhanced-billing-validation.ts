import { z } from "zod";
import { BillingTypeId } from "@/types/admin/billing-types";

// Enhanced billing statement schema with conditional validation
export const enhancedBillingStatementSchema = z.object({
  // Billing type selection (required)
  billingType: z.enum(['direct-customer', 'customer-order', 'manual-customer'], {
    required_error: "Please select a billing type",
    invalid_type_error: "Invalid billing type selected"
  }),

  // Customer information (conditionally required based on billing type)
  customerName: z.string().min(1, "Customer name is required"),
  customerId: z.string().optional(),
  customerOrderId: z.string().optional(),
  productionOrderId: z.string().optional(),

  // Manual customer details (for manual-customer billing type)
  manualCustomerDetails: z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),

  // Financial information
  subtotal: z.number().min(0, "Subtotal must be positive"),
  taxRate: z.number().min(0, "Tax rate must be positive").max(100, "Tax rate cannot exceed 100%"),
  discountAmount: z.number().min(0, "Discount amount must be positive"),

  // Payment terms
  paymentTerms: z.string().optional(),
  dueDate: z.date().optional(),

  // Invoice items
  invoiceItems: z.array(
    z.object({
      productId: z.string().optional(),
      materialId: z.string().optional(),
      inventoryItemId: z.string().optional(),
      description: z.string().min(1, "Item description is required"),
      quantity: z.number().min(0.001, "Quantity must be greater than 0"),
      unitPrice: z.number().min(0, "Unit price must be positive"),
      productCode: z.string().optional(),
      unit: z.string().optional(),
      discountPercent: z.number().min(0, "Discount percent must be positive").max(100, "Discount percent cannot exceed 100%").optional(),
      taxable: z.boolean().default(true),
    })
  ).min(1, "At least one invoice item is required"),

  // Additional details
  notes: z.string().optional(),
  poNumber: z.string().optional(),
  terms: z.string().optional(),
  footerNotes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation based on billing type
  switch (data.billingType) {
    case 'direct-customer':
      if (!data.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a customer from the database",
          path: ['customerId']
        });
      }
      break;

    case 'customer-order':
      if (!data.customerOrderId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a customer order",
          path: ['customerOrderId']
        });
      }
      break;

    case 'manual-customer':
      if (!data.customerName || data.customerName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a customer name",
          path: ['customerName']
        });
      }
      // Validate manual customer details if provided
      if (data.manualCustomerDetails?.email && data.manualCustomerDetails.email.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.manualCustomerDetails.email)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid email address",
            path: ['manualCustomerDetails', 'email']
          });
        }
      }
      break;
  }

  // Validate invoice items calculations
  data.invoiceItems.forEach((item, index) => {
    if (item.discountPercent && item.discountPercent > 0) {
      const discountAmount = (item.unitPrice * item.quantity * item.discountPercent) / 100;
      const itemTotal = (item.unitPrice * item.quantity) - discountAmount;
      
      if (itemTotal < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount cannot exceed item total",
          path: ['invoiceItems', index, 'discountPercent']
        });
      }
    }
  });

  // Validate financial calculations
  const calculatedSubtotal = data.invoiceItems.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    const discountAmount = item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0;
    return sum + (itemTotal - discountAmount);
  }, 0);

  // Allow for small rounding differences (within 0.01)
  if (Math.abs(data.subtotal - calculatedSubtotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Subtotal does not match calculated item totals",
      path: ['subtotal']
    });
  }

  // Validate discount amount doesn't exceed subtotal
  if (data.discountAmount > data.subtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Discount amount cannot exceed subtotal",
      path: ['discountAmount']
    });
  }
});

// Step-specific validation schemas
export const billingTypeSelectionSchema = z.object({
  billingType: z.enum(['direct-customer', 'customer-order', 'manual-customer'], {
    required_error: "Please select a billing type",
  }),
});

export const customerInformationSchema = z.object({
  billingType: z.enum(['direct-customer', 'customer-order', 'manual-customer']),
  customerName: z.string().min(1, "Customer name is required"),
  customerId: z.string().optional(),
  customerOrderId: z.string().optional(),
  manualCustomerDetails: z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  // Apply the same conditional validation as the main schema
  switch (data.billingType) {
    case 'direct-customer':
      if (!data.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a customer from the database",
          path: ['customerId']
        });
      }
      break;

    case 'customer-order':
      if (!data.customerOrderId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a customer order",
          path: ['customerOrderId']
        });
      }
      break;

    case 'manual-customer':
      if (!data.customerName || data.customerName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a customer name",
          path: ['customerName']
        });
      }
      break;
  }
});

export const billingDetailsSchema = z.object({
  subtotal: z.number().min(0, "Subtotal must be positive"),
  taxRate: z.number().min(0, "Tax rate must be positive").max(100, "Tax rate cannot exceed 100%"),
  discountAmount: z.number().min(0, "Discount amount must be positive"),
  paymentTerms: z.string().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  poNumber: z.string().optional(),
  terms: z.string().optional(),
  footerNotes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate discount amount doesn't exceed subtotal
  if (data.discountAmount > data.subtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Discount amount cannot exceed subtotal",
      path: ['discountAmount']
    });
  }
});

export const invoiceItemsSchema = z.object({
  invoiceItems: z.array(
    z.object({
      productId: z.string().optional(),
      materialId: z.string().optional(),
      inventoryItemId: z.string().optional(),
      description: z.string().min(1, "Item description is required"),
      quantity: z.number().min(0.001, "Quantity must be greater than 0"),
      unitPrice: z.number().min(0, "Unit price must be positive"),
      productCode: z.string().optional(),
      unit: z.string().optional(),
      discountPercent: z.number().min(0, "Discount percent must be positive").max(100, "Discount percent cannot exceed 100%").optional(),
      taxable: z.boolean().default(true),
    })
  ).min(1, "At least one invoice item is required"),
}).superRefine((data, ctx) => {
  // Validate each invoice item
  data.invoiceItems.forEach((item, index) => {
    if (item.discountPercent && item.discountPercent > 0) {
      const discountAmount = (item.unitPrice * item.quantity * item.discountPercent) / 100;
      const itemTotal = (item.unitPrice * item.quantity) - discountAmount;
      
      if (itemTotal < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount cannot exceed item total",
          path: ['invoiceItems', index, 'discountPercent']
        });
      }
    }
  });
});

// Validation helper functions
export function validateBillingTypeStep(billingType?: BillingTypeId): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!billingType) {
    errors.push("Please select a billing type");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCustomerInformationStep(
  billingType: BillingTypeId,
  customerName: string,
  customerId?: string,
  customerOrderId?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (billingType) {
    case 'direct-customer':
      if (!customerId) {
        errors.push("Please select a customer from the database");
      }
      break;
    case 'customer-order':
      if (!customerOrderId) {
        errors.push("Please select a customer order");
      }
      break;
    case 'manual-customer':
      if (!customerName || customerName.trim().length === 0) {
        errors.push("Please enter a customer name");
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateInvoiceItemsStep(invoiceItems: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!invoiceItems || invoiceItems.length === 0) {
    errors.push("At least one invoice item is required");
    return { isValid: false, errors };
  }
  
  const validItems = invoiceItems.filter(item => 
    item.description && 
    item.description.trim().length > 0 && 
    item.quantity > 0 && 
    item.unitPrice >= 0
  );
  
  if (validItems.length === 0) {
    errors.push("At least one valid invoice item is required");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Type exports
export type EnhancedBillingStatementFormData = z.infer<typeof enhancedBillingStatementSchema>;
export type BillingTypeSelectionData = z.infer<typeof billingTypeSelectionSchema>;
export type CustomerInformationData = z.infer<typeof customerInformationSchema>;
export type BillingDetailsData = z.infer<typeof billingDetailsSchema>;
export type InvoiceItemsData = z.infer<typeof invoiceItemsSchema>;