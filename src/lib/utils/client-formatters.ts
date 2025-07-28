/**
 * Client-side utility functions for formatting data
 * These functions don't depend on server-side modules and can be used in client components
 */

/**
 * Formats a date for display
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formats currency for display
 */
export function formatCurrencyForDisplay(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(numAmount)
}

/**
 * Client-side type definitions for shared documents
 */
export interface SharedCustomerInfo {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  tinNumber?: string | null
}

export interface SharedCompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  website?: string
}

export interface SharedSalesInvoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  subtotal: string
  taxRate: string
  taxAmount: string
  discountAmount: string
  totalAmount: string
  paymentTerms?: string | null
  dueDate?: string | null
  status: string
  poNumber?: string | null
  terms?: string | null
  footerNotes?: string | null
  invoiceItems: SharedSalesInvoiceItem[]
}

export interface SharedSalesInvoiceItem {
  id: string
  description: string
  quantity: string
  unitPrice: string
  totalPrice: string
  productCode?: string | null
  unit?: string | null
  discountPercent?: string | null
  taxable: boolean
}

export interface SharedBillingStatement {
  id: string
  statementNumber: string
  customerName: string
  billingDate: string
  dueDate?: string | null
  totalAmount: string
  taxAmount: string
  discountAmount: string
  netAmount: string
  status: string
  notes?: string | null
  
  // Related data
  customerOrder?: {
    orderNumber: string
    orderDate: string
  } | null
  
  productionOrder?: {
    id: string
    quantity: number
    startDate: string
    dueDate: string
    product?: {
      name: string
      sku: string
    }
    productVariant?: {
      displayName: string
      sku: string
    }
  } | null
  
  deliveryReceipts: SharedDeliveryReceipt[]
  salesInvoice?: SharedSalesInvoice | null
}

export interface SharedDeliveryReceipt {
  id: string
  receiptNumber: string
  deliveryDate: string
  deliveryAddress: string
  receivedBy: string
  receivedByTitle?: string | null
  deliveryStatus: string
  deliveryNotes?: string | null
  trackingNumber?: string | null
  courierService?: string | null
  signatureImage?: string | null
  photoEvidence?: string | null
}