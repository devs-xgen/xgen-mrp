import { 
  BillingStatement, 
  SalesInvoice, 
  DeliveryReceipt,
  SalesInvoiceItem,
  Customer,
  CustomerOrder,
  ProductionOrder,
  Product,
  ProductVariant,
  Material,
  User
} from "@prisma/client"
import { serializeDecimals, SerializableData } from "./decimal-serializer"
import { DEFAULT_COMPANY_INFO } from '@/lib/constant'

// ==============================================
// SHARED DOCUMENT INTERFACES
// ==============================================

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

// ==============================================
// TRANSFORMATION UTILITIES
// ==============================================

/**
 * Transforms a BillingStatement with relations to SharedBillingStatement
 */
export function transformBillingStatementToShared(
  billingStatement: BillingStatement & {
    customer?: Customer | null
    customerOrder?: (CustomerOrder & { customer?: Customer | null }) | null
    productionOrder?: (ProductionOrder & {
      product?: Product | null
      productVariant?: ProductVariant | null
    }) | null
    salesInvoice?: (SalesInvoice & {
      invoiceItems?: (SalesInvoiceItem & {
        material?: Material | null
        product?: Product | null
      })[]
    }) | null
    deliveryReceipts?: DeliveryReceipt[]
    createdByUser?: Pick<User, 'id' | 'email'> | null
  }
): SerializableData<SharedBillingStatement> {
  const shared: SharedBillingStatement = {
    id: billingStatement.id,
    statementNumber: billingStatement.statementNumber,
    customerName: billingStatement.customerName,
    billingDate: billingStatement.billingDate.toISOString(),
    dueDate: billingStatement.dueDate?.toISOString() || null,
    totalAmount: billingStatement.totalAmount.toString(),
    taxAmount: billingStatement.taxAmount.toString(),
    discountAmount: billingStatement.discountAmount.toString(),
    netAmount: billingStatement.netAmount.toString(),
    status: billingStatement.status,
    notes: billingStatement.notes,
    
    // Transform customer order if present
    customerOrder: billingStatement.customerOrder ? {
      orderNumber: billingStatement.customerOrder.orderNumber,
      orderDate: billingStatement.customerOrder.orderDate.toISOString()
    } : null,
    
    // Transform production order if present
    productionOrder: billingStatement.productionOrder ? {
      id: billingStatement.productionOrder.id,
      quantity: billingStatement.productionOrder.quantity,
      startDate: billingStatement.productionOrder.startDate.toISOString(),
      dueDate: billingStatement.productionOrder.dueDate.toISOString(),
      product: billingStatement.productionOrder.product ? {
        name: billingStatement.productionOrder.product.name,
        sku: billingStatement.productionOrder.product.sku
      } : undefined,
      productVariant: billingStatement.productionOrder.productVariant ? {
        displayName: billingStatement.productionOrder.productVariant.displayName,
        sku: billingStatement.productionOrder.productVariant.sku
      } : undefined
    } : null,
    
    // Transform delivery receipts
    deliveryReceipts: (billingStatement.deliveryReceipts || []).map(receipt => 
      transformDeliveryReceiptToShared(receipt)
    ),
    
    // Transform sales invoice if present
    salesInvoice: billingStatement.salesInvoice ? 
      transformSalesInvoiceToShared(billingStatement.salesInvoice) : null
  }
  
  return serializeDecimals(shared)
}

/**
 * Transforms a SalesInvoice with relations to SharedSalesInvoice
 */
export function transformSalesInvoiceToShared(
  salesInvoice: SalesInvoice & {
    invoiceItems?: (SalesInvoiceItem & {
      material?: Material | null
      product?: Product | null
    })[]
    billingStatement?: (BillingStatement & {
      customer?: Customer | null
      customerOrder?: (CustomerOrder & { customer?: Customer | null }) | null
    }) | null
    createdByUser?: Pick<User, 'id' | 'email'> | null
  }
): SerializableData<SharedSalesInvoice> {
  const shared: SharedSalesInvoice = {
    id: salesInvoice.id,
    invoiceNumber: salesInvoice.invoiceNumber,
    invoiceDate: salesInvoice.invoiceDate.toISOString(),
    subtotal: salesInvoice.subtotal.toString(),
    taxRate: salesInvoice.taxRate.toString(),
    taxAmount: salesInvoice.taxAmount.toString(),
    discountAmount: salesInvoice.discountAmount.toString(),
    totalAmount: salesInvoice.totalAmount.toString(),
    paymentTerms: salesInvoice.paymentTerms,
    dueDate: salesInvoice.dueDate?.toISOString() || null,
    status: salesInvoice.status,
    poNumber: salesInvoice.poNumber,
    terms: salesInvoice.terms,
    footerNotes: salesInvoice.footerNotes,
    
    // Transform invoice items
    invoiceItems: (salesInvoice.invoiceItems || []).map(item => 
      transformSalesInvoiceItemToShared(item)
    )
  }
  
  return serializeDecimals(shared)
}

/**
 * Transforms a SalesInvoiceItem to SharedSalesInvoiceItem
 */
export function transformSalesInvoiceItemToShared(
  item: SalesInvoiceItem & {
    material?: Material | null
    product?: Product | null
  }
): SerializableData<SharedSalesInvoiceItem> {
  const shared: SharedSalesInvoiceItem = {
    id: item.id,
    description: item.description,
    quantity: item.quantity.toString(),
    unitPrice: item.unitPrice.toString(),
    totalPrice: item.totalPrice.toString(),
    productCode: item.productCode,
    unit: item.unit,
    discountPercent: item.discountPercent?.toString() || null,
    taxable: item.taxable
  }
  
  return serializeDecimals(shared)
}

/**
 * Transforms a DeliveryReceipt to SharedDeliveryReceipt
 */
export function transformDeliveryReceiptToShared(
  deliveryReceipt: DeliveryReceipt & {
    billingStatement?: (BillingStatement & {
      customer?: Customer | null
      customerOrder?: (CustomerOrder & { customer?: Customer | null }) | null
    }) | null
    createdByUser?: Pick<User, 'id' | 'email'> | null
  }
): SerializableData<SharedDeliveryReceipt> {
  const shared: SharedDeliveryReceipt = {
    id: deliveryReceipt.id,
    receiptNumber: deliveryReceipt.receiptNumber,
    deliveryDate: deliveryReceipt.deliveryDate.toISOString(),
    deliveryAddress: deliveryReceipt.deliveryAddress,
    receivedBy: deliveryReceipt.receivedBy,
    receivedByTitle: deliveryReceipt.receivedByTitle,
    deliveryStatus: deliveryReceipt.deliveryStatus,
    deliveryNotes: deliveryReceipt.deliveryNotes,
    trackingNumber: deliveryReceipt.trackingNumber,
    courierService: deliveryReceipt.courierService,
    signatureImage: deliveryReceipt.signatureImage,
    photoEvidence: deliveryReceipt.photoEvidence
  }
  
  return serializeDecimals(shared)
}

/**
 * Extracts customer information from various sources
 */
export function extractCustomerInfo(
  customer?: Customer | null,
  customerOrder?: (CustomerOrder & { customer?: Customer | null }) | null,
  fallbackName?: string
): SharedCustomerInfo {
  // Priority: direct customer > customer from order > fallback name
  const sourceCustomer = customer || customerOrder?.customer
  
  if (sourceCustomer) {
    return {
      name: sourceCustomer.name,
      email: sourceCustomer.email,
      phone: sourceCustomer.phone,
      address: sourceCustomer.address,
      city: sourceCustomer.city,
      state: sourceCustomer.state,
      country: sourceCustomer.country,
      postalCode: sourceCustomer.postalCode,
      tinNumber: sourceCustomer.tinNumber
    }
  }
  
  // Fallback to just the name if no customer record is available
  return {
    name: fallbackName || "Unknown Customer",
    email: null,
    phone: null,
    address: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    tinNumber: null
  }
}

/**
 * Creates company information from environment variables with fallback to default
 */
export function getCompanyInfo(): SharedCompanyInfo {
  return {
    name: process.env.COMPANY_NAME || DEFAULT_COMPANY_INFO.name,
    address: process.env.COMPANY_ADDRESS || DEFAULT_COMPANY_INFO.address,
    phone: process.env.COMPANY_PHONE || DEFAULT_COMPANY_INFO.phone,
    email: process.env.COMPANY_EMAIL || DEFAULT_COMPANY_INFO.email,
    website: process.env.COMPANY_WEBSITE || DEFAULT_COMPANY_INFO.website
  }
}

/**
 * Sanitizes sensitive data from documents for public sharing
 */
export function sanitizeDocumentData<T extends Record<string, any>>(
  data: T,
  fieldsToRemove: string[] = ['createdBy', 'modifiedBy', 'createdByUser', 'modifiedByUser']
): Omit<T, keyof typeof fieldsToRemove[number]> {
  const sanitized = { ...data }
  
  fieldsToRemove.forEach(field => {
    delete sanitized[field]
  })
  
  return sanitized
}

/**
 * Validates that required customer information is present
 */
export function validateCustomerInfo(customerInfo: SharedCustomerInfo): boolean {
  return !!(customerInfo.name && customerInfo.name.trim().length > 0)
}

/**
 * Formats dates for display in shared documents
 */
export function formatDateForDisplay(
  date: string | Date,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

/**
 * Formats currency values for display in shared documents
 */
export function formatCurrencyForDisplay(
  amount: string | number,
  currency: string = 'PHP',
  locale: string = 'en-PH'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return numAmount.toLocaleString(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}