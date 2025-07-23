import { describe, it, expect, vi } from 'vitest';
import {
  calculateTaxAmount,
  calculateTotalAmount,
  calculateDiscountPercent,
  calculateEffectiveTaxRate,
  validateCalculationField,
  validateAllCalculations,
  handleCalculationChange,
  recalculateAll,
  roundToDecimals,
  CalculationHandlers,
} from '@/components/module/admin/billing/summary/calculation-handlers';
import { BillingCalculations } from '@/components/module/admin/billing/summary/billing-summary-card';

// Mock the convertDecimals function
vi.mock('@/lib/convertDecimals', () => ({
  convertDecimals: (obj: any) => obj,
}));

describe('Calculation Handlers', () => {
  const mockCalculations: BillingCalculations = {
    subtotal: 1000,
    taxRate: 12,
    taxAmount: 120,
    discountAmount: 50,
    totalAmount: 1070,
    netAmount: 1070,
  };

  describe('Basic Calculation Functions', () => {
    describe('roundToDecimals', () => {
      it('rounds to 2 decimal places by default', () => {
        expect(roundToDecimals(123.456)).toBe(123.46);
        expect(roundToDecimals(123.454)).toBe(123.45);
      });

      it('rounds to specified decimal places', () => {
        expect(roundToDecimals(123.456, 1)).toBe(123.5);
        expect(roundToDecimals(123.456, 3)).toBe(123.456);
        expect(roundToDecimals(123.456, 0)).toBe(123);
      });

      it('handles edge cases', () => {
        expect(roundToDecimals(0)).toBe(0);
        expect(roundToDecimals(-123.456)).toBe(-123.46);
      });
    });

    describe('calculateTaxAmount', () => {
      it('calculates tax amount correctly', () => {
        expect(calculateTaxAmount(1000, 12)).toBe(120);
        expect(calculateTaxAmount(1000, 0)).toBe(0);
        expect(calculateTaxAmount(0, 12)).toBe(0);
      });

      it('rounds to specified decimal places', () => {
        expect(calculateTaxAmount(1000, 12.5, 2)).toBe(125);
        expect(calculateTaxAmount(333.33, 12, 2)).toBe(40);
      });

      it('handles edge cases', () => {
        expect(calculateTaxAmount(1000, 100)).toBe(1000);
        expect(calculateTaxAmount(-1000, 12)).toBe(-120);
      });
    });

    describe('calculateTotalAmount', () => {
      it('calculates total amount correctly', () => {
        expect(calculateTotalAmount(1000, 120, 50)).toBe(1070);
        expect(calculateTotalAmount(1000, 0, 0)).toBe(1000);
        expect(calculateTotalAmount(1000, 120, 1120)).toBe(0);
      });

      it('rounds to specified decimal places', () => {
        expect(calculateTotalAmount(1000.555, 120.444, 50.333, 2)).toBe(1070.67);
      });

      it('handles negative results', () => {
        expect(calculateTotalAmount(100, 0, 150)).toBe(-50);
      });
    });

    describe('calculateDiscountPercent', () => {
      it('calculates discount percentage correctly', () => {
        expect(calculateDiscountPercent(50, 1000)).toBe(5);
        expect(calculateDiscountPercent(0, 1000)).toBe(0);
        expect(calculateDiscountPercent(1000, 1000)).toBe(100);
      });

      it('handles zero subtotal', () => {
        expect(calculateDiscountPercent(50, 0)).toBe(0);
      });

      it('rounds to 2 decimal places', () => {
        expect(calculateDiscountPercent(33.33, 1000)).toBe(3.33);
      });
    });

    describe('calculateEffectiveTaxRate', () => {
      it('calculates effective tax rate correctly', () => {
        expect(calculateEffectiveTaxRate(120, 1000)).toBe(12);
        expect(calculateEffectiveTaxRate(0, 1000)).toBe(0);
        expect(calculateEffectiveTaxRate(150, 1000)).toBe(15);
      });

      it('handles zero subtotal', () => {
        expect(calculateEffectiveTaxRate(120, 0)).toBe(0);
      });

      it('rounds to 2 decimal places', () => {
        expect(calculateEffectiveTaxRate(125, 1000)).toBe(12.5);
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateCalculationField', () => {
      it('validates subtotal correctly', () => {
        const result = validateCalculationField('subtotal', -100, mockCalculations);
        expect(result.isValid).toBe(false);
        expect(result.errors.subtotal).toBe('Subtotal cannot be negative');
      });

      it('validates tax rate correctly', () => {
        const result = validateCalculationField('taxRate', 150, mockCalculations);
        expect(result.isValid).toBe(false);
        expect(result.errors.taxRate).toBe('Tax rate cannot exceed 100%');
      });

      it('validates discount amount correctly', () => {
        const result = validateCalculationField('discountAmount', 1500, mockCalculations);
        expect(result.isValid).toBe(false);
        expect(result.errors.discountAmount).toBe('Discount cannot exceed subtotal');
      });

      it('provides warnings for unusual values', () => {
        const result = validateCalculationField('taxRate', 75, mockCalculations);
        expect(result.isValid).toBe(true);
        expect(result.warnings.taxRate).toBe('Tax rate seems unusually high');
      });

      it('provides suggestions for edge cases', () => {
        const result = validateCalculationField('subtotal', 0.5, mockCalculations);
        expect(result.isValid).toBe(true);
        expect(result.suggestions.subtotal).toBe('Consider if this small amount is correct');
      });

      it('validates with custom options', () => {
        const options = { maxSubtotal: 500 };
        const result = validateCalculationField('subtotal', 1000, mockCalculations, options);
        expect(result.isValid).toBe(false);
        expect(result.errors.subtotal).toBe('Subtotal cannot exceed 500');
      });
    });

    describe('validateAllCalculations', () => {
      it('validates all fields correctly', () => {
        const result = validateAllCalculations(mockCalculations);
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      });

      it('detects multiple validation errors', () => {
        const invalidCalculations: BillingCalculations = {
          subtotal: -100,
          taxRate: 150,
          taxAmount: 0,
          discountAmount: -50,
          totalAmount: 0,
          netAmount: 0,
        };

        const result = validateAllCalculations(invalidCalculations);
        expect(result.isValid).toBe(false);
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      });

      it('performs cross-field validations', () => {
        const invalidCalculations: BillingCalculations = {
          subtotal: 1000,
          taxRate: 12,
          taxAmount: 120,
          discountAmount: 50,
          totalAmount: -100, // Invalid: negative total with positive subtotal
          netAmount: -100,
        };

        const result = validateAllCalculations(invalidCalculations);
        expect(result.isValid).toBe(false);
        expect(result.errors.totalAmount).toBe('Total amount must be positive when subtotal is positive');
      });

      it('provides suggestions for unusual combinations', () => {
        const unusualCalculations: BillingCalculations = {
          subtotal: 15000,
          taxRate: 2, // Low tax rate for large amount
          taxAmount: 300,
          discountAmount: 0,
          totalAmount: 15300,
          netAmount: 15300,
        };

        const result = validateAllCalculations(unusualCalculations);
        expect(result.isValid).toBe(true);
        expect(result.suggestions.taxRate).toBe('Low tax rate for large amount - please verify');
      });
    });
  });

  describe('Calculation Change Handling', () => {
    describe('handleCalculationChange', () => {
      it('updates calculation field correctly', () => {
        const result = handleCalculationChange('subtotal', 2000, mockCalculations);
        
        expect(result.calculations.subtotal).toBe(2000);
        expect(result.changeEvent.field).toBe('subtotal');
        expect(result.changeEvent.value).toBe(2000);
        expect(result.changeEvent.previousValue).toBe(1000);
        expect(result.changeEvent.source).toBe('user');
      });

      it('auto-calculates dependent fields when enabled', () => {
        const result = handleCalculationChange('subtotal', 2000, mockCalculations, {
          autoCalculate: true,
        });
        
        expect(result.calculations.subtotal).toBe(2000);
        expect(result.calculations.taxAmount).toBe(240); // 2000 * 12% = 240
        expect(result.calculations.totalAmount).toBe(2190); // 2000 + 240 - 50 = 2190
        expect(result.calculations.netAmount).toBe(2190);
      });

      it('does not auto-calculate when disabled', () => {
        const result = handleCalculationChange('subtotal', 2000, mockCalculations, {
          autoCalculate: false,
        });
        
        expect(result.calculations.subtotal).toBe(2000);
        expect(result.calculations.taxAmount).toBe(120); // Unchanged
        expect(result.calculations.totalAmount).toBe(1070); // Unchanged
      });

      it('validates on change when enabled', () => {
        const result = handleCalculationChange('subtotal', -100, mockCalculations, {
          validateOnChange: true,
        });
        
        expect(result.validation.isValid).toBe(false);
        expect(result.validation.errors.subtotal).toBe('Subtotal cannot be negative');
      });

      it('calls validation change callback', () => {
        const mockOnValidationChange = vi.fn();
        
        handleCalculationChange('subtotal', -100, mockCalculations, {
          validateOnChange: true,
          onValidationChange: mockOnValidationChange,
        });
        
        expect(mockOnValidationChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isValid: false,
            errors: expect.objectContaining({
              subtotal: 'Subtotal cannot be negative',
            }),
          })
        );
      });

      it('calls calculation change callback', () => {
        const mockOnCalculationChange = vi.fn();
        
        handleCalculationChange('subtotal', 2000, mockCalculations, {
          onCalculationChange: mockOnCalculationChange,
        });
        
        expect(mockOnCalculationChange).toHaveBeenCalledWith(
          expect.objectContaining({
            field: 'subtotal',
            value: 2000,
            previousValue: 1000,
            source: 'user',
          })
        );
      });

      it('rounds values to specified decimal places', () => {
        const result = handleCalculationChange('subtotal', 1000.555, mockCalculations, {
          roundToDecimals: 2,
        });
        
        expect(result.calculations.subtotal).toBe(1000.56);
      });
    });

    describe('recalculateAll', () => {
      it('recalculates all dependent values', () => {
        const result = recalculateAll(mockCalculations);
        
        expect(result.calculations.taxAmount).toBe(120); // 1000 * 12% = 120
        expect(result.calculations.totalAmount).toBe(1070); // 1000 + 120 - 50 = 1070
        expect(result.calculations.netAmount).toBe(1070);
      });

      it('fixes calculation inconsistencies', () => {
        const inconsistentCalculations: BillingCalculations = {
          subtotal: 1000,
          taxRate: 12,
          taxAmount: 100, // Incorrect: should be 120
          discountAmount: 50,
          totalAmount: 1000, // Incorrect: should be 1070
          netAmount: 1000, // Incorrect: should be 1070
        };

        const result = recalculateAll(inconsistentCalculations);
        
        expect(result.calculations.taxAmount).toBe(120);
        expect(result.calculations.totalAmount).toBe(1070);
        expect(result.calculations.netAmount).toBe(1070);
      });

      it('validates recalculated values', () => {
        const result = recalculateAll(mockCalculations);
        
        expect(result.validation.isValid).toBe(true);
      });

      it('calls validation change callback', () => {
        const mockOnValidationChange = vi.fn();
        
        recalculateAll(mockCalculations, {
          onValidationChange: mockOnValidationChange,
        });
        
        expect(mockOnValidationChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isValid: true,
          })
        );
      });
    });
  });

  describe('CalculationHandlers Export', () => {
    it('exports all calculation functions', () => {
      expect(CalculationHandlers.validateField).toBe(validateCalculationField);
      expect(CalculationHandlers.validateAll).toBe(validateAllCalculations);
      expect(CalculationHandlers.handleChange).toBe(handleCalculationChange);
      expect(CalculationHandlers.recalculateAll).toBe(recalculateAll);
      expect(CalculationHandlers.roundToDecimals).toBe(roundToDecimals);
      expect(CalculationHandlers.calculateTaxAmount).toBe(calculateTaxAmount);
      expect(CalculationHandlers.calculateTotalAmount).toBe(calculateTotalAmount);
      expect(CalculationHandlers.calculateDiscountPercent).toBe(calculateDiscountPercent);
      expect(CalculationHandlers.calculateEffectiveTaxRate).toBe(calculateEffectiveTaxRate);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles zero values correctly', () => {
      const zeroCalculations: BillingCalculations = {
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        netAmount: 0,
      };

      const result = validateAllCalculations(zeroCalculations);
      expect(result.warnings.subtotal).toBe('Subtotal is zero - no charges will be applied');
    });

    it('handles very large numbers', () => {
      const largeCalculations: BillingCalculations = {
        subtotal: 999999,
        taxRate: 12,
        taxAmount: 119999.88,
        discountAmount: 0,
        totalAmount: 1119998.88,
        netAmount: 1119998.88,
      };

      const result = validateAllCalculations(largeCalculations);
      expect(result.isValid).toBe(true);
    });

    it('handles precision issues with floating point numbers', () => {
      const result = calculateTaxAmount(0.1 + 0.2, 12); // 0.30000000000000004
      expect(result).toBe(0.04); // Should be properly rounded
    });

    it('handles negative discount amounts', () => {
      const result = validateCalculationField('discountAmount', -50, mockCalculations);
      expect(result.isValid).toBe(false);
      expect(result.errors.discountAmount).toBe('Discount amount cannot be negative');
    });

    it('handles tax rate edge cases', () => {
      const result1 = validateCalculationField('taxRate', 0.5, mockCalculations);
      expect(result1.suggestions.taxRate).toBe('Tax rate below 1% - is this correct?');

      const result2 = validateCalculationField('taxRate', 100, mockCalculations);
      expect(result2.isValid).toBe(true);

      const result3 = validateCalculationField('taxRate', 100.01, mockCalculations);
      expect(result3.isValid).toBe(false);
    });
  });
});