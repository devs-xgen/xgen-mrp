import { z } from "zod";
import { EnhancedBillingStatementFormData } from "@/types/admin/billing-types";
import { BillingFormStep, BillingFormUIState } from "@/types/admin/billing-form-steps";

// ==============================================
// FORM PERSISTENCE TYPES
// ==============================================

export interface FormPersistenceData {
  formData: Partial<EnhancedBillingStatementFormData>;
  uiState: Partial<BillingFormUIState>;
  timestamp: number;
  version: string;
  sessionId: string;
}

export interface FormRecoveryOptions {
  maxAge?: number; // Maximum age in milliseconds (default: 24 hours)
  validateOnRecover?: boolean; // Validate data on recovery (default: true)
  clearOnSubmit?: boolean; // Clear persistence on successful submit (default: true)
}

export interface FormPersistenceConfig {
  storageKey: string;
  autoSaveInterval?: number; // Auto-save interval in milliseconds (default: 30 seconds)
  maxStorageSize?: number; // Maximum storage size in bytes (default: 1MB)
  enableCompression?: boolean; // Enable data compression (default: false)
}

// ==============================================
// FORM PERSISTENCE UTILITIES
// ==============================================

const DEFAULT_CONFIG: Required<FormPersistenceConfig> = {
  storageKey: 'billing-form-state',
  autoSaveInterval: 30000, // 30 seconds
  maxStorageSize: 1024 * 1024, // 1MB
  enableCompression: false,
};

const DEFAULT_RECOVERY_OPTIONS: Required<FormRecoveryOptions> = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  validateOnRecover: true,
  clearOnSubmit: true,
};

export class FormPersistenceManager {
  private config: Required<FormPersistenceConfig>;
  private recoveryOptions: Required<FormRecoveryOptions>;
  private sessionId: string;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(
    config: Partial<FormPersistenceConfig> = {},
    recoveryOptions: Partial<FormRecoveryOptions> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.recoveryOptions = { ...DEFAULT_RECOVERY_OPTIONS, ...recoveryOptions };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private compressData(data: string): string {
    // Simple compression using JSON.stringify optimization
    // In a real implementation, you might use a compression library
    return data;
  }

  private decompressData(data: string): string {
    // Simple decompression
    return data;
  }

  private validateStorageSize(data: string): boolean {
    const sizeInBytes = new Blob([data]).size;
    return sizeInBytes <= this.config.maxStorageSize;
  }

  /**
   * Save form data to local storage
   */
  saveFormData(
    formData: Partial<EnhancedBillingStatementFormData>,
    uiState: Partial<BillingFormUIState>
  ): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('Local storage is not available for form persistence');
      return false;
    }

    try {
      const persistenceData: FormPersistenceData = {
        formData,
        uiState,
        timestamp: Date.now(),
        version: '1.0.0',
        sessionId: this.sessionId,
      };

      const serializedData = JSON.stringify(persistenceData);
      
      if (!this.validateStorageSize(serializedData)) {
        console.warn('Form data exceeds maximum storage size');
        return false;
      }

      const compressedData = this.config.enableCompression 
        ? this.compressData(serializedData)
        : serializedData;

      localStorage.setItem(this.config.storageKey, compressedData);
      return true;
    } catch (error) {
      console.error('Failed to save form data:', error);
      return false;
    }
  }

  /**
   * Load form data from local storage
   */
  loadFormData(): FormPersistenceData | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const storedData = localStorage.getItem(this.config.storageKey);
      if (!storedData) {
        return null;
      }

      const decompressedData = this.config.enableCompression
        ? this.decompressData(storedData)
        : storedData;

      const persistenceData: FormPersistenceData = JSON.parse(decompressedData);

      // Check if data is too old
      const age = Date.now() - persistenceData.timestamp;
      if (age > this.recoveryOptions.maxAge) {
        this.clearFormData();
        return null;
      }

      return persistenceData;
    } catch (error) {
      console.error('Failed to load form data:', error);
      try {
        this.clearFormData(); // Clear corrupted data
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError);
      }
      return null;
    }
  }

  /**
   * Clear form data from local storage
   */
  clearFormData(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      console.error('Failed to clear form data:', error);
    }
  }

  /**
   * Check if there is recoverable form data
   */
  hasRecoverableData(): boolean {
    const data = this.loadFormData();
    return data !== null;
  }

  /**
   * Get form data age in milliseconds
   */
  getFormDataAge(): number | null {
    const data = this.loadFormData();
    if (!data) {
      return null;
    }
    return Date.now() - data.timestamp;
  }

  /**
   * Start auto-save functionality
   */
  startAutoSave(
    getFormData: () => Partial<EnhancedBillingStatementFormData>,
    getUIState: () => Partial<BillingFormUIState>
  ): void {
    this.stopAutoSave(); // Clear any existing timer

    this.autoSaveTimer = setInterval(() => {
      const formData = getFormData();
      const uiState = getUIState();
      
      // Only save if form is dirty
      if (uiState.isDirty) {
        this.saveFormData(formData, uiState);
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Validate recovered form data
   */
  validateRecoveredData(data: FormPersistenceData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.recoveryOptions.validateOnRecover) {
      return { isValid: true, errors, warnings };
    }

    try {
      // Basic structure validation
      if (!data.formData || typeof data.formData !== 'object') {
        errors.push('Invalid form data structure');
      }

      if (!data.uiState || typeof data.uiState !== 'object') {
        errors.push('Invalid UI state structure');
      }

      // Check for required fields based on billing type
      const formData = data.formData;
      if (formData.billingType) {
        switch (formData.billingType) {
          case 'direct-customer':
            if (!formData.customerId) {
              warnings.push('Customer information may be incomplete');
            }
            break;
          case 'customer-order':
            if (!formData.customerOrderId) {
              warnings.push('Customer order selection may be incomplete');
            }
            break;
          case 'manual-customer':
            if (!formData.customerName) {
              warnings.push('Customer name may be missing');
            }
            break;
        }
      }

      // Check invoice items
      if (formData.invoiceItems && Array.isArray(formData.invoiceItems)) {
        const validItems = formData.invoiceItems.filter(item => 
          item && item.description && item.quantity > 0 && item.unitPrice >= 0
        );
        
        if (validItems.length === 0 && formData.invoiceItems.length > 0) {
          warnings.push('Invoice items may need to be reviewed');
        }
      }

      // Check financial data consistency
      if (formData.subtotal !== undefined && formData.invoiceItems) {
        const calculatedSubtotal = formData.invoiceItems.reduce((sum, item) => {
          if (!item || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
            return sum;
          }
          const itemTotal = item.quantity * item.unitPrice;
          const discountAmount = item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0;
          return sum + (itemTotal - discountAmount);
        }, 0);

        if (Math.abs(formData.subtotal - calculatedSubtotal) > 0.01) {
          warnings.push('Financial calculations may need to be recalculated');
        }
      }

    } catch (error) {
      errors.push('Failed to validate recovered data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    used: number;
    available: number;
    percentage: number;
  } {
    if (!this.isLocalStorageAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      const data = localStorage.getItem(this.config.storageKey);
      const used = data ? new Blob([data]).size : 0;
      const available = this.config.maxStorageSize - used;
      const percentage = (used / this.config.maxStorageSize) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

// ==============================================
// FORM DIRTY STATE TRACKING
// ==============================================

export interface FormDirtyState {
  isDirty: boolean;
  dirtyFields: Set<string>;
  lastSaved: number | null;
  hasUnsavedChanges: boolean;
}

export class FormDirtyTracker {
  private dirtyState: FormDirtyState = {
    isDirty: false,
    dirtyFields: new Set(),
    lastSaved: null,
    hasUnsavedChanges: false,
  };

  private initialValues: Record<string, any> = {};
  private listeners: Array<(state: FormDirtyState) => void> = [];

  /**
   * Set initial form values for comparison
   */
  setInitialValues(values: Record<string, any>): void {
    this.initialValues = { ...values };
    this.dirtyState = {
      isDirty: false,
      dirtyFields: new Set(),
      lastSaved: Date.now(),
      hasUnsavedChanges: false,
    };
    this.notifyListeners();
  }

  /**
   * Update field value and track dirty state
   */
  updateField(fieldName: string, value: any): void {
    const initialValue = this.initialValues[fieldName];
    const isDifferent = !this.deepEqual(value, initialValue);

    if (isDifferent) {
      this.dirtyState.dirtyFields.add(fieldName);
    } else {
      this.dirtyState.dirtyFields.delete(fieldName);
    }

    this.dirtyState.isDirty = this.dirtyState.dirtyFields.size > 0;
    this.dirtyState.hasUnsavedChanges = this.dirtyState.isDirty;

    this.notifyListeners();
  }

  /**
   * Mark form as saved
   */
  markAsSaved(): void {
    this.dirtyState.lastSaved = Date.now();
    this.dirtyState.hasUnsavedChanges = false;
    this.notifyListeners();
  }

  /**
   * Reset dirty state
   */
  reset(): void {
    this.dirtyState = {
      isDirty: false,
      dirtyFields: new Set(),
      lastSaved: null,
      hasUnsavedChanges: false,
    };
    this.initialValues = {};
    this.notifyListeners();
  }

  /**
   * Get current dirty state
   */
  getState(): FormDirtyState {
    return { ...this.dirtyState, dirtyFields: new Set(this.dirtyState.dirtyFields) };
  }

  /**
   * Add listener for dirty state changes
   */
  addListener(listener: (state: FormDirtyState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;

    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in dirty state listener:', error);
      }
    });
  }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Format time duration for display
 */
export function formatTimeDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Format storage size for display
 */
export function formatStorageSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}