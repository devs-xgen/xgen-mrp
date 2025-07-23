import { useState, useCallback, useEffect } from "react";
import { z } from "zod";

export interface ValidationError {
  field: string;
  message: string;
  type: 'validation' | 'server' | 'network';
}

export interface ValidationState {
  errors: Record<string, string | string[]>;
  isValid: boolean;
  isValidating: boolean;
  hasErrors: boolean;
  touchedFields: Set<string>;
}

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  revalidateMode?: 'onChange' | 'onBlur';
  debounceMs?: number;
  validateOnMount?: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  mode = 'onBlur',
  revalidateMode = 'onChange',
  debounceMs = 300,
  validateOnMount = false
}: UseFormValidationOptions<T>) {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: false,
    isValidating: false,
    hasErrors: false,
    touchedFields: new Set()
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const validateField = useCallback(async (
    fieldName: string, 
    value: any, 
    allData: T
  ): Promise<string | null> => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.pick({ [fieldName]: true } as any);
      await fieldSchema.parseAsync({ [fieldName]: value });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => 
          err.path.length > 0 && err.path[0] === fieldName
        );
        return fieldError?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  }, [schema]);

  const validateForm = useCallback(async (data: T): Promise<{
    isValid: boolean;
    errors: Record<string, string | string[]>;
  }> => {
    try {
      await schema.parseAsync(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string | string[]> = {};
        
        error.errors.forEach(err => {
          const fieldPath = err.path.join('.');
          if (!errors[fieldPath]) {
            errors[fieldPath] = err.message;
          } else if (Array.isArray(errors[fieldPath])) {
            (errors[fieldPath] as string[]).push(err.message);
          } else {
            errors[fieldPath] = [errors[fieldPath] as string, err.message];
          }
        });
        
        return { isValid: false, errors };
      }
      return { 
        isValid: false, 
        errors: { _form: 'Validation failed' }
      };
    }
  }, [schema]);

  const validateFieldAsync = useCallback((
    fieldName: string,
    value: any,
    allData: T,
    immediate = false
  ) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const performValidation = async () => {
      setValidationState(prev => ({ ...prev, isValidating: true }));
      
      try {
        const error = await validateField(fieldName, value, allData);
        
        setValidationState(prev => {
          const newErrors = { ...prev.errors };
          
          if (error) {
            newErrors[fieldName] = error;
          } else {
            delete newErrors[fieldName];
          }
          
          return {
            ...prev,
            errors: newErrors,
            hasErrors: Object.keys(newErrors).length > 0,
            isValidating: false,
            touchedFields: new Set([...prev.touchedFields, fieldName])
          };
        });
      } catch (err) {
        setValidationState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [fieldName]: 'Validation error occurred'
          },
          hasErrors: true,
          isValidating: false,
          touchedFields: new Set([...prev.touchedFields, fieldName])
        }));
      }
    };

    if (immediate || debounceMs === 0) {
      performValidation();
    } else {
      const timer = setTimeout(performValidation, debounceMs);
      setDebounceTimer(timer);
    }
  }, [debounceTimer, debounceMs, validateField]);

  const validateFormAsync = useCallback(async (data: T) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await validateForm(data);
      
      setValidationState(prev => ({
        ...prev,
        errors: result.errors,
        isValid: result.isValid,
        hasErrors: !result.isValid,
        isValidating: false
      }));
      
      return result;
    } catch (err) {
      const errorState = {
        errors: { _form: 'Validation failed' },
        isValid: false,
        hasErrors: true,
        isValidating: false
      };
      
      setValidationState(prev => ({ ...prev, ...errorState }));
      return errorState;
    }
  }, [validateForm]);

  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[fieldName];
      
      return {
        ...prev,
        errors: newErrors,
        hasErrors: Object.keys(newErrors).length > 0
      };
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      errors: {},
      hasErrors: false,
      isValid: false
    }));
  }, []);

  const setServerError = useCallback((fieldName: string, message: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: message
      },
      hasErrors: true,
      isValid: false
    }));
  }, []);

  const setServerErrors = useCallback((errors: Record<string, string>) => {
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        ...errors
      },
      hasErrors: true,
      isValid: false
    }));
  }, []);

  const markFieldTouched = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, fieldName])
    }));
  }, []);

  const isFieldTouched = useCallback((fieldName: string) => {
    return validationState.touchedFields.has(fieldName);
  }, [validationState.touchedFields]);

  const getFieldError = useCallback((fieldName: string) => {
    return validationState.errors[fieldName];
  }, [validationState.errors]);

  const hasFieldError = useCallback((fieldName: string) => {
    return !!validationState.errors[fieldName];
  }, [validationState.errors]);

  // Initialize validation on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      // This would need initial data to validate
      // Implementation depends on how the hook is used
    }
  }, [validateOnMount]);

  return {
    // State
    ...validationState,
    
    // Field validation
    validateField: validateFieldAsync,
    clearFieldError,
    markFieldTouched,
    isFieldTouched,
    getFieldError,
    hasFieldError,
    
    // Form validation
    validateForm: validateFormAsync,
    clearAllErrors,
    
    // Server errors
    setServerError,
    setServerErrors,
  };
}

// Specialized hook for step-by-step validation
export function useStepValidation<T extends Record<string, any>>(
  schemas: Record<string, z.ZodSchema<any>>,
  currentStep: string
) {
  const currentSchema = schemas[currentStep];
  
  const validation = useFormValidation<T>({
    schema: currentSchema,
    mode: 'onChange',
    revalidateMode: 'onChange',
    debounceMs: 300
  });

  const validateCurrentStep = useCallback(async (data: T) => {
    if (!currentSchema) {
      return { isValid: true, errors: {} };
    }
    
    return validation.validateForm(data);
  }, [currentSchema, validation.validateForm]);

  const canProceedToNextStep = useCallback((data: T) => {
    if (!currentSchema) return true;
    
    try {
      currentSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }, [currentSchema]);

  return {
    ...validation,
    validateCurrentStep,
    canProceedToNextStep,
    currentStepSchema: currentSchema
  };
}