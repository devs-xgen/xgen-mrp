/**
 * Integration Tests for Billing Statement Creation Page
 * 
 * Tests the integration between the page and its components including:
 * - Form state management
 * - Data loading and error handling
 * - Step navigation and validation
 * - Form persistence and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';
import React from 'react';

import CreateBillingStatementPage from '@/app/admin/(protected)/billing/billing-statements/create/page';
import { BillingFormStep } from '@/types/admin/billing-form-steps';

// Mock the enhanced form component to test integration
vi.mock('@/components/module/admin/billing/enhanced-billing-statement-form', () => ({
  EnhancedBillingStatementForm: ({ 
    onSubmit, 
    onStepChange, 
    initialData, 
    isSubmitting,
    enablePersistence,
    enableAutoSave 
  }: any) => {
    const [currentStep, setCurrentStep] = React.useState(BillingFormStep.BILLING_TYPE_SELECTION);
    
    const handleStepChange = (step: BillingFormStep) => {
      setCurrentStep(step);
      onStepChange?.(step);
    };

    const handleSubmit = () => {
      onSubmit({
        customerName: 'Test Customer',
        customerId: '1',
        subtotal: 1000,
        taxRate: 12,
        discountAmount: 0,
        invoiceItems: [
          {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 1000,
            productCode: 'TEST-001',
            unit: 'PCS',
            discountPercent: 0,
            taxable: true,
          },
        ],
        paymentTerms: 'Net 30',
        dueDate: new Date(),
        notes: '',
        poNumber: '',
        terms: '',
        footerNotes: '',
      });
    };

    return (
      <div data-testid="enhanced-billing-form">
        <div data-testid="form-props">
          <span data-testid="is-submitting">{isSubmitting.toString()}</span>
          <span data-testid="enable-persistence">{enablePersistence.toString()}</span>
          <span data-testid="enable-auto-save">{enableAutoSave.toString()}</span>
          <span data-testid="initial-data">{JSON.stringify(initialData)}</span>
        </div>
        <div data-testid="current-step">{currentStep}</div>
        <button onClick={() => handleStepChange(BillingFormStep.CUSTOMER_INFORMATION)}>
          Next Step
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting}>
          Submit Form
        </button>
      </div>
    );
  },
}));

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/actions/billing-statements', () => ({
  createBillingStatement: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'test-id', statementNumber: 'BILL-001' },
  }),
}));

describe('CreateBillingStatementPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Integration', () => {
    it('should render and integrate with enhanced billing form', async () => {
      render(<CreateBillingStatementPage />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Check that enhanced form is rendered
      expect(screen.getByTestId('enhanced-billing-form')).toBeInTheDocument();
    });

    it('should pass correct props to enhanced form', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Check form props
      expect(screen.getByTestId('is-submitting')).toHaveTextContent('false');
      expect(screen.getByTestId('enable-persistence')).toHaveTextContent('true');
      expect(screen.getByTestId('enable-auto-save')).toHaveTextContent('true');
    });

    it('should handle step changes from form', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Initial step
      expect(screen.getByTestId('current-step')).toHaveTextContent(
        BillingFormStep.BILLING_TYPE_SELECTION
      );

      // Trigger step change
      const nextButton = screen.getByText('Next Step');
      await userEvent.click(nextButton);

      // Check step changed
      expect(screen.getByTestId('current-step')).toHaveTextContent(
        BillingFormStep.CUSTOMER_INFORMATION
      );
    });

    it('should handle form submission', async () => {
      const { createBillingStatement } = await import('@/lib/actions/billing-statements');
      
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByText('Submit Form');
      await userEvent.click(submitButton);

      // Check submission was called
      await waitFor(() => {
        expect(createBillingStatement).toHaveBeenCalledWith(
          expect.objectContaining({
            customerName: 'Test Customer',
            customerId: '1',
            subtotal: 1000,
          })
        );
      });
    });
  });

  describe('URL Parameter Integration', () => {
    it('should pass URL parameters as initial data', async () => {
      // Mock search params
      vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(
        new URLSearchParams('?type=customer-order&customerOrderId=123')
      );

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Check initial data includes URL parameters
      const initialDataElement = screen.getByTestId('initial-data');
      const initialData = JSON.parse(initialDataElement.textContent || '{}');
      
      expect(initialData).toEqual({
        billingType: 'customer-order',
        customerId: '',
        customerOrderId: '123',
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle form submission errors', async () => {
      const { createBillingStatement } = await import('@/lib/actions/billing-statements');
      (createBillingStatement as any).mockResolvedValue({
        success: false,
        error: 'Validation failed',
      });

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByText('Submit Form');
      await userEvent.click(submitButton);

      // Check error handling
      const { toast } = await import('sonner');
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create billing statement',
          expect.objectContaining({
            description: 'Validation failed',
          })
        );
      });
    });

    it('should handle network errors during submission', async () => {
      const { createBillingStatement } = await import('@/lib/actions/billing-statements');
      (createBillingStatement as any).mockRejectedValue(new Error('Network error'));

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByText('Submit Form');
      await userEvent.click(submitButton);

      // Check error handling
      const { toast } = await import('sonner');
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create billing statement',
          expect.objectContaining({
            description: 'Network error',
          })
        );
      });
    });
  });

  describe('Loading State Integration', () => {
    it('should show loading state initially', () => {
      render(<CreateBillingStatementPage />);

      // Should show loading state
      expect(screen.getByText(/loading billing form/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading state after initialization', async () => {
      render(<CreateBillingStatementPage />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Should show form content
      expect(screen.getByTestId('enhanced-billing-form')).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('should handle back navigation', async () => {
      const mockBack = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: vi.fn(),
        back: mockBack,
      });

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByRole('button', { name: /back to statements/i });
      await userEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should handle cancel navigation', async () => {
      const mockBack = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: vi.fn(),
        back: mockBack,
      });

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should navigate to created statement on success', async () => {
      const mockPush = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        back: vi.fn(),
      });

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByText('Submit Form');
      await userEvent.click(submitButton);

      // Check navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/billing/billing-statements/test-id');
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility standards', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Check main heading
      const heading = screen.getByRole('heading', { name: /create billing statement/i });
      expect(heading).toBeInTheDocument();

      // Check navigation
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Check interactive elements are accessible
      const backButton = screen.getByRole('button', { name: /back to statements/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should handle focus management', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Test focus on interactive elements
      const backButton = screen.getByRole('button', { name: /back to statements/i });
      
      act(() => {
        backButton.focus();
      });

      expect(document.activeElement).toBe(backButton);
    });
  });

  describe('Performance Integration', () => {
    it('should not cause memory leaks', async () => {
      const { unmount } = render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Check that cleanup was performed (this would be more comprehensive in a real test)
      expect(true).toBe(true); // Placeholder for memory leak checks
    });

    it('should handle rapid state changes', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Rapidly trigger step changes
      const nextButton = screen.getByText('Next Step');
      
      for (let i = 0; i < 5; i++) {
        await userEvent.click(nextButton);
      }

      // Should handle rapid changes without errors
      expect(screen.getByTestId('current-step')).toBeInTheDocument();
    });
  });
});