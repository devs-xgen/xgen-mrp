# Design Document

## Overview

This design document outlines the enhanced billing UI for the MRP system. The goal is to create a more intuitive and user-friendly billing statement creation process that clearly guides users through different billing scenarios while maintaining alignment with the simplified billing schema.

## Architecture

### Current UI Issues
- The billing form presents both customer and customer order selection simultaneously, which can be confusing
- No clear guidance on when to use direct customer vs customer order billing
- Manual customer name entry is not clearly supported
- The form layout could be more intuitive for different billing scenarios

### Proposed UI Enhancements

#### 1. Billing Type Selection Screen
```typescript
interface BillingTypeOption {
  id: 'direct-customer' | 'customer-order' | 'manual-customer';
  title: string;
  description: string;
  icon: React.ComponentType;
  recommended?: boolean;
}

const billingTypeOptions: BillingTypeOption[] = [
  {
    id: 'customer-order',
    title: 'Customer Order Billing',
    description: 'Create billing from an existing customer order with pre-filled details',
    icon: ShoppingCart,
    recommended: true
  },
  {
    id: 'direct-customer',
    title: 'Direct Customer Billing',
    description: 'Create billing for an existing customer from your database',
    icon: Users
  },
  {
    id: 'manual-customer',
    title: 'Manual Customer Entry',
    description: 'Create billing with manually entered customer information',
    icon: Edit
  }
];
```

#### 2. Enhanced Form Components

##### Customer Order Selection Component
```typescript
interface CustomerOrderSelectorProps {
  onOrderSelect: (order: CustomerOrder) => void;
  selectedOrder?: CustomerOrder;
}

// Features:
// - Searchable dropdown with order number, customer name, and amount
// - Order details preview on selection
// - Auto-population of customer name and order items
// - Clear indication of order status and dates
```

##### Direct Customer Selection Component
```typescript
interface DirectCustomerSelectorProps {
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer?: Customer;
}

// Features:
// - Searchable dropdown with customer name, email, and code
// - Customer details preview on selection
// - Auto-population of customer name
// - Display of customer payment terms and credit limit
```

##### Manual Customer Entry Component
```typescript
interface ManualCustomerEntryProps {
  onCustomerNameChange: (name: string) => void;
  customerName: string;
}

// Features:
// - Free text input for customer name
// - Optional fields for customer details
// - Clear indication that this is manual entry
// - Validation for required customer name
```

#### 3. Improved Form Layout

##### Step-by-Step Flow
```typescript
enum BillingFormStep {
  BILLING_TYPE_SELECTION = 'billing-type-selection',
  CUSTOMER_INFORMATION = 'customer-information',
  BILLING_DETAILS = 'billing-details',
  INVOICE_ITEMS = 'invoice-items',
  REVIEW_SUBMIT = 'review-submit'
}

interface BillingFormState {
  currentStep: BillingFormStep;
  billingType: BillingTypeOption['id'];
  customerInfo: CustomerInfo;
  billingDetails: BillingDetails;
  invoiceItems: InvoiceItem[];
  calculations: BillingCalculations;
}
```

##### Responsive Card Layout
```typescript
// Main form layout with responsive design
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Main Form Area - 3 columns */}
  <div className="lg:col-span-3 space-y-6">
    <BillingTypeSelector />
    <CustomerInformationCard />
    <BillingDetailsCard />
    <InvoiceItemsCard />
  </div>
  
  {/* Summary Sidebar - 1 column */}
  <div className="lg:col-span-1">
    <BillingSummaryCard />
    <CustomerSummaryCard />
  </div>
</div>
```

## Components and Interfaces

### 1. BillingTypeSelector Component
```typescript
interface BillingTypeSelectorProps {
  selectedType?: BillingTypeOption['id'];
  onTypeSelect: (type: BillingTypeOption['id']) => void;
}

// Features:
// - Card-based selection with icons and descriptions
// - Clear visual indication of selected type
// - Responsive grid layout
// - Hover states and animations
```

### 2. Enhanced Customer Information Cards
```typescript
// Customer Order Card
interface CustomerOrderCardProps {
  selectedOrder?: CustomerOrder;
  onOrderSelect: (order: CustomerOrder) => void;
  onClear: () => void;
}

// Direct Customer Card
interface DirectCustomerCardProps {
  selectedCustomer?: Customer;
  onCustomerSelect: (customer: Customer) => void;
  onClear: () => void;
}

// Manual Customer Card
interface ManualCustomerCardProps {
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  additionalFields?: boolean;
}
```

### 3. Improved Summary Components
```typescript
interface BillingSummaryCardProps {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  netAmount: number;
  onCalculationChange: (field: string, value: number) => void;
}

interface CustomerSummaryCardProps {
  billingType: BillingTypeOption['id'];
  customerInfo: {
    name: string;
    source: 'customer' | 'order' | 'manual';
    details?: Customer | CustomerOrder;
  };
  onEdit: () => void;
}
```

### 4. Form Validation and State Management
```typescript
// Enhanced validation schema
const billingStatementFormSchema = z.object({
  billingType: z.enum(['direct-customer', 'customer-order', 'manual-customer']),
  customerName: z.string().min(1, 'Customer name is required'),
  customerId: z.string().optional(),
  customerOrderId: z.string().optional(),
  // ... other fields
}).refine((data) => {
  // Ensure appropriate customer information is provided based on billing type
  if (data.billingType === 'direct-customer') {
    return !!data.customerId;
  }
  if (data.billingType === 'customer-order') {
    return !!data.customerOrderId;
  }
  if (data.billingType === 'manual-customer') {
    return !!data.customerName;
  }
  return false;
}, {
  message: 'Please provide appropriate customer information for the selected billing type'
});
```

## Data Models

### Enhanced Form Data Structure
```typescript
interface EnhancedBillingStatementFormData extends BillingStatementFormData {
  billingType: 'direct-customer' | 'customer-order' | 'manual-customer';
  customerSource: 'database' | 'order' | 'manual';
  originalCustomerOrder?: CustomerOrder; // For reference when billing from order
  manualCustomerDetails?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}
```

### UI State Management
```typescript
interface BillingFormUIState {
  currentStep: BillingFormStep;
  billingType?: BillingTypeOption['id'];
  isLoading: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  canProceed: boolean;
  showValidation: boolean;
}
```

## User Experience Flow

### 1. Billing Type Selection Flow
1. User lands on billing creation page
2. System shows three clear billing type options with descriptions
3. User selects preferred billing type
4. System highlights selection and shows "Continue" button
5. User proceeds to customer information step

### 2. Customer Information Flow

#### For Customer Order Billing:
1. System shows searchable customer order dropdown
2. User searches and selects order
3. System displays order preview with customer and amount details
4. System auto-populates customer name and order items
5. User can proceed to billing details

#### For Direct Customer Billing:
1. System shows searchable customer dropdown
2. User searches and selects customer
3. System displays customer preview with contact details
4. System auto-populates customer name
5. User can proceed to billing details

#### For Manual Customer Entry:
1. System shows customer name input field
2. User enters customer name manually
3. System optionally allows additional customer details
4. User can proceed to billing details

### 3. Form Completion Flow
1. User completes billing details (dates, terms, etc.)
2. User adds invoice items with real-time calculation updates
3. System shows comprehensive summary in sidebar
4. User reviews all information
5. User submits form with validation feedback

## Error Handling

### Validation Rules
- Billing type must be selected before proceeding
- Customer information must be provided based on selected billing type
- Customer name is always required regardless of billing type
- Invoice items must have valid descriptions, quantities, and prices
- Financial calculations must be accurate and positive

### Error Display Patterns
```typescript
interface FormError {
  field: string;
  message: string;
  type: 'validation' | 'server' | 'network';
}

// Error display components
<FormFieldError error={error} />
<FormSectionError errors={sectionErrors} />
<FormGlobalError error={globalError} />
```

### User Feedback
- Real-time validation with inline error messages
- Success notifications on form submission
- Loading states during data fetching and submission
- Clear progress indicators for multi-step flow

## Testing Strategy

### Component Testing
- Test billing type selection functionality
- Test customer selection components with different data scenarios
- Test form validation with various input combinations
- Test calculation accuracy and real-time updates

### Integration Testing
- Test complete billing creation flow for each billing type
- Test form state management and step navigation
- Test data persistence and form recovery
- Test responsive design across different screen sizes

### User Experience Testing
- Test form usability with different user personas
- Test accessibility compliance for all form elements
- Test performance with large datasets (customers, orders)
- Test error handling and recovery scenarios