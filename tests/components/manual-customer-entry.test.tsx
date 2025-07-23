import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManualCustomerEntry } from '@/components/module/admin/billing/customer-selection/manual-customer-entry';

describe('ManualCustomerEntry', () => {
  const mockOnCustomerNameChange = vi.fn();
  const mockOnCustomerDetailsChange = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('Customer Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter customer name...')).toBeInTheDocument();
  });

  it('displays required asterisk when required prop is true', () => {
    render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        required={true}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onCustomerNameChange when name input changes', () => {
    render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    );

    const nameInput = screen.getByPlaceholderText('Enter customer name...');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    expect(mockOnCustomerNameChange).toHaveBeenCalledWith('John Doe');
  });

  it('shows customer preview card when name is entered', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('Manual Customer Entry')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
  });

  it('shows clear button when customer name is entered', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByTitle('Clear customer information');
    expect(clearButton).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByTitle('Clear customer information');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
    expect(mockOnCustomerNameChange).toHaveBeenCalledWith('');
  });

  it('shows additional fields toggle when showAdditionalFields is true', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    );

    expect(screen.getByText('Add Additional Customer Details')).toBeInTheDocument();
  });

  it('expands additional fields when toggle is clicked', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    );

    const toggleButton = screen.getByText('Add Additional Customer Details');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Optional Customer Information')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
      expect(screen.getByLabelText('Address')).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('State/Province')).toBeInTheDocument();
      expect(screen.getByLabelText('Postal Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
    });
  });

  it('calls onCustomerDetailsChange when additional fields are modified', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    );

    const toggleButton = screen.getByText('Add Additional Customer Details');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    });

    expect(mockOnCustomerDetailsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
      })
    );
  });

  it('displays customer details in preview when provided', () => {
    const customerDetails = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+63 912 345 6789',
      address: '123 Main St',
      city: 'Manila',
      state: 'Metro Manila',
      postalCode: '1000',
      country: 'Philippines',
    };

    render(
      <ManualCustomerEntry
        customerName="John Doe"
        customerDetails={customerDetails}
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Manila, Metro Manila, 1000, Philippines')).toBeInTheDocument();
  });

  it('shows manual entry notice when customer name is entered', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText(/Manual Entry:/)).toBeInTheDocument();
    expect(screen.getByText(/This customer information will be saved with the billing statement/)).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(
      <ManualCustomerEntry
        customerName=""
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        disabled={true}
      />
    );

    const nameInput = screen.getByPlaceholderText('Enter customer name...');
    expect(nameInput).toBeDisabled();
  });

  it('pre-fills additional fields with existing customer details', async () => {
    const customerDetails = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+63 912 345 6789',
      address: '123 Main St',
    };

    render(
      <ManualCustomerEntry
        customerName="John Doe"
        customerDetails={customerDetails}
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    );

    const toggleButton = screen.getByText('Add Additional Customer Details');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const phoneInput = screen.getByLabelText('Phone') as HTMLInputElement;
      const addressInput = screen.getByLabelText('Address') as HTMLTextAreaElement;

      expect(emailInput.value).toBe('john@example.com');
      expect(phoneInput.value).toBe('+63 912 345 6789');
      expect(addressInput.value).toBe('123 Main St');
    });
  });

  it('changes toggle button text when additional fields are expanded', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    );

    const toggleButton = screen.getByText('Add Additional Customer Details');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Hide Additional Customer Details')).toBeInTheDocument();
    });
  });

  it('clears all fields when clear is called', () => {
    const customerDetails = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+63 912 345 6789',
    };

    render(
      <ManualCustomerEntry
        customerName="John Doe"
        customerDetails={customerDetails}
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByTitle('Clear customer information');
    fireEvent.click(clearButton);

    expect(mockOnCustomerNameChange).toHaveBeenCalledWith('');
    expect(mockOnCustomerDetailsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      })
    );
  });

  it('does not show additional fields when showAdditionalFields is false', () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onClear={mockOnClear}
        showAdditionalFields={false}
      />
    );

    expect(screen.queryByText('Add Additional Customer Details')).not.toBeInTheDocument();
  });

  it('validates email input type', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    );

    const toggleButton = screen.getByText('Add Additional Customer Details');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  it('validates phone input type', async () => {
    render(
      <ManualCustomerEntry
        customerName="John Doe"
        onCustomerNameChange={mockOnCustomerNameChange}
        onCustomerDetailsChange={mockOnCustomerDetailsChange}
        onClear={mockOnClear}
        showAdditionalFields={true}
      />
    );

    const toggleButton = screen.getByText('Add Additional Customer Details');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const phoneInput = screen.getByLabelText('Phone');
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });
  });
});