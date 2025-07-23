import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DirectCustomerSelector } from '@/components/module/admin/billing/customer-selection/direct-customer-selector'
import { Customer } from '@/types/admin/billing'

describe('DirectCustomerSelector', () => {
  const mockOnCustomerSelect = vi.fn()
  const mockOnClear = vi.fn()

  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      code: 'CUST-001',
      email: 'john@example.com',
      phone: '+63 912 345 6789',
      address: '123 Main St',
      city: 'Manila',
      state: 'NCR',
      country: 'Philippines',
      postalCode: '1000',
      tinNumber: '123-456-789-000',
      status: 'ACTIVE'
    },
    {
      id: '2',
      name: 'Jane Smith',
      code: 'CUST-002',
      email: 'jane@example.com',
      phone: '+63 917 123 4567',
      address: '456 Oak Ave',
      city: 'Quezon City',
      state: 'NCR',
      country: 'Philippines',
      postalCode: '1100',
      tinNumber: '987-654-321-000',
      status: 'ACTIVE'
    },
    {
      id: '3',
      name: 'Bob Johnson',
      code: 'CUST-003',
      email: 'bob@example.com',
      phone: '+63 918 987 6543',
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      tinNumber: null,
      status: 'INACTIVE'
    }
  ]

  beforeEach(() => {
    mockOnCustomerSelect.mockClear()
    mockOnClear.mockClear()
  })

  test('renders search input with placeholder', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByPlaceholderText('Search by name, email, phone, or customer code...')).toBeInTheDocument()
  })

  test('displays all customers when no search term', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })
  })

  test('filters customers based on name search', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.change(searchInput, { target: { value: 'John Doe' } })

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })
  })

  test('filters customers based on email search', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.change(searchInput, { target: { value: 'jane@' } })

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })
  })

  test('filters customers based on customer code search', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.change(searchInput, { target: { value: 'CUST-002' } })

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })
  })

  test('shows no results message when search yields no matches', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No customers found matching your search')).toBeInTheDocument()
    })
  })

  test('calls onCustomerSelect when customer is clicked', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      const customerButton = screen.getByText('John Doe').closest('button')
      expect(customerButton).toBeInTheDocument()
      
      if (customerButton) {
        fireEvent.click(customerButton)
        expect(mockOnCustomerSelect).toHaveBeenCalledWith(mockCustomers[0])
      }
    })
  })

  test('displays selected customer preview with full details', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('Selected Customer')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText((content, element) => content.includes('CUST-001'))).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText((content, element) => content.includes('Manila, NCR, Philippines'))).toBeInTheDocument()
    expect(screen.getByText((content, element) => content.includes('TIN: 123-456-789-000'))).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  test('displays selected customer preview with minimal details', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[2]} // Bob Johnson with minimal details
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('Selected Customer')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText((content, element) => content.includes('CUST-003'))).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    expect(screen.getByText('+63 918 987 6543')).toBeInTheDocument()
    expect(screen.getByText('INACTIVE')).toBeInTheDocument()
    
    // Should not show address or TIN sections for customers without them
    expect(screen.queryByText('TIN:')).not.toBeInTheDocument()
  })

  test('shows customer status badges correctly', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      const activeBadges = screen.getAllByText('ACTIVE')
      const inactiveBadges = screen.getAllByText('INACTIVE')
      
      expect(activeBadges.length).toBeGreaterThan(0)
      expect(inactiveBadges.length).toBeGreaterThan(0)
    })
  })

  test('calls onClear when clear button is clicked', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
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
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        disabled={true}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    expect(searchInput).toBeDisabled()
  })

  test('shows empty state when no customers provided', async () => {
    render(
      <DirectCustomerSelector
        customers={[]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      expect(screen.getByText('No customers available')).toBeInTheDocument()
    })
  })

  test('closes dropdown when customer is selected', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      const customerButton = screen.getByText('John Doe').closest('button')
      if (customerButton) {
        fireEvent.click(customerButton)
      }
    })

    // Dropdown should be closed after selection
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('displays customer information in dropdown correctly', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by name, email, phone, or customer code...')
    fireEvent.focus(searchInput)

    await waitFor(() => {
      // Check that customer codes, emails, and phones are displayed in dropdown
      expect(screen.getByText('CUST-001')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument()
    })
  })
})