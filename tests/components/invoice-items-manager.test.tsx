import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceItemsManager } from '@/components/module/admin/billing/invoice-items/invoice-items-manager'
import { SalesInvoiceItemFormData } from '@/types/admin/billing'

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    Plus: () => <div data-testid="plus-icon" />,
    Trash2: () => <div data-testid="trash-icon" />,
    GripVertical: () => <div data-testid="grip-icon" />,
    Copy: () => <div data-testid="copy-icon" />,
    Download: () => <div data-testid="download-icon" />,
    Upload: () => <div data-testid="upload-icon" />,
    Zap: () => <div data-testid="zap-icon" />,
  }
})

// Mock drag and drop
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-drop-context" onClick={() => onDragEnd({ source: { index: 0 }, destination: { index: 1 } })}>
      {children}
    </div>
  ),
  Droppable: ({ children }: any) => children({ 
    innerRef: vi.fn(), 
    droppableProps: {}, 
    placeholder: null 
  }, { isDraggingOver: false }),
  Draggable: ({ children }: any) => children({ 
    innerRef: vi.fn(), 
    draggableProps: {}, 
    dragHandleProps: {} 
  }, { isDragging: false }),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('InvoiceItemsManager', () => {
  const mockOnItemsChange = vi.fn()
  const mockOnValidationChange = vi.fn()

  const defaultProps = {
    items: [
      {
        description: 'Test Item 1',
        quantity: 1,
        unitPrice: 100,
        productCode: 'TEST-001',
        unit: 'PCS',
        discountPercent: 0,
        taxable: true,
      } as SalesInvoiceItemFormData,
    ],
    onItemsChange: mockOnItemsChange,
    onValidationChange: mockOnValidationChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders with basic props', () => {
      render(<InvoiceItemsManager {...defaultProps} />)
      
      expect(screen.getByText('Invoice Items')).toBeInTheDocument()
      expect(screen.getByText('Add and manage items for this invoice')).toBeInTheDocument()
      expect(screen.getByText('1 / 50 items')).toBeInTheDocument()
    })

    test('displays item count and total correctly', () => {
      render(<InvoiceItemsManager {...defaultProps} />)
      
      expect(screen.getByText('1 / 50 items')).toBeInTheDocument()
      expect(screen.getByText('Total: ₱100.00')).toBeInTheDocument()
    })

    test('shows templates and bulk operations buttons when enabled', () => {
      render(
        <InvoiceItemsManager 
          {...defaultProps} 
          showTemplates={true}
          showBulkOperations={true}
        />
      )
      
      expect(screen.getByText('Templates')).toBeInTheDocument()
      expect(screen.getByText('Bulk Actions')).toBeInTheDocument()
    })

    test('hides templates and bulk operations buttons when disabled', () => {
      render(
        <InvoiceItemsManager 
          {...defaultProps} 
          showTemplates={false}
          showBulkOperations={false}
        />
      )
      
      expect(screen.queryByText('Templates')).not.toBeInTheDocument()
      expect(screen.queryByText('Bulk Actions')).not.toBeInTheDocument()
    })
  })

  describe('Item Management', () => {
    test('adds new item when Add Item button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemsManager {...defaultProps} />)
      
      const addButton = screen.getByText('Add Item')
      await user.click(addButton)
      
      expect(mockOnItemsChange).toHaveBeenCalledWith([
        defaultProps.items[0],
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          productCode: '',
          unit: 'PCS',
          discountPercent: 0,
          taxable: true,
        },
      ])
    })

    test('prevents adding items when at max limit', async () => {
      const user = userEvent.setup()
      const items = Array(5).fill(null).map((_, i) => ({
        ...defaultProps.items[0],
        description: `Item ${i + 1}`,
      }))
      
      render(
        <InvoiceItemsManager 
          {...defaultProps} 
          items={items}
          maxItems={5}
        />
      )
      
      const addButton = screen.getByText('Add Item')
      expect(addButton).toBeDisabled()
    })

    test('calculates totals correctly', () => {
      const items = [
        {
          description: 'Item 1',
          quantity: 2,
          unitPrice: 100,
          productCode: '',
          unit: 'PCS',
          discountPercent: 10,
          taxable: true,
        },
        {
          description: 'Item 2',
          quantity: 1,
          unitPrice: 50,
          productCode: '',
          unit: 'PCS',
          discountPercent: 0,
          taxable: true,
        },
      ] as SalesInvoiceItemFormData[]
      
      render(<InvoiceItemsManager {...defaultProps} items={items} />)
      
      // Item 1: (2 * 100) - 10% = 180
      // Item 2: (1 * 50) - 0% = 50
      // Total: 230
      expect(screen.getByText('Total Amount: ₱230.00')).toBeInTheDocument()
      expect(screen.getByText('Total Quantity: 3')).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    test('validates items and calls onValidationChange', () => {
      const invalidItems = [
        {
          description: '',
          quantity: 0,
          unitPrice: -10,
          productCode: '',
          unit: 'PCS',
          discountPercent: 150,
          taxable: true,
        },
      ] as SalesInvoiceItemFormData[]
      
      render(<InvoiceItemsManager {...defaultProps} items={invalidItems} />)
      
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        false,
        expect.arrayContaining([
          'At least one valid invoice item is required',
          'Item 1: Description is required',
          'Item 1: Quantity must be greater than 0',
          'Item 1: Unit price cannot be negative',
          'Item 1: Discount must be between 0% and 100%',
        ])
      )
    })

    test('shows validation errors in UI', () => {
      const errors = ['Test error 1', 'Test error 2']
      render(<InvoiceItemsManager {...defaultProps} errors={{ invoiceItems: 'Test error' }} />)
      
      // The validation component should be rendered when there are errors
      // This would be tested more thoroughly in the validation component tests
    })
  })

  describe('Drag and Drop', () => {
    test('handles drag and drop reordering', async () => {
      const items = [
        { ...defaultProps.items[0], description: 'Item 1' },
        { ...defaultProps.items[0], description: 'Item 2' },
      ] as SalesInvoiceItemFormData[]
      
      render(<InvoiceItemsManager {...defaultProps} items={items} />)
      
      const dragDropContext = screen.getByTestId('drag-drop-context')
      fireEvent.click(dragDropContext)
      
      // The mock will trigger onDragEnd with source index 0 and destination index 1
      // This should reorder the items
      expect(mockOnItemsChange).toHaveBeenCalled()
    })

    test('disables drag and drop when disabled prop is true', () => {
      render(<InvoiceItemsManager {...defaultProps} disabled={true} />)
      
      // When disabled, drag handles should not be interactive
      // This is handled by the Draggable component's isDragDisabled prop
    })
  })

  describe('Bulk Operations', () => {
    test('shows bulk selection when items are selected', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemsManager {...defaultProps} />)
      
      // This would require interaction with the InvoiceItemRow component
      // which has selection checkboxes
      // The test would verify that bulk operation UI appears when items are selected
    })

    test('handles bulk delete operation', () => {
      // This would test the bulk delete functionality
      // when multiple items are selected and bulk delete is triggered
    })

    test('handles bulk duplicate operation', () => {
      // This would test the bulk duplicate functionality
      // when multiple items are selected and bulk duplicate is triggered
    })
  })

  describe('Import/Export', () => {
    test('exports items to JSON', async () => {
      const user = userEvent.setup()
      
      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = vi.fn(() => 'mock-url')
      const mockClick = vi.fn()
      const mockSetAttribute = vi.fn()
      
      global.URL.createObjectURL = mockCreateObjectURL
      const mockAnchor = {
        click: mockClick,
        setAttribute: mockSetAttribute,
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      
      render(<InvoiceItemsManager {...defaultProps} />)
      
      const exportButton = screen.getByText('Export')
      await user.click(exportButton)
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockSetAttribute).toHaveBeenCalledWith('href', 'mock-url')
      expect(mockSetAttribute).toHaveBeenCalledWith('download', expect.stringContaining('invoice-items-'))
      expect(mockClick).toHaveBeenCalled()
    })

    test('imports items from JSON file', async () => {
      const user = userEvent.setup()
      
      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
      }
      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)
      
      render(<InvoiceItemsManager {...defaultProps} />)
      
      const importButton = screen.getByText('Import')
      await user.click(importButton)
      
      // This would trigger the file input click
      // The actual file reading would be tested separately
    })
  })

  describe('Templates', () => {
    test('opens template dialog when Templates button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemsManager {...defaultProps} showTemplates={true} />)
      
      const templatesButton = screen.getByText('Templates')
      await user.click(templatesButton)
      
      // The template dialog should open
      // This would be tested more thoroughly in the templates component tests
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<InvoiceItemsManager {...defaultProps} />)
      
      // Check for proper labeling
      expect(screen.getByText('Invoice Items')).toBeInTheDocument()
      
      // Form controls should have proper labels
      // This would be tested more thoroughly for each form element
    })

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<InvoiceItemsManager {...defaultProps} />)
      
      // Test tab navigation through form elements
      await user.tab()
      
      // Verify focus management
      // This would test that focus moves logically through the interface
    })
  })

  describe('Error Handling', () => {
    test('handles empty items array gracefully', () => {
      render(<InvoiceItemsManager {...defaultProps} items={[]} />)
      
      expect(screen.getByText('No items added yet')).toBeInTheDocument()
      expect(screen.getByText('Add Your First Item')).toBeInTheDocument()
    })

    test('handles invalid item data gracefully', () => {
      const invalidItems = [
        {
          description: null,
          quantity: 'invalid',
          unitPrice: undefined,
        } as any,
      ]
      
      render(<InvoiceItemsManager {...defaultProps} items={invalidItems} />)
      
      // Should handle invalid data without crashing
      // Validation should catch and report issues
    })
  })

  describe('Performance', () => {
    test('handles large number of items efficiently', () => {
      const manyItems = Array(100).fill(null).map((_, i) => ({
        ...defaultProps.items[0],
        description: `Item ${i + 1}`,
      }))
      
      const { container } = render(
        <InvoiceItemsManager {...defaultProps} items={manyItems} maxItems={100} />
      )
      
      // Should render without performance issues
      expect(container).toBeInTheDocument()
      expect(screen.getByText('100 / 100 items')).toBeInTheDocument()
    })
  })
})