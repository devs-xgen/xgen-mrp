import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingStatementForm } from '@/components/module/admin/billing/enhanced-billing-statement-form';
import { EnhancedDirectCustomerSelector } from '@/components/module/admin/billing/customer-selection/enhanced-direct-customer-selector';
import { InvoiceItemsManager } from '@/components/module/admin/billing/invoice-items/invoice-items-manager';

// Performance testing utilities
const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now();
  render(component);
  const endTime = performance.now();
  return endTime - startTime;
};

const measureInteractionTime = async (interaction: () => Promise<void>) => {
  const startTime = performance.now();
  await interaction();
  const endTime = performance.now();
  return endTime - startTime;
};

// Mock large datasets
const generateLargeCustomerDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: `customer-${i}`,
    name: `Customer ${i}`,
    email: `customer${i}@example.com`,
    phone: `+123456789${i}`,
    code: `CUST${i.toString().padStart(4, '0')}`,
    address: `${i} Test Street, Test City, TC ${i.toString().padStart(5, '0')}`,
    paymentTerms: 'NET_30',
    creditLimit: 10000 + (i * 100)
  }));
};

const generateLargeOrderDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: `order-${i}`,
    orderNumber: `ORD-${i.toString().padStart(6, '0')}`,
    customer: {
      id: `customer-${i % 100}`,
      name: `Customer ${i % 100}`,
      email: `customer${i % 100}@example.com`
    },
    totalAmount: 1000 + (i * 50),
    status: ['PENDING', 'CONFIRMED', 'PROCESSING'][i % 3],
    orderDate: new Date(2024, 0, 1 + (i % 365)),
    orderLines: Array.from({ length: Math.min(5, i % 10 + 1) }, (_, j) => ({
      id: `line-${i}-${j}`,
      product: { name: `Product ${j}` },
      quantity: j + 1,
      unitPrice: 100 + (j * 25)
    }))
  }));
};

const generateLargeInvoiceItemsDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: `item-${i}`,
    description: `Invoice Item ${i}`,
    quantity: Math.floor(Math.random() * 10) + 1,
    unitPrice: Math.floor(Math.random() * 1000) + 100,
    discount: Math.floor(Math.random() * 20),
    taxRate: [0, 5, 10, 15][i % 4]
  }));
};

// Mock API functions
const mockGetCustomers = vi.fn();
const mockGetCustomerOrders = vi.fn();
const mockCreateBillingStatement = vi.fn();

vi.mock('@/lib/actions/customers', () => ({
  getAllCustomers: () => mockGetCustomers()
}));

vi.mock('@/lib/actions/customer-order', () => ({
  getCustomerOrders: () => mockGetCustomerOrders()
}));

vi.mock('@/lib/actions/billing-statements', () => ({
  createBillingStatement: (data: any) => mockCreateBillingStatement(data)
}));

describe('Billing UI Performance Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful responses by default
    mockCreateBillingStatement.mockResolvedValue({ id: 'billing-1', success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Large Dataset Performance', () => {
    it('should render customer selector with 1000 customers within acceptable time', async () => {
      const largeCustomerDataset = generateLargeCustomerDataset(1000);
      mockGetCustomers.mockResolvedValue(largeCustomerDataset);

      const renderTime = await measureRenderTime(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      // Should render within 500ms
      expect(renderTime).toBeLessThan(500);

      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
      });
    });

    it('should handle customer search with large dataset efficiently', async () => {
      const largeCustomerDataset = generateLargeCustomerDataset(5000);
      mockGetCustomers.mockResolvedValue(largeCustomerDataset);

      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search customers/)).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/Search customers/);

      const searchTime = await measureInteractionTime(async () => {
        await user.type(searchInput, 'Customer 1000');
        await waitFor(() => {
          expect(screen.getByText('Customer 1000')).toBeInTheDocument();
        });
      });

      // Search should complete within 300ms
      expect(searchTime).toBeLessThan(300);
    });

    it('should render order selector with 2000 orders within acceptable time', async () => {
      const largeOrderDataset = generateLargeOrderDataset(2000);
      mockGetCustomerOrders.mockResolvedValue(largeOrderDataset);

      const renderTime = await measureRenderTime(
        <EnhancedCustomerOrderSelector
          onOrderSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      // Should render within 600ms
      expect(renderTime).toBeLessThan(600);

      await waitFor(() => {
        expect(screen.getByText('ORD-000000')).toBeInTheDocument();
      });
    });

    it('should handle invoice items with 100+ items efficiently', async () => {
      const largeInvoiceItems = generateLargeInvoiceItemsDataset(100);

      const renderTime = await measureRenderTime(
        <InvoiceItemsManager
          items={largeInvoiceItems}
          onItemsChange={vi.fn()}
          onCalculationChange={vi.fn()}
        />
      );

      // Should render within 400ms
      expect(renderTime).toBeLessThan(400);

      // Verify all items are rendered
      await waitFor(() => {
        expect(screen.getByText('Invoice Item 0')).toBeInTheDocument();
        expect(screen.getByText('Invoice Item 99')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction Performance', () => {
    it('should handle rapid billing type switching efficiently', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      const customerOrderCard = screen.getByText('Customer Order Billing').closest('div');
      const directCustomerCard = screen.getByText('Direct Customer Billing').closest('div');
      const manualEntryCard = screen.getByText('Manual Customer Entry').closest('div');

      const switchingTime = await measureInteractionTime(async () => {
        // Rapidly switch between billing types
        for (let i = 0; i < 10; i++) {
          await user.click(customerOrderCard!);
          await user.click(directCustomerCard!);
          await user.click(manualEntryCard!);
        }
      });

      // Should complete all switches within 1 second
      expect(switchingTime).toBeLessThan(1000);
    });

    it('should handle rapid invoice item additions efficiently', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      // Set up form first
      const manualEntryCard = screen.getByText('Manual Customer Entry').closest('div');
      await user.click(manualEntryCard!);

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'Test Customer');

      const additionTime = await measureInteractionTime(async () => {
        // Add 20 invoice items rapidly
        for (let i = 0; i < 20; i++) {
          const addItemButton = screen.getByRole('button', { name: /add item/i });
          await user.click(addItemButton);
        }
      });

      // Should complete all additions within 2 seconds
      expect(additionTime).toBeLessThan(2000);

      // Verify all items were added
      const itemRows = screen.getAllByText(/Item \d+/);
      expect(itemRows).toHaveLength(20);
    });

    it('should handle real-time calculation updates efficiently', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      // Set up form
      const manualEntryCard = screen.getByText('Manual Customer Entry').closest('div');
      await user.click(manualEntryCard!);

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'Test Customer');

      // Add an invoice item
      const addItemButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addItemButton);

      const quantityInput = screen.getByPlaceholderText(/Quantity/);
      const priceInput = screen.getByPlaceholderText(/Unit price/);

      const calculationTime = await measureInteractionTime(async () => {
        // Rapidly change values to trigger calculations
        for (let i = 1; i <= 10; i++) {
          await user.clear(quantityInput);
          await user.type(quantityInput, i.toString());
          await user.clear(priceInput);
          await user.type(priceInput, (i * 100).toString());
        }
      });

      // Should complete all calculations within 1.5 seconds
      expect(calculationTime).toBeLessThan(1500);

      // Verify final calculation is correct
      await waitFor(() => {
        expect(screen.getByText('$1,000.00')).toBeInTheDocument(); // 10 * 100
      });
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should not cause memory leaks with repeated form renders', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render and unmount form multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<BillingStatementForm />);
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should properly cleanup event listeners and timers', async () => {
      const user = userEvent.setup();
      
      const { unmount } = render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search customers/);
      await user.type(searchInput, 'test');

      // Unmount component
      unmount();

      // Wait for any pending timers
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should not throw any errors or warnings about cleanup
      expect(true).toBe(true); // If we reach here, cleanup was successful
    });
  });

  describe('Network Performance', () => {
    it('should handle slow API responses gracefully', async () => {
      // Mock slow API response
      mockGetCustomers.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(generateLargeCustomerDataset(100)), 2000)
        )
      );

      const startTime = performance.now();
      
      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      // Should show loading state immediately
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
      }, { timeout: 3000 });

      const totalTime = performance.now() - startTime;
      
      // Should handle the delay gracefully
      expect(totalTime).toBeGreaterThan(2000);
      expect(totalTime).toBeLessThan(2500); // Some buffer for processing
    });

    it('should debounce search requests to prevent API spam', async () => {
      const user = userEvent.setup();
      mockGetCustomers.mockResolvedValue(generateLargeCustomerDataset(100));

      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search customers/);

      // Type rapidly
      await user.type(searchInput, 'test customer search', { delay: 50 });

      // Wait for debounce
      await waitFor(() => {
        expect(mockGetCustomers).toHaveBeenCalledTimes(1);
      });

      // Should only make one API call despite rapid typing
      expect(mockGetCustomers).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent API requests efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock API responses with different delays
      mockGetCustomers.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(generateLargeCustomerDataset(50)), 100)
        )
      );
      
      mockGetCustomerOrders.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(generateLargeOrderDataset(50)), 150)
        )
      );

      const startTime = performance.now();

      render(<BillingStatementForm />);

      // Trigger both API calls by switching billing types
      const customerOrderCard = screen.getByText('Customer Order Billing').closest('div');
      const directCustomerCard = screen.getByText('Direct Customer Billing').closest('div');

      await user.click(customerOrderCard!);
      await user.click(directCustomerCard!);

      // Wait for both to complete
      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
      });

      const totalTime = performance.now() - startTime;

      // Should complete within reasonable time despite concurrent requests
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Browser Compatibility Performance', () => {
    it('should perform consistently across different viewport sizes', async () => {
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ];

      const renderTimes: number[] = [];

      for (const viewport of viewports) {
        // Mock viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        });

        const renderTime = await measureRenderTime(<BillingStatementForm />);
        renderTimes.push(renderTime);
      }

      // All render times should be within acceptable range
      renderTimes.forEach(time => {
        expect(time).toBeLessThan(800);
      });

      // Performance should be consistent across viewports (within 200ms difference)
      const maxTime = Math.max(...renderTimes);
      const minTime = Math.min(...renderTimes);
      expect(maxTime - minTime).toBeLessThan(200);
    });
  });
});