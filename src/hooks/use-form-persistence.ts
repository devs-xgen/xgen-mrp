import { useEffect, useRef, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { EnhancedBillingStatementFormData } from '@/types/admin/billing-types';
import { BillingFormUIState } from '@/types/admin/billing-form-steps';
import {
  FormPersistenceManager,
  FormDirtyTracker,
  FormPersistenceData,
  FormPersistenceConfig,
  FormRecoveryOptions,
  FormDirtyState,
  formatTimeDuration,
} from '@/lib/utils/form-persistence';

// ==============================================
// HOOK TYPES
// ==============================================

export interface UseFormPersistenceOptions {
  persistenceConfig?: Partial<FormPersistenceConfig>;
  recoveryOptions?: Partial<FormRecoveryOptions>;
  enableAutoSave?: boolean;
  enableDirtyTracking?: boolean;
  onRecoveryAvailable?: (data: FormPersistenceData) => void;
  onAutoSave?: (success: boolean) => void;
  onDirtyStateChange?: (state: FormDirtyState) => void;
}

export interface FormPersistenceState {
  isRecoveryAvailable: boolean;
  recoveryData: FormPersistenceData | null;
  lastAutoSave: number | null;
  autoSaveEnabled: boolean;
  dirtyState: FormDirtyState;
  storageInfo: {
    used: number;
    available: number;
    percentage: number;
  };
}

export interface FormPersistenceActions {
  saveFormData: () => boolean;
  loadFormData: () => FormPersistenceData | null;
  clearFormData: () => void;
  recoverFormData: () => boolean;
  startAutoSave: () => void;
  stopAutoSave: () => void;
  markAsSaved: () => void;
  showUnsavedChangesWarning: () => boolean;
}

// ==============================================
// MAIN HOOK
// ==============================================

export function useFormPersistence(
  form: UseFormReturn<EnhancedBillingStatementFormData>,
  uiState: BillingFormUIState,
  setUIState: (state: BillingFormUIState | ((prev: BillingFormUIState) => BillingFormUIState)) => void,
  options: UseFormPersistenceOptions = {}
): [FormPersistenceState, FormPersistenceActions] {
  
  // Refs for managers
  const persistenceManagerRef = useRef<FormPersistenceManager | null>(null);
  const dirtyTrackerRef = useRef<FormDirtyTracker | null>(null);
  
  // State
  const [persistenceState, setPersistenceState] = useState<FormPersistenceState>({
    isRecoveryAvailable: false,
    recoveryData: null,
    lastAutoSave: null,
    autoSaveEnabled: false,
    dirtyState: {
      isDirty: false,
      dirtyFields: new Set(),
      lastSaved: null,
      hasUnsavedChanges: false,
    },
    storageInfo: {
      used: 0,
      available: 0,
      percentage: 0,
    },
  });

  // Initialize managers
  useEffect(() => {
    persistenceManagerRef.current = new FormPersistenceManager(
      options.persistenceConfig,
      options.recoveryOptions
    );

    if (options.enableDirtyTracking !== false) {
      dirtyTrackerRef.current = new FormDirtyTracker();
    }

    // Check for recovery data on initialization
    const recoveryData = persistenceManagerRef.current.loadFormData();
    if (recoveryData) {
      setPersistenceState(prev => ({
        ...prev,
        isRecoveryAvailable: true,
        recoveryData,
      }));
      
      options.onRecoveryAvailable?.(recoveryData);
    }

    // Update storage info
    const storageInfo = persistenceManagerRef.current.getStorageInfo();
    setPersistenceState(prev => ({
      ...prev,
      storageInfo,
    }));

    return () => {
      persistenceManagerRef.current?.stopAutoSave();
    };
  }, []);

  // Set up dirty tracking
  useEffect(() => {
    if (!dirtyTrackerRef.current || options.enableDirtyTracking === false) {
      return;
    }

    const tracker = dirtyTrackerRef.current;
    
    // Set initial values
    const formValues = form.getValues();
    tracker.setInitialValues(formValues);

    // Listen for dirty state changes
    const unsubscribe = tracker.addListener((dirtyState) => {
      setPersistenceState(prev => ({
        ...prev,
        dirtyState,
      }));
      
      options.onDirtyStateChange?.(dirtyState);
      
      // Update UI state
      setUIState(prev => ({
        ...prev,
        isDirty: dirtyState.isDirty,
      }));
    });

    return unsubscribe;
  }, [form, setUIState, options.enableDirtyTracking, options.onDirtyStateChange]);

  // Watch form changes for dirty tracking
  useEffect(() => {
    if (!dirtyTrackerRef.current || options.enableDirtyTracking === false) {
      return;
    }

    const subscription = form.watch((value, { name }) => {
      if (name && dirtyTrackerRef.current) {
        dirtyTrackerRef.current.updateField(name, value[name as keyof typeof value]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, options.enableDirtyTracking]);

  // Auto-save functionality
  useEffect(() => {
    if (!options.enableAutoSave || !persistenceManagerRef.current) {
      return;
    }

    const getFormData = () => form.getValues();
    const getUIState = () => uiState;

    persistenceManagerRef.current.startAutoSave(getFormData, getUIState);
    
    setPersistenceState(prev => ({
      ...prev,
      autoSaveEnabled: true,
    }));

    return () => {
      persistenceManagerRef.current?.stopAutoSave();
      setPersistenceState(prev => ({
        ...prev,
        autoSaveEnabled: false,
      }));
    };
  }, [options.enableAutoSave, form, uiState]);

  // Actions
  const saveFormData = useCallback((): boolean => {
    if (!persistenceManagerRef.current) {
      return false;
    }

    const formData = form.getValues();
    const success = persistenceManagerRef.current.saveFormData(formData, uiState);
    
    if (success) {
      setPersistenceState(prev => ({
        ...prev,
        lastAutoSave: Date.now(),
        storageInfo: persistenceManagerRef.current!.getStorageInfo(),
      }));
      
      dirtyTrackerRef.current?.markAsSaved();
      options.onAutoSave?.(true);
    } else {
      options.onAutoSave?.(false);
    }

    return success;
  }, [form, uiState, options.onAutoSave]);

  const loadFormData = useCallback((): FormPersistenceData | null => {
    if (!persistenceManagerRef.current) {
      return null;
    }

    return persistenceManagerRef.current.loadFormData();
  }, []);

  const clearFormData = useCallback((): void => {
    if (!persistenceManagerRef.current) {
      return;
    }

    persistenceManagerRef.current.clearFormData();
    
    setPersistenceState(prev => ({
      ...prev,
      isRecoveryAvailable: false,
      recoveryData: null,
      storageInfo: persistenceManagerRef.current!.getStorageInfo(),
    }));

    dirtyTrackerRef.current?.reset();
  }, []);

  const recoverFormData = useCallback((): boolean => {
    if (!persistenceManagerRef.current || !persistenceState.recoveryData) {
      return false;
    }

    try {
      const validation = persistenceManagerRef.current.validateRecoveredData(
        persistenceState.recoveryData
      );

      if (!validation.isValid) {
        toast.error('Recovered data is invalid and cannot be restored');
        console.error('Recovery validation errors:', validation.errors);
        return false;
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      const { formData, uiState: recoveredUIState } = persistenceState.recoveryData;

      // Restore form data
      if (formData) {
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined) {
            form.setValue(key as keyof EnhancedBillingStatementFormData, value);
          }
        });
      }

      // Restore UI state
      if (recoveredUIState) {
        setUIState(prev => ({
          ...prev,
          ...recoveredUIState,
        }));
      }

      // Update dirty tracker with recovered values
      if (dirtyTrackerRef.current && formData) {
        dirtyTrackerRef.current.setInitialValues(formData);
      }

      // Clear recovery data after successful recovery
      setPersistenceState(prev => ({
        ...prev,
        isRecoveryAvailable: false,
        recoveryData: null,
      }));

      const age = persistenceManagerRef.current.getFormDataAge();
      const ageText = age ? formatTimeDuration(age) : 'recently';
      
      toast.success(`Form data recovered from ${ageText}`);
      return true;

    } catch (error) {
      console.error('Failed to recover form data:', error);
      toast.error('Failed to recover form data');
      return false;
    }
  }, [persistenceState.recoveryData, form, setUIState]);

  const startAutoSave = useCallback((): void => {
    if (!persistenceManagerRef.current) {
      return;
    }

    const getFormData = () => form.getValues();
    const getUIState = () => uiState;

    persistenceManagerRef.current.startAutoSave(getFormData, getUIState);
    
    setPersistenceState(prev => ({
      ...prev,
      autoSaveEnabled: true,
    }));
  }, [form, uiState]);

  const stopAutoSave = useCallback((): void => {
    if (!persistenceManagerRef.current) {
      return;
    }

    persistenceManagerRef.current.stopAutoSave();
    
    setPersistenceState(prev => ({
      ...prev,
      autoSaveEnabled: false,
    }));
  }, []);

  const markAsSaved = useCallback((): void => {
    dirtyTrackerRef.current?.markAsSaved();
    
    setPersistenceState(prev => ({
      ...prev,
      lastAutoSave: Date.now(),
    }));
  }, []);

  const showUnsavedChangesWarning = useCallback((): boolean => {
    return persistenceState.dirtyState.hasUnsavedChanges;
  }, [persistenceState.dirtyState.hasUnsavedChanges]);

  const actions: FormPersistenceActions = {
    saveFormData,
    loadFormData,
    clearFormData,
    recoverFormData,
    startAutoSave,
    stopAutoSave,
    markAsSaved,
    showUnsavedChangesWarning,
  };

  return [persistenceState, actions];
}

// ==============================================
// UNSAVED CHANGES WARNING HOOK
// ==============================================

export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(message);
        if (!confirmLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, message]);
}

// ==============================================
// AUTO-SAVE STATUS HOOK
// ==============================================

export function useAutoSaveStatus(
  lastAutoSave: number | null,
  autoSaveEnabled: boolean
): {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveText: string;
} {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!autoSaveEnabled) {
      setStatus('idle');
      return;
    }

    if (lastAutoSave) {
      setStatus('saved');
      
      // Reset to idle after 3 seconds
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [lastAutoSave, autoSaveEnabled]);

  const lastSaveText = lastAutoSave 
    ? `Last saved ${formatTimeDuration(Date.now() - lastAutoSave)}`
    : 'Not saved yet';

  return { status, lastSaveText };
}