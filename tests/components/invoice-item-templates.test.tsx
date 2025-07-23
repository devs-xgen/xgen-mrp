import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceItemTemplates } from '@/components/module/admin/billing/invoice-items/invoice-item-templates'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('InvoiceItemTemplates', () => {
  const mockOnClose = vi.fn()
  const mockOnApplyTemplate = vi.fn()

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onApplyTemplate: mockOnApplyTemplate,
    disabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Rendering', () => {
    test('renders dialog when open', () => {
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      expect(screen.getByText('Invoice Item Templates')).toBeInTheDocument()
      expect(screen.getByText('Choose a template to quickly add common item combinations')).toBeInTheDocument()
    })

    test('does not render when closed', () => {
      render(<InvoiceItemTemplates {...defaultProps} open={false} />)
      
      expect(screen.queryByText('Invoice Item Templates')).not.toBeInTheDocument()
    })

    test('renders default templates', () => {
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      expect(screen.getByText('Basic Service Package')).toBeInTheDocument()
      expect(screen.getByText('Product Bundle')).toBeInTheDocument()
      expect(screen.getByText('Maintenance Package')).toBeInTheDocument()
    })

    test('shows create template button', () => {
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      expect(screen.getByText('Create Template')).toBeInTheDocument()
    })
  })

  describe('Template Display', () => {
    test('displays template information correctly', () => {
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Check for Basic Service Package details
      expect(screen.getByText('Standard service items for basic projects')).toBeInTheDocument()
      expect(screen.getByText('3 items')).toBeInTheDocument()
      
      // Check for template items preview
      expect(screen.getByText('Consultation Service')).toBeInTheDocument()
      expect(screen.getByText('Implementation Service')).toBeInTheDocument()
      expect(screen.getByText('Documentation')).toBeInTheDocument()
    })

    test('calculates template totals correctly', () => {
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Basic Service Package: 2500 + (8 * 1500) + 1000 = 15500
      expect(screen.getByText('₱15,500.00')).toBeInTheDocument()
    })

    test('shows usage count when template has been used', () => {
      // Mock localStorage to return templates with usage count
      const templatesWithUsage = [
        {
          id: 'custom-1',
          name: 'Custom Template',
          items: [],
          createdAt: new Date(),
          usageCount: 5,
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(templatesWithUsage))
      
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      expect(screen.getByText('Used 5x')).toBeInTheDocument()
    })
  })

  describe('Template Actions', () => {
    test('applies template when Apply Template button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      const applyButtons = screen.getAllByText('Apply Template')
      await user.click(applyButtons[0])
      
      expect(mockOnApplyTemplate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            description: 'Consultation Service',
            quantity: 1,
            unitPrice: 2500,
          }),
        ])
      )
    })

    test('increments usage count when template is applied', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      const applyButtons = screen.getAllByText('Apply Template')
      await user.click(applyButtons[0])
      
      // Should save updated templates with incremented usage count
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test('shows edit and delete buttons for custom templates', () => {
      const customTemplates = [
        {
          id: 'custom-1',
          name: 'Custom Template',
          items: [],
          createdAt: new Date(),
          usageCount: 0,
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customTemplates))
      
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Custom templates should have edit and delete buttons
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      
      expect(editButtons.length).toBeGreaterThan(0)
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    test('does not show edit/delete buttons for default templates', () => {
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Default templates should not have edit/delete buttons
      // Only Apply Template buttons should be present
      const applyButtons = screen.getAllByText('Apply Template')
      expect(applyButtons).toHaveLength(3) // 3 default templates
    })
  })

  describe('Template Creation', () => {
    test('opens create template dialog when Create Template is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      const createButton = screen.getByText('Create Template')
      await user.click(createButton)
      
      expect(screen.getByText('Create New Template')).toBeInTheDocument()
    })

    test('creates new template with valid data', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Open create dialog
      const createButton = screen.getByText('Create Template')
      await user.click(createButton)
      
      // Fill in template details
      const nameInput = screen.getByLabelText('Template Name *')
      await user.type(nameInput, 'Test Template')
      
      const descriptionInput = screen.getByLabelText('Description')
      await user.type(descriptionInput, 'Test description')
      
      // Fill in first item
      const itemDescInput = screen.getByPlaceholderText('Item description')
      await user.type(itemDescInput, 'Test Item')
      
      const quantityInput = screen.getByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '2')
      
      const priceInput = screen.getByDisplayValue('0')
      await user.clear(priceInput)
      await user.type(priceInput, '100')
      
      // Save template
      const saveButton = screen.getByText('Create Template')
      await user.click(saveButton)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test('validates template name is required', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Open create dialog
      const createButton = screen.getByText('Create Template')
      await user.click(createButton)
      
      // Try to save without name
      const saveButton = screen.getByText('Create Template')
      await user.click(saveButton)
      
      // Should show error toast
      const { toast } = await import('sonner')
      expect(toast.error).toHaveBeenCalledWith('Template name is required')
    })

    test('validates at least one valid item is required', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Open create dialog
      const createButton = screen.getByText('Create Template')
      await user.click(createButton)
      
      // Fill name but leave items empty
      const nameInput = screen.getByLabelText('Template Name *')
      await user.type(nameInput, 'Test Template')
      
      // Save template
      const saveButton = screen.getByText('Create Template')
      await user.click(saveButton)
      
      // Should show error toast
      const { toast } = await import('sonner')
      expect(toast.error).toHaveBeenCalledWith('At least one valid item is required')
    })
  })

  describe('Template Editing', () => {
    test('opens edit dialog with template data pre-filled', async () => {
      const user = userEvent.setup()
      const customTemplates = [
        {
          id: 'custom-1',
          name: 'Custom Template',
          description: 'Custom description',
          items: [
            {
              description: 'Custom Item',
              quantity: 1,
              unitPrice: 100,
              productCode: '',
              unit: 'PCS',
              discountPercent: 0,
              taxable: true,
            },
          ],
          createdAt: new Date(),
          usageCount: 0,
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customTemplates))
      
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText('Edit Template')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Custom Template')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Custom description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Custom Item')).toBeInTheDocument()
    })
  })

  describe('Template Deletion', () => {
    test('deletes custom template when delete button is clicked', async () => {
      const user = userEvent.setup()
      const customTemplates = [
        {
          id: 'custom-1',
          name: 'Custom Template',
          items: [],
          createdAt: new Date(),
          usageCount: 0,
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customTemplates))
      
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const { toast } = await import('sonner')
      expect(toast.success).toHaveBeenCalledWith('Template deleted')
    })

    test('prevents deletion of default templates', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Default templates should not have delete buttons
      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i })
      expect(deleteButtons).toHaveLength(0)
    })
  })

  describe('Local Storage Integration', () => {
    test('loads custom templates from localStorage on mount', () => {
      const customTemplates = [
        {
          id: 'custom-1',
          name: 'Saved Template',
          items: [],
          createdAt: new Date(),
          usageCount: 0,
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customTemplates))
      
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      expect(screen.getByText('Saved Template')).toBeInTheDocument()
    })

    test('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not crash when localStorage fails
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Should still show default templates
      expect(screen.getByText('Basic Service Package')).toBeInTheDocument()
    })

    test('saves templates to localStorage when modified', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Apply a template to trigger save
      const applyButtons = screen.getAllByText('Apply Template')
      await user.click(applyButtons[0])
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'invoice-item-templates',
        expect.any(String)
      )
    })
  })

  describe('Disabled State', () => {
    test('disables all interactive elements when disabled', () => {
      render(<InvoiceItemTemplates {...defaultProps} disabled={true} />)
      
      const createButton = screen.getByText('Create Template')
      expect(createButton).toBeDisabled()
      
      const applyButtons = screen.getAllByText('Apply Template')
      applyButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    test('has proper dialog structure', () => {
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Invoice Item Templates')).toBeInTheDocument()
    })

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      // Should be able to navigate with keyboard
      await user.tab()
      
      // Focus should move through interactive elements
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })

    test('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemTemplates {...defaultProps} />)
      
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})