import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  FormSectionError, 
  FormGlobalError, 
  FormValidationSummary 
} from '@/components/ui/form-section-error';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="alert-triangle-icon">
      <triangle />
    </svg>
  ),
  X: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="x-icon">
      <path />
    </svg>
  ),
}));

describe('FormSectionError', () => {
  const mockErrors = [
    { field: 'customerName', message: 'Customer name is required', type: 'validation' as const },
    { field: 'subtotal', message: 'Subtotal must be positive', type: 'validation' as const },
  ];

  it('should render error list', () => {
    render(<FormSectionError errors={mockErrors} />);
    
    expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
    expect(screen.getByText('customerName:')).toBeInTheDocument();
    expect(screen.getByText('Customer name is required')).toBeInTheDocument();
    expect(screen.getByText('subtotal:')).toBeInTheDocument();
    expect(screen.getByText('Subtotal must be positive')).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(
      <FormSectionError 
        errors={mockErrors} 
        title="Custom error title" 
      />
    );
    expect(screen.getByText('Custom error title')).toBeInTheDocument();
  });

  it('should not render when no errors provided', () => {
    const { container } = render(<FormSectionError errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render dismiss button when dismissible', () => {
    const onDismiss = vi.fn();
    render(
      <FormSectionError 
        errors={mockErrors} 
        dismissible={true}
        onDismiss={onDismiss}
      />
    );
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('should not render dismiss button when not dismissible', () => {
    render(<FormSectionError errors={mockErrors} dismissible={false} />);
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FormSectionError errors={mockErrors} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('FormGlobalError', () => {
  it('should render server error', () => {
    render(<FormGlobalError error="Server error occurred" type="server" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Server error occurred')).toBeInTheDocument();
  });

  it('should render network error', () => {
    render(<FormGlobalError error="Network connection failed" type="network" />);
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('should render validation error', () => {
    render(<FormGlobalError error="Validation failed" type="validation" />);
    
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
  });

  it('should not render when no error provided', () => {
    const { container } = render(<FormGlobalError />);
    expect(container.firstChild).toBeNull();
  });

  it('should render dismiss button by default', () => {
    const onDismiss = vi.fn();
    render(
      <FormGlobalError 
        error="Test error" 
        onDismiss={onDismiss}
      />
    );
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('should not render dismiss button when not dismissible', () => {
    render(
      <FormGlobalError 
        error="Test error" 
        dismissible={false}
      />
    );
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });
});

describe('FormValidationSummary', () => {
  const mockErrors = {
    customerName: 'Customer name is required',
    subtotal: ['Subtotal must be positive', 'Subtotal is required'],
    taxRate: 'Tax rate must be between 0-100%',
  };

  it('should render validation summary', () => {
    render(<FormValidationSummary errors={mockErrors} />);
    
    expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Customer Name:';
    })).toBeInTheDocument();
    expect(screen.getByText('Customer name is required')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Subtotal:';
    })).toBeInTheDocument();
    expect(screen.getByText('Subtotal must be positive')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Tax Rate:';
    })).toBeInTheDocument();
    expect(screen.getByText('Tax rate must be between 0-100%')).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(
      <FormValidationSummary 
        errors={mockErrors} 
        title="Custom validation title" 
      />
    );
    expect(screen.getByText('Custom validation title')).toBeInTheDocument();
  });

  it('should limit number of errors displayed', () => {
    const manyErrors = {
      field1: 'Error 1',
      field2: 'Error 2',
      field3: 'Error 3',
      field4: 'Error 4',
      field5: 'Error 5',
    };
    
    render(
      <FormValidationSummary 
        errors={manyErrors} 
        maxErrors={3}
      />
    );
    
    // Should only show first 3 errors
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Field1:';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Field2:';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Field3:';
    })).toBeInTheDocument();
    expect(screen.queryByText((content, element) => {
      return element?.textContent === 'Field4:';
    })).not.toBeInTheDocument();
    expect(screen.queryByText((content, element) => {
      return element?.textContent === 'Field5:';
    })).not.toBeInTheDocument();
  });

  it('should not render when no errors provided', () => {
    const { container } = render(<FormValidationSummary errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should handle array errors by showing first message', () => {
    const errorsWithArray = {
      testField: ['First error', 'Second error'],
    };
    
    render(<FormValidationSummary errors={errorsWithArray} />);
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Test Field:';
    })).toBeInTheDocument();
    expect(screen.getByText('First error')).toBeInTheDocument();
    expect(screen.queryByText('Second error')).not.toBeInTheDocument();
  });

  it('should format field names properly', () => {
    const camelCaseErrors = {
      customerName: 'Error message',
      billingType: 'Error message',
      customerOrderId: 'Error message',
    };
    
    render(<FormValidationSummary errors={camelCaseErrors} />);
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Customer Name:';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Billing Type:';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Customer Order Id:';
    })).toBeInTheDocument();
  });
});