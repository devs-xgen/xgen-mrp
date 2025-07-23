import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation, useStepValidation } from '@/hooks/use-form-validation';

// Mock timers
vi.useFakeTimers();

describe('useFormValidation', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be at least 18'),
  });

  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  it('should initialize with empty validation state', () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.touchedFields).toEqual(new Set());
  });

  it('should validate form successfully with valid data', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateForm(validData);
    });

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
    expect(result.current.hasErrors).toBe(false);
  });

  it('should validate form and return errors with invalid data', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    const invalidData = {
      name: '',
      email: 'invalid-email',
      age: 16,
    };

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateForm(invalidData);
    });

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toHaveProperty('name');
    expect(validationResult.errors).toHaveProperty('email');
    expect(validationResult.errors).toHaveProperty('age');
    expect(result.current.isValid).toBe(false);
    expect(result.current.hasErrors).toBe(true);
  });

  it('should validate individual field with debounce', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ 
        schema: testSchema,
        debounceMs: 300
      })
    );

    const testData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };

    act(() => {
      result.current.validateField('email', 'invalid-email', testData);
    });

    // Should be validating immediately (or may not be if debounce is working)
    // The validation state might not be immediately true due to async nature

    // Fast-forward time to trigger debounced validation
    await act(async () => {
      vi.advanceTimersByTime(300);
      // Wait a bit more for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have validation error
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.touchedFields.has('email')).toBe(true);
  });

  it('should validate field immediately when debounce is 0', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ 
        schema: testSchema,
        debounceMs: 0
      })
    );

    const testData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };

    await act(async () => {
      result.current.validateField('email', 'invalid-email', testData);
    });

    expect(result.current.errors.email).toBeDefined();
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.touchedFields.has('email')).toBe(true);
  });

  it('should clear field error', () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    // Set an error first
    act(() => {
      result.current.setServerError('name', 'Server error');
    });

    expect(result.current.errors.name).toBe('Server error');
    expect(result.current.hasErrors).toBe(true);

    // Clear the error
    act(() => {
      result.current.clearFieldError('name');
    });

    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.hasErrors).toBe(false);
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    // Set multiple errors
    act(() => {
      result.current.setServerErrors({
        name: 'Name error',
        email: 'Email error',
      });
    });

    expect(result.current.hasErrors).toBe(true);

    // Clear all errors
    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.errors).toEqual({});
    expect(result.current.hasErrors).toBe(false);
  });

  it('should set server errors', () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    act(() => {
      result.current.setServerError('name', 'Server validation failed');
    });

    expect(result.current.errors.name).toBe('Server validation failed');
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  it('should set multiple server errors', () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    const serverErrors = {
      name: 'Name is taken',
      email: 'Email already exists',
    };

    act(() => {
      result.current.setServerErrors(serverErrors);
    });

    expect(result.current.errors.name).toBe('Name is taken');
    expect(result.current.errors.email).toBe('Email already exists');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should mark field as touched', () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    act(() => {
      result.current.markFieldTouched('name');
    });

    expect(result.current.isFieldTouched('name')).toBe(true);
    expect(result.current.touchedFields.has('name')).toBe(true);
  });

  it('should get field error', () => {
    const { result } = renderHook(() =>
      useFormValidation({ schema: testSchema })
    );

    act(() => {
      result.current.setServerError('name', 'Test error');
    });

    expect(result.current.getFieldError('name')).toBe('Test error');
    expect(result.current.hasFieldError('name')).toBe(true);
  });
});

describe('useStepValidation', () => {
  const step1Schema = z.object({
    name: z.string().min(1, 'Name is required'),
  });

  const step2Schema = z.object({
    email: z.string().email('Invalid email'),
  });

  const schemas = {
    step1: step1Schema,
    step2: step2Schema,
  };

  it('should initialize with current step schema', () => {
    const { result } = renderHook(() =>
      useStepValidation(schemas, 'step1')
    );

    expect(result.current.currentStepSchema).toBe(step1Schema);
  });

  it('should validate current step', async () => {
    const { result } = renderHook(() =>
      useStepValidation(schemas, 'step1')
    );

    const validData = { name: 'John Doe' };

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateCurrentStep(validData);
    });

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual({});
  });

  it('should return true for canProceedToNextStep with valid data', () => {
    const { result } = renderHook(() =>
      useStepValidation(schemas, 'step1')
    );

    const validData = { name: 'John Doe' };

    const canProceed = result.current.canProceedToNextStep(validData);
    expect(canProceed).toBe(true);
  });

  it('should return false for canProceedToNextStep with invalid data', () => {
    const { result } = renderHook(() =>
      useStepValidation(schemas, 'step1')
    );

    const invalidData = { name: '' };

    const canProceed = result.current.canProceedToNextStep(invalidData);
    expect(canProceed).toBe(false);
  });

  it('should handle missing schema gracefully', async () => {
    const { result } = renderHook(() =>
      useStepValidation(schemas, 'nonexistent-step')
    );

    const testData = { name: 'John Doe' };

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateCurrentStep(testData);
    });

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual({});

    const canProceed = result.current.canProceedToNextStep(testData);
    expect(canProceed).toBe(true);
  });
});