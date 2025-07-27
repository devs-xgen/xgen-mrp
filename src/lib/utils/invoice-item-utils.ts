import { SalesInvoiceItemFormData } from "@/types/admin/billing";

// Type for order line display (from customer-order types)
interface OrderLineForDisplay {
  id: string;
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure?: string | null;
  } | null;
  productVariant?: {
    id: string;
    displayName: string;
    sku: string;
    unitPrice?: number;
  } | null;
}

/**
 * Map customer order items to invoice items for billing
 */
export function mapOrderItemsToInvoiceItems(orderLines: OrderLineForDisplay[]): SalesInvoiceItemFormData[] {
  return orderLines.map((line) => {
    const product = line.product;
    const variant = line.productVariant;
    
    // Use variant information if available, otherwise use product information
    const description = variant 
      ? `${product?.name || 'Unknown Product'} (${variant.displayName})`
      : product?.name || 'Unknown Product';
    
    const productCode = variant?.sku || product?.sku || '';
    const unitPrice = variant?.unitPrice || line.unitPrice || 0;
    const unit = product?.unitOfMeasure || 'PCS';

    return {
      productId: line.productId,
      productVariantId: line.productVariantId,
      description,
      quantity: line.quantity,
      unitPrice,
      productCode,
      unit,
      discountPercent: 0, // Default discount
      taxable: true, // Default taxable
    };
  });
}

/**
 * Calculate item total with discount
 */
export function calculateItemTotal(item: SalesInvoiceItemFormData): number {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = item.discountPercent ? (subtotal * item.discountPercent) / 100 : 0;
  return subtotal - discountAmount;
}

/**
 * Calculate total for multiple items
 */
export function calculateItemsTotal(items: SalesInvoiceItemFormData[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

/**
 * Validate invoice item
 */
export function validateInvoiceItem(item: SalesInvoiceItemFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!item.description || item.description.trim().length === 0) {
    errors.push("Description is required");
  }
  
  if (item.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }
  
  if (item.unitPrice < 0) {
    errors.push("Unit price cannot be negative");
  }
  
  if (item.discountPercent && (item.discountPercent < 0 || item.discountPercent > 100)) {
    errors.push("Discount must be between 0% and 100%");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple invoice items
 */
export function validateInvoiceItems(items: SalesInvoiceItemFormData[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (items.length === 0) {
    errors.push("At least one invoice item is required");
    return { isValid: false, errors };
  }

  const validItems = items.filter(item => {
    const validation = validateInvoiceItem(item);
    return validation.isValid;
  });

  if (validItems.length === 0) {
    errors.push("At least one valid invoice item is required");
  }

  items.forEach((item, index) => {
    const validation = validateInvoiceItem(item);
    validation.errors.forEach(error => {
      errors.push(`Item ${index + 1}: ${error}`);
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}