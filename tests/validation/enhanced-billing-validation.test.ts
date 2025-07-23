import { describe, it, expect } from 'vitest';
import {
  enhancedBillingStatementSchema,
  billingTypeSelectionSchema,
  customerInformationSchema,
  billingDetailsSchema,
  invoiceItemsSchema,
  validateBillingTypeStep,
  validateCustomerInformationStep,
  validateInvoiceItemsStep,
} from '@/lib/validation/enhanced-billing-validation';
import { BillingTypeId } from '@/types/admin/billing-types';

describe('Enhanced Billing Validation', () => {
  describe('billingTypeSelectionSchema', () => {
    it('should validate valid billing type', () => {
      const validData = { billingType: 'direct-customer' as BillingTypeId };
      const result = billingTypeSelectionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid billing type', () => {
      const invalidData = { billingType: 'invalid-type' };
      const result = billingTypeSelectionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require billing type', () => {
      const emptyData = {};
      const result = billingTypeSelectionSchema.safeParse(emptyData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Please select a billing type');
      }
    });
  });

  describe('customerInformationSchema', () => {
    it('should validate direct customer billing with customerId', () => {
      const validData = {
        billingType: 'direct-customer' as BillingTypeId,
        customerName: 'Test Customer',
        customerId: 'customer-123',
      };
      const result = customerInformationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject direct customer billing without customerId', () => {
      const invalidData = {
        billingType: 'direct-customer' as BillingTypeId,
        customerName: 'Test Customer',
      };
      const result = customerInformationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate customer order billing with customerOrderId', () => {
      const validData = {
        billingType: 'customer-order' as BillingTypeId,
        customerName: 'Test Customer',
        customerOrderId: 'order-123',
      };
      const result = customerInformationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject customer order billing without customerOrderId', () => {
      const invalidData = {
        billingType: 'customer-order' as BillingTypeId,
        customerName: 'Test Customer',
      };
      const result = customerInformationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate manual customer billing with just customerName', () => {
      const validData = {
        billingType: 'manual-customer' as BillingTypeId,
        customerName: 'Test Customer',
      };
      const result = customerInformationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject manual customer billing with empty customerName', () => {
      const invalidData = {
        billingType: 'manual-customer' as BillingTypeId,
        customerName: '',
      };
      const result = customerInformationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate manual customer details with valid email', () => {
      const validData = {
        billingType: 'manual-customer' as BillingTypeId,
        customerName: 'Test Customer',
        manualCustomerDetails: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '123-456-7890',
        },
      };
      const result = customerInformationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject manual customer details with invalid email', () => {
      const invalidData = {
        billingType: 'manual-customer' as BillingTypeId,
        customerName: 'Test Customer',
        manualCustomerDetails: {
          name: 'Test Customer',
          email: 'invalid-email',
        },
      };
      const result = customerInformationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('billingDetailsSchema', () => {
    it('should validate valid billing details', () => {
      const validData = {
        subtotal: 100,
        taxRate: 12,
        discountAmount: 10,
        paymentTerms: 'Net 30',
        notes: 'Test notes',
      };
      const result = billingDetailsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative subtotal', () => {
      const invalidData = {
        subtotal: -100,
        taxRate: 12,
        discountAmount: 0,
      };
      const result = billingDetailsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject tax rate over 100%', () => {
      const invalidData = {
        subtotal: 100,
        taxRate: 150,
        discountAmount: 0,
      };
      const result = billingDetailsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject discount amount exceeding subtotal', () => {
      const invalidData = {
        subtotal: 100,
        taxRate: 12,
        discountAmount: 150,
      };
      const result = billingDetailsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('invoiceItemsSchema', () => {
    it('should validate valid invoice items', () => {
      const validData = {
        invoiceItems: [
          {
            description: 'Test Item',
            quantity: 2,
            unitPrice: 50,
            taxable: true,
          },
        ],
      };
      const result = invoiceItemsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty invoice items array', () => {
      const invalidData = {
        invoiceItems: [],
      };
      const result = invoiceItemsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject items with empty description', () => {
      const invalidData = {
        invoiceItems: [
          {
            description: '',
            quantity: 2,
            unitPrice: 50,
            taxable: true,
          },
        ],
      };
      const result = invoiceItemsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject items with zero quantity', () => {
      const invalidData = {
        invoiceItems: [
          {
            description: 'Test Item',
            quantity: 0,
            unitPrice: 50,
            taxable: true,
          },
        ],
      };
      const result = invoiceItemsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject items with negative unit price', () => {
      const invalidData = {
        invoiceItems: [
          {
            description: 'Test Item',
            quantity: 2,
            unitPrice: -50,
            taxable: true,
          },
        ],
      };
      const result = invoiceItemsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject items with discount exceeding item total', () => {
      const invalidData = {
        invoiceItems: [
          {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 100,
            discountPercent: 150, // 150% discount
            taxable: true,
          },
        ],
      };
      const result = invoiceItemsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('enhancedBillingStatementSchema', () => {
    it('should validate complete valid form data', () => {
      const validData = {
        billingType: 'direct-customer' as BillingTypeId,
        customerName: 'Test Customer',
        customerId: 'customer-123',
        subtotal: 100,
        taxRate: 12,
        discountAmount: 10,
        invoiceItems: [
          {
            description: 'Test Item',
            quantity: 2,
            unitPrice: 50,
            taxable: true,
          },
        ],
      };
      const result = enhancedBillingStatementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate subtotal calculation accuracy', () => {
      const validData = {
        billingType: 'direct-customer' as BillingTypeId,
        customerName: 'Test Customer',
        customerId: 'customer-123',
        subtotal: 100, // Should match calculated total
        taxRate: 12,
        discountAmount: 0,
        invoiceItems: [
          {
            description: 'Test Item 1',
            quantity: 2,
            unitPrice: 30, // 2 * 30 = 60
            taxable: true,
          },
          {
            description: 'Test Item 2',
            quantity: 1,
            unitPrice: 40, // 1 * 40 = 40
            taxable: true,
          },
          // Total should be 60 + 40 = 100
        ],
      };
      const result = enhancedBillingStatementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject subtotal that does not match calculated total', () => {
      const invalidData = {
        billingType: 'direct-customer' as BillingTypeId,
        customerName: 'Test Customer',
        customerId: 'customer-123',
        subtotal: 200, // Does not match calculated total of 100
        taxRate: 12,
        discountAmount: 0,
        invoiceItems: [
          {
            description: 'Test Item 1',
            quantity: 2,
            unitPrice: 30, // 2 * 30 = 60
            taxable: true,
          },
          {
            description: 'Test Item 2',
            quantity: 1,
            unitPrice: 40, // 1 * 40 = 40
            taxable: true,
          },
          // Total should be 60 + 40 = 100, but subtotal is 200
        ],
      };
      const result = enhancedBillingStatementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateBillingTypeStep', () => {
      it('should return valid for valid billing type', () => {
        const result = validateBillingTypeStep('direct-customer');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return invalid for undefined billing type', () => {
        const result = validateBillingTypeStep(undefined);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Please select a billing type');
      });
    });

    describe('validateCustomerInformationStep', () => {
      it('should validate direct customer with customerId', () => {
        const result = validateCustomerInformationStep(
          'direct-customer',
          'Test Customer',
          'customer-123'
        );
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject direct customer without customerId', () => {
        const result = validateCustomerInformationStep(
          'direct-customer',
          'Test Customer'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Please select a customer from the database');
      });

      it('should validate customer order with customerOrderId', () => {
        const result = validateCustomerInformationStep(
          'customer-order',
          'Test Customer',
          undefined,
          'order-123'
        );
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject customer order without customerOrderId', () => {
        const result = validateCustomerInformationStep(
          'customer-order',
          'Test Customer'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Please select a customer order');
      });

      it('should validate manual customer with customerName', () => {
        const result = validateCustomerInformationStep(
          'manual-customer',
          'Test Customer'
        );
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject manual customer with empty customerName', () => {
        const result = validateCustomerInformationStep(
          'manual-customer',
          ''
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Please enter a customer name');
      });
    });

    describe('validateInvoiceItemsStep', () => {
      it('should validate valid invoice items', () => {
        const items = [
          {
            description: 'Test Item',
            quantity: 2,
            unitPrice: 50,
          },
        ];
        const result = validateInvoiceItemsStep(items);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty invoice items', () => {
        const result = validateInvoiceItemsStep([]);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('At least one invoice item is required');
      });

      it('should reject items without valid data', () => {
        const items = [
          {
            description: '',
            quantity: 0,
            unitPrice: -10,
          },
        ];
        const result = validateInvoiceItemsStep(items);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('At least one valid invoice item is required');
      });
    });
  });
});