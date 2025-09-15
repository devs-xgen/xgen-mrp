// utils/serialize-data.ts

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Recursively serializes an object to a plain JSON object, handling complex types like Decimal and Date.
 * @param data The data object to serialize.
 * @returns A new object with complex types converted to serializable formats.
 */

export function serializeData(data: any): any {
  if (data === null || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item));
  }

  const serialized: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      
      // Handle Prisma's Decimal type
      if (value instanceof Decimal) {
        serialized[key] = value.toNumber();
      } 
      // Handle Date objects
      else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } 
      // Recursively handle nested objects
      else if (typeof value === 'object') {
        serialized[key] = serializeData(value);
      } 
      // Handle all other primitive types
      else {
        serialized[key] = value;
      }
    }
  }
  return serialized;
}