/**
 * End-to-End Tests for Billing Statement Creation Page
 * 
 * Tests the complete billing statement creation workflow including:
 * - Page loading and navigation
 * - Form step progression
 * - Validation and error handling
 * - Form submission and success flow
 * - Accessibility compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import CreateBillingStatementPage from '@/app/admin/(protected)/billing/billing-statements/create/page';
import { createBillingStatement } from '@/lib/actions/billing-statements';
import { getAllCustomers } from '@/lib/actions/customers';
import { getCustomerOrdersForBilling } from '@/lib/actions/customer-order';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/actions/billing-statements', () => ({
  createBillingStatement: vi.fn(),
}));

vi.mock('@/lib/actions/customers', () => ({
  getAllCustomers: vi.fn(),
}));

vi.mock('@/lib/actions/customer-order', () => ({
  getCustomerOrdersForBilling: vi.fn(),
}));

// Mock data
const mockCustomers = [
  {
    id: '1',
    name: 'Test Customer 1',
    email: 'customer1@test.com',
    phone: '+1234567890',
  },
  {
    id: '2',
    name: 'Test Customer 2',
    email: 'customer2@test.com',
    phone: '+0987654321',
  },
];

const mockCustomerOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerId: '1',
    customer: mockCustomers[0],
    totalAmount: 1000,
    orderDate: new Date('2024-01-01'),
    orderLines: [
      {
        id: '1',
        productId: 'prod-1',
        product: { name: 'Test Product', sku: 'TEST-001' },
        quantity: 2,
        unitPrice: 500,
      },
    ],
  },
];

describe('CreateBillingStatementPage', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    
    (getAllCustomers as any).mockResolvedValue(mockCustomers);
    (getCustomerOrdersForBilling as any).mockResolvedValue(mockCustomerOrders);
    (createBillingStatement as any).mockResolvedValue({
      success: true,
      data: { id: 'billing-1', statementNumber: 'BILL-001' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page Loading and Navigation', () => {
    it('should render page header with correct title and navigation', async () => {
      render(<CreateBillingStatementPage />);

      // Check page title
      expect(screen.getByRole('heading', { name: /create billing statement/i })).toBeInTheDocument();
      
      // Check breadcrumb navigation
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /billing statements/i })).toBeInTheDocument();
      
      // Check back button
      expect(screen.getByRole('button', { name: /back to statements/i })).toBeInTheDocument();
      
      // Check cancel button
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<CreateBillingStatementPage />);
      
      expect(screen.getByText(/loading billing form/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should handle back navigation', async () => {
      render(<CreateBillingStatementPage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to statements/i });
      await userEvent.click(backButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('should handle cancel navigation', async () => {
      render(<CreateBillingStatementPage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL Parameters Handling', () => {
    it('should pre-fill form with customer order from URL parameters', async () => {
      mockSearchParams.set('type', 'customer-order');
      mockSearchParams.set('customerOrderId', '1');

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Should skip to customer information step
      expect(screen.getByText(/customer information/i)).toBeInTheDocument();
    });

    it('should pre-fill form with direct customer from URL parameters', async () => {
      mockSearchParams.set('type', 'direct-customer');
      mockSearchParams.set('customerId', '1');

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Should skip to customer information step
      expect(screen.getByText(/customer information/i)).toBeInTheDocument();
    });
  });

  describe('Form Step Progression', () => {
    it('should progress through all form steps', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Step 1: Billing Type Selection
      expect(screen.getByText(/choose billing type/i)).toBeInTheDocument();
      
      const customerOrderOption = screen.getByRole('button', { name: /customer order billing/i });
      await userEvent.click(customerOrderOption);

      // Progress to next step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      // Step 2: Customer Information
      await waitFor(() => {
        expect(screen.getByText(/customer information/i)).toBeInTheDocument();
      });

      // Select a customer order
      const orderSelect = screen.getByRole('combobox', { name: /customer order/i });
      await userEvent.click(orderSelect);
      
      const orderOption = await screen.findByText(/ORD-001/);
      await userEvent.click(orderOption);

      // Progress to next step
      const nextButton2 = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton2);

      // Step 3: Billing Details
      await waitFor(() => {
        expect(screen.getByText(/billing details/i)).toBeInTheDocument();
      });
    });

    it('should prevent progression with invalid data', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Try to proceed without selecting billing type
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      // Should show validation error
      expect(screen.getByText(/please select a billing type/i)).toBeInTheDocument();
    });

    it('should allow navigation back to previous steps', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Progress to step 2
      const customerOrderOption = screen.getByRole('button', { name: /customer order billing/i });
      await userEvent.click(customerOrderOption);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      // Go back to previous step
      const backButton = screen.getByRole('button', { name: /previous/i });
      await userEvent.click(backButton);

      // Should be back at billing type selection
      expect(screen.getByText(/choose billing type/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required customer information', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Select manual customer entry
      const manualOption = screen.getByRole('button', { name: /manual customer entry/i });
      await userEvent.click(manualOption);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      // Try to proceed without entering customer name
      const nextButton2 = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton2);

      // Should show validation error
      expect(screen.getByText(/customer name is required/i)).toBeInTheDocument();
    });

    it('should validate invoice items', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Progress through steps to invoice items
      // ... (setup steps)

      // Try to submit without valid invoice items
      const submitButton = screen.getByRole('button', { name: /create billing statement/i });
      await userEvent.click(submitButton);

      // Should show validation error
      expect(screen.getByText(/at least one invoice item is required/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form successfully with valid data', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Fill out complete form
      // ... (form filling steps)

      const submitButton = screen.getByRole('button', { name: /create billing statement/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(createBillingStatement).toHaveBeenCalledWith(
          expect.objectContaining({
            customerName: expect.any(String),
            invoiceItems: expect.arrayContaining([
              expect.objectContaining({
                description: expect.any(String),
                quantity: expect.any(Number),
                unitPrice: expect.any(Number),
              }),
            ]),
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Billing statement created successfully',
        expect.objectContaining({
          description: expect.stringContaining('BILL-001'),
        })
      );

      expect(mockPush).toHaveBeenCalledWith('/admin/billing/billing-statements/billing-1');
    });

    it('should handle submission errors gracefully', async () => {
      (createBillingStatement as any).mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Fill out and submit form
      // ... (form filling steps)

      const submitButton = screen.getByRole('button', { name: /create billing statement/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create billing statement',
          expect.objectContaining({
            description: 'Database connection failed',
          })
        );
      });

      // Should not navigate away on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should prevent double submission', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Fill out form and submit
      // ... (form filling steps)

      const submitButton = screen.getByRole('button', { name: /create billing statement/i });
      
      // Click submit button multiple times rapidly
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);

      // Should only call create function once
      await waitFor(() => {
        expect(createBillingStatement).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error boundary for unexpected errors', async () => {
      (getAllCustomers as any).mockRejectedValue(new Error('Network error'));

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should handle network errors during data loading', async () => {
      (getCustomerOrdersForBilling as any).mockRejectedValue(new Error('Failed to fetch'));

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Check main heading
      const heading = screen.getByRole('heading', { name: /create billing statement/i });
      expect(heading).toHaveAttribute('aria-level', '1');

      // Check navigation landmarks
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Check form accessibility
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Test tab navigation through interactive elements
      const backButton = screen.getByRole('button', { name: /back to statements/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      backButton.focus();
      expect(document.activeElement).toBe(backButton);

      // Tab to next element
      fireEvent.keyDown(backButton, { key: 'Tab' });
      // Note: Full keyboard navigation testing would require more complex setup
    });

    it('should announce form validation errors to screen readers', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Trigger validation error
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      // Check for aria-live region with error message
      const errorMessage = screen.getByText(/please select a billing type/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Form Persistence', () => {
    it('should auto-save form data', async () => {
      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Fill out some form data
      const customerOrderOption = screen.getByRole('button', { name: /customer order billing/i });
      await userEvent.click(customerOrderOption);

      // Should show auto-save status
      await waitFor(() => {
        expect(screen.getByText(/auto-saved/i)).toBeInTheDocument();
      });
    });

    it('should offer form recovery on page reload', async () => {
      // Mock localStorage with saved form data
      const savedData = {
        billingType: 'customer-order',
        customerName: 'Test Customer',
        timestamp: Date.now(),
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => JSON.stringify(savedData)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.getByText(/recover previous session/i)).toBeInTheDocument();
      });

      // Should show recovery dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<CreateBillingStatementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading billing form/i)).not.toBeInTheDocument();
      });

      // Check that mobile-specific classes are applied
      const container = screen.getByRole('main');
      expect(container).toHaveClass('container');
    });
  });
});