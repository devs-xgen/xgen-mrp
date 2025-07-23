import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BillingFormNavigation } from '@/components/module/admin/billing/form-steps/billing-form-navigation'
import { BillingFormStep } from '@/types/admin/billing-form-steps'

describe('BillingFormNavigation', () => {
  const mockOnStepChange = vi.fn()
  const mockOnNext = vi.fn()
  const mockOnPrevious = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Navigation Buttons', () => {
    test('shows only next button on first step', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
        />
      )

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
    })

    test('shows both previous and next buttons on middle steps', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          onStepChange={mockOnStepChange}
        />
      )

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    })

    test('shows submit button on last step', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.REVIEW_SUBMIT}
          completedSteps={[
            BillingFormStep.BILLING_TYPE_SELECTION,
            BillingFormStep.CUSTOMER_INFORMATION,
            BillingFormStep.BILLING_DETAILS,
            BillingFormStep.INVOICE_ITEMS
          ]}
          onStepChange={mockOnStepChange}
          isLastStep={true}
        />
      )

      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    test('disables next button when canProceedToNext is false', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
          canProceedToNext={false}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    test('enables next button when canProceedToNext is true', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
          canProceedToNext={true}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).not.toBeDisabled()
    })

    test('disables all buttons when disabled prop is true', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          onStepChange={mockOnStepChange}
          disabled={true}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      const previousButton = screen.getByRole('button', { name: /previous/i })
      
      expect(nextButton).toBeDisabled()
      expect(previousButton).toBeDisabled()
    })

    test('shows submitting state on submit button', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.REVIEW_SUBMIT}
          completedSteps={[
            BillingFormStep.BILLING_TYPE_SELECTION,
            BillingFormStep.CUSTOMER_INFORMATION,
            BillingFormStep.BILLING_DETAILS,
            BillingFormStep.INVOICE_ITEMS
          ]}
          onStepChange={mockOnStepChange}
          isLastStep={true}
          isSubmitting={true}
        />
      )

      expect(screen.getByText('Submitting...')).toBeInTheDocument()
    })
  })

  describe('Click Handlers', () => {
    test('calls onNext when next button is clicked', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
          onNext={mockOnNext}
          canProceedToNext={true}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      expect(mockOnNext).toHaveBeenCalledTimes(1)
    })

    test('calls onPrevious when previous button is clicked', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          onStepChange={mockOnStepChange}
          onPrevious={mockOnPrevious}
        />
      )

      const previousButton = screen.getByRole('button', { name: /previous/i })
      fireEvent.click(previousButton)

      expect(mockOnPrevious).toHaveBeenCalledTimes(1)
    })

    test('calls onSubmit when submit button is clicked', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.REVIEW_SUBMIT}
          completedSteps={[
            BillingFormStep.BILLING_TYPE_SELECTION,
            BillingFormStep.CUSTOMER_INFORMATION,
            BillingFormStep.BILLING_DETAILS,
            BillingFormStep.INVOICE_ITEMS
          ]}
          onStepChange={mockOnStepChange}
          onSubmit={mockOnSubmit}
          isLastStep={true}
          canProceedToNext={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /submit/i })
      fireEvent.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    test('calls onStepChange when no custom handlers provided', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
          canProceedToNext={true}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      expect(mockOnStepChange).toHaveBeenCalledWith(BillingFormStep.CUSTOMER_INFORMATION)
    })
  })

  describe('Step Information Display', () => {
    test('displays current step title and description', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
        />
      )

      expect(screen.getByText('Billing Type')).toBeInTheDocument()
      expect(screen.getByText('Choose how you want to create the billing statement')).toBeInTheDocument()
    })

    test('updates step information when current step changes', () => {
      const { rerender } = render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
        />
      )

      expect(screen.getByText('Billing Type')).toBeInTheDocument()

      rerender(
        <BillingFormNavigation
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          onStepChange={mockOnStepChange}
        />
      )

      expect(screen.getByText('Customer Information')).toBeInTheDocument()
      expect(screen.getByText('Select or enter customer details')).toBeInTheDocument()
    })
  })

  describe('Navigation Logic', () => {
    test('prevents navigation to next step when current step not completed', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          onStepChange={mockOnStepChange}
          canProceedToNext={false}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    test('allows navigation to previous step', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          onStepChange={mockOnStepChange}
        />
      )

      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).not.toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    test('has proper button roles and labels', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          onStepChange={mockOnStepChange}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      const previousButton = screen.getByRole('button', { name: /previous/i })

      expect(nextButton).toHaveAttribute('type', 'button')
      expect(previousButton).toHaveAttribute('type', 'button')
    })

    test('provides proper navigation context', () => {
      render(
        <BillingFormNavigation
          currentStep={BillingFormStep.BILLING_DETAILS}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION, BillingFormStep.CUSTOMER_INFORMATION]}
          onStepChange={mockOnStepChange}
        />
      )

      // Should show current step information
      expect(screen.getByText('Billing Details')).toBeInTheDocument()
      expect(screen.getByText('Set dates, terms, and basic information')).toBeInTheDocument()
    })

    test('has proper layout structure', () => {
      const { container } = render(
        <BillingFormNavigation
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          onStepChange={mockOnStepChange}
        />
      )

      // Should have proper flex layout
      const navigationContainer = container.firstChild
      expect(navigationContainer).toHaveClass('flex', 'items-center', 'justify-between')
    })
  })
})