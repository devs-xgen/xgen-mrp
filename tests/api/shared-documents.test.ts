import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/shared-documents/[token]/route'
import { prisma } from '@/lib/db'
import { ShareableDocType } from '@prisma/client'

// Mock the database
vi.mock('@/lib/db', () => ({
  prisma: {
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
}))

describe('Shared Documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 404 for non-existent token', async () => {
    vi.mocked(prisma.shareableLink.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost:3001/api/shared-documents/invalid-token')
    const response = await GET(request, { params: { token: 'invalid-token' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Link not found')
  })

  it('should return 403 for revoked token', async () => {
    const mockShareableLink = {
      id: 'link-1',
      token: 'valid-token',
      documentType: ShareableDocType.BILLING_STATEMENT,
      documentId: 'doc-1',
      isRevoked: true,
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      createdByUser: { id: 'user-1', email: 'test@example.com' }
    }

    vi.mocked(prisma.shareableLink.findUnique).mockResolvedValue(mockShareableLink)

    const request = new Request('http://localhost:3001/api/shared-documents/valid-token')
    const response = await GET(request, { params: { token: 'valid-token' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Link has been revoked')
  })

  it('should return 410 for expired token', async () => {
    const mockShareableLink = {
      id: 'link-1',
      token: 'expired-token',
      documentType: ShareableDocType.BILLING_STATEMENT,
      documentId: 'doc-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      createdByUser: { id: 'user-1', email: 'test@example.com' }
    }

    vi.mocked(prisma.shareableLink.findUnique).mockResolvedValue(mockShareableLink)

    const request = new Request('http://localhost:3001/api/shared-documents/expired-token')
    const response = await GET(request, { params: { token: 'expired-token' } })
    const data = await response.json()

    expect(response.status).toBe(410)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Link has expired')
  })

  it('should successfully return billing statement data', async () => {
    const mockShareableLink = {
      id: 'link-1',
      token: 'valid-token',
      documentType: ShareableDocType.BILLING_STATEMENT,
      documentId: 'doc-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      createdByUser: { id: 'user-1', email: 'test@example.com' }
    }

    const mockBillingStatement = {
      id: 'doc-1',
      statementNumber: 'BS-001',
      customerName: 'Test Customer',
      billingDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-31'),
      totalAmount: { toString: () => '1000.00' },
      taxAmount: { toString: () => '100.00' },
      discountAmount: { toString: () => '0.00' },
      netAmount: { toString: () => '1100.00' },
      status: 'SENT',
      notes: 'Test notes',
      customer: {
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '+1234567890',
        address: '123 Test St'
      },
      customerOrder: null,
      productionOrder: null,
      salesInvoice: null,
      deliveryReceipts: [],
      createdByUser: { id: 'user-1', email: 'test@example.com' }
    }

    vi.mocked(prisma.shareableLink.findUnique).mockResolvedValue(mockShareableLink)
    vi.mocked(prisma.billingStatement.findUnique).mockResolvedValue(mockBillingStatement)
    vi.mocked(prisma.shareableLink.update).mockResolvedValue({} as any)

    const request = new Request('http://localhost:3001/api/shared-documents/valid-token')
    const response = await GET(request, { params: { token: 'valid-token' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.document).toBeDefined()
    expect(data.document.type).toBe(ShareableDocType.BILLING_STATEMENT)
    expect(data.document.data.statementNumber).toBe('BS-001')
    expect(data.document.metadata.customerInfo.name).toBe('Test Customer')
    expect(data.document.metadata.companyInfo.name).toBe('XGen Manufacturing')
  })

  it('should implement rate limiting', async () => {
    const mockShareableLink = {
      id: 'link-1',
      token: 'valid-token',
      documentType: ShareableDocType.BILLING_STATEMENT,
      documentId: 'doc-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000),
      createdByUser: { id: 'user-1', email: 'test@example.com' }
    }

    vi.mocked(prisma.shareableLink.findUnique).mockResolvedValue(mockShareableLink)

    // Make multiple requests quickly to trigger rate limiting
    const requests = Array.from({ length: 12 }, (_, i) => {
      const request = new Request('http://localhost:3001/api/shared-documents/valid-token', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })
      return GET(request, { params: { token: 'valid-token' } })
    })

    const responses = await Promise.all(requests)
    const lastResponse = responses[responses.length - 1]
    const data = await lastResponse.json()

    // The last request should be rate limited
    expect(lastResponse.status).toBe(429)
    expect(data.error).toContain('Rate limit exceeded')
  })
})