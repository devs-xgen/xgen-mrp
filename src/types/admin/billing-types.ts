import { LucideIcon } from "lucide-react";

// ==============================================
// BILLING TYPE SELECTION TYPES
// ==============================================

export type BillingTypeId = 'direct-customer' | 'customer-order' | 'manual-customer';

export interface BillingTypeOption {
  id: BillingTypeId;
  title: string;
  description: string;
  icon: LucideIcon;
  recommended?: boolean;
  features: string[];
}

export interface BillingTypeSelectorProps {
  selectedType?: BillingTypeId;
  onTypeSelect: (type: BillingTypeId) => void;
  disabled?: boolean;
  className?: string;
}

export interface BillingTypeCardProps {
  option: BillingTypeOption;
  isSelected: boolean;
  onSelect: (id: BillingTypeId) => void;
  disabled?: boolean;
}

// Enhanced billing form data with billing type
export interface EnhancedBillingStatementFormData {
  billingType: BillingTypeId;
  customerSource: 'database' | 'order' | 'manual';
  
  // Existing form data
  customerId?: string;
  customerName: string;
  customerOrderId?: string;
  productionOrderId?: string;
  
  // Additional manual customer details
  manualCustomerDetails?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  
  // Original customer order reference
  originalCustomerOrder?: any; // CustomerOrder type from existing system
  
  // Rest of the form data
  subtotal: number;
  taxRate: number;
  discountAmount: number;
  paymentTerms?: string;
  dueDate?: Date;
  invoiceItems: any[]; // SalesInvoiceItemFormData from existing system
  notes?: string;
  poNumber?: string;
  terms?: string;
  footerNotes?: string;
}