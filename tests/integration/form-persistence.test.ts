import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { useFormPersistence } from '@/hooks/use-form-persistence';
import { FormPersistenceManager, FormDirtyTracker } from '@/lib/utils/form-persistence';
import { EnhancedBillingStatementFormData } from '@/types/admin/billing-types';
import { BillingFormUIState, BillingFormStep } from '@/types/admin/billing-form-steps';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Form Persistence Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('FormPersistenceManager', () => {
    let manager: FormPersistenceManager;

    beforeEach(() => {
      manager = new FormPersistenceManager();
    });

    it('should save form data to localStorage', () => {
      const formData: Partial<EnhancedBillingStatementFormData> = {
        billingType: 'direct-customer',
        customerName: 'Test Customer',
        subtotal: 1000,
      };

      const uiState: Partial<BillingFormUIState> = {
        currentStep: BillingFormStep.CUSTOMER_INFORMATION,
        isDirty: true,
      };

      const result = manager.saveFormData(formData, uiState);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'billing-form-state',
        expect.stringContaining('"customerName":"Test Customer"')
      );
    });

    it('should load form data from localStorage', () => {
      const mockData = {
        formData: {
          billingType: 'direct-customer',
          customerName: 'Test Customer',
        },
        uiState: {
          currentStep: BillingFormStep.CUSTOMER_INFORMATION,
        },
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = manager.loadFormData();

      expect(result).toEqual(mockData);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('billing-form-state');
    });

    it('should return null for expired data', () => {
      const expiredData = {
        formData: { customerName: 'Test' },
        uiState: {},
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        version: '1.0.0',
        sessionId: 'test-session',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

      const result = manager.loadFormData();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('billing-form-state');
    });

    it('should clear form data', () => {
      manager.clearFormData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('billing-form-state');
    });

    it('should validate recovered data', () => {
      const validData = {
        formData: {
          billingType: 'direct-customer' as const,
          customerName: 'Test Customer',
          customerId: 'customer-123',
          subtotal: 1000,
          invoiceItems: [
            {
              description: 'Test Item',
              quantity: 1,
              unitPrice: 1000,
            },
          ],
        },
        uiState: {
          currentStep: BillingFormStep.CUSTOMER_INFORMATION,
        },
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      const result = manager.validateRecoveredData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation warnings in recovered data', () => {
      const dataWithWarnings = {
        formData: {
          billingType: 'customer-order' as const,
          customerName: 'Test Customer',
          // Missing customerOrderId for customer-order billing type
          subtotal: 1000,
          invoiceItems: [],
        },
        uiState: {},
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      const result = manager.validateRecoveredData(dataWithWarnings);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('customer order'))).toBe(true);
    });
  });

  describe('FormDirtyTracker', () => {
    let tracker: FormDirtyTracker;

    beforeEach(() => {
      tracker = new FormDirtyTracker();
    });

    it('should track dirty state correctly', () => {
      const initialValues = {
        customerName: 'Initial Customer',
        subtotal: 0,
      };

      tracker.setInitialValues(initialValues);

      let currentState = tracker.getState();
      expect(currentState.isDirty).toBe(false);
      expect(currentState.dirtyFields.size).toBe(0);

      // Update a field
      tracker.updateField('customerName', 'Updated Customer');

      currentState = tracker.getState();
      expect(currentState.isDirty).toBe(true);
      expect(currentState.dirtyFields.has('customerName')).toBe(true);
      expect(currentState.hasUnsavedChanges).toBe(true);

      // Revert to original value
      tracker.updateField('customerName', 'Initial Customer');

      currentState = tracker.getState();
      expect(currentState.isDirty).toBe(false);
      expect(currentState.dirtyFields.size).toBe(0);
    });

    it('should handle deep equality correctly', () => {
      const initialValues = {
        invoiceItems: [
          { description: 'Item 1', quantity: 1, unitPrice: 100 },
        ],
      };

      tracker.setInitialValues(initialValues);

      // Same content, different object reference
      tracker.updateField('invoiceItems', [
        { description: 'Item 1', quantity: 1, unitPrice: 100 },
      ]);

      const state = tracker.getState();
      expect(state.isDirty).toBe(false);

      // Different content
      tracker.updateField('invoiceItems', [
        { description: 'Item 1', quantity: 2, unitPrice: 100 },
      ]);

      const updatedState = tracker.getState();
      expect(updatedState.isDirty).toBe(true);
    });

    it('should notify listeners of state changes', () => {
      const listener = vi.fn();
      const unsubscribe = tracker.addListener(listener);

      tracker.setInitialValues({ customerName: 'Test' });
      expect(listener).toHaveBeenCalled();

      tracker.updateField('customerName', 'Updated');
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isDirty: true,
          hasUnsavedChanges: true,
        })
      );

      unsubscribe();
      tracker.updateField('customerName', 'Another Update');
      
      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should mark as saved correctly', () => {
      tracker.setInitialValues({ customerName: 'Test' });
      tracker.updateField('customerName', 'Updated');

      let state = tracker.getState();
      expect(state.hasUnsavedChanges).toBe(true);

      tracker.markAsSaved();

      state = tracker.getState();
      expect(state.hasUnsavedChanges).toBe(false);
      expect(state.lastSaved).toBeTypeOf('number');
    });
  });

  describe('useFormPersistence Hook', () => {
    const mockForm = {
      getValues: vi.fn(),
      setValue: vi.fn(),
      watch: vi.fn(() => ({ unsubscribe: vi.fn() })),
    } as any;

    const mockUIState: BillingFormUIState = {
      currentStep: BillingFormStep.BILLING_TYPE_SELECTION,
      completedSteps: [],
      isLoading: false,
      errors: {},
      isDirty: false,
      canProceed: false,
      showValidation: false,
    };

    const mockSetUIState = vi.fn();

    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [state] = result.current;

      expect(state.isRecoveryAvailable).toBe(false);
      expect(state.recoveryData).toBeNull();
      expect(state.autoSaveEnabled).toBe(false);
      expect(state.dirtyState.isDirty).toBe(false);
    });

    it('should detect recovery data on initialization', () => {
      const mockRecoveryData = {
        formData: { customerName: 'Recovered Customer' },
        uiState: {},
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecoveryData));

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          enableAutoSave: false,
        })
      );

      const [state] = result.current;

      expect(state.isRecoveryAvailable).toBe(true);
      expect(state.recoveryData).toEqual(mockRecoveryData);
    });

    it('should save form data manually', () => {
      mockForm.getValues.mockReturnValue({
        customerName: 'Test Customer',
        subtotal: 1000,
      });

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [, actions] = result.current;

      act(() => {
        const success = actions.saveFormData();
        expect(success).toBe(true);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should clear form data', () => {
      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [, actions] = result.current;

      act(() => {
        actions.clearFormData();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('billing-form-state');
    });

    it('should handle auto-save when enabled', () => {
      vi.useFakeTimers();

      mockForm.getValues.mockReturnValue({
        customerName: 'Test Customer',
      });

      const mockUIStateWithDirty = {
        ...mockUIState,
        isDirty: true,
      };

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIStateWithDirty, mockSetUIState, {
          enableAutoSave: true,
          persistenceConfig: {
            autoSaveInterval: 1000, // 1 second for testing
          },
        })
      );

      const [state] = result.current;
      expect(state.autoSaveEnabled).toBe(true);

      // Fast-forward time to trigger auto-save
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage unavailability gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const manager = new FormPersistenceManager();
      const result = manager.saveFormData({ customerName: 'Test' }, {});

      expect(result).toBe(false);
    });

    it('should handle corrupted data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const manager = new FormPersistenceManager();
      const result = manager.loadFormData();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('billing-form-state');
    });

    it('should handle storage size limits', () => {
      const manager = new FormPersistenceManager({
        maxStorageSize: 100, // Very small limit
      });

      const largeFormData = {
        customerName: 'A'.repeat(1000), // Large string
      };

      const result = manager.saveFormData(largeFormData, {});

      expect(result).toBe(false);
    });
  });

  describe('Data Validation', () => {
    let manager: FormPersistenceManager;

    beforeEach(() => {
      manager = new FormPersistenceManager();
    });

    it('should validate billing type consistency', () => {
      const inconsistentData = {
        formData: {
          billingType: 'direct-customer' as const,
          customerName: 'Test Customer',
          // Missing customerId for direct-customer billing
        },
        uiState: {},
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      const result = manager.validateRecoveredData(inconsistentData);

      expect(result.warnings.some(w => w.includes('Customer information'))).toBe(true);
    });

    it('should validate invoice items', () => {
      const dataWithInvalidItems = {
        formData: {
          billingType: 'manual-customer' as const,
          customerName: 'Test Customer',
          invoiceItems: [
            { description: '', quantity: 0, unitPrice: -10 }, // Invalid item
            { description: 'Valid Item', quantity: 1, unitPrice: 100 }, // Valid item
          ],
        },
        uiState: {},
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      const result = manager.validateRecoveredData(dataWithInvalidItems);

      expect(result.warnings.some(w => w.includes('Invoice items'))).toBe(true);
    });

    it('should validate financial calculations', () => {
      const dataWithInconsistentCalculations = {
        formData: {
          billingType: 'manual-customer' as const,
          customerName: 'Test Customer',
          subtotal: 1000,
          invoiceItems: [
            { description: 'Item', quantity: 1, unitPrice: 500 }, // Should total 500, not 1000
          ],
        },
        uiState: {},
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      const result = manager.validateRecoveredData(dataWithInconsistentCalculations);

      expect(result.warnings.some(w => w.includes('Financial calculations'))).toBe(true);
    });
  });
});