import { describe, it, expect } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import {
  serializeDecimal,
  deserializeDecimal,
  serializeDecimals,
  deserializeDecimals,
  serializeBillingStatement,
  serializeSalesInvoice,
  serializeSalesInvoiceItem,
  formatDecimal,
  formatCurrency,
  BILLING_DECIMAL_FIELDS,
  type SerializableData
} from '../../src/lib/utils/decimal-serializer';

describe('Decimal Serializer', () => {
  describe('serializeDecimal', () => {
    it('should serialize a Decimal object to string', () => {
      const decimal = new Decimal('123.45');
      const result = serializeDecimal(decimal);
      expect(result).toBe('123.45');
    });

    it('should handle null values', () => {
      const result = serializeDecimal(null);
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = serializeDecimal(undefined);
      expect(result).toBeNull();
    });

    it('should handle string values', () => {
      const result = serializeDecimal('123.45');
      expect(result).toBe('123.45');
    });

    it('should handle number values', () => {
      const result = serializeDecimal(123.45);
      expect(result).toBe('123.45');
    });

    it('should handle large decimal values', () => {
      const decimal = new Decimal('999999999.99');
      const result = serializeDecimal(decimal);
      expect(result).toBe('999999999.99');
    });

    it('should handle small decimal values', () => {
      const decimal = new Decimal('0.001');
      const result = serializeDecimal(decimal);
      expect(result).toBe('0.001');
    });

    it('should handle negative decimal values', () => {
      const decimal = new Decimal('-123.45');
      const result = serializeDecimal(decimal);
      expect(result).toBe('-123.45');
    });

    it('should throw error for invalid values', () => {
      expect(() => serializeDecimal({} as any)).toThrow('Invalid decimal value');
    });
  });

  describe('deserializeDecimal', () => {
    it('should deserialize a string to Decimal object', () => {
      const result = deserializeDecimal('123.45');
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('123.45');
    });

    it('should handle null values', () => {
      const result = deserializeDecimal(null);
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = deserializeDecimal(undefined);
      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = deserializeDecimal('');
      expect(result).toBeNull();
    });

    it('should handle large decimal values', () => {
      const result = deserializeDecimal('999999999.99');
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('999999999.99');
    });

    it('should handle small decimal values', () => {
      const result = deserializeDecimal('0.001');
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('0.001');
    });

    it('should handle negative decimal values', () => {
      const result = deserializeDecimal('-123.45');
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('-123.45');
    });

    it('should throw error for invalid string values', () => {
      expect(() => deserializeDecimal('invalid')).toThrow('Failed to deserialize decimal value');
    });
  });

  describe('serializeDecimals', () => {
    it('should serialize simple object with Decimal fields', () => {
      const data = {
        id: '1',
        amount: new Decimal('123.45'),
        name: 'Test'
      };

      const result = serializeDecimals(data);
      
      expect(result).toEqual({
        id: '1',
        amount: '123.45',
        name: 'Test'
      });
    });

    it('should serialize nested objects with Decimal fields', () => {
      const data = {
        id: '1',
        billing: {
          totalAmount: new Decimal('100.00'),
          taxAmount: new Decimal('10.00')
        },
        items: [
          {
            quantity: new Decimal('2.5'),
            unitPrice: new Decimal('40.00')
          }
        ]
      };

      const result = serializeDecimals(data);
      
      expect(result).toEqual({
        id: '1',
        billing: {
          totalAmount: '100',
          taxAmount: '10'
        },
        items: [
          {
            quantity: '2.5',
            unitPrice: '40'
          }
        ]
      });
    });

    it('should handle arrays of objects with Decimal fields', () => {
      const data = [
        { amount: new Decimal('100.00') },
        { amount: new Decimal('200.00') }
      ];

      const result = serializeDecimals(data);
      
      expect(result).toEqual([
        { amount: '100' },
        { amount: '200' }
      ]);
    });

    it('should handle null and undefined values', () => {
      const data = {
        validAmount: new Decimal('123.45'),
        nullAmount: null,
        undefinedAmount: undefined
      };

      const result = serializeDecimals(data);
      
      expect(result).toEqual({
        validAmount: '123.45',
        nullAmount: null,
        undefinedAmount: undefined
      });
    });

    it('should handle empty objects and arrays', () => {
      expect(serializeDecimals({})).toEqual({});
      expect(serializeDecimals([])).toEqual([]);
    });

    it('should handle primitive values', () => {
      expect(serializeDecimals('string')).toBe('string');
      expect(serializeDecimals(123)).toBe(123);
      expect(serializeDecimals(true)).toBe(true);
      expect(serializeDecimals(null)).toBeNull();
      expect(serializeDecimals(undefined)).toBeUndefined();
    });
  });

  describe('deserializeDecimals', () => {
    it('should deserialize specified fields back to Decimal objects', () => {
      const data = {
        id: '1',
        amount: '123.45',
        taxAmount: '10.00',
        name: 'Test'
      };

      const result = deserializeDecimals(data, ['amount', 'taxAmount']);
      
      expect(result.id).toBe('1');
      expect(result.name).toBe('Test');
      expect(result.amount).toBeInstanceOf(Decimal);
      expect(result.amount?.toString()).toBe('123.45');
      expect(result.taxAmount).toBeInstanceOf(Decimal);
      expect(result.taxAmount?.toString()).toBe('10');
    });

    it('should handle nested objects', () => {
      const data = {
        id: '1',
        billing: {
          totalAmount: '100.00',
          taxAmount: '10.00'
        }
      };

      const result = deserializeDecimals(data, ['totalAmount', 'taxAmount']);
      
      expect(result.billing.totalAmount).toBeInstanceOf(Decimal);
      expect(result.billing.taxAmount).toBeInstanceOf(Decimal);
    });

    it('should handle arrays', () => {
      const data = [
        { amount: '100.00' },
        { amount: '200.00' }
      ];

      const result = deserializeDecimals(data, ['amount']);
      
      expect(result[0].amount).toBeInstanceOf(Decimal);
      expect(result[1].amount).toBeInstanceOf(Decimal);
    });

    it('should handle null and undefined values', () => {
      expect(deserializeDecimals(null, [])).toBeNull();
      expect(deserializeDecimals(undefined, [])).toBeUndefined();
    });
  });

  describe('Billing-specific serializers', () => {
    it('should serialize billing statement data', () => {
      const statement = {
        id: '1',
        totalAmount: new Decimal('1000.00'),
        taxAmount: new Decimal('100.00'),
        discountAmount: new Decimal('50.00'),
        netAmount: new Decimal('1050.00'),
        customerName: 'Test Customer'
      };

      const result = serializeBillingStatement(statement);
      
      expect(result).toEqual({
        id: '1',
        totalAmount: '1000',
        taxAmount: '100',
        discountAmount: '50',
        netAmount: '1050',
        customerName: 'Test Customer'
      });
    });

    it('should serialize sales invoice data', () => {
      const invoice = {
        id: '1',
        subtotal: new Decimal('900.00'),
        taxRate: new Decimal('10.00'),
        taxAmount: new Decimal('90.00'),
        totalAmount: new Decimal('990.00'),
        invoiceNumber: 'INV-001'
      };

      const result = serializeSalesInvoice(invoice);
      
      expect(result).toEqual({
        id: '1',
        subtotal: '900',
        taxRate: '10',
        taxAmount: '90',
        totalAmount: '990',
        invoiceNumber: 'INV-001'
      });
    });

    it('should serialize sales invoice item data', () => {
      const item = {
        id: '1',
        quantity: new Decimal('2.5'),
        unitPrice: new Decimal('100.00'),
        totalPrice: new Decimal('250.00'),
        discountPercent: new Decimal('5.00'),
        description: 'Test Item'
      };

      const result = serializeSalesInvoiceItem(item);
      
      expect(result).toEqual({
        id: '1',
        quantity: '2.5',
        unitPrice: '100',
        totalPrice: '250',
        discountPercent: '5',
        description: 'Test Item'
      });
    });
  });

  describe('formatDecimal', () => {
    it('should format Decimal objects', () => {
      const decimal = new Decimal('123.456');
      expect(formatDecimal(decimal)).toBe('123.46');
      expect(formatDecimal(decimal, 3)).toBe('123.456');
    });

    it('should format string values', () => {
      expect(formatDecimal('123.456')).toBe('123.46');
      expect(formatDecimal('123.456', 1)).toBe('123.5');
    });

    it('should handle null and undefined', () => {
      expect(formatDecimal(null)).toBe('0.00');
      expect(formatDecimal(undefined)).toBe('0.00');
    });

    it('should handle invalid values', () => {
      expect(formatDecimal('invalid')).toBe('0.00');
    });

    it('should format with different locales', () => {
      const decimal = new Decimal('1234.56');
      expect(formatDecimal(decimal, 2, 'en-US')).toBe('1,234.56');
      expect(formatDecimal(decimal, 2, 'de-DE')).toBe('1.234,56');
    });
  });

  describe('formatCurrency', () => {
    it('should format Decimal objects as currency', () => {
      const decimal = new Decimal('123.45');
      expect(formatCurrency(decimal)).toBe('$123.45');
    });

    it('should format string values as currency', () => {
      expect(formatCurrency('123.45')).toBe('$123.45');
    });

    it('should handle different currencies', () => {
      const decimal = new Decimal('123.45');
      expect(formatCurrency(decimal, 'EUR')).toBe('€123.45');
      expect(formatCurrency(decimal, 'GBP')).toBe('£123.45');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
    });

    it('should handle invalid values', () => {
      expect(formatCurrency('invalid')).toBe('$0.00');
    });

    it('should format with different locales', () => {
      const decimal = new Decimal('1234.56');
      expect(formatCurrency(decimal, 'USD', 'en-US')).toBe('$1,234.56');
      // Use the actual output from the system
      const expectedEUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.56);
      expect(formatCurrency(decimal, 'EUR', 'de-DE')).toBe(expectedEUR);
    });
  });

  describe('BILLING_DECIMAL_FIELDS', () => {
    it('should contain correct field mappings', () => {
      expect(BILLING_DECIMAL_FIELDS.billingStatement).toEqual([
        'totalAmount',
        'taxAmount',
        'discountAmount',
        'netAmount'
      ]);

      expect(BILLING_DECIMAL_FIELDS.salesInvoice).toEqual([
        'subtotal',
        'taxRate',
        'taxAmount',
        'discountAmount',
        'totalAmount'
      ]);

      expect(BILLING_DECIMAL_FIELDS.salesInvoiceItem).toEqual([
        'quantity',
        'unitPrice',
        'totalPrice',
        'discountPercent'
      ]);
    });
  });

  describe('Round-trip serialization', () => {
    it('should maintain precision through serialize/deserialize cycle', () => {
      const originalData = {
        amount: new Decimal('123.456789'),
        price: new Decimal('999.99'),
        tax: new Decimal('0.001')
      };

      const serialized = serializeDecimals(originalData);
      const deserialized = deserializeDecimals(serialized, ['amount', 'price', 'tax']);

      expect(deserialized.amount?.toString()).toBe('123.456789');
      expect(deserialized.price?.toString()).toBe('999.99');
      expect(deserialized.tax?.toString()).toBe('0.001');
    });

    it('should handle complex nested structures', () => {
      const originalData = {
        billingStatement: {
          totalAmount: new Decimal('1000.00'),
          items: [
            {
              quantity: new Decimal('2.5'),
              unitPrice: new Decimal('400.00'),
              totalPrice: new Decimal('1000.00')
            }
          ]
        }
      };

      const serialized = serializeDecimals(originalData);
      const deserialized = deserializeDecimals(serialized, [
        'totalAmount', 'quantity', 'unitPrice', 'totalPrice'
      ]);

      expect(deserialized.billingStatement.totalAmount?.toString()).toBe('1000');
      expect(deserialized.billingStatement.items[0].quantity?.toString()).toBe('2.5');
      expect(deserialized.billingStatement.items[0].unitPrice?.toString()).toBe('400');
      expect(deserialized.billingStatement.items[0].totalPrice?.toString()).toBe('1000');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values', () => {
      const decimal = new Decimal('0');
      expect(serializeDecimal(decimal)).toBe('0');
      expect(deserializeDecimal('0')?.toString()).toBe('0');
    });

    it('should handle very large numbers', () => {
      const decimal = new Decimal('999999999999.99');
      const serialized = serializeDecimal(decimal);
      const deserialized = deserializeDecimal(serialized);
      expect(deserialized?.toString()).toBe('999999999999.99');
    });

    it('should handle very small numbers', () => {
      const decimal = new Decimal('0.000001');
      const serialized = serializeDecimal(decimal);
      const deserialized = deserializeDecimal(serialized);
      expect(deserialized?.toString()).toBe('0.000001');
    });

    it('should handle scientific notation', () => {
      const decimal = new Decimal('1e-6');
      const serialized = serializeDecimal(decimal);
      const deserialized = deserializeDecimal(serialized);
      expect(deserialized?.toString()).toBe('0.000001');
    });
  });
});