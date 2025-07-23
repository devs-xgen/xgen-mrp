import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceItemRow } from '@/components/module/admin/billing/invoice-items/invoice-item-row'
import { SalesInvoiceItemFormData } from '@/types/admin/billing'

describe('InvoiceItemRow', () => {
  const mockOnUpdate = vi.fn()
  const mockOnRemove = vi.fn()
  const mockOnDuplicate = vi.fn()
  const mockOnSelect = vi.fn()

  const defaultItem: SalesInvoiceItemFormData = {
    description: 'Test Item',
    quantity: 2,
    unitPrice: 100,
    productCode: 'TEST-001',
    unit: 'PCS',
    discountPercent: 10,
    taxable: true,
  }

  const defaultProps = {
    item: defaultItem,
    index: 0,
    onUpdate: mockOnUpdate,
    onRemove: mockOnRemove,
    onDuplicate: mockOnDuplicate,
    onSelect: mockOnSelect,
    selected: false,
    disabled: false,
    canRemove: true,
    errors: {},
    total: 180, // (2 * 100) - 10% = 180
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders item fields correctly', () => {
      render(<InvoiceItemRow {...defaultProps} />)
      
      expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('TEST-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    })

    test('displays item number badge', () => {
      render(<InvoiceItemRow {...defaultProps} index={5} />)
      
      expect(screen.getByText('6')).toBeInTheDocument() // index + 1
    })

    test('shows calculated totals', () => {
      render(<InvoiceItemRow {...defaultProps} />)
      
      expect(screen.getByText('Subtotal: ₱200.00')).toBeInTheDocument() // 2 * 100
      expect(screen.getByText('Discount: -₱20.00')).toBeInTheDocument() // 10% of 200
      expect(screen.getByText('Total: ₱180.00')).toBeInTheDocument()
    })

    test('shows taxable status', () => {
      render(<InvoiceItemRow {...defaultProps} />)
      
      expect(screen.getByText('Taxable: ✓')).toBeInTheDocument()
    })

    test('shows non-taxable status', () => {
      const nonTaxableItem = { ...defaultItem, taxable: false }
      render(<InvoiceItemRow {...defaultProps} item={nonTaxableItem} />)
      
      expect(screen.getByText('Taxable: ✗')).toBeInTheDocument()
    })

    test('highlights selected row', () => {
      const { container } = render(<InvoiceItemRow {...defaultProps} selected={true} />)
      
      const card = container.querySelector('.ring-2.ring-blue-500')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Field Updates', () => {
    test('updates description field', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const descriptionInput = screen.getByDisplayValue('Test Item')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated Item')
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ description: 'Updated Item' })
    })

    test('updates quantity field', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const quantityInput = screen.getByDisplayValue('2')
      await user.clear(quantityInput)
      await user.type(quantityInput, '5')
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ quantity: 5 })
    })

    test('updates unit price field', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const priceInput = screen.getByDisplayValue('100')
      await user.clear(priceInput)
      await user.type(priceInput, '150')
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ unitPrice: 150 })
    })

    test('updates discount percentage', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const discountInput = screen.getByDisplayValue('10')
      await user.clear(discountInput)
      await user.type(discountInput, '15')
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ discountPercent: 15 })
    })

    test('updates product code', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const codeInput = screen.getByDisplayValue('TEST-001')
      await user.clear(codeInput)
      await user.type(codeInput, 'NEW-001')
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ productCode: 'NEW-001' })
    })

    test('updates unit selection', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const unitSelect = screen.getByRole('combobox')
      await user.click(unitSelect)
      
      const kgOption = screen.getByText('KG')
      await user.click(kgOption)
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ unit: 'KG' })
    })

    test('updates taxable checkbox', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const taxableCheckbox = screen.getByRole('checkbox')
      await user.click(taxableCheckbox)
      
      expect(mockOnUpdate).toHaveBeenCalledWith({ taxable: false })
    })
  })

  describe('Validation', () => {
    test('shows validation errors for invalid fields', () => {
      const invalidItem = {
        ...defaultItem,
        description: '',
        quantity: 0,
        unitPrice: -10,
        discountPercent: 150,
      }
      
      render(<InvoiceItemRow {...defaultProps} item={invalidItem} />)
      
      // Should show validation error messages
      expect(screen.getByText('Description is required')).toBeInTheDocument()
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
      expect(screen.getByText('Unit price cannot be negative')).toBeInTheDocument()
      expect(screen.getByText('Discount must be between 0% and 100%')).toBeInTheDocument()
    })

    test('highlights invalid fields with error styling', () => {
      const invalidItem = {
        ...defaultItem,
        description: '',
        quantity: 0,
      }
      
      const { container } = render(<InvoiceItemRow {...defaultProps} item={invalidItem} />)
      
      const errorInputs = container.querySelectorAll('.border-red-300')
      expect(errorInputs.length).toBeGreaterThan(0)
    })

    test('validates in real-time as user types', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const descriptionInput = screen.getByDisplayValue('Test Item')
      await user.clear(descriptionInput)
      
      // Should show validation error immediately
      await waitFor(() => {
        expect(screen.getByText('Description is required')).toBeInTheDocument()
      })
    })
  })

  describe('Actions', () => {
    test('calls onSelect when selection checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const selectCheckbox = screen.getAllByRole('checkbox')[0] // First checkbox is selection
      await user.click(selectCheckbox)
      
      expect(mockOnSelect).toHaveBeenCalledWith(true)
    })

    test('calls onDuplicate when duplicate button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const duplicateButton = screen.getByRole('button', { name: /duplicate/i })
      await user.click(duplicateButton)
      
      expect(mockOnDuplicate).toHaveBeenCalled()
    })

    test('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)
      
      expect(mockOnRemove).toHaveBeenCalled()
    })

    test('disables remove button when canRemove is false', () => {
      render(<InvoiceItemRow {...defaultProps} canRemove={false} />)
      
      const removeButton = screen.getByRole('button', { name: /cannot remove last item/i })
      expect(removeButton).toBeDisabled()
    })
  })

  describe('Disabled State', () => {
    test('disables all inputs when disabled prop is true', () => {
      render(<InvoiceItemRow {...defaultProps} disabled={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toBeDisabled()
      })
      
      const numberInputs = screen.getAllByRole('spinbutton')
      numberInputs.forEach(input => {
        expect(input).toBeDisabled()
      })
      
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled()
      })
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Calculations', () => {
    test('calculates subtotal correctly', () => {
      render(<InvoiceItemRow {...defaultProps} />)
      
      // 2 * 100 = 200
      expect(screen.getByText('Subtotal: ₱200.00')).toBeInTheDocument()
    })

    test('calculates discount correctly', () => {
      render(<InvoiceItemRow {...defaultProps} />)
      
      // 10% of 200 = 20
      expect(screen.getByText('Discount: -₱20.00')).toBeInTheDocument()
    })

    test('shows no discount when discount is 0', () => {
      const itemWithoutDiscount = { ...defaultItem, discountPercent: 0 }
      render(<InvoiceItemRow {...defaultProps} item={itemWithoutDiscount} />)
      
      expect(screen.queryByText(/Discount:/)).not.toBeInTheDocument()
    })

    test('displays total amount correctly', () => {
      render(<InvoiceItemRow {...defaultProps} />)
      
      expect(screen.getByText('Total: ₱180.00')).toBeInTheDocument()
    })
  })

  describe('Drag Handle', () => {
    test('renders drag handle with proper props', () => {
      const mockDragHandleProps = {
        'data-rbd-drag-handle-draggable-id': 'test',
        'data-rbd-drag-handle-context-id': 'test',
      }
      
      render(<InvoiceItemRow {...defaultProps} dragHandleProps={mockDragHandleProps} />)
      
      // The drag handle should be rendered with the provided props
      // This would be tested by checking for the presence of the drag handle element
    })
  })

  describe('Accessibility', () => {
    test('has proper labels for all form fields', () => {
      render(<InvoiceItemRow {...defaultProps} />)
      
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/qty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/unit price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/disc/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/unit/i)).toBeInTheDocument()
    })

    test('provides tooltips for action buttons', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const duplicateButton = screen.getByRole('button', { name: /duplicate/i })
      await user.hover(duplicateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Duplicate item')).toBeInTheDocument()
      })
    })

    test('shows appropriate tooltip for disabled remove button', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} canRemove={false} />)
      
      const removeButton = screen.getByRole('button', { name: /cannot remove last item/i })
      await user.hover(removeButton)
      
      await waitFor(() => {
        expect(screen.getByText('Cannot remove last item')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('handles invalid numeric inputs gracefully', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const quantityInput = screen.getByDisplayValue('2')
      await user.clear(quantityInput)
      await user.type(quantityInput, 'invalid')
      
      // Should handle invalid input and call onUpdate with 0
      expect(mockOnUpdate).toHaveBeenCalledWith({ quantity: 0 })
    })

    test('handles empty numeric inputs gracefully', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemRow {...defaultProps} />)
      
      const priceInput = screen.getByDisplayValue('100')
      await user.clear(priceInput)
      
      // Should handle empty input and call onUpdate with 0
      expect(mockOnUpdate).toHaveBeenCalledWith({ unitPrice: 0 })
    })
  })
})