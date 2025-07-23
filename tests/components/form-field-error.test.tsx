import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormFieldError, FormFieldErrorInline } from '@/components/ui/form-field-error';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="alert-circle-icon">
      <circle />
    </svg>
  ),
}));

describe('FormFieldError', () => {
  it('should render single error message', () => {
    render(<FormFieldError error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render multiple error messages', () => {
    const errors = ['This field is required', 'Must be at least 3 characters'];
    render(<FormFieldError error={errors} />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('Must be at least 3 characters')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('should not render when no error provided', () => {
    const { container } = render(<FormFieldError />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when empty error array provided', () => {
    const { container } = render(<FormFieldError error={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with icon by default', () => {
    render(<FormFieldError error="Test error" />);
    const alertIcon = screen.getByTestId('alert-circle-icon');
    expect(alertIcon).toBeInTheDocument();
  });

  it('should not render icon when showIcon is false', () => {
    render(<FormFieldError error="Test error" showIcon={false} />);
    const alertIcon = screen.queryByTestId('alert-circle-icon');
    expect(alertIcon).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FormFieldError error="Test error" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('FormFieldErrorInline', () => {
  it('should render inline error message', () => {
    render(<FormFieldErrorInline error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with field id when provided', () => {
    render(<FormFieldErrorInline error="Test error" field="testField" />);
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveAttribute('id', 'testField-error');
  });

  it('should not render icon by default', () => {
    render(<FormFieldErrorInline error="Test error" />);
    const alertIcon = screen.queryByTestId('alert-circle-icon');
    expect(alertIcon).not.toBeInTheDocument();
  });

  it('should render icon when showIcon is true', () => {
    render(<FormFieldErrorInline error="Test error" showIcon={true} />);
    const alertIcon = screen.getByTestId('alert-circle-icon');
    expect(alertIcon).toBeInTheDocument();
  });

  it('should handle multiple errors', () => {
    const errors = ['Error 1', 'Error 2'];
    render(<FormFieldErrorInline error={errors} />);
    
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('should not render when no error provided', () => {
    const { container } = render(<FormFieldErrorInline />);
    expect(container.firstChild).toBeNull();
  });
});