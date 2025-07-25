import { Decimal } from '@prisma/client/runtime/library';

/**
 * Serializable representation of a Decimal value
 */
export interface SerializableDecimal {
  value: string;
  precision: number;
}

/**
 * Type helper to convert Decimal fields to serializable strings
 */
export type SerializableData<T> = {
  [K in keyof T]: T[K] extends Decimal
    ? string
    : T[K] extends Decimal | null
    ? string | null
    : T[K] extends Decimal | undefined
    ? string | undefined
    : T[K] extends Array<infer U>
    ? Array<SerializableData<U>>
    : T[K] extends object
    ? SerializableData<T[K]>
    : T[K];
};

/**
 * Converts a Prisma Decimal object to a serializable string
 * @param decimal - The Decimal object to serialize
 * @returns The decimal value as a string, or null if input is null/undefined
 */
export function serializeDecimal(decimal: Decimal | null | undefined): string | null {
  if (decimal === null || decimal === undefined) {
    return null;
  }
  
  if (decimal instanceof Decimal) {
    return decimal.toString();
  }
  
  // Handle case where decimal might already be a string
  if (typeof decimal === 'string') {
    return decimal;
  }
  
  // Handle case where decimal might be a number
  if (typeof decimal === 'number') {
    return decimal.toString();
  }
  
  throw new Error(`Invalid decimal value: ${decimal}`);
}

/**
 * Converts a serialized decimal string back to a Prisma Decimal object
 * @param value - The string value to deserialize
 * @returns A new Decimal object, or null if input is null/undefined
 */
export function deserializeDecimal(value: string | null | undefined): Decimal | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  try {
    return new Decimal(value);
  } catch (error) {
    throw new Error(`Failed to deserialize decimal value "${value}": ${error}`);
  }
}

/**
 * Recursively serializes all Decimal objects in a data structure to strings
 * @param data - The data object containing Decimal fields
 * @returns A new object with all Decimal fields converted to strings
 */
export function serializeDecimals<T>(data: T): SerializableData<T> {
  if (data === null || data === undefined) {
    return data as SerializableData<T>;
  }
  
  if (data instanceof Decimal) {
    return serializeDecimal(data) as SerializableData<T>;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeDecimals(item)) as SerializableData<T>;
  }
  
  if (typeof data === 'object' && data.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeDecimals(value);
    }
    return result as SerializableData<T>;
  }
  
  return data as SerializableData<T>;
}

/**
 * Recursively deserializes all string decimal values back to Decimal objects
 * @param data - The serialized data object
 * @param decimalFields - Array of field names that should be converted back to Decimal
 * @returns A new object with specified fields converted back to Decimal objects
 */
export function deserializeDecimals<T>(
  data: SerializableData<T>,
  decimalFields: string[]
): T {
  if (data === null || data === undefined) {
    return data as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => deserializeDecimals(item, decimalFields)) as T;
  }
  
  if (typeof data === 'object' && data.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (decimalFields.includes(key) && typeof value === 'string') {
        result[key] = deserializeDecimal(value);
      } else if (typeof value === 'object') {
        result[key] = deserializeDecimals(value, decimalFields);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
  
  return data as T;
}

/**
 * Predefined decimal field mappings for common billing entities
 */
export const BILLING_DECIMAL_FIELDS = {
  billingStatement: [
    'totalAmount',
    'taxAmount',
    'discountAmount',
    'netAmount'
  ],
  salesInvoice: [
    'subtotal',
    'taxRate',
    'taxAmount',
    'discountAmount',
    'totalAmount'
  ],
  salesInvoiceItem: [
    'quantity',
    'unitPrice',
    'totalPrice',
    'discountPercent'
  ],
  product: [
    'unitCost',
    'sellingPrice'
  ],
  productVariant: [
    'unitCost',
    'sellingPrice'
  ],
  material: [
    'costPerUnit'
  ],
  productionOrder: [
    'plannedMaterialCost',
    'actualMaterialCost',
    'materialVariance'
  ]
} as const;

/**
 * Helper function to serialize billing statement data
 */
export function serializeBillingStatement<T extends Record<string, any>>(
  statement: T
): SerializableData<T> {
  return serializeDecimals(statement);
}

/**
 * Helper function to serialize sales invoice data
 */
export function serializeSalesInvoice<T extends Record<string, any>>(
  invoice: T
): SerializableData<T> {
  return serializeDecimals(invoice);
}

/**
 * Helper function to serialize sales invoice item data
 */
export function serializeSalesInvoiceItem<T extends Record<string, any>>(
  item: T
): SerializableData<T> {
  return serializeDecimals(item);
}

/**
 * Utility function to format decimal values for display
 * @param decimal - The decimal value to format
 * @param decimalPlaces - Number of decimal places to show (default: 2)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted string representation
 */
export function formatDecimal(
  decimal: Decimal | string | null | undefined,
  decimalPlaces: number = 2,
  locale: string = 'en-US'
): string {
  if (decimal === null || decimal === undefined) {
    return '0.00';
  }
  
  const value = decimal instanceof Decimal ? decimal.toNumber() : parseFloat(decimal.toString());
  
  if (isNaN(value)) {
    return '0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
}

/**
 * Utility function to format currency values
 * @param decimal - The decimal value to format as currency
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  decimal: Decimal | string | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (decimal === null || decimal === undefined) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(0);
  }
  
  const value = decimal instanceof Decimal ? decimal.toNumber() : parseFloat(decimal.toString());
  
  if (isNaN(value)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(0);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}