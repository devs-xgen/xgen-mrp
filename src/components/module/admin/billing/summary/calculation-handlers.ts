import { convertDecimals } from "@/lib/convertDecimals";
import { BillingCalculations } from "./billing-summary-card";

// ==============================================
// CALCULATION HANDLER TYPES
// ==============================================

export interface CalculationChangeEvent {
  field: keyof BillingCalculations;
  value: number;
  previousValue: number;
  timestamp: Date;
  source: 'user' | 'auto' | 'system';
}

export interface CalculationValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  suggestions: Record<string, string>;
}

export interface CalculationHandlerOptions {
  autoCalculate?: boolean;
  validateOnChange?: boolean;
  roundToDecimals?: number;
  maxSubtotal?: number;
  maxTaxRate?: number;
  maxDiscountPercent?: number;
  onValidationChange?: (result: CalculationValidationResult) => void;
  onCalculationChange?: (event: CalculationChangeEvent) => void;
}

export interface CalculationState {
  calculations: BillingCalculations;
  validation: CalculationValidationResult;
  history: CalculationChangeEvent[];
  isCalculating: boolean;
  lastUpdated: Date;
}

// ==============================================
// CALCULATION UTILITIES
// ==============================================

/**
 * Round number to specified decimal places
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate tax amount with proper rounding
 */
export function calculateTaxAmount(subtotal: number, taxRate: number, decimals: number = 2): number {
  const result = (subtotal * taxRate) / 100;
  return roundToDecimals(result, decimals);
}

/**
 * Calculate total amount with proper rounding
 */
export function calculateTotalAmount(
  subtotal: number,
  taxAmount: number,
  discountAmount: number,
  decimals: number = 2
): number {
  const result = subtotal + taxAmount - discountAmount;
  return roundToDecimals(result, decimals);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercent(discountAmount: number, subtotal: number): number {
  if (subtotal === 0) return 0;
  return roundToDecimals((discountAmount / subtotal) * 100, 2);
}

/**
 * Calculate effective tax rate
 */
export function calculateEffectiveTaxRate(taxAmount: number, subtotal: number): number {
  if (subtotal === 0) return 0;
  return roundToDecimals((taxAmount / subtotal) * 100, 2);
}

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================

/**
 * Validate individual calculation field
 */
export function validateCalculationField(
  field: keyof BillingCalculations,
  value: number,
  calculations: BillingCalculations,
  options: CalculationHandlerOptions = {}
): CalculationValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const suggestions: Record<string, string> = {};

  const {
    maxSubtotal = 1000000,
    maxTaxRate = 100,
    maxDiscountPercent = 100,
  } = options;

  switch (field) {
    case 'subtotal':
      if (value < 0) {
        errors.subtotal = "Subtotal cannot be negative";
      } else if (value > maxSubtotal) {
        errors.subtotal = `Subtotal cannot exceed ${maxSubtotal.toLocaleString()}`;
      } else if (value === 0) {
        warnings.subtotal = "Subtotal is zero - no charges will be applied";
      } else if (value > maxSubtotal * 0.8) {
        warnings.subtotal = "Large subtotal amount - please verify";
      }
      
      if (value > 0 && value < 1) {
        suggestions.subtotal = "Consider if this small amount is correct";
      }
      break;

    case 'taxRate':
      if (value < 0) {
        errors.taxRate = "Tax rate cannot be negative";
      } else if (value > maxTaxRate) {
        errors.taxRate = `Tax rate cannot exceed ${maxTaxRate}%`;
      } else if (value > 50) {
        warnings.taxRate = "Tax rate seems unusually high";
      } else if (value > 0 && value < 1) {
        suggestions.taxRate = "Tax rate below 1% - is this correct?";
      }
      break;

    case 'discountAmount':
      if (value < 0) {
        errors.discountAmount = "Discount amount cannot be negative";
      } else if (value > calculations.subtotal) {
        errors.discountAmount = "Discount cannot exceed subtotal";
      } else {
        const discountPercent = calculateDiscountPercent(value, calculations.subtotal);
        if (discountPercent > maxDiscountPercent) {
          errors.discountAmount = `Discount percentage cannot exceed ${maxDiscountPercent}%`;
        } else if (discountPercent > 50) {
          warnings.discountAmount = `Large discount applied (${discountPercent.toFixed(1)}%)`;
        } else if (discountPercent > 25) {
          suggestions.discountAmount = `Significant discount (${discountPercent.toFixed(1)}%) - please verify`;
        }
      }
      break;

    case 'taxAmount':
      const expectedTaxAmount = calculateTaxAmount(calculations.subtotal, calculations.taxRate);
      if (Math.abs(value - expectedTaxAmount) > 0.01) {
        warnings.taxAmount = "Tax amount doesn't match calculated value";
        suggestions.taxAmount = `Expected: ${expectedTaxAmount.toFixed(2)}`;
      }
      break;

    case 'totalAmount':
      if (value < 0) {
        errors.totalAmount = "Total amount cannot be negative";
      } else {
        const expectedTotal = calculateTotalAmount(
          calculations.subtotal,
          calculations.taxAmount,
          calculations.discountAmount
        );
        if (Math.abs(value - expectedTotal) > 0.01) {
          warnings.totalAmount = "Total amount doesn't match calculated value";
          suggestions.totalAmount = `Expected: ${expectedTotal.toFixed(2)}`;
        }
      }
      break;

    case 'netAmount':
      if (value !== calculations.totalAmount) {
        warnings.netAmount = "Net amount should equal total amount";
        suggestions.netAmount = `Should be: ${calculations.totalAmount.toFixed(2)}`;
      }
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Validate all calculations
 */
export function validateAllCalculations(
  calculations: BillingCalculations,
  options: CalculationHandlerOptions = {}
): CalculationValidationResult {
  const allErrors: Record<string, string> = {};
  const allWarnings: Record<string, string> = {};
  const allSuggestions: Record<string, string> = {};

  // Validate each field
  Object.keys(calculations).forEach((key) => {
    const field = key as keyof BillingCalculations;
    const result = validateCalculationField(field, calculations[field], calculations, options);
    
    Object.assign(allErrors, result.errors);
    Object.assign(allWarnings, result.warnings);
    Object.assign(allSuggestions, result.suggestions);
  });

  // Cross-field validations
  const discountPercent = calculateDiscountPercent(calculations.discountAmount, calculations.subtotal);
  const effectiveTaxRate = calculateEffectiveTaxRate(calculations.taxAmount, calculations.subtotal);

  // Check for unusual combinations
  if (calculations.subtotal > 0 && calculations.totalAmount <= 0) {
    allErrors.totalAmount = "Total amount must be positive when subtotal is positive";
  }

  if (discountPercent > 0 && effectiveTaxRate === 0) {
    allSuggestions.general = "Consider if tax should be applied with discount";
  }

  if (calculations.subtotal > 10000 && effectiveTaxRate < 5) {
    allSuggestions.taxRate = "Low tax rate for large amount - please verify";
  }

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: allSuggestions,
  };
}

// ==============================================
// CALCULATION HANDLERS
// ==============================================

/**
 * Handle calculation change with auto-calculation and validation
 */
export function handleCalculationChange(
  field: keyof BillingCalculations,
  value: number,
  currentCalculations: BillingCalculations,
  options: CalculationHandlerOptions = {}
): {
  calculations: BillingCalculations;
  validation: CalculationValidationResult;
  changeEvent: CalculationChangeEvent;
} {
  const {
    autoCalculate = true,
    validateOnChange = true,
    roundToDecimals: decimals = 2,
  } = options;

  // Create change event
  const changeEvent: CalculationChangeEvent = {
    field,
    value,
    previousValue: currentCalculations[field],
    timestamp: new Date(),
    source: 'user',
  };

  // Update calculations
  let updatedCalculations = { ...currentCalculations, [field]: roundToDecimals(value, decimals) };

  // Auto-calculate dependent fields
  if (autoCalculate) {
    if (field === 'subtotal' || field === 'taxRate') {
      updatedCalculations.taxAmount = calculateTaxAmount(
        updatedCalculations.subtotal,
        updatedCalculations.taxRate,
        decimals
      );
    }

    // Recalculate total and net amounts
    if (['subtotal', 'taxAmount', 'discountAmount'].includes(field) || 
        (field === 'taxRate' && updatedCalculations.taxAmount !== currentCalculations.taxAmount)) {
      updatedCalculations.totalAmount = calculateTotalAmount(
        updatedCalculations.subtotal,
        updatedCalculations.taxAmount,
        updatedCalculations.discountAmount,
        decimals
      );
      updatedCalculations.netAmount = updatedCalculations.totalAmount;
    }
  }

  // Apply decimal conversion
  updatedCalculations = convertDecimals(updatedCalculations);

  // Validate if requested
  const validation = validateOnChange 
    ? validateAllCalculations(updatedCalculations, options)
    : { isValid: true, errors: {}, warnings: {}, suggestions: {} };

  // Notify validation change
  if (options.onValidationChange) {
    options.onValidationChange(validation);
  }

  // Notify calculation change
  if (options.onCalculationChange) {
    options.onCalculationChange(changeEvent);
  }

  return {
    calculations: updatedCalculations,
    validation,
    changeEvent,
  };
}

/**
 * Recalculate all dependent values
 */
export function recalculateAll(
  calculations: BillingCalculations,
  options: CalculationHandlerOptions = {}
): {
  calculations: BillingCalculations;
  validation: CalculationValidationResult;
} {
  const { roundToDecimals: decimals = 2 } = options;

  // Recalculate tax amount
  const taxAmount = calculateTaxAmount(calculations.subtotal, calculations.taxRate, decimals);
  
  // Recalculate total amount
  const totalAmount = calculateTotalAmount(
    calculations.subtotal,
    taxAmount,
    calculations.discountAmount,
    decimals
  );

  const updatedCalculations = convertDecimals({
    ...calculations,
    taxAmount,
    totalAmount,
    netAmount: totalAmount,
  });

  const validation = validateAllCalculations(updatedCalculations, options);

  // Notify validation change
  if (options.onValidationChange) {
    options.onValidationChange(validation);
  }

  return {
    calculations: updatedCalculations,
    validation,
  };
}

/**
 * Create calculation state manager
 */
export function createCalculationState(
  initialCalculations: BillingCalculations,
  options: CalculationHandlerOptions = {}
): CalculationState {
  const validation = validateAllCalculations(initialCalculations, options);
  
  return {
    calculations: initialCalculations,
    validation,
    history: [],
    isCalculating: false,
    lastUpdated: new Date(),
  };
}

/**
 * Update calculation state
 */
export function updateCalculationState(
  state: CalculationState,
  field: keyof BillingCalculations,
  value: number,
  options: CalculationHandlerOptions = {}
): CalculationState {
  const result = handleCalculationChange(field, value, state.calculations, options);
  
  return {
    ...state,
    calculations: result.calculations,
    validation: result.validation,
    history: [...state.history, result.changeEvent],
    lastUpdated: new Date(),
  };
}

// ==============================================
// EXPORT UTILITIES
// ==============================================

export const CalculationHandlers = {
  validateField: validateCalculationField,
  validateAll: validateAllCalculations,
  handleChange: handleCalculationChange,
  recalculateAll,
  createState: createCalculationState,
  updateState: updateCalculationState,
  roundToDecimals,
  calculateTaxAmount,
  calculateTotalAmount,
  calculateDiscountPercent,
  calculateEffectiveTaxRate,
};