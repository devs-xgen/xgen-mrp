import { describe, it, expect, vi } from 'vitest'
import {
  transformBillingStatementToShared,
  transformSalesInvoiceToShared,
  transformDeliveryReceiptToShared
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
        netAmount: 1350.00,
        status: 'PENDING',
        notes: 'Test billing statement',
        customerOrder: {
          id: 'co-1',
          orderNumber: 'CO-2024-001',
          orderDate: new Date('2024-01-10')
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
            courierService: 'FastCourier'
          }
        ],
        salesInvoice: {
          id: 'si-1',
          invoiceNumber: 'SI-2024-001',
          invoiceDate: new Date('2024-01-11'),
          subtotal: 1350.00,
          taxAmount: 150.00,
          totalAmount: 1500.00,
          paymentTerms: 'Net 30',
          dueDate: new Date('2024-02-11'),
          status: 'SENT',
          invoiceItems: []
        }
      }

      const result = transformBillingStatementForSharing(mockBillingStatement)

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
          orderDate: '2024-01-10'
        },
        deliveryReceipts: [{
          id: 'dr-1',
          receiptNumber: 'DR-2024-001',
          deliveryDate: '2024-01-12',
          deliveryAddress: '123 Test St',
          receivedBy: 'John Doe',
          receivedByTitle: 'Manager',
          deliveryStatus: 'DELIVERED',
          deliveryNotes: 'Delivered successfully',
          trackingNumber: 'TRK123',
          courierService: 'FastCourier'
        }],
        salesInvoice: {
          id: 'si-1',
          invoiceNumber: 'SI-2024-001',
          invoiceDate: '2024-01-11',
          subtotal: 1350.00,
          taxAmount: 150.00,
          totalAmount: 1500.00,
          paymentTerms: 'Net 30',
          dueDate: '2024-02-11',
          status: 'SENT',
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
        totalAmount: 1000.00,
        taxAmount: 100.00,
        netAmount: 900.00,
        status: 'PAID',
        deliveryReceipts: [],
        customerOrder: null,
        salesInvoice: null
      }

      const result = transformBillingStatementForSharing(mockBillingStatement)

      expect(result.dueDate).toBeUndefined()
      expect(result.notes).toBeUndefined()
      expect(result.customerOrder).toBeNull()
      expect(result.salesInvoice).toBeNull()
      expect(result.deliveryReceipts).toEqual([])
    })

    it('should convert dates to ISO strings', () => {
      const mockBillingStatement = {
        id: 'bs-3',
        statementNumber: 'BS-2024-003',
        customerName: 'Test Customer 3',
        billingDate: new Date('2024-01-25T10:30:00Z'),
        dueDate: new Date('2024-02-25T10:30:00Z'),
        totalAmount: 2000.00,
        taxAmount: 200.00,
        netAmount: 1800.00,
        status: 'PENDING',
        deliveryReceipts: [],
        customerOrder: null,
        salesInvoice: null
      }

      const result = transformBillingStatementForSharing(mockBillingStatement)

      expect(result.billingDate).toBe('2024-01-25')
      expect(result.dueDate).toBe('2024-02-25')
    })
  })

  describe('transformSalesInvoiceForSharing', () => {
    it('should transform sales invoice with all required fields', () => {
      const mockSalesInvoice = {
        id: 'si-1',
        invoiceNumber: 'SI-2024-001',
        invoiceDate: new Date('2024-01-15'),
        subtotal: 1000.00,
        taxAmount: 100.00,
        totalAmount: 1100.00,
        paymentTerms: 'Net 30',
        dueDate: new Date('2024-02-15'),
        status: 'SENT',
        invoiceItems: [
          {
            id: 'item-1',
            description: 'Test Item 1',
            quantity: 2,
            unitPrice: 250.00,
            totalPrice: 500.00
          },
          {
            id: 'item-2',
            description: 'Test Item 2',
            quantity: 1,
            unitPrice: 500.00,
            totalPrice: 500.00
          }
        ]
      }

      const result = transformSalesInvoiceForSharing(mockSalesInvoice)

      expect(result).toEqual({
        id: 'si-1',
        invoiceNumber: 'SI-2024-001',
        invoiceDate: '2024-01-15',
        subtotal: 1000.00,
        taxAmount: 100.00,
        totalAmount: 1100.00,
        paymentTerms: 'Net 30',
        dueDate: '2024-02-15',
        status: 'SENT',
        invoiceItems: [
          {
            id: 'item-1',
            description: 'Test Item 1',
            quantity: 2,
            unitPrice: 250.00,
            totalPrice: 500.00
          },
          {
            id: 'item-2',
            description: 'Test Item 2',
            quantity: 1,
            unitPrice: 500.00,
            totalPrice: 500.00
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
        taxAmount: 80.00,
        totalAmount: 880.00,
        status: 'DRAFT',
        invoiceItems: []
      }

      const result = transformSalesInvoiceForSharing(mockSalesInvoice)

      expect(result.paymentTerms).toBeUndefined()
      expect(result.dueDate).toBeUndefined()
      expect(result.invoiceItems).toEqual([])
    })
  })

  describe('transformDeliveryReceiptForSharing', () => {
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
        courierService: 'Express Delivery'
      }

      const result = transformDeliveryReceiptForSharing(mockDeliveryReceipt)

      expect(result).toEqual({
        id: 'dr-1',
        receiptNumber: 'DR-2024-001',
        deliveryDate: '2024-01-15',
        deliveryAddress: '123 Main St, City, State 12345',
        receivedBy: 'Jane Smith',
        receivedByTitle: 'Warehouse Manager',
        deliveryStatus: 'DELIVERED',
        deliveryNotes: 'Package delivered in good condition',
        trackingNumber: 'TRK456789',
        courierService: 'Express Delivery'
      })
    })

    it('should handle delivery receipt with optional fields missing', () => {
      const mockDeliveryReceipt = {
        id: 'dr-2',
        receiptNumber: 'DR-2024-002',
        deliveryDate: new Date('2024-01-20'),
        deliveryAddress: '456 Oak Ave, Town, State 67890',
        receivedBy: 'Bob Johnson',
        deliveryStatus: 'PENDING'
      }

      const result = transformDeliveryReceiptForSharing(mockDeliveryReceipt)

      expect(result.receivedByTitle).toBeUndefined()
      expect(result.deliveryNotes).toBeUndefined()
      expect(result.trackingNumber).toBeUndefined()
      expect(result.courierService).toBeUndefined()
    })

    it('should convert delivery date to ISO string', () => {
      const mockDeliveryReceipt = {
        id: 'dr-3',
        receiptNumber: 'DR-2024-003',
        deliveryDate: new Date('2024-01-25T14:30:00Z'),
        deliveryAddress: '789 Pine St',
        receivedBy: 'Alice Brown',
        deliveryStatus: 'DELIVERED'
      }

      const result = transformDeliveryReceiptForSharing(mockDeliveryReceipt)

      expect(result.deliveryDate).toBe('2024-01-25')
    })
  })

  describe('Error handling', () => {
    it('should handle null input gracefully', () => {
      expect(() => transformBillingStatementForSharing(null as any)).toThrow()
      expect(() => transformSalesInvoiceForSharing(null as any)).toThrow()
      expect(() => transformDeliveryReceiptForSharing(null as any)).toThrow()
    })

    it('should handle undefined input gracefully', () => {
      expect(() => transformBillingStatementForSharing(undefined as any)).toThrow()
      expect(() => transformSalesInvoiceForSharing(undefined as any)).toThrow()
      expect(() => transformDeliveryReceiptForSharing(undefined as any)).toThrow()
    })

    it('should handle malformed date objects', () => {
      const mockBillingStatement = {
        id: 'bs-bad',
        statementNumber: 'BS-BAD',
        customerName: 'Test',
        billingDate: 'invalid-date' as any,
        totalAmount: 100,
        taxAmount: 10,
        netAmount: 90,
        status: 'PENDING',
        deliveryReceipts: [],
        customerOrder: null,
        salesInvoice: null
      }

      expect(() => transformBillingStatementForSharing(mockBillingStatement)).toThrow()
    })
  })
})