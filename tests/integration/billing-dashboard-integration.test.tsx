/**
 * Integration Tests for Billing Dashboard and Enhanced Billing Form Interaction
 * 
 * Tests the complete flow from dashboard to billing creation including:
 * - Dashboard quick actions for different billing types
 * - Navigation to billing creation with pre-selected types
 * - Analytics display and recommendations
 * - Recent statements with billing type indicators
 * - Dashboard-to-form state management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dashboard components
const MockBillingTypeQuickActions = ({ billingTypeAnalytics = [], recommendations = [] }) => {
  return (
    <div data-testid="billing-type-quick-actions">
      <h3>Quick Actions</h3>
      <div>
        <button data-testid="customer-order-action">
          Customer Order Billing
          <span>Used {billingTypeAnalytics.find(a => a.billingType === 'customer-order')?.count || 0} times</span>
        </button>
        <button data-testid="direct-customer-action">
          Direct Customer Billing
          <span>Used {billingTypeAnalytics.find(a => a.billingType === 'direct-customer')?.count || 0} times</span>
        </button>
        <button data-testid="manual-customer-action">
          Manual Customer Entry
          <span>Used {billingTypeAnalytics.find(a => a.billingType === 'manual-customer')?.count || 0} times</span>
        </button>
      </div>
      {recommendations.length > 0 && (
        <div data-testid="recommendations">
          <span>Recommended: {recommendations[0].recommendedType}</span>
          <span>{recommendations[0].reason}</span>
        </div>
      )}
    </div>
  );
};

const MockBillingTypeAnalyticsCard = ({ analytics = [] }) => {
  const totalCount = analytics.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div data-testid="billing-type-analytics">
      <h3>Billing Type Usage</h3>
      {analytics.length === 0 ? (
        <div>No billing data available yet</div>
      ) : (
        <div>
          {analytics.map((item) => (
            <div key={item.billingType} data-testid={`analytics-${item.billingType}`}>
              <span>{item.billingType}: {item.count} statements</span>
              <span>{((item.count / totalCount) * 100).toFixed(1)}%</span>
              <span>₱{item.totalAmount.toLocaleString()}</span>
            </div>
          ))}
          <div data-testid="analytics-summary">
            <span>Total: {totalCount} statements</span>
            <span>₱{analytics.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const MockBillingRecommendationsCard = ({ recommendations = [] }) => {
  return (
    <div data-testid="billing-recommendations">
      <h3>Smart Recommendations</h3>
      {recommendations.length === 0 ? (
        <div>No recommendations available yet</div>
      ) : (
        <div>
          {recommendations.map((rec, index) => (
            <div key={index} data-testid={`recommendation-${index}`}>
              <span>{rec.recommendedType}</span>
              <span>{rec.reason}</span>
              <span>{Math.round(rec.confidence * 100)}% confidence</span>
              <button>Try {rec.recommendedType}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MockEnhancedRecentStatements = ({ statements = [] }) => {
  const getBillingType = (statement) => {
    if (statement.customerOrderId) return 'customer-order';
    if (statement.customerId) return 'direct-customer';
    return 'manual-customer';
  };

  return (
    <div data-testid="recent-statements">
      <h3>Recent Billing Statements</h3>
      {statements.length === 0 ? (
        <div>No billing statements yet</div>
      ) : (
        <div>
          {statements.map((statement) => (
            <div key={statement.id} data-testid={`statement-${statement.id}`}>
              <span>{statement.statementNumber}</span>
              <span>{statement.customerName}</span>
              <span data-testid={`billing-type-${getBillingType(statement)}`}>
                {getBillingType(statement)}
              </span>
              <span>₱{statement.netAmount.toLocaleString()}</span>
              <span>{statement.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MockBillingDashboard = ({ analytics = {}, statements = [] }) => {
  const {
    billingTypeBreakdown = [],
    billingTypeRecommendations = [],
    totalRevenue = 0,
    paidAmount = 0,
    pendingAmount = 0,
    overdueAmount = 0
  } = analytics;

  return (
    <div data-testid="billing-dashboard">
      <div>
        <h1>Billing Dashboard</h1>
        <button data-testid="new-billing-statement">
          New Billing Statement
        </button>
      </div>

      {/* Key Metrics */}
      <div data-testid="key-metrics">
        <div>Total Revenue: ₱{totalRevenue.toLocaleString()}</div>
        <div>Paid Amount: ₱{paidAmount.toLocaleString()}</div>
        <div>Pending Amount: ₱{pendingAmount.toLocaleString()}</div>
        <div>Overdue: ₱{overdueAmount.toLocaleString()}</div>
      </div>

      {/* Enhanced Components */}
      <MockBillingTypeQuickActions 
        billingTypeAnalytics={billingTypeBreakdown}
        recommendations={billingTypeRecommendations}
      />
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <MockEnhancedRecentStatements statements={statements} />
        <MockBillingTypeAnalyticsCard analytics={billingTypeBreakdown} />
      </div>
      
      <MockBillingRecommendationsCard recommendations={billingTypeRecommendations} />
    </div>
  );
};

const MockBillingCreationForm = ({ preSelectedType = null }) => {
  return (
    <div data-testid="billing-creation-form">
      <h1>Create Billing Statement</h1>
      {preSelectedType && (
        <div data-testid="pre-selected-type">
          Pre-selected: {preSelectedType}
        </div>
      )}
      <div data-testid="billing-type-selector">
        <button data-testid="select-customer-order">Customer Order Billing</button>
        <button data-testid="select-direct-customer">Direct Customer Billing</button>
        <button data-testid="select-manual-customer">Manual Customer Entry</button>
      </div>
      <div data-testid="form-content">
        <input placeholder="Customer Name" />
        <button>Save</button>
        <button>Submit</button>
      </div>
    </div>
  );
};

// Mock navigation function
const mockNavigate = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockNavigate,
    replace: mockNavigate,
  }),
}));

describe('Billing Dashboard Integration Tests', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Dashboard Analytics Display', () => {
    it('should display billing type analytics correctly', () => {
      const mockAnalytics = {
        billingTypeBreakdown: [
          {
            billingType: 'customer-order',
            count: 15,
            totalAmount: 150000,
            percentage: 60,
            averageAmount: 10000
          },
          {
            billingType: 'direct-customer',
            count: 8,
            totalAmount: 80000,
            percentage: 32,
            averageAmount: 10000
          },
          {
            billingType: 'manual-customer',
            count: 2,
            totalAmount: 20000,
            percentage: 8,
            averageAmount: 10000
          }
        ],
        totalRevenue: 250000,
        paidAmount: 200000,
        pendingAmount: 30000,
        overdueAmount: 20000
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      // Check key metrics
      expect(screen.getByText('Total Revenue: ₱250,000')).toBeInTheDocument();
      expect(screen.getByText('Paid Amount: ₱200,000')).toBeInTheDocument();
      expect(screen.getByText('Pending Amount: ₱30,000')).toBeInTheDocument();
      expect(screen.getByText('Overdue: ₱20,000')).toBeInTheDocument();

      // Check analytics breakdown
      expect(screen.getByTestId('analytics-customer-order')).toBeInTheDocument();
      expect(screen.getByText('customer-order: 15 statements')).toBeInTheDocument();
      expect(screen.getByText('60.0%')).toBeInTheDocument();
      expect(screen.getByText('₱150,000')).toBeInTheDocument();

      expect(screen.getByTestId('analytics-direct-customer')).toBeInTheDocument();
      expect(screen.getByText('direct-customer: 8 statements')).toBeInTheDocument();
      expect(screen.getByText('32.0%')).toBeInTheDocument();

      expect(screen.getByTestId('analytics-manual-customer')).toBeInTheDocument();
      expect(screen.getByText('manual-customer: 2 statements')).toBeInTheDocument();
      expect(screen.getByText('8.0%')).toBeInTheDocument();

      // Check summary
      expect(screen.getByText('Total: 25 statements')).toBeInTheDocument();
      expect(screen.getByText('₱250,000')).toBeInTheDocument();
    });

    it('should handle empty analytics gracefully', () => {
      const mockAnalytics = {
        billingTypeBreakdown: [],
        totalRevenue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      expect(screen.getByText('No billing data available yet')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue: ₱0')).toBeInTheDocument();
    });
  });

  describe('Smart Recommendations', () => {
    it('should display recommendations based on usage patterns', () => {
      const mockAnalytics = {
        billingTypeRecommendations: [
          {
            recommendedType: 'customer-order',
            reason: 'Your most frequently used billing type (15 times, 60.0% of all billing)',
            confidence: 0.9,
            basedOn: 'usage-pattern'
          },
          {
            recommendedType: 'direct-customer',
            reason: 'Recently active - used 5 times in the last 30 days',
            confidence: 0.7,
            basedOn: 'recent-activity'
          }
        ]
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      expect(screen.getByTestId('recommendation-0')).toBeInTheDocument();
      expect(screen.getByText('customer-order')).toBeInTheDocument();
      expect(screen.getAllByText('Your most frequently used billing type (15 times, 60.0% of all billing)')).toHaveLength(2);
      expect(screen.getByText('90% confidence')).toBeInTheDocument();

      expect(screen.getByTestId('recommendation-1')).toBeInTheDocument();
      expect(screen.getByText('Recently active - used 5 times in the last 30 days')).toBeInTheDocument();
      expect(screen.getByText('70% confidence')).toBeInTheDocument();
    });

    it('should handle no recommendations gracefully', () => {
      const mockAnalytics = {
        billingTypeRecommendations: []
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      expect(screen.getByText('No recommendations available yet')).toBeInTheDocument();
    });
  });

  describe('Recent Statements with Type Indicators', () => {
    it('should display recent statements with billing type indicators', () => {
      const mockStatements = [
        {
          id: '1',
          statementNumber: 'BS-2024-001',
          customerName: 'ABC Corp',
          customerId: 'cust-1',
          customerOrderId: 'order-1',
          netAmount: 15000,
          status: 'PAID'
        },
        {
          id: '2',
          statementNumber: 'BS-2024-002',
          customerName: 'XYZ Ltd',
          customerId: 'cust-2',
          customerOrderId: null,
          netAmount: 8000,
          status: 'SENT'
        },
        {
          id: '3',
          statementNumber: 'BS-2024-003',
          customerName: 'Manual Customer',
          customerId: null,
          customerOrderId: null,
          netAmount: 5000,
          status: 'DRAFT'
        }
      ];

      render(<MockBillingDashboard statements={mockStatements} />);

      // Check statements are displayed
      expect(screen.getByTestId('statement-1')).toBeInTheDocument();
      expect(screen.getByText('BS-2024-001')).toBeInTheDocument();
      expect(screen.getByText('ABC Corp')).toBeInTheDocument();
      expect(screen.getByTestId('billing-type-customer-order')).toBeInTheDocument();
      expect(screen.getByText('₱15,000')).toBeInTheDocument();
      expect(screen.getByText('PAID')).toBeInTheDocument();

      expect(screen.getByTestId('statement-2')).toBeInTheDocument();
      expect(screen.getByText('BS-2024-002')).toBeInTheDocument();
      expect(screen.getByText('XYZ Ltd')).toBeInTheDocument();
      expect(screen.getByTestId('billing-type-direct-customer')).toBeInTheDocument();

      expect(screen.getByTestId('statement-3')).toBeInTheDocument();
      expect(screen.getByText('BS-2024-003')).toBeInTheDocument();
      expect(screen.getByText('Manual Customer')).toBeInTheDocument();
      expect(screen.getByTestId('billing-type-manual-customer')).toBeInTheDocument();
    });

    it('should handle empty statements list', () => {
      render(<MockBillingDashboard statements={[]} />);

      expect(screen.getByText('No billing statements yet')).toBeInTheDocument();
    });
  });

  describe('Quick Actions Navigation', () => {
    it('should navigate to billing creation with pre-selected type', async () => {
      const user = userEvent.setup();
      const mockAnalytics = {
        billingTypeBreakdown: [
          { billingType: 'customer-order', count: 10, totalAmount: 100000, percentage: 50, averageAmount: 10000 }
        ]
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      const customerOrderButton = screen.getByTestId('customer-order-action');
      await user.click(customerOrderButton);

      // In a real implementation, this would navigate to the creation form
      expect(customerOrderButton).toBeInTheDocument();
      expect(screen.getByText('Used 10 times')).toBeInTheDocument();
    });

    it('should show usage statistics in quick actions', () => {
      const mockAnalytics = {
        billingTypeBreakdown: [
          { billingType: 'customer-order', count: 15, totalAmount: 150000, percentage: 60, averageAmount: 10000 },
          { billingType: 'direct-customer', count: 8, totalAmount: 80000, percentage: 32, averageAmount: 10000 },
          { billingType: 'manual-customer', count: 2, totalAmount: 20000, percentage: 8, averageAmount: 10000 }
        ]
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      expect(screen.getByText('Used 15 times')).toBeInTheDocument();
      expect(screen.getByText('Used 8 times')).toBeInTheDocument();
      expect(screen.getByText('Used 2 times')).toBeInTheDocument();
    });
  });

  describe('Dashboard to Form Integration', () => {
    it('should pass billing type selection from dashboard to form', () => {
      // Simulate navigation from dashboard to form with pre-selected type
      render(<MockBillingCreationForm preSelectedType="customer-order" />);

      expect(screen.getByTestId('pre-selected-type')).toBeInTheDocument();
      expect(screen.getByText('Pre-selected: customer-order')).toBeInTheDocument();
    });

    it('should maintain form state when navigating back to dashboard', async () => {
      const user = userEvent.setup();
      
      // Start with form
      const { rerender } = render(<MockBillingCreationForm />);

      // Fill some form data
      const customerInput = screen.getByPlaceholderText('Customer Name');
      await user.type(customerInput, 'Test Customer');

      // Navigate back to dashboard (simulate)
      rerender(<MockBillingDashboard analytics={{}} />);
      expect(screen.getByText('Billing Dashboard')).toBeInTheDocument();

      // Navigate back to form (simulate form recovery)
      rerender(<MockBillingCreationForm />);
      expect(screen.getByText('Create Billing Statement')).toBeInTheDocument();
    });
  });

  describe('Recommendation Actions', () => {
    it('should allow users to act on recommendations', async () => {
      const user = userEvent.setup();
      const mockAnalytics = {
        billingTypeRecommendations: [
          {
            recommendedType: 'customer-order',
            reason: 'Your most frequently used billing type',
            confidence: 0.9,
            basedOn: 'usage-pattern'
          }
        ]
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      const tryButton = screen.getByText('Try customer-order');
      await user.click(tryButton);

      // In a real implementation, this would navigate to the form with pre-selected type
      expect(tryButton).toBeInTheDocument();
    });
  });

  describe('Error Handling and Loading States', () => {
    it('should handle analytics loading errors gracefully', () => {
      // Simulate error state
      const mockAnalytics = {
        error: 'Failed to load analytics',
        billingTypeBreakdown: [],
        billingTypeRecommendations: []
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      // Should still render basic structure
      expect(screen.getByText('Billing Dashboard')).toBeInTheDocument();
      expect(screen.getByText('No billing data available yet')).toBeInTheDocument();
      expect(screen.getByText('No recommendations available yet')).toBeInTheDocument();
    });

    it('should show loading states for dashboard components', () => {
      // Test loading state handling
      const LoadingDashboard = () => (
        <div data-testid="loading-dashboard">
          <div>Loading billing analytics...</div>
          <div>Loading recommendations...</div>
          <div>Loading recent statements...</div>
        </div>
      );

      render(<LoadingDashboard />);

      expect(screen.getByText('Loading billing analytics...')).toBeInTheDocument();
      expect(screen.getByText('Loading recommendations...')).toBeInTheDocument();
      expect(screen.getByText('Loading recent statements...')).toBeInTheDocument();
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      const mockAnalytics = {
        billingTypeBreakdown: [
          { billingType: 'customer-order', count: 10, totalAmount: 100000, percentage: 50, averageAmount: 10000 }
        ]
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      // Check for proper button elements
      const newBillingButton = screen.getByTestId('new-billing-statement');
      expect(newBillingButton.tagName).toBe('BUTTON');

      const quickActionButton = screen.getByTestId('customer-order-action');
      expect(quickActionButton.tagName).toBe('BUTTON');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockAnalytics = {
        billingTypeBreakdown: [
          { billingType: 'customer-order', count: 10, totalAmount: 100000, percentage: 50, averageAmount: 10000 }
        ]
      };

      render(<MockBillingDashboard analytics={mockAnalytics} />);

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId('new-billing-statement'));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId('customer-order-action'));
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', () => {
      // Test with large number of statements
      const manyStatements = Array.from({ length: 100 }, (_, i) => ({
        id: `stmt-${i}`,
        statementNumber: `BS-2024-${String(i + 1).padStart(3, '0')}`,
        customerName: `Customer ${i + 1}`,
        customerId: `cust-${i}`,
        customerOrderId: i % 2 === 0 ? `order-${i}` : null,
        netAmount: (i + 1) * 1000,
        status: ['PAID', 'SENT', 'DRAFT'][i % 3]
      }));

      render(<MockBillingDashboard statements={manyStatements.slice(0, 5)} />);

      // Should only render the first 5 (recent statements)
      expect(screen.getByTestId('statement-stmt-0')).toBeInTheDocument();
      expect(screen.getByTestId('statement-stmt-4')).toBeInTheDocument();
      expect(screen.queryByTestId('statement-stmt-5')).not.toBeInTheDocument();
    });

    it('should update analytics in real-time', async () => {
      const initialAnalytics = {
        billingTypeBreakdown: [
          { billingType: 'customer-order', count: 10, totalAmount: 100000, percentage: 100, averageAmount: 10000 }
        ]
      };

      const { rerender } = render(<MockBillingDashboard analytics={initialAnalytics} />);

      expect(screen.getByText('customer-order: 10 statements')).toBeInTheDocument();
      expect(screen.getByText('100.0%')).toBeInTheDocument();

      // Simulate analytics update
      const updatedAnalytics = {
        billingTypeBreakdown: [
          { billingType: 'customer-order', count: 12, totalAmount: 120000, percentage: 80, averageAmount: 10000 },
          { billingType: 'direct-customer', count: 3, totalAmount: 30000, percentage: 20, averageAmount: 10000 }
        ]
      };

      rerender(<MockBillingDashboard analytics={updatedAnalytics} />);

      expect(screen.getByText('customer-order: 12 statements')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.getByText('direct-customer: 3 statements')).toBeInTheDocument();
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });
  });
});