import { ShoppingCart, Users, Edit } from "lucide-react";
import { BillingTypeOption } from "@/types/admin/billing-types";

export const billingTypeOptions: BillingTypeOption[] = [
  {
    id: 'customer-order',
    title: 'Customer Order Billing',
    description: 'Create billing from an existing customer order with pre-filled details',
    icon: ShoppingCart,
    recommended: true,
    features: [
      'Auto-populated customer information',
      'Pre-filled order items and amounts',
      'Order reference tracking',
      'Streamlined workflow'
    ]
  },
  {
    id: 'direct-customer',
    title: 'Direct Customer Billing',
    description: 'Create billing for an existing customer from your database',
    icon: Users,
    features: [
      'Select from existing customers',
      'Access to customer payment terms',
      'Customer credit limit visibility',
      'Manual item entry'
    ]
  },
  {
    id: 'manual-customer',
    title: 'Manual Customer Entry',
    description: 'Create billing with manually entered customer information',
    icon: Edit,
    features: [
      'Quick customer name entry',
      'No customer database required',
      'Optional customer details',
      'Flexible billing creation'
    ]
  }
];

export const getBillingTypeOption = (id: string) => {
  return billingTypeOptions.find(option => option.id === id);
};

export const getRecommendedBillingType = () => {
  return billingTypeOptions.find(option => option.recommended);
};