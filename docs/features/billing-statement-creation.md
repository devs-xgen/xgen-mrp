# Billing Statement Creation Feature

## Overview
The billing statement creation feature provides a modern, multi-step form interface for creating billing statements with enhanced user experience using a professional stepper component.

## Location
- **Route**: `/admin/billing/billing-statements/create`
- **Main Component**: `src/components/module/admin/billing/billing-statement-create-client.tsx`
- **Page Component**: `src/app/admin/billing/billing-statements/create/page.tsx`

## UI/UX Enhancements

### Modern Stepper Interface
The form now uses a sophisticated stepper component that provides:
- **Visual Progress Tracking**: Clear indication of current step and completion status
- **Interactive Navigation**: Users can see all steps at a glance
- **Responsive Design**: Adapts to different screen sizes with hidden descriptions on mobile
- **Loading States**: Animated loading indicators during data fetching
- **Completion Indicators**: Check marks for completed steps

### Enhanced Visual Design
- **Card-based Layout**: Clean, modern card design for better content organization
- **Consistent Spacing**: Improved spacing and typography hierarchy
- **Loading Animations**: Skeleton loading states that match the final UI structure
- **Professional Navigation**: Enhanced button styling with loading states and icons

## Features

### Step 1: Customer Selection
Users can choose from three different methods to select or enter customer information:

1. **Manual Customer Selection**
   - Fetches existing customers from the database
   - Searchable dropdown with customer details
   - Shows customer code, contact person, email, phone, and payment terms
   - Uses the `Customer` model from Prisma schema

2. **Customer Order Selection**
   - Fetches customer orders from the database
   - Searchable dropdown showing order number, customer name, and order amount
   - Auto-populates customer information from the selected order
   - Uses the `CustomerOrder` model from Prisma schema

3. **Manual Customer Entry**
   - Allows typing a new customer name
   - Saves the entered string as the customer name
   - Useful for one-time customers or new customers

### Step 2: Billing Details
- **Financial Information**:
  - Subtotal input
  - Tax rate (default 12% VAT)
  - Discount amount
  - Auto-calculated tax amount and total

- **Payment Terms**:
  - Payment terms input (auto-populated from customer data if available)
  - Due date picker
  - Additional notes

- **Quick Actions**:
  - Set VAT (12%) button
  - No Tax (0%) button
  - Net 30 terms button
  - Net 15 terms button

### Step 3: Review & Confirm
- Comprehensive summary of all entered information
- Customer information display
- Billing summary with calculations
- Payment terms overview
- Final confirmation before submission

## File Structure

```
src/app/admin/(protected)/billing/billing-statements/create/
├── page.tsx                                    # Main page component

src/components/module/admin/billing/
├── billing-statement-create-client.tsx         # Main client component
└── billing-statement-create-client/
    └── steps/
        ├── customer-selection-step.tsx         # Step 1: Customer selection
        ├── billing-details-step.tsx            # Step 2: Billing details
        └── review-step.tsx                     # Step 3: Review & confirm
```

## Components Used

### UI Components (Shadcn)
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`, `Input`, `Label`, `Textarea`
- `RadioGroup`, `RadioGroupItem`
- `Command`, `CommandInput`, `CommandItem`, `CommandList`
- `Popover`, `PopoverContent`, `PopoverTrigger`
- `Calendar`, `Badge`, `Progress`, `Separator`

### Icons (Lucide React)
- `User`, `ShoppingCart`, `Edit3`
- `Search`, `Calendar`, `Calculator`, `DollarSign`
- `FileText`, `CreditCard`, `Clock`
- `ArrowLeft`, `ArrowRight`, `Check`, `ChevronsUpDown`

## Data Flow

### Customer Selection Data
```typescript
interface CustomerSelectionData {
  sourceType: "manual" | "customer_order" | "manual_input";
  selectedCustomer?: Customer;
  selectedCustomerOrder?: CustomerOrder;
  manualCustomerName?: string;
}
```

### Billing Details Data
```typescript
interface BillingDetailsData {
  subtotal: number;
  taxRate: number;
  discountAmount: number;
  paymentTerms?: string;
  dueDate?: Date;
  notes?: string;
}
```

### Form Submission
The form creates a `BillingStatementFormData` object with:
- Customer information (ID, name, order ID)
- Financial details (subtotal, tax, discount)
- Payment terms and due date
- Additional notes
- Empty invoice items array (to be populated later)

## API Integration

### Data Fetching
- `getAllCustomers()` - Fetches active customers with limit of 100
- `getCustomerOrdersForBilling()` - Fetches customer orders for billing

### Form Submission
- `createBillingStatement()` - Creates the billing statement record
- Redirects to the created billing statement detail page on success

## Validation

### Step Validation
- **Step 1**: Requires selection/entry based on chosen source type
- **Step 2**: Requires subtotal > 0
- **Step 3**: Always valid (review step)

### Form Validation
- Customer selection is required
- Subtotal must be greater than 0
- Tax rate and discount amount must be non-negative

## User Experience Features

### Progress Tracking
- Visual progress bar showing completion percentage
- Step indicators with icons and descriptions
- Current step highlighting

### Auto-population
- Payment terms auto-filled from customer data
- Quick action buttons for common scenarios
- Real-time calculation of totals

### Search & Filter
- Searchable customer dropdown
- Searchable customer order dropdown
- Responsive design for mobile and desktop

## Error Handling
- Loading states during data fetching
- Error messages for failed operations
- Form validation with user feedback
- Graceful handling of missing data

## Future Enhancements
- Invoice items management in subsequent steps
- PDF generation and preview
- Email sending functionality
- Bulk billing statement creation
- Advanced customer search filters
- Integration with accounting systems

## Dependencies
- Next.js 15.3.4
- React Hook Form (for form management)
- Zod (for validation schemas)
- Prisma (for database operations)
- Shadcn UI components
- Lucide React icons
- date-fns (for date formatting)

## Testing
The feature can be tested by:
1. Starting the development server: `npm run dev`
2. Navigating to `/admin/billing/billing-statements/create`
3. Testing each customer selection method
4. Filling in billing details
5. Reviewing and submitting the form

## Notes
- The feature follows the existing codebase patterns and conventions
- Uses TypeScript for type safety
- Implements responsive design principles
- Follows accessibility best practices
- Maintains consistency with the existing UI/UX design