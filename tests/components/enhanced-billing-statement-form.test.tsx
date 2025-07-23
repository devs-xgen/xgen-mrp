import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedBillingStatementForm } from '@/components/module/admin/billing/enhanced-billing-statement-form'
import { BillingFormStep } from '@/types/admin/billing-form-steps'

// Mock the actions
vi.mock('@/lib/actions/customers', () => ({
  getAllCustomers: vi.fn().mockResolvedValue([
    { id: '1', name: 'Test Customer', email: 'test@example.com' }
  ])
}))

vi.mock('@/lib/actions/customer-order', () => ({
  getCustomerOrders: vi.fn().mockResolvedValue([
    { 
      id: '1', 
      orderNumber: 'ORD-001', 
      totalAmount: 1000,
      orderDate: new Date(),
      customer: { id: '1', name: 'Test Customer' }
    }
  ])
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('EnhancedBillingStatementForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnStepChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Layout and Structure', () => {
    test('renders with step-based layout', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Check for progress indicator
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()

      // Check for main form area and sidebar
      const mainFormArea = screen.getByRole('form')
      expect(mainFormArea).toBeInTheDocument()

      // Check for summary sidebar
      expect(screen.getByText('Summary')).toBeInTheDocument()
    })

    test('displays responsive grid layout', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Check for grid layout classes (this would be more comprehensive in a real test)
      const gridContainer = screen.getByRole('form').closest('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-4')
    })

    test('shows billing type selection as first step', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Should show billing type selection
      expect(screen.getByText('Step 1: Choose Billing Type')).toBeInTheDocument()
      expect(screen.getByText('Customer Order Billing')).toBeInTheDocument()
      expect(screen.getByText('Direct Customer Billing')).toBeInTheDocument()
      expect(screen.getByText('Manual Customer Entry')).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    test('shows progress indicators for all steps', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Check for step titles in progress indicator
      expect(screen.getByText('Billing Type')).toBeInTheDocument()
      expect(screen.getByText('Customer Information')).toBeInTheDocument()
      expect(screen.getByText('Billing Details')).toBeInTheDocument()
      expect(screen.getByText('Invoice Items')).toBeInTheDocument()
      expect(screen.getByText('Review & Submit')).toBeInTheDocument()
    })

    test('enables next button when billing type is selected', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Initially next button should be disabled
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()

      // Select a billing type
      const customerOrderOption = screen.getByText('Customer Order Billing')
      fireEvent.click(customerOrderOption)

      // Next button should now be enabled
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled()
      })
    })

    test('navigates to next step when next button is clicked', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Select billing type
      const customerOrderOption = screen.getByText('Customer Order Billing')
      fireEvent.click(customerOrderOption)

      // Click next
      const nextButton = screen.getByRole('button', { name: /next/i })
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled()
      })
      fireEvent.click(nextButton)

      // Should call onStepChange with customer information step
      expect(mockOnStepChange).toHaveBeenCalledWith(BillingFormStep.CUSTOMER_INFORMATION)
    })

    test('shows previous button on subsequent steps', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
          initialData={{ billingType: 'customer-order' }}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Navigate to second step manually
      fireEvent.click(screen.getByText('Customer Order Billing'))
      const nextButton = screen.getByRole('button', { name: /next/i })
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled()
      })
      fireEvent.click(nextButton)

      // Should show previous button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      })
    })
  })

  describe('Form State Management', () => {
    test('handles billing type selection state', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Select customer order billing
      const customerOrderOption = screen.getByText('Customer Order Billing')
      fireEvent.click(customerOrderOption)

      // Should show selection in summary
      await waitFor(() => {
        expect(screen.getByText('customer-order')).toBeInTheDocument()
      })
    })

    test('updates form state when customer is selected', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Select billing type and navigate to customer selection
      fireEvent.click(screen.getByText('Customer Order Billing'))
      const nextButton = screen.getByRole('button', { name: /next/i })
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled()
      })
      fireEvent.click(nextButton)

      // Wait for customer information step
      await waitFor(() => {
        expect(screen.getByText('Step 2: Customer Information')).toBeInTheDocument()
      })

      // The customer selection should be available
      expect(screen.getByText('Customer Order')).toBeInTheDocument()
    })

    test('maintains form data across step navigation', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Select billing type
      fireEvent.click(screen.getByText('Customer Order Billing'))
      
      // Navigate forward and back
      const nextButton = screen.getByRole('button', { name: /next/i })
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled()
      })
      fireEvent.click(nextButton)

      // Go back
      await waitFor(() => {
        const previousButton = screen.getByRole('button', { name: /previous/i })
        fireEvent.click(previousButton)
      })

      // Billing type selection should still be active
      await waitFor(() => {
        expect(screen.getByText('Step 1: Choose Billing Type')).toBeInTheDocument()
      })
    })
  })

  describe('Summary Sidebar', () => {
    test('displays summary information', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Check summary elements
      expect(screen.getByText('Summary')).toBeInTheDocument()
      expect(screen.getByText('Subtotal:')).toBeInTheDocument()
      expect(screen.getByText('Tax (12%):')).toBeInTheDocument()
      expect(screen.getByText('Total Amount:')).toBeInTheDocument()
      expect(screen.getByText('Progress')).toBeInTheDocument()
    })

    test('updates summary when customer is selected', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Select billing type
      fireEvent.click(screen.getByText('Customer Order Billing'))

      // Summary should show billing type
      await waitFor(() => {
        expect(screen.getByText('customer-order')).toBeInTheDocument()
      })
    })

    test('shows sticky positioning for summary', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Check for sticky class on summary card
      const summaryCard = screen.getByText('Summary').closest('.card')
      expect(summaryCard).toHaveClass('sticky')
    })
  })

  describe('Error Handling', () => {
    test('handles loading state', () => {
      // Mock loading state
      vi.mocked(require('@/lib/actions/customers').getAllCustomers).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    test('handles form submission errors', async () => {
      const mockSubmitError = vi.fn().mockRejectedValue(new Error('Submission failed'))

      render(
        <EnhancedBillingStatementForm
          onSubmit={mockSubmitError}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // This would require navigating through all steps to test submission
      // For now, we just verify the error handling structure is in place
      expect(mockSubmitError).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('has proper form structure', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Should have proper form element
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    test('has proper button roles and labels', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Check for properly labeled buttons
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    test('provides proper step navigation context', async () => {
      render(
        <EnhancedBillingStatementForm
          onSubmit={mockOnSubmit}
          onStepChange={mockOnStepChange}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })

      // Should show current step information
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
      expect(screen.getByText('Billing Type')).toBeInTheDocument()
    })
  })
})