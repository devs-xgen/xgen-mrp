import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

/**
 * Simple form persistence hook for any form type
 * Saves form data to localStorage and restores it on mount
 */
export function useFormPersistence<T extends Record<string, any>>(
  key: string,
  form: UseFormReturn<T>
) {
  // Load saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`form-${key}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Only restore if data is valid
        if (parsedData && typeof parsedData === 'object') {
          Object.entries(parsedData).forEach(([field, value]) => {
            if (value !== undefined && value !== null) {
              form.setValue(field as keyof T, value);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
  }, [key, form]);

  // Save form data on changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      try {
        localStorage.setItem(`form-${key}`, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, [key, form]);

  // Clear saved data function
  const clearSavedData = () => {
    try {
      localStorage.removeItem(`form-${key}`);
    } catch (error) {
      console.warn('Failed to clear saved form data:', error);
    }
  };

  return { clearSavedData };
}
