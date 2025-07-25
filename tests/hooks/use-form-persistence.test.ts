import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { 
  useFormPersistence, 
  useUnsavedChangesWarning, 
  useAutoSaveStatus 
} from '@/hooks/use-form-persistence';
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

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockForm.getValues.mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [state] = result.current;

      expect(state.isRecoveryAvailable).toBe(false);
      expect(state.recoveryData).toBeNull();
      expect(state.lastAutoSave).toBeNull();
      expect(state.autoSaveEnabled).toBe(false);
      expect(state.dirtyState.isDirty).toBe(false);
    });

    it('should provide all expected actions', () => {
      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [, actions] = result.current;

      expect(actions).toHaveProperty('saveFormData');
      expect(actions).toHaveProperty('loadFormData');
      expect(actions).toHaveProperty('clearFormData');
      expect(actions).toHaveProperty('recoverFormData');
      expect(actions).toHaveProperty('startAutoSave');
      expect(actions).toHaveProperty('stopAutoSave');
      expect(actions).toHaveProperty('markAsSaved');
      expect(actions).toHaveProperty('showUnsavedChangesWarning');
    });
  });

  describe('Recovery Functionality', () => {
    it('should detect recovery data on initialization', () => {
      const mockRecoveryData = {
        formData: { customerName: 'Recovered Customer' },
        uiState: { currentStep: BillingFormStep.CUSTOMER_INFORMATION },
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecoveryData));

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [state] = result.current;

      expect(state.isRecoveryAvailable).toBe(true);
      expect(state.recoveryData).toEqual(mockRecoveryData);
    });

    it('should call onRecoveryAvailable callback when recovery data is found', () => {
      const mockRecoveryData = {
        formData: { customerName: 'Recovered Customer' },
        uiState: {},
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecoveryData));

      const onRecoveryAvailable = vi.fn();

      renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          onRecoveryAvailable,
        })
      );

      expect(onRecoveryAvailable).toHaveBeenCalledWith(mockRecoveryData);
    });

    it('should recover form data successfully', () => {
      const mockRecoveryData = {
        formData: {
          customerName: 'Recovered Customer',
          subtotal: 1000,
        },
        uiState: {
          currentStep: BillingFormStep.CUSTOMER_INFORMATION,
        },
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecoveryData));

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [, actions] = result.current;

      act(() => {
        const success = actions.recoverFormData();
        expect(success).toBe(true);
      });

      expect(mockForm.setValue).toHaveBeenCalledWith('customerName', 'Recovered Customer');
      expect(mockForm.setValue).toHaveBeenCalledWith('subtotal', 1000);
      expect(mockSetUIState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Save Functionality', () => {
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

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'billing-form-state',
        expect.stringContaining('"customerName":"Test Customer"')
      );
    });

    it('should call onAutoSave callback on save', () => {
      mockForm.getValues.mockReturnValue({ customerName: 'Test' });

      const onAutoSave = vi.fn();

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          onAutoSave,
        })
      );

      const [, actions] = result.current;

      act(() => {
        actions.saveFormData();
      });

      expect(onAutoSave).toHaveBeenCalledWith(true);
    });

    it('should handle save failures', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      mockForm.getValues.mockReturnValue({ customerName: 'Test' });

      const onAutoSave = vi.fn();

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          onAutoSave,
        })
      );

      const [, actions] = result.current;

      act(() => {
        const success = actions.saveFormData();
        expect(success).toBe(false);
      });

      expect(onAutoSave).toHaveBeenCalledWith(false);
    });
  });

  describe('Auto-save Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should enable auto-save when configured', () => {
      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          enableAutoSave: true,
        })
      );

      const [state] = result.current;
      expect(state.autoSaveEnabled).toBe(true);
    });

    it('should auto-save at specified intervals', () => {
      mockForm.getValues.mockReturnValue({ customerName: 'Test' });

      const mockUIStateWithDirty = {
        ...mockUIState,
        isDirty: true,
      };

      renderHook(() =>
        useFormPersistence(mockForm, mockUIStateWithDirty, mockSetUIState, {
          enableAutoSave: true,
          persistenceConfig: {
            autoSaveInterval: 1000,
          },
        })
      );

      // Fast-forward time to trigger auto-save
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should not auto-save when form is not dirty', () => {
      mockForm.getValues.mockReturnValue({ customerName: 'Test' });

      const mockUIStateClean = {
        ...mockUIState,
        isDirty: false,
      };

      renderHook(() =>
        useFormPersistence(mockForm, mockUIStateClean, mockSetUIState, {
          enableAutoSave: true,
          persistenceConfig: {
            autoSaveInterval: 1000,
          },
        })
      );

      // Clear any calls from localStorage availability check
      localStorageMock.setItem.mockClear();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should start and stop auto-save manually', () => {
      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          enableAutoSave: false,
        })
      );

      let [state, actions] = result.current;
      expect(state.autoSaveEnabled).toBe(false);

      act(() => {
        actions.startAutoSave();
      });

      [state] = result.current;
      expect(state.autoSaveEnabled).toBe(true);

      act(() => {
        actions.stopAutoSave();
      });

      [state] = result.current;
      expect(state.autoSaveEnabled).toBe(false);
    });
  });

  describe('Dirty State Tracking', () => {
    it('should track dirty state when enabled', async () => {
      const onDirtyStateChange = vi.fn();

      renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          enableDirtyTracking: true,
          onDirtyStateChange,
        })
      );

      // Wait for the dirty tracker to be set up
      await waitFor(() => {
        expect(onDirtyStateChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isDirty: false,
            hasUnsavedChanges: false,
          })
        );
      });
    });

    it('should update UI state when dirty state changes', async () => {
      renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          enableDirtyTracking: true,
        })
      );

      // Wait for the dirty tracker to be set up and call setUIState
      await waitFor(() => {
        expect(mockSetUIState).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it('should not track dirty state when disabled', () => {
      const onDirtyStateChange = vi.fn();

      renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState, {
          enableDirtyTracking: false,
          onDirtyStateChange,
        })
      );

      expect(onDirtyStateChange).not.toHaveBeenCalled();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear form data', async () => {
      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      const [, actions] = result.current;

      await act(async () => {
        actions.clearFormData();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('billing-form-state');
    });

    it('should update state after clearing', async () => {
      // Set up initial recovery data
      const mockRecoveryData = {
        formData: { customerName: 'Test' },
        uiState: {},
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: 'test-session',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecoveryData));

      const { result } = renderHook(() =>
        useFormPersistence(mockForm, mockUIState, mockSetUIState)
      );

      // Wait for initial state to be set
      await waitFor(() => {
        const [state] = result.current;
        expect(state.isRecoveryAvailable).toBe(true);
      });

      // Clear data
      const [, actions] = result.current;
      await act(async () => {
        actions.clearFormData();
      });

      const [state] = result.current;
      expect(state.isRecoveryAvailable).toBe(false);
      expect(state.recoveryData).toBeNull();
    });
  });
});

describe('useUnsavedChangesWarning Hook', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
    });
    
    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add event listeners when hasUnsavedChanges is true', () => {
    renderHook(() => useUnsavedChangesWarning(true));

    expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('should not add event listeners when hasUnsavedChanges is false', () => {
    renderHook(() => useUnsavedChangesWarning(false));

    expect(mockAddEventListener).not.toHaveBeenCalled();
  });

  it('should remove event listeners on cleanup', () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning(true));

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('should use custom message', () => {
    const customMessage = 'Custom warning message';
    renderHook(() => useUnsavedChangesWarning(true, customMessage));

    // The message is used internally, we can't easily test it without mocking the event
    expect(mockAddEventListener).toHaveBeenCalled();
  });
});

describe('useAutoSaveStatus Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return idle status when auto-save is disabled', () => {
    const { result } = renderHook(() => useAutoSaveStatus(null, false));

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSaveText).toBe('Not saved yet');
  });

  it('should return saved status after auto-save', () => {
    const lastAutoSave = Date.now();
    
    const { result } = renderHook(() => useAutoSaveStatus(lastAutoSave, true));

    expect(result.current.status).toBe('saved');
    expect(result.current.lastSaveText).toContain('Last saved');
  });

  it('should reset to idle after timeout', () => {
    const lastAutoSave = Date.now();
    
    const { result } = renderHook(() => useAutoSaveStatus(lastAutoSave, true));

    expect(result.current.status).toBe('saved');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.status).toBe('idle');
  });

  it('should format last save time correctly', () => {
    const oneMinuteAgo = Date.now() - (60 * 1000);
    
    const { result } = renderHook(() => useAutoSaveStatus(oneMinuteAgo, true));

    expect(result.current.lastSaveText).toContain('1 minute ago');
  });
});