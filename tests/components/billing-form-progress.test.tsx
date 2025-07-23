import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BillingFormProgress } from '@/components/module/admin/billing/form-steps/billing-form-progress'
import { BillingFormStep } from '@/types/admin/billing-form-steps'

describe('BillingFormProgress', () => {
  const totalSteps = 5

  describe('Progress Bar', () => {
    test('shows correct progress percentage for first step', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          totalSteps={totalSteps}
        />
      )

      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    })

    test('shows correct progress percentage for middle step', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_DETAILS}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION, BillingFormStep.CUSTOMER_INFORMATION]}
          totalSteps={totalSteps}
        />
      )

      expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()
    })

    test('shows correct progress percentage for last step', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.REVIEW_SUBMIT}
          completedSteps={[
            BillingFormStep.BILLING_TYPE_SELECTION,
            BillingFormStep.CUSTOMER_INFORMATION,
            BillingFormStep.BILLING_DETAILS,
            BillingFormStep.INVOICE_ITEMS
          ]}
          totalSteps={totalSteps}
        />
      )

      expect(screen.getByText('Step 5 of 5')).toBeInTheDocument()
    })
  })

  describe('Step Indicators', () => {
    test('displays all step titles', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          totalSteps={totalSteps}
        />
      )

      expect(screen.getByText('Billing Type')).toBeInTheDocument()
      expect(screen.getByText('Customer Information')).toBeInTheDocument()
      expect(screen.getByText('Billing Details')).toBeInTheDocument()
      expect(screen.getByText('Invoice Items')).toBeInTheDocument()
      expect(screen.getByText('Review & Submit')).toBeInTheDocument()
    })

    test('highlights current step', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          totalSteps={totalSteps}
        />
      )

      // Current step should have primary styling
      const customerInfoStep = screen.getByText('Customer Information')
      expect(customerInfoStep).toHaveClass('text-primary')
    })

    test('shows completed steps with check marks', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_DETAILS}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION, BillingFormStep.CUSTOMER_INFORMATION]}
          totalSteps={totalSteps}
        />
      )

      // Completed steps should show check icons
      const checkIcons = screen.getAllByTestId('check-icon') // This would need to be added to the component
      expect(checkIcons).toHaveLength(2)
    })

    test('shows future steps as inactive', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          totalSteps={totalSteps}
        />
      )

      // Future steps should have muted styling
      const invoiceItemsStep = screen.getByText('Invoice Items')
      expect(invoiceItemsStep).toHaveClass('text-muted-foreground')
    })
  })

  describe('Visual States', () => {
    test('applies correct styling for current step', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_DETAILS}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION, BillingFormStep.CUSTOMER_INFORMATION]}
          totalSteps={totalSteps}
        />
      )

      const currentStepTitle = screen.getByText('Billing Details')
      expect(currentStepTitle).toHaveClass('text-primary')
    })

    test('applies correct styling for completed steps', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_DETAILS}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION, BillingFormStep.CUSTOMER_INFORMATION]}
          totalSteps={totalSteps}
        />
      )

      const completedStepTitle = screen.getByText('Billing Type')
      expect(completedStepTitle).toHaveClass('text-foreground')
    })

    test('applies correct styling for future steps', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          totalSteps={totalSteps}
        />
      )

      const futureStepTitle = screen.getByText('Review & Submit')
      expect(futureStepTitle).toHaveClass('text-muted-foreground')
    })
  })

  describe('Progress Bar Animation', () => {
    test('shows progress bar with correct width', () => {
      const { container } = render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_DETAILS} // Step 3 of 5 = 60%
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION, BillingFormStep.CUSTOMER_INFORMATION]}
          totalSteps={totalSteps}
        />
      )

      const progressBar = container.querySelector('.bg-primary')
      expect(progressBar).toHaveStyle({ width: '60%' })
    })

    test('shows 100% progress on last step', () => {
      const { container } = render(
        <BillingFormProgress
          currentStep={BillingFormStep.REVIEW_SUBMIT}
          completedSteps={[
            BillingFormStep.BILLING_TYPE_SELECTION,
            BillingFormStep.CUSTOMER_INFORMATION,
            BillingFormStep.BILLING_DETAILS,
            BillingFormStep.INVOICE_ITEMS
          ]}
          totalSteps={totalSteps}
        />
      )

      const progressBar = container.querySelector('.bg-primary')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })
  })

  describe('Accessibility', () => {
    test('provides proper step information', () => {
      render(
        <BillingFormProgress
          currentStep={BillingFormStep.CUSTOMER_INFORMATION}
          completedSteps={[BillingFormStep.BILLING_TYPE_SELECTION]}
          totalSteps={totalSteps}
        />
      )

      // Should show current step number
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
    })

    test('has proper semantic structure', () => {
      const { container } = render(
        <BillingFormProgress
          currentStep={BillingFormStep.BILLING_TYPE_SELECTION}
          completedSteps={[]}
          totalSteps={totalSteps}
        />
      )

      // Should have proper container structure
      expect(container.firstChild).toHaveClass('w-full')
    })
  })
})