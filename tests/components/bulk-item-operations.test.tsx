import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulkItemOperations } from '@/components/module/admin/billing/invoice-items/bulk-item-operations'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('BulkItemOperations', () => {
  const mockOnClose = vi.fn()
  const mockOnAddMultiple = vi.fn()

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onAddMultiple: mockOnAddMultiple,
    disabled: false,
    maxItems: 50,
    currentItemCount: 10,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders dialog when open', () => {
      render(<BulkItemOperations {...defaultProps} />)
      
      expect(screen.getByText('Bulk Item Operations')).toBeInTheDocument()
      expect(screen.getByText('Current items: 10')).toBeInTheDocument()
      expect(screen.getByText('Available slots: 40')).toBeInTheDocument()
    })

    test('does not render when closed', () => {
      render(<BulkItemOperations {...defaultProps} open={false} />)
      
      expect(screen.queryByText('Bulk Item Operations')).not.toBeInTheDocument()
    })

    test('shows correct available slots calculation', () => {
      render(<BulkItemOperations {...defaultProps} currentItemCount={45} />)
      
      expect(screen.getByText('Available slots: 5')).toBeInTheDocument()
    })

    test('shows warning badge when few slots remaining', () => {
      const { container } = render(
        <BulkItemOperations {...defaultProps} currentItemCount={45} />
      )
      
      const badge = container.querySelector('.bg-destructive')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    test('renders all tabs', () => {
      render(<BulkItemOperations {...defaultProps} />)
      
      expect(screen.getByText('Add Multiple')).toBeInTheDocument()
      expect(screen.getByText('Import CSV')).toBeInTheDocument()
      expect(screen.getByText('Quick Template')).toBeInTheDocument()
    })

    test('switches between tabs', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      expect(screen.getByText('Import items from a CSV file')).toBeInTheDocument()
    })
  })

  describe('Add Multiple Items', () => {
    test('renders add multiple form by default', () => {
      render(<BulkItemOperations {...defaultProps} />)
      
      expect(screen.getByText('Create multiple similar items at once')).toBeInTheDocument()
      expect(screen.getByLabelText('Number of Items')).toBeInTheDocument()
      expect(screen.getByLabelText('Base Description')).toBeInTheDocument()
    })

    test('updates item count input', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const countInput = screen.getByLabelText('Number of Items')
      await user.clear(countInput)
      await user.type(countInput, '10')
      
      expect(countInput).toHaveValue(10)
    })

    test('limits item count to available slots', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} currentItemCount={45} />)
      
      const countInput = screen.getByLabelText('Number of Items')
      await user.clear(countInput)
      await user.type(countInput, '10')
      
      // Should be limited to 5 (maxItems - currentItemCount)
      expect(countInput).toHaveValue(5)
    })

    test('updates base item fields', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const descriptionInput = screen.getByLabelText('Base Description')
      await user.type(descriptionInput, 'Test Item')
      
      const quantityInput = screen.getByLabelText('Quantity')
      await user.clear(quantityInput)
      await user.type(quantityInput, '2')
      
      const priceInput = screen.getByLabelText('Unit Price')
      await user.clear(priceInput)
      await user.type(priceInput, '100')
      
      expect(descriptionInput).toHaveValue('Test Item')
      expect(quantityInput).toHaveValue(2)
      expect(priceInput).toHaveValue(100)
    })

    test('shows preview of items to be created', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const descriptionInput = screen.getByLabelText('Base Description')
      await user.type(descriptionInput, 'Product')
      
      const countInput = screen.getByLabelText('Number of Items')
      await user.clear(countInput)
      await user.type(countInput, '3')
      
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
      expect(screen.getByText('Product 3')).toBeInTheDocument()
    })

    test('creates multiple items when Add Items button is clicked', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const descriptionInput = screen.getByLabelText('Base Description')
      await user.type(descriptionInput, 'Test Item')
      
      const countInput = screen.getByLabelText('Number of Items')
      await user.clear(countInput)
      await user.type(countInput, '3')
      
      const addButton = screen.getByText('Add 3 Items')
      await user.click(addButton)
      
      expect(mockOnAddMultiple).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ description: 'Test Item 1' }),
          expect.objectContaining({ description: 'Test Item 2' }),
          expect.objectContaining({ description: 'Test Item 3' }),
        ])
      )
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('validates base description is required', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const addButton = screen.getByText('Add 5 Items')
      await user.click(addButton)
      
      const { toast } = await import('sonner')
      expect(toast.error).toHaveBeenCalledWith('Base item description is required')
    })

    test('prevents adding more items than available slots', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} currentItemCount={48} />)
      
      const descriptionInput = screen.getByLabelText('Base Description')
      await user.type(descriptionInput, 'Test Item')
      
      const countInput = screen.getByLabelText('Number of Items')
      await user.clear(countInput)
      await user.type(countInput, '5')
      
      const addButton = screen.getByText('Add 2 Items') // Should be limited to 2
      await user.click(addButton)
      
      const { toast } = await import('sonner')
      expect(toast.error).toHaveBeenCalledWith('Cannot add 5 items. Only 2 slots available.')
    })
  })

  describe('CSV Import', () => {
    test('renders CSV import form', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      expect(screen.getByText('Import items from a CSV file')).toBeInTheDocument()
      expect(screen.getByLabelText('CSV Data')).toBeInTheDocument()
      expect(screen.getByText('Download Sample')).toBeInTheDocument()
    })

    test('downloads sample CSV file', async () => {
      const user = userEvent.setup()
      
      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = vi.fn(() => 'mock-url')
      const mockClick = vi.fn()
      const mockSetAttribute = vi.fn()
      
      global.URL.createObjectURL = mockCreateObjectURL
      const mockAnchor = {
        click: mockClick,
        setAttribute: mockSetAttribute,
        href: '',
        download: '',
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      
      render(<BulkItemOperations {...defaultProps} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      const downloadButton = screen.getByText('Download Sample')
      await user.click(downloadButton)
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
    })

    test('parses valid CSV data', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      const csvInput = screen.getByLabelText('CSV Data')
      const validCSV = `description,quantity,unitPrice,productCode,unit,discountPercent,taxable
"Product A",1,100.00,"PROD-A","PCS",0,true
"Product B",2,50.00,"PROD-B","PCS",10,true`
      
      await user.type(csvInput, validCSV)
      
      expect(screen.getByText('Preview (2 items)')).toBeInTheDocument()
      expect(screen.getByText('Product A')).toBeInTheDocument()
      expect(screen.getByText('Product B')).toBeInTheDocument()
    })

    test('shows error for invalid CSV format', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      const csvInput = screen.getByLabelText('CSV Data')
      const invalidCSV = 'invalid csv data'
      
      await user.type(csvInput, invalidCSV)
      
      expect(screen.getByText(/Missing required headers/)).toBeInTheDocument()
    })

    test('imports CSV data when Import button is clicked', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      const csvInput = screen.getByLabelText('CSV Data')
      const validCSV = `description,quantity,unitPrice
"Product A",1,100.00
"Product B",2,50.00`
      
      await user.type(csvInput, validCSV)
      
      const importButton = screen.getByText('Import 2 Items')
      await user.click(importButton)
      
      expect(mockOnAddMultiple).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ description: 'Product A' }),
          expect.objectContaining({ description: 'Product B' }),
        ])
      )
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('prevents importing more items than available slots', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} currentItemCount={49} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      const csvInput = screen.getByLabelText('CSV Data')
      const csvWithTooManyItems = `description,quantity,unitPrice
"Product A",1,100.00
"Product B",2,50.00`
      
      await user.type(csvInput, csvWithTooManyItems)
      
      expect(screen.getByText(/CSV contains 2 items, but only 1 slots available/)).toBeInTheDocument()
    })
  })

  describe('Quick Templates', () => {
    test('renders quick template options', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const templateTab = screen.getByText('Quick Template')
      await user.click(templateTab)
      
      expect(screen.getByText('Basic Service Items')).toBeInTheDocument()
      expect(screen.getByText('Product Package')).toBeInTheDocument()
      expect(screen.getByText('Monthly Services')).toBeInTheDocument()
    })

    test('displays template details', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const templateTab = screen.getByText('Quick Template')
      await user.click(templateTab)
      
      expect(screen.getByText('Consultation')).toBeInTheDocument()
      expect(screen.getByText('Implementation')).toBeInTheDocument()
      expect(screen.getByText('Documentation')).toBeInTheDocument()
    })

    test('applies template when Use This Template is clicked', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const templateTab = screen.getByText('Quick Template')
      await user.click(templateTab)
      
      const useTemplateButtons = screen.getAllByText('Use This Template')
      await user.click(useTemplateButtons[0])
      
      expect(mockOnAddMultiple).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ description: 'Consultation' }),
          expect.objectContaining({ description: 'Implementation' }),
          expect.objectContaining({ description: 'Documentation' }),
        ])
      )
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('prevents using template with too many items', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} currentItemCount={49} />)
      
      const templateTab = screen.getByText('Quick Template')
      await user.click(templateTab)
      
      const useTemplateButtons = screen.getAllByText('Use This Template')
      await user.click(useTemplateButtons[0]) // Basic Service Items has 3 items
      
      const { toast } = await import('sonner')
      expect(toast.error).toHaveBeenCalledWith('Template has 3 items, but only 1 slots available')
    })

    test('disables template button when not enough slots', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} currentItemCount={49} />)
      
      const templateTab = screen.getByText('Quick Template')
      await user.click(templateTab)
      
      const useTemplateButtons = screen.getAllByText('Use This Template')
      expect(useTemplateButtons[0]).toBeDisabled() // Basic Service Items has 3 items, only 1 slot available
    })
  })

  describe('Disabled State', () => {
    test('disables all interactive elements when disabled', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} disabled={true} />)
      
      // Check Add Multiple tab
      const addButton = screen.getByText('Add 5 Items')
      expect(addButton).toBeDisabled()
      
      // Check CSV Import tab
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      const downloadButton = screen.getByText('Download Sample')
      expect(downloadButton).toBeDisabled()
      
      // Check Quick Template tab
      const templateTab = screen.getByText('Quick Template')
      await user.click(templateTab)
      
      const useTemplateButtons = screen.getAllByText('Use This Template')
      useTemplateButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    test('has proper dialog structure', () => {
      render(<BulkItemOperations {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Bulk Item Operations')).toBeInTheDocument()
    })

    test('has proper tab navigation', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
      
      await user.click(tabs[1])
      expect(tabs[1]).toHaveAttribute('data-state', 'active')
    })

    test('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('handles invalid numeric inputs gracefully', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const quantityInput = screen.getByLabelText('Quantity')
      await user.clear(quantityInput)
      await user.type(quantityInput, 'invalid')
      
      // Should handle invalid input gracefully
      expect(quantityInput).toHaveValue(0)
    })

    test('handles empty CSV data gracefully', async () => {
      const user = userEvent.setup()
      render(<BulkItemOperations {...defaultProps} />)
      
      const csvTab = screen.getByText('Import CSV')
      await user.click(csvTab)
      
      const importButton = screen.getByText('Import 0 Items')
      await user.click(importButton)
      
      const { toast } = await import('sonner')
      expect(toast.error).toHaveBeenCalledWith('No valid items to import')
    })
  })
})