import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { 
  InvoiceItemValidation, 
  InvoiceItemValidationSummary 
} from '@/components/module/admin/billing/invoice-items/invoice-item-validation'

describe('InvoiceItemValidation', () => {
  describe('Error Display', () => {
    test('renders errors when provided', () => {
      const errors = [
        'Description is required',
        'Quantity must be greater than 0',
        'Unit price cannot be negative',
      ]
      
      render(<InvoiceItemValidation errors={errors} />)
      
      expect(screen.getByText('Invoice Items Validation Errors')).toBeInTheDocument()
      expect(screen.getByText('3 errors')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
      expect(screen.getByText('Unit price cannot be negative')).toBeInTheDocument()
    })

    test('renders single error correctly', () => {
      const errors = ['Description is required']
      
      render(<InvoiceItemValidation errors={errors} />)
      
      expect(screen.getByText('1 error')).toBeInTheDocument()
    })

    test('uses destructive styling for errors', () => {
      const errors = ['Test error']
      const { container } = render(<InvoiceItemValidation errors={errors} />)
      
      const alert = container.querySelector('[data-variant="destructive"]')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('Warning Display', () => {
    test('renders warnings when provided', () => {
      const warnings = [
        'Large discount applied',
        'High quantity detected',
      ]
      
      render(<InvoiceItemValidation errors={[]} warnings={warnings} />)
      
      expect(screen.getByText('Invoice Items Warnings')).toBeInTheDocument()
      expect(screen.getByText('2 warnings')).toBeInTheDocument()
      expect(screen.getByText('Large discount applied')).toBeInTheDocument()
      expect(screen.getByText('High quantity detected')).toBeInTheDocument()
    })

    test('renders single warning correctly', () => {
      const warnings = ['Test warning']
      
      render(<InvoiceItemValidation errors={[]} warnings={warnings} />)
      
      expect(screen.getByText('1 warning')).toBeInTheDocument()
    })

    test('uses warning styling for warnings', () => {
      const warnings = ['Test warning']
      const { container } = render(<InvoiceItemValidation errors={[]} warnings={warnings} />)
      
      const alert = container.querySelector('.border-yellow-200')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('Success Display', () => {
    test('shows success message when showSuccess is true and no errors/warnings', () => {
      render(<InvoiceItemValidation errors={[]} warnings={[]} showSuccess={true} />)
      
      expect(screen.getByText('All invoice items are valid and ready for submission.')).toBeInTheDocument()
    })

    test('does not show success when there are errors', () => {
      render(<InvoiceItemValidation errors={['Test error']} warnings={[]} showSuccess={true} />)
      
      expect(screen.queryByText('All invoice items are valid and ready for submission.')).not.toBeInTheDocument()
    })

    test('does not show success when there are warnings', () => {
      render(<InvoiceItemValidation errors={[]} warnings={['Test warning']} showSuccess={true} />)
      
      expect(screen.queryByText('All invoice items are valid and ready for submission.')).not.toBeInTheDocument()
    })

    test('uses success styling for success message', () => {
      const { container } = render(<InvoiceItemValidation errors={[]} warnings={[]} showSuccess={true} />)
      
      const alert = container.querySelector('.border-green-200')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    test('renders nothing when no errors, warnings, or success', () => {
      const { container } = render(<InvoiceItemValidation errors={[]} warnings={[]} showSuccess={false} />)
      
      expect(container.firstChild).toBeNull()
    })

    test('renders nothing when showSuccess is not provided and no errors/warnings', () => {
      const { container } = render(<InvoiceItemValidation errors={[]} warnings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Combined Errors and Warnings', () => {
    test('renders both errors and warnings', () => {
      const errors = ['Test error']
      const warnings = ['Test warning']
      
      render(<InvoiceItemValidation errors={errors} warnings={warnings} />)
      
      expect(screen.getByText('Invoice Items Validation Errors')).toBeInTheDocument()
      expect(screen.getByText('Invoice Items Warnings')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(screen.getByText('Test warning')).toBeInTheDocument()
    })
  })
})

describe('InvoiceItemValidationSummary', () => {
  const defaultProps = {
    totalItems: 5,
    validItems: 3,
    totalAmount: 1000,
    errors: [],
    warnings: [],
  }

  describe('Statistics Display', () => {
    test('displays item statistics correctly', () => {
      render(<InvoiceItemValidationSummary {...defaultProps} />)
      
      expect(screen.getByText('5')).toBeInTheDocument() // Total Items
      expect(screen.getByText('3')).toBeInTheDocument() // Valid Items
      expect(screen.getByText('2')).toBeInTheDocument() // Invalid Items (5 - 3)
      expect(screen.getByText('₱1,000')).toBeInTheDocument() // Total Amount
    })

    test('displays labels for statistics', () => {
      render(<InvoiceItemValidationSummary {...defaultProps} />)
      
      expect(screen.getByText('Total Items')).toBeInTheDocument()
      expect(screen.getByText('Valid Items')).toBeInTheDocument()
      expect(screen.getByText('Invalid Items')).toBeInTheDocument()
      expect(screen.getByText('Total Amount')).toBeInTheDocument()
    })

    test('formats total amount with commas', () => {
      render(<InvoiceItemValidationSummary {...defaultProps} totalAmount={1234567} />)
      
      expect(screen.getByText('₱1,234,567')).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    test('shows valid badge when no errors', () => {
      render(<InvoiceItemValidationSummary {...defaultProps} />)
      
      expect(screen.getByText('Valid')).toBeInTheDocument()
    })

    test('shows invalid badge when there are errors', () => {
      const propsWithErrors = {
        ...defaultProps,
        errors: ['Test error'],
      }
      
      render(<InvoiceItemValidationSummary {...propsWithErrors} />)
      
      expect(screen.getByText('Invalid')).toBeInTheDocument()
    })

    test('shows error count badge when there are errors', () => {
      const propsWithErrors = {
        ...defaultProps,
        errors: ['Error 1', 'Error 2'],
      }
      
      render(<InvoiceItemValidationSummary {...propsWithErrors} />)
      
      expect(screen.getByText('2 Errors')).toBeInTheDocument()
    })

    test('shows warning count badge when there are warnings', () => {
      const propsWithWarnings = {
        ...defaultProps,
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
      }
      
      render(<InvoiceItemValidationSummary {...propsWithWarnings} />)
      
      expect(screen.getByText('3 Warnings')).toBeInTheDocument()
    })

    test('handles singular forms correctly', () => {
      const propsWithSingleError = {
        ...defaultProps,
        errors: ['Single error'],
      }
      
      render(<InvoiceItemValidationSummary {...propsWithSingleError} />)
      
      expect(screen.getByText('1 Error')).toBeInTheDocument()
    })
  })

  describe('Validation Messages', () => {
    test('includes validation component when there are errors', () => {
      const propsWithErrors = {
        ...defaultProps,
        errors: ['Test error'],
      }
      
      render(<InvoiceItemValidationSummary {...propsWithErrors} />)
      
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    test('includes validation component when there are warnings', () => {
      const propsWithWarnings = {
        ...defaultProps,
        warnings: ['Test warning'],
      }
      
      render(<InvoiceItemValidationSummary {...propsWithWarnings} />)
      
      expect(screen.getByText('Test warning')).toBeInTheDocument()
    })

    test('does not include validation component when no errors or warnings', () => {
      render(<InvoiceItemValidationSummary {...defaultProps} />)
      
      // Should not render the validation messages section
      expect(screen.queryByText('Invoice Items Validation Errors')).not.toBeInTheDocument()
      expect(screen.queryByText('Invoice Items Warnings')).not.toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    test('uses success styling when valid', () => {
      const { container } = render(<InvoiceItemValidationSummary {...defaultProps} />)
      
      const card = container.querySelector('.border-green-300')
      expect(card).toBeInTheDocument()
    })

    test('uses error styling when invalid', () => {
      const propsWithErrors = {
        ...defaultProps,
        errors: ['Test error'],
      }
      
      const { container } = render(<InvoiceItemValidationSummary {...propsWithErrors} />)
      
      const card = container.querySelector('.border-red-300')
      expect(card).toBeInTheDocument()
    })

    test('uses warning styling when only warnings', () => {
      const propsWithWarnings = {
        ...defaultProps,
        warnings: ['Test warning'],
      }
      
      const { container } = render(<InvoiceItemValidationSummary {...propsWithWarnings} />)
      
      const card = container.querySelector('.border-yellow-300')
      expect(card).toBeInTheDocument()
    })

    test('shows success icon when valid', () => {
      render(<InvoiceItemValidationSummary {...defaultProps} />)
      
      // Check for success icon (CheckCircle)
      const successIcon = document.querySelector('.text-green-600')
      expect(successIcon).toBeInTheDocument()
    })

    test('shows error icon when invalid', () => {
      const propsWithErrors = {
        ...defaultProps,
        errors: ['Test error'],
      }
      
      render(<InvoiceItemValidationSummary {...propsWithErrors} />)
      
      // Check for error icon (XCircle)
      const errorIcon = document.querySelector('.text-red-600')
      expect(errorIcon).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles zero items correctly', () => {
      const propsWithZeroItems = {
        ...defaultProps,
        totalItems: 0,
        validItems: 0,
      }
      
      render(<InvoiceItemValidationSummary {...propsWithZeroItems} />)
      
      expect(screen.getByText('0')).toBeInTheDocument() // Total Items
      expect(screen.getAllByText('0')).toHaveLength(3) // Total, Valid, and Invalid items
    })

    test('handles all items being valid', () => {
      const propsAllValid = {
        ...defaultProps,
        totalItems: 5,
        validItems: 5,
      }
      
      render(<InvoiceItemValidationSummary {...propsAllValid} />)
      
      expect(screen.getByText('5')).toBeInTheDocument() // Total Items
      expect(screen.getByText('5')).toBeInTheDocument() // Valid Items
      expect(screen.getByText('0')).toBeInTheDocument() // Invalid Items
    })

    test('handles all items being invalid', () => {
      const propsAllInvalid = {
        ...defaultProps,
        totalItems: 5,
        validItems: 0,
        errors: ['All items invalid'],
      }
      
      render(<InvoiceItemValidationSummary {...propsAllInvalid} />)
      
      expect(screen.getByText('5')).toBeInTheDocument() // Total Items
      expect(screen.getByText('0')).toBeInTheDocument() // Valid Items
      expect(screen.getByText('5')).toBeInTheDocument() // Invalid Items
    })

    test('handles large amounts correctly', () => {
      const propsLargeAmount = {
        ...defaultProps,
        totalAmount: 9999999.99,
      }
      
      render(<InvoiceItemValidationSummary {...propsLargeAmount} />)
      
      expect(screen.getByText('₱9,999,999.99')).toBeInTheDocument()
    })
  })
})