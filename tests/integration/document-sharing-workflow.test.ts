import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma
const mockPrisma = {
  shareableLink: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  billingStatement: {
    findUnique: vi.fn()
  },
  salesInvoice: {
    findUnique: vi.fn()
  },
  deliveryReceipt: {
    findUnique: vi.fn()
  }
}

vi.mock('@/lib/db', () => ({
  default: mockPrisma
}))

// Mock document transformers
vi.mock('@/lib/utils/shared-document-transformers', () => ({
  transformBillingStatementToShared: vi.fn(),
  transformSalesInvoiceToShared: vi.fn(),
  transformDeliveryReceiptToShared: vi.fn(),
  extractCustomerInfo: vi.fn(),
  getCompanyInfo: vi.fn(() => ({
    name: 'XGen Manufacturing',
    address: '123 Manufacturing St',
    phone: '+1 (555) 123-4567',
    email: 'info@xgenmanufacturing.com'
  }))
}))

// Mock rate limiter
vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 9 }))
}))

// Mock audit logger
vi.mock('@/lib/utils/audit-logger', () => ({
  logDocumentAccess: vi.fn()
}))

describe('Document Sharing Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full document sharing workflow for billing statement', async () => {
    const mockToken = 'valid-token-123'
    const mockShareableLink = {
      id: 'link-1',
      token: mockToken,
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      isRevoked: false,
      accessCount: 0,
      lastAccessedAt: null,
      lastAccessedIp: null
    }

    const mockBillingStatement = {
      id: 'bs-1',
      statementNumber: 'BS-2024-001',
      customerName: 'Test Customer',
      billingDate: new Date('2024-01-15'),
      totalAmount: 1500.00,
      taxAmount: 150.00,
      discountAmount: 0.00,
      netAmount: 1350.00,
      status: 'PENDING',
      customerOrder: {
        orderNumber: 'CO-2024-001',
        orderDate: new Date('2024-01-10')
      },
      deliveryReceipts: [],
      salesInvoice: null
    }

    const mockTransformedDocument = {
      id: 'bs-1',
      statementNumber: 'BS-2024-001',
      customerName: 'Test Customer',
      billingDate: '2024-01-15T00:00:00.000Z',
      totalAmount: '1500',
      taxAmount: '150',
      discountAmount: '0',
      netAmount: '1350',
      status: 'PENDING',
      customerOrder: {
        orderNumber: 'CO-2024-001',
        orderDate: '2024-01-10T00:00:00.000Z'
      },
      deliveryReceipts: [],
      salesInvoice: null
    }

    const mockCustomerInfo = {
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '+1234567890',
      address: '123 Customer St',
      city: 'Customer City',
      state: 'CA',
      country: 'USA',
      postalCode: '12345',
      tinNumber: null
    }

    // Setup mocks
    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockShareableLink)
    mockPrisma.billingStatement.findUnique.mockResolvedValue(mockBillingStatement)
    
    const mockTransformBillingStatement = vi.mocked(require('@/lib/utils/shared-document-transformers').transformBillingStatementToShared)
    mockTransformBillingStatement.mockReturnValue(mockTransformedDocument)
    
    const mockExtractCustomerInfo = vi.mocked(require('@/lib/utils/shared-document-transformers').extractCustomerInfo)
    mockExtractCustomerInfo.mockReturnValue(mockCustomerInfo)

    const mockCheckRateLimit = vi.mocked(require('@/lib/utils/rate-limiter').checkRateLimit)
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 9 })

    const mockLogDocumentAccess = vi.mocked(require('@/lib/utils/audit-logger').logDocumentAccess)

    // Step 1: Access shared document
    const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    })

    const { GET } = await import('@/app/api/shared-documents/[token]/route')
    const response = await GET(request, { params: { token: mockToken } })
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.document.type).toBe('BILLING_STATEMENT')
    expect(data.document.data).toEqual(mockTransformedDocument)
    expect(data.document.metadata.customerInfo).toEqual(mockCustomerInfo)
    expect(data.document.metadata.companyInfo.name).toBe('XGen Manufacturing')

    // Verify database interactions
    expect(mockPrisma.shareableLink.findUnique).toHaveBeenCalledWith({
      where: { token: mockToken }
    })

    expect(mockPrisma.billingStatement.findUnique).toHaveBeenCalledWith({
      where: { id: 'bs-1' },
      include: expect.any(Object)
    })

    // Verify access tracking
    expect(mockPrisma.shareableLink.update).toHaveBeenCalledWith({
      where: { id: 'link-1' },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: expect.any(Date),
        lastAccessedIp: '192.168.1.1'
      }
    })

    // Verify audit logging
    expect(mockLogDocumentAccess).toHaveBeenCalledWith({
      linkId: 'link-1',
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      ipAddress: '192.168.1.1',
      userAgent: undefined,
      timestamp: expect.any(Date)
    })

    // Verify rate limiting
    expect(mockCheckRateLimit).toHaveBeenCalledWith('192.168.1.1')

    // Verify document transformation
    expect(mockTransformBillingStatement).toHaveBeenCalledWith(mockBillingStatement)
    expect(mockExtractCustomerInfo).toHaveBeenCalled()
  })

  it('should handle expired links correctly', async () => {
    const mockToken = 'expired-token-123'
    const mockExpiredLink = {
      id: 'link-1',
      token: mockToken,
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRevoked: false,
      accessCount: 5
    }

    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockExpiredLink)

    const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`)

    const { GET } = await import('@/app/api/shared-documents/[token]/route')
    const response = await GET(request, { params: { token: mockToken } })
    const data = await response.json()

    expect(response.status).toBe(410)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Share link has expired')

    // Should not access the document or update access count
    expect(mockPrisma.billingStatement.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.shareableLink.update).not.toHaveBeenCalled()
  })

  it('should handle revoked links correctly', async () => {
    const mockToken = 'revoked-token-123'
    const mockRevokedLink = {
      id: 'link-1',
      token: mockToken,
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isRevoked: true,
      revokedAt: new Date(),
      accessCount: 3
    }

    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockRevokedLink)

    const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`)

    const { GET } = await import('@/app/api/shared-documents/[token]/route')
    const response = await GET(request, { params: { token: mockToken } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Share link has been revoked')

    // Should not access the document or update access count
    expect(mockPrisma.billingStatement.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.shareableLink.update).not.toHaveBeenCalled()
  })

  it('should handle rate limiting correctly', async () => {
    const mockToken = 'valid-token-123'
    const mockShareableLink = {
      id: 'link-1',
      token: mockToken,
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isRevoked: false,
      accessCount: 0
    }

    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockShareableLink)

    const mockCheckRateLimit = vi.mocked(require('@/lib/utils/rate-limiter').checkRateLimit)
    mockCheckRateLimit.mockReturnValue({ 
      allowed: false, 
      remaining: 0, 
      resetTime: Date.now() + 60000 
    })

    const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    })

    const { GET } = await import('@/app/api/shared-documents/[token]/route')
    const response = await GET(request, { params: { token: mockToken } })
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Too many requests')

    // Should not access the document
    expect(mockPrisma.billingStatement.findUnique).not.toHaveBeenCalled()
  })

  it('should handle different document types in the same workflow', async () => {
    const testCases = [
      {
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        mockDocument: { id: 'bs-1', statementNumber: 'BS-001' },
        transformFunction: 'transformBillingStatementToShared',
        prismaMethod: 'billingStatement'
      },
      {
        documentType: 'SALES_INVOICE',
        documentId: 'si-1',
        mockDocument: { id: 'si-1', invoiceNumber: 'SI-001' },
        transformFunction: 'transformSalesInvoiceToShared',
        prismaMethod: 'salesInvoice'
      },
      {
        documentType: 'DELIVERY_RECEIPT',
        documentId: 'dr-1',
        mockDocument: { id: 'dr-1', receiptNumber: 'DR-001' },
        transformFunction: 'transformDeliveryReceiptToShared',
        prismaMethod: 'deliveryReceipt'
      }
    ]

    for (const testCase of testCases) {
      vi.clearAllMocks()

      const mockToken = `token-${testCase.documentId}`
      const mockShareableLink = {
        id: `link-${testCase.documentId}`,
        token: mockToken,
        documentType: testCase.documentType,
        documentId: testCase.documentId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: false,
        accessCount: 0
      }

      const mockTransformedDocument = {
        id: testCase.documentId,
        ...testCase.mockDocument
      }

      // Setup mocks
      mockPrisma.shareableLink.findUnique.mockResolvedValue(mockShareableLink)
      mockPrisma[testCase.prismaMethod].findUnique.mockResolvedValue(testCase.mockDocument)

      const mockTransformFunction = vi.mocked(require('@/lib/utils/shared-document-transformers')[testCase.transformFunction])
      mockTransformFunction.mockReturnValue(mockTransformedDocument)

      const mockCheckRateLimit = vi.mocked(require('@/lib/utils/rate-limiter').checkRateLimit)
      mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 9 })

      // Test the workflow
      const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`)

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      const response = await GET(request, { params: { token: mockToken } })
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.document.type).toBe(testCase.documentType)
      expect(data.document.data).toEqual(mockTransformedDocument)

      // Verify correct document retrieval
      expect(mockPrisma[testCase.prismaMethod].findUnique).toHaveBeenCalledWith({
        where: { id: testCase.documentId },
        include: expect.any(Object)
      })

      // Verify correct transformation
      expect(mockTransformFunction).toHaveBeenCalledWith(testCase.mockDocument)
    }
  })

  it('should handle missing documents gracefully', async () => {
    const mockToken = 'valid-token-123'
    const mockShareableLink = {
      id: 'link-1',
      token: mockToken,
      documentType: 'BILLING_STATEMENT',
      documentId: 'non-existent-bs',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isRevoked: false,
      accessCount: 0
    }

    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockShareableLink)
    mockPrisma.billingStatement.findUnique.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`)

    const { GET } = await import('@/app/api/shared-documents/[token]/route')
    const response = await GET(request, { params: { token: mockToken } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Document not found')

    // Should not update access count for missing documents
    expect(mockPrisma.shareableLink.update).not.toHaveBeenCalled()
  })

  it('should track access statistics correctly', async () => {
    const mockToken = 'valid-token-123'
    const mockShareableLink = {
      id: 'link-1',
      token: mockToken,
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isRevoked: false,
      accessCount: 5,
      lastAccessedAt: new Date('2024-01-10'),
      lastAccessedIp: '192.168.1.100'
    }

    const mockDocument = { id: 'bs-1', statementNumber: 'BS-001' }

    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockShareableLink)
    mockPrisma.billingStatement.findUnique.mockResolvedValue(mockDocument)

    const mockTransformBillingStatement = vi.mocked(require('@/lib/utils/shared-document-transformers').transformBillingStatementToShared)
    mockTransformBillingStatement.mockReturnValue(mockDocument)

    const mockCheckRateLimit = vi.mocked(require('@/lib/utils/rate-limiter').checkRateLimit)
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 9 })

    const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
      headers: {
        'x-forwarded-for': '192.168.1.200',
        'user-agent': 'Mozilla/5.0 Test Browser'
      }
    })

    const { GET } = await import('@/app/api/shared-documents/[token]/route')
    await GET(request, { params: { token: mockToken } })

    // Verify access count increment and tracking
    expect(mockPrisma.shareableLink.update).toHaveBeenCalledWith({
      where: { id: 'link-1' },
      data: {
        accessCount: { increment: 1 }, // Should increment from 5 to 6
        lastAccessedAt: expect.any(Date),
        lastAccessedIp: '192.168.1.200' // Should update to new IP
      }
    })

    // Verify audit logging with user agent
    const mockLogDocumentAccess = vi.mocked(require('@/lib/utils/audit-logger').logDocumentAccess)
    expect(mockLogDocumentAccess).toHaveBeenCalledWith({
      linkId: 'link-1',
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 Test Browser',
      timestamp: expect.any(Date)
    })
  })
})