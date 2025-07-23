import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ManualCustomerEntry } from '@/components/module/admin/billing/customer-selection/manual-customer-entry';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Edit: () => <div data-testid="edit-icon" />,
  User: () => <div data-testid="user-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Save: () => <div data-testid="save-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

describe('ManualCustomerEntry', () => {
  const mockOnCustomerNameChange = vi.fn();
  const mockOnCustomerDetailsChange = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  // New tests for enhanced functionality
  describe('Validation', () => {
    it('validates customer name length', () => {
      render(
        <ManualCustomerEntry
          customerName="A"
          onCustomerNameChange={mockOnCustomerNameChange}
          onValidationChange={mockOnValidationChange}
          onClear={mockOnClear}
        />
      );

      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          errors: expect.arrayContaining(['Customer name must be at least 2 characters long']),
        })
      );
    });

    it('validates required customer name', () => {
      render(
        <ManualCustomerEntry
          customerName=""
          onCustomerNameChange={mockOnCustomerNameChange}
          onValidationChange={mockOnValidationChange}
          onClear={mockOnClear}
          required={true}
        />
      );

      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          errors: expect.arrayContaining(['Customer name is required']),
        })
      );
    });

    it('validates email format', async () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onCustomerDetailsChange={mockOnCustomerDetailsChange}
          onValidationChange={mockOnValidationChange}
          onClear={mockOnClear}
          showAdditionalFields={true}
        />
      );

      const toggleButton = screen.getByText('Add Additional Customer Details');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email');
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      });

      // Wait for validation to be called with the invalid email
      await waitFor(() => {
        const lastCall = mockOnValidationChange.mock.calls[mockOnValidationChange.mock.calls.length - 1];
        expect(lastCall[0]).toEqual(
          expect.objectContaining({
            isValid: false,
            errors: expect.arrayContaining(['Please enter a valid email address']),
          })
        );
      });
    });

    it('formats customer name properly', () => {
      render(
        <ManualCustomerEntry
          customerName=""
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
        />
      );

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      fireEvent.change(nameInput, { target: { value: 'john  doe' } });

      expect(mockOnCustomerNameChange).toHaveBeenCalledWith('John Doe');
    });

    it('shows validation errors in UI', () => {
      render(
        <ManualCustomerEntry
          customerName="A"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
        />
      );

      expect(screen.getAllByText('Customer name must be at least 2 characters long')).toHaveLength(2);
    });

    it('shows validation success indicators', () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
  });

  describe('Persistence', () => {
    it('shows save button when persistence is enabled and there are unsaved changes', () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
          enablePersistence={true}
        />
      );

      // Trigger a change to create unsaved changes
      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      fireEvent.change(nameInput, { target: { value: 'John Doe Updated' } });

      expect(screen.getByTitle('Save customer entry for future use')).toBeInTheDocument();
    });

    it('saves customer data to localStorage when save button is clicked', () => {
      const mockSetItem = vi.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
      });

      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
          enablePersistence={true}
        />
      );

      // Trigger a change to create unsaved changes
      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      fireEvent.change(nameInput, { target: { value: 'John Doe Updated' } });

      const saveButton = screen.getByTitle('Save customer entry for future use');
      fireEvent.click(saveButton);

      expect(mockSetItem).toHaveBeenCalledWith(
        'manual-customer-entries',
        expect.stringContaining('John Doe Updated')
      );
    });

    it('shows persistence status messages', () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
          enablePersistence={true}
        />
      );

      expect(screen.getByText(/Customer details are automatically saved locally/)).toBeInTheDocument();
    });

    it('does not show persistence features when disabled', () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
          enablePersistence={false}
        />
      );

      expect(screen.queryByTitle('Save customer entry for future use')).not.toBeInTheDocument();
      expect(screen.getByText(/Consider adding this customer to your database/)).toBeInTheDocument();
    });
  });

  describe('Business Rules', () => {
    it('shows warning for short customer names', () => {
      render(
        <ManualCustomerEntry
          customerName="John"
          onCustomerNameChange={mockOnCustomerNameChange}
          onValidationChange={mockOnValidationChange}
          onClear={mockOnClear}
        />
      );

      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          warnings: expect.arrayContaining(['Customer name seems short - consider adding more details']),
        })
      );
    });

    it('shows warning when no contact information is provided', () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onValidationChange={mockOnValidationChange}
          onClear={mockOnClear}
        />
      );

      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          warnings: expect.arrayContaining(['Consider adding contact information for better record keeping']),
        })
      );
    });

    it('shows warning for incomplete address', async () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onCustomerDetailsChange={mockOnCustomerDetailsChange}
          onValidationChange={mockOnValidationChange}
          onClear={mockOnClear}
          showAdditionalFields={true}
        />
      );

      const toggleButton = screen.getByText('Add Additional Customer Details');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const addressInput = screen.getByLabelText('Address');
        fireEvent.change(addressInput, { target: { value: '123 Main St' } });
      });

      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          warnings: expect.arrayContaining(['Address is incomplete - consider adding city and state']),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('displays external validation errors', () => {
      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
          errors={{ customerName: 'External validation error' }}
        />
      );

      expect(screen.getByText('External validation error')).toBeInTheDocument();
    });

    it('handles localStorage errors gracefully', () => {
      const mockSetItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <ManualCustomerEntry
          customerName="John Doe"
          onCustomerNameChange={mockOnCustomerNameChange}
          onClear={mockOnClear}
          enablePersistence={true}
        />
      );

      // Trigger a change and save
      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      fireEvent.change(nameInput, { target: { value: 'John Doe Updated' } });

      const saveButton = screen.getByTitle('Save customer entry for future use');
      fireEvent.click(saveButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save customer entry to local storage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});