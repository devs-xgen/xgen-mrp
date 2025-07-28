import { describe, it, expect, vi } from 'vitest'
import {
  transformBillingStatementToShared,
  transformSalesInvoiceToShared,
  transformDeliveryReceiptToShared,
  extractCustomerInfo,
  getCompanyInfo,
  sanitizeDocumentData,
  validateCustomerInfo,
  formatDateForDisplay,
  formatCurrencyForDisplay
} from '@/lib/utils/shared-document-transformers'

describe('Document Data Transformers', () => {
  describe('transformBillingStatementToShared', () => {
    it('should transform billing statement with all required fields', () => {
      const mockBillingStatement = {
        id: 'bs-1',
        statementNumber: 'BS-2024-001',
        customerName: 'Test Customer',
        billingDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        totalAmount: 1500.00,
        taxAmount: 150.00,
        discountAmount: 0.00,
        netAmount: 1350.00,
        status: 'PENDING',
        notes: 'Test billing statement',
        customerOrder: {
          id: 'co-1',
          orderNumber: 'CO-2024-001',
          orderDate: new Date('2024-01-10'),
          customer: null
        },
        deliveryReceipts: [
          {
            id: 'dr-1',
            receiptNumber: 'DR-2024-001',
            deliveryDate: new Date('2024-01-12'),
            deliveryAddress: '123 Test St',
            receivedBy: 'John Doe',
            receivedByTitle: 'Manager',
            deliveryStatus: 'DELIVERED',
            deliveryNotes: 'Delivered successfully',
            trackingNumber: 'TRK123',
            courierService: 'FastCourier',
            signatureImage: null,
            photoEvidence: null
          }
        ],
        salesInvoice: {
          id: 'si-1',
          invoiceNumber: 'SI-2024-001',
          invoiceDate: new Date('2024-01-11'),
          subtotal: 1350.00,
          taxRate: 10.00,
          taxAmount: 150.00,
          discountAmount: 0.00,
          totalAmount: 1500.00,
          paymentTerms: 'Net 30',
          dueDate: new Date('2024-02-11'),
          status: 'SENT',
          poNumber: null,
          terms: null,
          footerNotes: null,
          invoiceItems: []
        }
      }

      const result = transformBillingStatementToShared(mockBillingStatement)

      expect(result).toEqual({
        id: 'bs-1',
        statementNumber: 'BS-2024-001',
        customerName: 'Test Customer',
        billingDate: '2024-01-15T00:00:00.000Z',
        dueDate: '2024-02-15T00:00:00.000Z',
        totalAmount: '1500',
        taxAmount: '150',
        discountAmount: '0',
        netAmount: '1350',
        status: 'PENDING',
        notes: 'Test billing statement',
        customerOrder: {
          orderNumber: 'CO-2024-001',
          orderDate: '2024-01-10T00:00:00.000Z'
        },
        productionOrder: null,
        deliveryReceipts: [{
          id: 'dr-1',
          receiptNumber: 'DR-2024-001',
          deliveryDate: '2024-01-12T00:00:00.000Z',
          deliveryAddress: '123 Test St',
          receivedBy: 'John Doe',
          receivedByTitle: 'Manager',
          deliveryStatus: 'DELIVERED',
          deliveryNotes: 'Delivered successfully',
          trackingNumber: 'TRK123',
          courierService: 'FastCourier',
          signatureImage: null,
          photoEvidence: null
        }],
        salesInvoice: {
          id: 'si-1',
          invoiceNumber: 'SI-2024-001',
          invoiceDate: '2024-01-11T00:00:00.000Z',
          subtotal: '1350',
          taxRate: '10',
          taxAmount: '150',
          discountAmount: '0',
          totalAmount: '1500',
          paymentTerms: 'Net 30',
          dueDate: '2024-02-11T00:00:00.000Z',
          status: 'SENT',
          poNumber: null,
          terms: null,
          footerNotes: null,
          invoiceItems: []
        }
      })
    })

    it('should handle billing statement with optional fields missing', () => {
      const mockBillingStatement = {
        id: 'bs-2',
        statementNumber: 'BS-2024-002',
        customerName: 'Test Customer 2',
        billingDate: new Date('2024-01-20'),
        dueDate: null,
        totalAmount: 1000.00,
        taxAmount: 100.00,
        discountAmount: 0.00,
        netAmount: 900.00,
        status: 'PAID',
        notes: null,
        deliveryReceipts: [],
        customerOrder: null,
        salesInvoice: null
      }

      const result = transformBillingStatementToShared(mockBillingStatement)

      expect(result.dueDate).toBeNull()
      expect(result.notes).toBeNull()
      expect(result.customerOrder).toBeNull()
      expect(result.salesInvoice).toBeNull()
      expect(result.deliveryReceipts).toEqual([])
    })
  })

  describe('transformSalesInvoiceToShared', () => {
    it('should transform sales invoice with all required fields', () => {
      const mockSalesInvoice = {
        id: 'si-1',
        invoiceNumber: 'SI-2024-001',
        invoiceDate: new Date('2024-01-15'),
        subtotal: 1000.00,
        taxRate: 10.00,
        taxAmount: 100.00,
        discountAmount: 0.00,
        totalAmount: 1100.00,
        paymentTerms: 'Net 30',
        dueDate: new Date('2024-02-15'),
        status: 'SENT',
        poNumber: 'PO-123',
        terms: 'Standard terms',
        footerNotes: 'Thank you for your business',
        invoiceItems: [
          {
            id: 'item-1',
            description: 'Test Item 1',
            quantity: 2.0,
            unitPrice: 250.00,
            totalPrice: 500.00,
            productCode: 'PROD-001',
            unit: 'pcs',
            discountPercent: null,
            taxable: true
          }
        ]
      }

      const result = transformSalesInvoiceToShared(mockSalesInvoice)

      expect(result).toEqual({
        id: 'si-1',
        invoiceNumber: 'SI-2024-001',
        invoiceDate: '2024-01-15T00:00:00.000Z',
        subtotal: '1000',
        taxRate: '10',
        taxAmount: '100',
        discountAmount: '0',
        totalAmount: '1100',
        paymentTerms: 'Net 30',
        dueDate: '2024-02-15T00:00:00.000Z',
        status: 'SENT',
        poNumber: 'PO-123',
        terms: 'Standard terms',
        footerNotes: 'Thank you for your business',
        invoiceItems: [
          {
            id: 'item-1',
            description: 'Test Item 1',
            quantity: '2',
            unitPrice: '250',
            totalPrice: '500',
            productCode: 'PROD-001',
            unit: 'pcs',
            discountPercent: null,
            taxable: true
          }
        ]
      })
    })

    it('should handle sales invoice with optional fields missing', () => {
      const mockSalesInvoice = {
        id: 'si-2',
        invoiceNumber: 'SI-2024-002',
        invoiceDate: new Date('2024-01-20'),
        subtotal: 800.00,
        taxRate: 0.00,
        taxAmount: 0.00,
        discountAmount: 0.00,
        totalAmount: 800.00,
        paymentTerms: null,
        dueDate: null,
        status: 'DRAFT',
        poNumber: null,
        terms: null,
        footerNotes: null,
        invoiceItems: []
      }

      const result = transformSalesInvoiceToShared(mockSalesInvoice)

      expect(result.paymentTerms).toBeNull()
      expect(result.dueDate).toBeNull()
      expect(result.poNumber).toBeNull()
      expect(result.terms).toBeNull()
      expect(result.footerNotes).toBeNull()
      expect(result.invoiceItems).toEqual([])
    })
  })

  describe('transformDeliveryReceiptToShared', () => {
    it('should transform delivery receipt with all required fields', () => {
      const mockDeliveryReceipt = {
        id: 'dr-1',
        receiptNumber: 'DR-2024-001',
        deliveryDate: new Date('2024-01-15'),
        deliveryAddress: '123 Main St, City, State 12345',
        receivedBy: 'Jane Smith',
        receivedByTitle: 'Warehouse Manager',
        deliveryStatus: 'DELIVERED',
        deliveryNotes: 'Package delivered in good condition',
        trackingNumber: 'TRK456789',
        courierService: 'Express Delivery',
        signatureImage: 'signature.jpg',
        photoEvidence: 'photo.jpg'
      }

      const result = transformDeliveryReceiptToShared(mockDeliveryReceipt)

      expect(result).toEqual({
        id: 'dr-1',
        receiptNumber: 'DR-2024-001',
        deliveryDate: '2024-01-15T00:00:00.000Z',
        deliveryAddress: '123 Main St, City, State 12345',
        receivedBy: 'Jane Smith',
        receivedByTitle: 'Warehouse Manager',
        deliveryStatus: 'DELIVERED',
        deliveryNotes: 'Package delivered in good condition',
        trackingNumber: 'TRK456789',
        courierService: 'Express Delivery',
        signatureImage: 'signature.jpg',
        photoEvidence: 'photo.jpg'
      })
    })

    it('should handle delivery receipt with optional fields missing', () => {
      const mockDeliveryReceipt = {
        id: 'dr-2',
        receiptNumber: 'DR-2024-002',
        deliveryDate: new Date('2024-01-20'),
        deliveryAddress: '456 Oak Ave, Town, State 67890',
        receivedBy: 'Bob Johnson',
        receivedByTitle: null,
        deliveryStatus: 'PENDING',
        deliveryNotes: null,
        trackingNumber: null,
        courierService: null,
        signatureImage: null,
        photoEvidence: null
      }

      const result = transformDeliveryReceiptToShared(mockDeliveryReceipt)

      expect(result.receivedByTitle).toBeNull()
      expect(result.deliveryNotes).toBeNull()
      expect(result.trackingNumber).toBeNull()
      expect(result.courierService).toBeNull()
      expect(result.signatureImage).toBeNull()
      expect(result.photoEvidence).toBeNull()
    })
  })

  describe('extractCustomerInfo', () => {
    it('should extract customer info from direct customer', () => {
      const mockCustomer = {
        id: 'cust-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        country: 'USA',
        postalCode: '12345',
        tinNumber: 'TIN123'
      }

      const result = extractCustomerInfo(mockCustomer)

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        country: 'USA',
        postalCode: '12345',
        tinNumber: 'TIN123'
      })
    })

    it('should use fallback name when no customer is available', () => {
      const result = extractCustomerInfo(null, null, 'Fallback Customer')

      expect(result).toEqual({
        name: 'Fallback Customer',
        email: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        tinNumber: null
      })
    })
  })

  describe('getCompanyInfo', () => {
    it('should return company info from environment variables', () => {
      const result = getCompanyInfo()

      expect(result).toEqual({
        name: 'XGen Manufacturing',
        address: '123 Manufacturing St, Industrial City, IC 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@xgenmanufacturing.com',
        website: 'www.xgenmanufacturing.com'
      })
    })
  })

  describe('sanitizeDocumentData', () => {
    it('should remove sensitive fields from document data', () => {
      const mockData = {
        id: 'doc-1',
        title: 'Test Document',
        createdBy: 'user-1',
        modifiedBy: 'user-2',
        createdByUser: { name: 'John' },
        modifiedByUser: { name: 'Jane' },
        content: 'Document content'
      }

      const result = sanitizeDocumentData(mockData)

      expect(result).toEqual({
        id: 'doc-1',
        title: 'Test Document',
        content: 'Document content'
      })
    })

    it('should remove custom fields when specified', () => {
      const mockData = {
        id: 'doc-1',
        title: 'Test Document',
        secret: 'confidential',
        internal: 'internal data'
      }

      const result = sanitizeDocumentData(mockData, ['secret', 'internal'])

      expect(result).toEqual({
        id: 'doc-1',
        title: 'Test Document'
      })
    })
  })

  describe('validateCustomerInfo', () => {
    it('should validate customer info with valid name', () => {
      const customerInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        tinNumber: null
      }

      expect(validateCustomerInfo(customerInfo)).toBe(true)
    })

    it('should reject customer info with empty name', () => {
      const customerInfo = {
        name: '',
        email: 'john@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        tinNumber: null
      }

      expect(validateCustomerInfo(customerInfo)).toBe(false)
    })

    it('should reject customer info with whitespace-only name', () => {
      const customerInfo = {
        name: '   ',
        email: 'john@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        tinNumber: null
      }

      expect(validateCustomerInfo(customerInfo)).toBe(false)
    })
  })

  describe('formatDateForDisplay', () => {
    it('should format date string correctly', () => {
      const result = formatDateForDisplay('2024-01-15T10:30:00Z')
      expect(result).toBe('January 15, 2024')
    })

    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDateForDisplay(date)
      expect(result).toBe('January 15, 2024')
    })

    it('should handle invalid dates', () => {
      const result = formatDateForDisplay('invalid-date')
      expect(result).toBe('Invalid Date')
    })
  })

  describe('formatCurrencyForDisplay', () => {
    it('should format numeric amount correctly', () => {
      const result = formatCurrencyForDisplay(1234.56)
      expect(result).toBe('$1,234.56')
    })

    it('should format string amount correctly', () => {
      const result = formatCurrencyForDisplay('1234.56')
      expect(result).toBe('$1,234.56')
    })

    it('should handle invalid amounts', () => {
      const result = formatCurrencyForDisplay('invalid')
      expect(result).toBe('$0.00')
    })
  })

  describe('Error handling', () => {
    it('should handle null input gracefully', () => {
      expect(() => transformBillingStatementToShared(null as any)).toThrow()
      expect(() => transformSalesInvoiceToShared(null as any)).toThrow()
      expect(() => transformDeliveryReceiptToShared(null as any)).toThrow()
    })

    it('should handle undefined input gracefully', () => {
      expect(() => transformBillingStatementToShared(undefined as any)).toThrow()
      expect(() => transformSalesInvoiceToShared(undefined as any)).toThrow()
      expect(() => transformDeliveryReceiptToShared(undefined as any)).toThrow()
    })
  })
})