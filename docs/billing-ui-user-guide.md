# Enhanced Billing UI User Guide

## Overview

The enhanced billing UI provides a streamlined and intuitive interface for creating billing statements. This guide covers all features and workflows available in the new billing system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Billing Type Selection](#billing-type-selection)
3. [Customer Information](#customer-information)
4. [Invoice Items Management](#invoice-items-management)
5. [Calculations and Summary](#calculations-and-summary)
6. [Form Validation](#form-validation)
7. [Accessibility Features](#accessibility-features)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Billing System

1. Navigate to the Admin Dashboard
2. Click on "Billing" in the main navigation
3. Select "Create Billing Statement" to start a new billing statement

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 320px width
- Internet connection for data synchronization

## Billing Type Selection

The first step in creating a billing statement is selecting the appropriate billing type. The system offers three distinct options:

### 1. Customer Order Billing (Recommended)

**When to use**: When you have an existing customer order that needs to be billed.

**Features**:
- Auto-populates customer information from the order
- Pre-fills invoice items from order lines
- Maintains order reference for tracking
- Validates order status before billing

**How to use**:
1. Click on the "Customer Order Billing" card
2. The system will highlight your selection
3. Click "Continue" to proceed to customer order selection

### 2. Direct Customer Billing

**When to use**: When billing an existing customer without a specific order.

**Features**:
- Access to complete customer database
- Auto-populates customer contact information
- Maintains customer payment terms and credit limits
- Suitable for service billing or ad-hoc charges

**How to use**:
1. Click on the "Direct Customer Billing" card
2. The system will highlight your selection
3. Click "Continue" to proceed to customer selection

### 3. Manual Customer Entry

**When to use**: When billing a new customer or when customer information is not in the system.

**Features**:
- Free-text customer name entry
- Optional additional customer details
- Local storage for future reference
- Validation for required information

**How to use**:
1. Click on the "Manual Customer Entry" card
2. The system will highlight your selection
3. Click "Continue" to proceed to manual entry

## Customer Information

### Customer Order Selection

When using Customer Order Billing:

1. **Search Orders**: Use the search box to find orders by:
   - Order number
   - Customer name
   - Order amount
   - Order date

2. **Select Order**: Click on the desired order from the dropdown list

3. **Review Order Details**: The system displays:
   - Order number and date
   - Customer information
   - Order total amount
   - Order status
   - Order line items

4. **Auto-population**: Customer name and order items are automatically filled

### Direct Customer Selection

When using Direct Customer Billing:

1. **Search Customers**: Use the search box to find customers by:
   - Customer name
   - Customer code
   - Email address
   - Phone number

2. **Select Customer**: Click on the desired customer from the dropdown list

3. **Review Customer Details**: The system displays:
   - Customer name and code
   - Contact information (email, phone)
   - Billing address
   - Payment terms
   - Credit limit status

4. **Auto-population**: Customer name is automatically filled

### Manual Customer Entry

When using Manual Customer Entry:

1. **Enter Customer Name**: Type the customer name in the text field
   - Minimum 2 characters required
   - Real-time validation feedback
   - Invalid characters are prevented

2. **Additional Details** (Optional):
   - Email address
   - Phone number
   - Billing address
   - Notes

3. **Save for Future**: Click the save button to store customer information locally

4. **Validation**: The system provides:
   - Real-time validation feedback
   - Suggestions for better record keeping
   - Error prevention and correction

## Invoice Items Management

### Adding Invoice Items

1. **Add New Item**: Click the "Add Item" button
2. **Fill Item Details**:
   - **Description**: Enter item description (required)
   - **Quantity**: Enter quantity (minimum 0.01)
   - **Unit Price**: Enter price per unit
   - **Product Code**: Optional product reference
   - **Unit**: Select unit of measure (PCS, KG, etc.)
   - **Discount**: Enter discount percentage (0-100%)
   - **Taxable**: Check if item is subject to tax

### Item Management Features

#### Bulk Operations
- **Add Multiple Items**: Use the bulk operations dialog
- **Import from Template**: Select from predefined item templates
- **Copy from Previous**: Import items from recent billing statements

#### Item Actions
- **Duplicate**: Create a copy of an existing item
- **Remove**: Delete an item (with confirmation)
- **Reorder**: Drag and drop to change item order
- **Select**: Use checkboxes for bulk operations

#### Validation
- **Real-time Validation**: Immediate feedback on invalid entries
- **Required Fields**: Description and quantity are mandatory
- **Numeric Validation**: Quantity and price must be valid numbers
- **Range Validation**: Discount must be between 0-100%

### Item Templates

Pre-defined templates for common items:

1. **Service Items**: Consultation, maintenance, support
2. **Product Items**: Physical goods with standard pricing
3. **Custom Items**: Blank template for unique items

## Calculations and Summary

### Real-time Calculations

The system automatically calculates:

- **Line Totals**: Quantity × Unit Price - Discount
- **Subtotal**: Sum of all line totals
- **Tax Amount**: Subtotal × Tax Rate (if applicable)
- **Discount Amount**: Total discounts applied
- **Net Amount**: Final amount after all calculations

### Tax Configuration

1. **Tax Rate**: Enter percentage (0-100%)
2. **Tax Application**: Applied to taxable items only
3. **Tax Display**: Shows calculated tax amount
4. **Tax Validation**: Ensures valid tax rates

### Summary Card

The billing summary card displays:

- **Subtotal**: Pre-tax amount
- **Tax Rate**: Applied tax percentage
- **Tax Amount**: Calculated tax
- **Discount Amount**: Total discounts
- **Total Amount**: Final billing amount
- **Net Amount**: Amount due

### Calculation Validation

- **Precision**: All calculations use 2 decimal places
- **Rounding**: Standard rounding rules applied
- **Validation**: Prevents negative totals
- **Updates**: Real-time recalculation on changes

## Form Validation

### Field-Level Validation

Each form field includes:

- **Required Field Indicators**: Red asterisk (*)
- **Real-time Validation**: Immediate feedback on input
- **Error Messages**: Clear, actionable error descriptions
- **Success Indicators**: Green checkmarks for valid fields

### Form-Level Validation

Before submission, the system validates:

- **Billing Type**: Must be selected
- **Customer Information**: Must be provided based on billing type
- **Invoice Items**: At least one item required
- **Calculations**: All amounts must be valid
- **Required Fields**: All mandatory fields completed

### Error Handling

- **Inline Errors**: Displayed next to relevant fields
- **Summary Errors**: Listed at the top of the form
- **Persistent Errors**: Remain until corrected
- **Error Prevention**: Invalid inputs are blocked

## Accessibility Features

### Keyboard Navigation

- **Tab Order**: Logical tab sequence through all form elements
- **Enter/Space**: Activate buttons and selections
- **Arrow Keys**: Navigate dropdown options
- **Escape**: Close dialogs and dropdowns

### Screen Reader Support

- **ARIA Labels**: Descriptive labels for all form elements
- **Live Regions**: Announce dynamic content changes
- **Role Attributes**: Proper semantic roles for components
- **Status Updates**: Announce validation and calculation changes

### Visual Accessibility

- **High Contrast**: Support for high contrast mode
- **Color Independence**: Information not conveyed by color alone
- **Focus Indicators**: Clear visual focus indicators
- **Text Scaling**: Supports browser text scaling up to 200%

### Motor Accessibility

- **Large Click Targets**: Minimum 44px touch targets
- **Drag Alternatives**: Keyboard alternatives for drag operations
- **Timeout Extensions**: No automatic timeouts
- **Error Recovery**: Easy correction of mistakes

## Troubleshooting

### Common Issues

#### "Customer not found" Error
**Cause**: Selected customer may have been deleted or deactivated
**Solution**: 
1. Refresh the page
2. Search for the customer again
3. Use manual customer entry if needed

#### Calculation Errors
**Cause**: Invalid numeric inputs or extreme values
**Solution**:
1. Check all quantity and price fields
2. Ensure values are within reasonable ranges
3. Verify tax rate is between 0-100%

#### Form Won't Submit
**Cause**: Validation errors or missing required fields
**Solution**:
1. Check for red error messages
2. Ensure all required fields are completed
3. Verify at least one invoice item is added

#### Slow Performance
**Cause**: Large datasets or network issues
**Solution**:
1. Clear browser cache
2. Check internet connection
3. Try searching with more specific terms

### Browser-Specific Issues

#### Safari on iOS
- **Issue**: Virtual keyboard may cover form fields
- **Solution**: The form automatically scrolls to focused fields

#### Firefox
- **Issue**: Dropdown animations may appear slower
- **Solution**: This is normal behavior and doesn't affect functionality

### Data Recovery

#### Form Data Loss
The system automatically saves form data locally:
- **Auto-save**: Every 30 seconds
- **Recovery**: Available on page reload
- **Manual Save**: Use Ctrl+S (Cmd+S on Mac)

#### Recovery Dialog
If unsaved data is detected:
1. Click "Recover" to restore previous data
2. Click "Start Fresh" to begin with empty form
3. Review recovered data before proceeding

### Getting Help

#### In-App Help
- **Tooltips**: Hover over question mark icons
- **Field Help**: Click on field labels for detailed help
- **Validation Messages**: Follow error message instructions

#### Contact Support
If you encounter persistent issues:
1. Note the exact error message
2. Record the steps that led to the issue
3. Contact your system administrator
4. Provide browser and operating system information

## Best Practices

### Efficient Workflow

1. **Prepare Information**: Gather customer and item details before starting
2. **Use Templates**: Leverage item templates for common billing scenarios
3. **Batch Similar Items**: Group similar items together
4. **Review Before Submit**: Use the summary card to verify all details
5. **Save Frequently**: Use manual save for complex billing statements

### Data Quality

1. **Consistent Naming**: Use consistent product and customer names
2. **Complete Information**: Fill optional fields when available
3. **Accurate Quantities**: Double-check quantities and units
4. **Proper Descriptions**: Use clear, descriptive item descriptions

### Performance Tips

1. **Specific Searches**: Use specific search terms to reduce load times
2. **Limit Items**: Keep invoice items under 50 for optimal performance
3. **Regular Cleanup**: Clear browser cache periodically
4. **Stable Connection**: Ensure stable internet connection for best experience

## Keyboard Shortcuts

### Global Shortcuts
- **Ctrl+S** (Cmd+S): Save form data
- **Ctrl+Z** (Cmd+Z): Undo last action
- **Ctrl+Enter** (Cmd+Enter): Submit form
- **Escape**: Close dialogs/cancel operations

### Navigation Shortcuts
- **Tab**: Move to next field
- **Shift+Tab**: Move to previous field
- **Enter**: Activate buttons/select options
- **Space**: Toggle checkboxes/select options
- **Arrow Keys**: Navigate dropdown options

### Item Management Shortcuts
- **Ctrl+D** (Cmd+D): Duplicate selected item
- **Delete**: Remove selected item
- **Ctrl+A** (Cmd+A): Select all items
- **Ctrl+Shift+A** (Cmd+Shift+A): Add new item

## Updates and Changes

### Recent Updates
- Enhanced customer search with fuzzy matching
- Improved mobile responsiveness
- Added bulk item operations
- Enhanced accessibility features
- Performance optimizations for large datasets

### Upcoming Features
- Advanced item templates
- Batch billing creation
- Enhanced reporting integration
- Mobile app support
- Offline capability

---

For additional support or feature requests, please contact your system administrator or refer to the technical documentation.