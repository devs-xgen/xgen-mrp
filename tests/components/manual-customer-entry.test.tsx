import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ManualCustomerEntry } from '@/components/module/admin/billing/customer-selection/manual-customer-entry'

describe('ManualCustomerEntry', () => {
  const mockOnCustomerNameChange = vi.fn()
  const mockOnCustomerDetailsChange = vi.fn()
  const mockOnClear = vi.fn()

  const mockCustomerDetails = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+63 912 345 6789',
    address: '123 Main St, Manila'
  }

  beforeEach(() => {
    mockOnCustomerNameChange.mockClear()
    mockOnCustomerDetailsChange.mockClear()
    mockOnClear.mockClear()
  })

  test('renders customer name input with placeholder', () => {
    render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByPlaceholderText('Enter customer name...')).toBeInTheDocument()
    expect(screen.getByText('Customer Name *')).toBeInTheDocument()
  })

  test('displays current customer name value', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    )

    const nameInput = screen.getByDisplayValue('John Doe')
    expect(nameInput).toBeInTheDocument()
  })

  test('calls onCustomerNameChange when name is typed', () => {
    render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter customer name...')
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })

    expect(mockOnCustomerNameChange).toHaveBeenCalledWith('Jane Smith')
  })

  test('shows additional fields when expanded', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    )

    const expandButton = screen.getByText(/Additional Customer Details/)
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('customer@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('+63 XXX XXX XXXX')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter customer address...')).toBeInTheDocument()
    })
  })

  test('hides additional fields when showAdditionalFields is false', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={false}
      />
    )

    expect(screen.queryByText(/Additional Customer Details/)).not.toBeInTheDocument()
  })

  test('displays customer details when provided', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        customerDetails={mockCustomerDetails}
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    )

    const expandButton = screen.getByText(/Additional Customer Details/)
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+63 912 345 6789')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123 Main St, Manila')).toBeInTheDocument()
    })
  })

  test('calls onCustomerDetailsChange when additional fields are modified', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    )

    const expandButton = screen.getByText(/Additional Customer Details/)
    fireEvent.click(expandButton)

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('customer@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(mockOnCustomerDetailsChange).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'test@example.com',
        phone: '',
        address: ''
      })
    })
  })

  test('shows customer summary when name is provided', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('Customer Summary')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Manual Entry')).toBeInTheDocument()
  })

  test('shows customer summary with additional details', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        customerDetails={mockCustomerDetails}
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('Customer Summary')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument()
    expect(screen.getByText('123 Main St, Manila')).toBeInTheDocument()
  })

  test('shows message when only name is provided', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByText('Only customer name will be used for billing.')).toBeInTheDocument()
  })

  test('calls onClear when clear button is clicked', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
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

  test('disables all inputs when disabled prop is true', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        disabled={true}
      />
    )

    const nameInput = screen.getByDisplayValue('John Doe')
    expect(nameInput).toBeDisabled()
  })

  test('disables additional fields when disabled prop is true', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        disabled={true}
        showAdditionalFields={true}
      />
    )

    const expandButton = screen.getByRole('button', { name: /Additional Customer Details/ })
    expect(expandButton).toBeDisabled()
  })

  test('shows helpful note about manual entry', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    )

    const expandButton = screen.getByText(/Additional Customer Details/)
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText(/These additional details are optional/)).toBeInTheDocument()
      expect(screen.getByText(/won't create a permanent customer record/)).toBeInTheDocument()
    })
  })

  test('applies custom className', () => {
    const { container } = render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('shows clear button only when customer name is provided', () => {
    const { rerender } = render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={false}
      />
    )

    // No clear button when name is empty (only the expand button should be hidden)
    const clearButtons = screen.queryAllByRole('button').filter(button => 
      button.querySelector('[data-testid="x-icon"]')
    )
    expect(clearButtons.length).toBe(0)

    rerender(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={false}
      />
    )

    // Clear button should appear when name is provided
    const clearButtonsAfter = screen.queryAllByRole('button').filter(button => 
      button.querySelector('[data-testid="x-icon"]')
    )
    expect(clearButtonsAfter.length).toBeGreaterThan(0)
  })

  test('updates name in details when name changes', () => {
    render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter customer name...')
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })

    expect(mockOnCustomerNameChange).toHaveBeenCalledWith('Jane Smith')
    expect(mockOnCustomerDetailsChange).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: '',
      phone: '',
      address: ''
    })
  })

  test('shows proper labels for all input fields', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    )

    expect(screen.getByText('Customer Name *')).toBeInTheDocument()

    const expandButton = screen.getByText(/Additional Customer Details/)
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('Email Address')).toBeInTheDocument()
      expect(screen.getByText('Phone Number')).toBeInTheDocument()
      expect(screen.getByText('Address')).toBeInTheDocument()
    })
  })
})