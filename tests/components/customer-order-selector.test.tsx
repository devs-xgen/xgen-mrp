import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerOrderSelector } from '@/components/module/admin/billing/customer-selection/customer-order-selector'
import { CustomerOrder } from '@/types/admin/customer-order'

// Mock the formatCurrencyPHP function
vi.mock('@/lib/constant', () => ({
  formatCurrencyPHP: (amount: number) => `₱${amount.toLocaleString()}`
}))

describe('CustomerOrderSelector', () => {
  const mockOnOrderSelect = vi.fn()
  const mockOnClear = vi.fn()

  const mockOrders: CustomerOrder[] = [
    {
      id: '1',
      orderNumber: 'CO-2024-0001',
      customerId: 'customer-1',
      orderDate: new Date('2024-01-15'),
      requiredDate: new Date('2024-02-15'),
      status: 'PENDING',
      totalAmount: 15000,
      notes: null,
      customer: {
        id: 'customer-1',
        name: 'John Doe',
        email: 'john@example.com'
      },
      orderLines: [
        {
          id: 'line-1',
          productId: 'product-1',
          quantity: 2,
          unitPrice: 5000,
          status: 'PENDING',
          product: {
            id: 'product-1',
            name: 'Product A',
            sku: 'SKU-001'
          }
        },
        {
          id: 'line-2',
          productId: 'product-2',
          quantity: 1,
          unitPrice: 5000,
          status: 'PENDING',
          product: {
            id: 'product-2',
            name: 'Product B',
            sku: 'SKU-002'
          }
        }
      ]
    },
    {
      id: '2',
      orderNumber: 'CO-2024-0002',
      customerId: 'customer-2',
      orderDate: new Date('2024-01-20'),
      requiredDate: new Date('2024-02-20'),
      status: 'CONFIRMED',
      totalAmount: 25000,
      notes: null,
      customer: {
        id: 'customer-2',
        name: 'Jane Smith',
        email: 'jane@example.com'
      },
      orderLines: []
    }
  ]

  beforeEach(() => {
    mockOnOrderSelect.mockClear()
    mockOnClear.mockClear()
  })

  test('renders search input with placeholder', () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByPlaceholderText('Search by order number, customer name, or amount...')).toBeInTheDocument()
  })

  test('displays all orders when no search term', async () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      expect(screen.getByText('CO-2024-0001')).toBeInTheDocument()
      expect(screen.getByText('CO-2024-0002')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  test('filters orders based on search term', async () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    fireEvent.change(searchInput, { target: { value: 'John' } })

    await waitFor(() => {
      expect(screen.getByText('CO-2024-0001')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('CO-2024-0002')).not.toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })

  test('shows no results message when search yields no matches', async () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No orders found matching your search')).toBeInTheDocument()
    })
  })

  test('calls onOrderSelect when order is clicked', async () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      const orderButton = screen.getByText('CO-2024-0001').closest('button')
      expect(orderButton).toBeInTheDocument()
      
      if (orderButton) {
        fireEvent.click(orderButton)
        expect(mockOnOrderSelect).toHaveBeenCalledWith(mockOrders[0])
      }
    })
  })

  test('displays selected order preview', () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        selectedOrder={mockOrders[0]}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('Selected Order')).toBeInTheDocument()
    expect(screen.getByText('CO-2024-0001')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('₱15,000')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  test('shows order lines in selected order preview', () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        selectedOrder={mockOrders[0]}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('2 item(s)')).toBeInTheDocument()
    expect(screen.getByText('Product A')).toBeInTheDocument()
    expect(screen.getByText('Product B')).toBeInTheDocument()
    expect(screen.getByText('2 × ₱5,000')).toBeInTheDocument()
    expect(screen.getByText('1 × ₱5,000')).toBeInTheDocument()
  })

  test('shows truncated order lines when more than 3 items', () => {
    const orderWithManyLines = {
      ...mockOrders[0],
      orderLines: [
        ...mockOrders[0].orderLines!,
        {
          id: 'line-3',
          productId: 'product-3',
          quantity: 1,
          unitPrice: 1000,
          status: 'PENDING' as const,
          product: { id: 'product-3', name: 'Product C', sku: 'SKU-003' }
        },
        {
          id: 'line-4',
          productId: 'product-4',
          quantity: 1,
          unitPrice: 1000,
          status: 'PENDING' as const,
          product: { id: 'product-4', name: 'Product D', sku: 'SKU-004' }
        }
      ]
    }

    render(
      <CustomerOrderSelector
        orders={[orderWithManyLines]}
        selectedOrder={orderWithManyLines}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('4 item(s)')).toBeInTheDocument()
    expect(screen.getByText('+1 more items')).toBeInTheDocument()
  })

  test('calls onClear when clear button is clicked', () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        selectedOrder={mockOrders[0]}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    const clearButtons = screen.getAllByRole('button')
    const clearButton = clearButtons.find(button => 
      button.querySelector('[data-testid="x-icon"]') || 
      button.textContent?.includes('×') ||
      button.getAttribute('aria-label')?.includes('clear')
    )
    
    if (clearButton) {
      fireEvent.click(clearButton)
      expect(mockOnClear).toHaveBeenCalled()
    }
  })

  test('disables component when disabled prop is true', () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
        disabled={true}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    expect(searchInput).toBeDisabled()
  })

  test('shows empty state when no orders provided', async () => {
    render(
      <CustomerOrderSelector
        orders={[]}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      expect(screen.getByText('No orders available')).toBeInTheDocument()
    })
  })

  test('closes dropdown when order is selected', async () => {
    render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      const orderButton = screen.getByText('CO-2024-0001').closest('button')
      if (orderButton) {
        fireEvent.click(orderButton)
      }
    })

    // Dropdown should be closed after selection
    expect(screen.queryByText('CO-2024-0002')).not.toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <CustomerOrderSelector
        orders={mockOrders}
        onOrderSelect={mockOnOrderSelect}
        onClear={mockOnClear}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})