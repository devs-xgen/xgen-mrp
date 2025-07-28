import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock Prisma
const mockPrisma = {
  shareableLink: {
    create: vi.fn(),
    findMany: vi.fn(),
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

// Mock token generator
vi.mock('@/lib/utils/token-generator', () => ({
  generateSecureToken: vi.fn(() => 'secure-token-123'),
  validateToken: vi.fn((token) => token === 'secure-token-123')
}))

// Mock auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {}
}))

describe('Share Link Generation Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete end-to-end share link generation flow', async () => {
    const mockSession = {
      user: { id: 'user-1', role: 'ADMIN' }
    }

    const mockDocument = {
      id: 'bs-1',
      statementNumber: 'BS-2024-001',
      customerName: 'Test Customer'
    }

    const mockCreatedLink = {
      id: 'link-1',
      token: 'secure-token-123',
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      isRevoked: false,
      accessCount: 0,
      createdAt: new Date(),
      lastAccessedAt: null,
      lastAccessedIp: null
    }

    // Setup mocks
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    mockPrisma.billingStatement.findUnique.mockResolvedValue(mockDocument)
    mockPrisma.shareableLink.create.mockResolvedValue(mockCreatedLink)

    // Step 1: Create share link
    const createRequest = new NextRequest('http://localhost/api/share-links', {
      method: 'POST',
      body: JSON.stringify({
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1'
      })
    })

    const { POST } = await import('@/app/api/share-links/route')
    const createResponse = await POST(createRequest)
    const createData = await createResponse.json()

    // Verify creation response
    expect(createResponse.status).toBe(201)
    expect(createData.success).toBe(true)
    expect(createData.shareableLink.token).toBe('secure-token-123')
    expect(createData.shareableLink.url).toContain('/billing-statement/share/secure-token-123')

    // Verify database calls
    expect(mockPrisma.billingStatement.findUnique).toHaveBeenCalledWith({
      where: { id: 'bs-1' }
    })
    expect(mockPrisma.shareableLink.create).toHaveBeenCalledWith({
      data: {
        token: 'secure-token-123',
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        expiresAt: expect.any(Date),
        createdBy: 'user-1'
      }
    })

    // Step 2: Retrieve existing links
    mockPrisma.shareableLink.findMany.mockResolvedValue([mockCreatedLink])

    const { GET } = await import('@/app/api/share-links/[documentType]/[documentId]/route')
    const getResponse = await GET(
      new NextRequest('http://localhost/api/share-links/BILLING_STATEMENT/bs-1'),
      { params: { documentType: 'BILLING_STATEMENT', documentId: 'bs-1' } }
    )
    const getData = await getResponse.json()

    // Verify retrieval response
    expect(getResponse.status).toBe(200)
    expect(getData.links).toHaveLength(1)
    expect(getData.links[0].token).toBe('secure-token-123')

    // Step 3: Revoke the link
    const mockUpdatedLink = {
      ...mockCreatedLink,
      isRevoked: true,
      revokedAt: new Date()
    }

    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockCreatedLink)
    mockPrisma.shareableLink.update.mockResolvedValue(mockUpdatedLink)

    const { DELETE } = await import('@/app/api/share-links/[linkId]/route')
    const deleteResponse = await DELETE(
      new NextRequest('http://localhost/api/share-links/link-1'),
      { params: { linkId: 'link-1' } }
    )
    const deleteData = await deleteResponse.json()

    // Verify revocation response
    expect(deleteResponse.status).toBe(200)
    expect(deleteData.success).toBe(true)
    expect(deleteData.message).toBe('Share link revoked successfully')

    // Verify revocation database call
    expect(mockPrisma.shareableLink.update).toHaveBeenCalledWith({
      where: { id: 'link-1' },
      data: {
        isRevoked: true,
        revokedAt: expect.any(Date)
      }
    })
  })

  it('should handle multiple document types in the same flow', async () => {
    const mockSession = {
      user: { id: 'user-1', role: 'ADMIN' }
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    // Test billing statement
    mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })
    mockPrisma.shareableLink.create.mockResolvedValue({
      id: 'link-1',
      token: 'token-bs',
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(),
      createdBy: 'user-1'
    })

    const { POST } = await import('@/app/api/share-links/route')
    
    const bsRequest = new NextRequest('http://localhost/api/share-links', {
      method: 'POST',
      body: JSON.stringify({
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1'
      })
    })

    const bsResponse = await POST(bsRequest)
    const bsData = await bsResponse.json()

    expect(bsResponse.status).toBe(201)
    expect(bsData.shareableLink.url).toContain('/billing-statement/share/')

    // Test sales invoice
    mockPrisma.salesInvoice.findUnique.mockResolvedValue({ id: 'si-1' })
    mockPrisma.shareableLink.create.mockResolvedValue({
      id: 'link-2',
      token: 'token-si',
      documentType: 'SALES_INVOICE',
      documentId: 'si-1',
      expiresAt: new Date(),
      createdBy: 'user-1'
    })

    const siRequest = new NextRequest('http://localhost/api/share-links', {
      method: 'POST',
      body: JSON.stringify({
        documentType: 'SALES_INVOICE',
        documentId: 'si-1'
      })
    })

    const siResponse = await POST(siRequest)
    const siData = await siResponse.json()

    expect(siResponse.status).toBe(201)
    expect(siData.shareableLink.url).toContain('/sales-invoice/share/')

    // Test delivery receipt
    mockPrisma.deliveryReceipt.findUnique.mockResolvedValue({ id: 'dr-1' })
    mockPrisma.shareableLink.create.mockResolvedValue({
      id: 'link-3',
      token: 'token-dr',
      documentType: 'DELIVERY_RECEIPT',
      documentId: 'dr-1',
      expiresAt: new Date(),
      createdBy: 'user-1'
    })

    const drRequest = new NextRequest('http://localhost/api/share-links', {
      method: 'POST',
      body: JSON.stringify({
        documentType: 'DELIVERY_RECEIPT',
        documentId: 'dr-1'
      })
    })

    const drResponse = await POST(drRequest)
    const drData = await drResponse.json()

    expect(drResponse.status).toBe(201)
    expect(drData.shareableLink.url).toContain('/delivery-receipt/share/')
  })

  it('should handle concurrent link creation for the same document', async () => {
    const mockSession = {
      user: { id: 'user-1', role: 'ADMIN' }
    }

    const mockDocument = { id: 'bs-1' }

    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    mockPrisma.billingStatement.findUnique.mockResolvedValue(mockDocument)

    // Mock different tokens for concurrent requests
    const { generateSecureToken } = await import('@/lib/utils/token-generator')
    const mockGenerateSecureToken = vi.mocked(generateSecureToken)
    mockGenerateSecureToken
      .mockReturnValueOnce('token-1')
      .mockReturnValueOnce('token-2')
      .mockReturnValueOnce('token-3')

    mockPrisma.shareableLink.create
      .mockResolvedValueOnce({
        id: 'link-1',
        token: 'token-1',
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        expiresAt: new Date(),
        createdBy: 'user-1'
      })
      .mockResolvedValueOnce({
        id: 'link-2',
        token: 'token-2',
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        expiresAt: new Date(),
        createdBy: 'user-1'
      })
      .mockResolvedValueOnce({
        id: 'link-3',
        token: 'token-3',
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        expiresAt: new Date(),
        createdBy: 'user-1'
      })

    const { POST } = await import('@/app/api/share-links/route')

    // Create multiple concurrent requests
    const requests = [1, 2, 3].map(i => 
      POST(new NextRequest('http://localhost/api/share-links', {
        method: 'POST',
        body: JSON.stringify({
          documentType: 'BILLING_STATEMENT',
          documentId: 'bs-1'
        })
      }))
    )

    const responses = await Promise.all(requests)
    const dataPromises = responses.map(r => r.json())
    const data = await Promise.all(dataPromises)

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(201)
    })

    // Each should have a unique token
    const tokens = data.map(d => d.shareableLink.token)
    expect(new Set(tokens).size).toBe(3) // All unique

    // All should be for the same document
    data.forEach(d => {
      expect(d.shareableLink.url).toContain('/billing-statement/share/')
    })
  })

  it('should maintain data consistency during link lifecycle', async () => {
    const mockSession = {
      user: { id: 'user-1', role: 'ADMIN' }
    }

    const mockDocument = { id: 'bs-1' }
    const mockLink = {
      id: 'link-1',
      token: 'secure-token-123',
      documentType: 'BILLING_STATEMENT',
      documentId: 'bs-1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      isRevoked: false,
      accessCount: 0,
      createdAt: new Date(),
      lastAccessedAt: null,
      lastAccessedIp: null,
      createdByUser: {
        name: 'Test User',
        email: 'test@example.com'
      }
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    mockPrisma.billingStatement.findUnique.mockResolvedValue(mockDocument)
    mockPrisma.shareableLink.create.mockResolvedValue(mockLink)

    // Create link
    const { POST } = await import('@/app/api/share-links/route')
    const createRequest = new NextRequest('http://localhost/api/share-links', {
      method: 'POST',
      body: JSON.stringify({
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1'
      })
    })

    await POST(createRequest)

    // Verify link exists in "database"
    mockPrisma.shareableLink.findMany.mockResolvedValue([mockLink])

    const { GET } = await import('@/app/api/share-links/[documentType]/[documentId]/route')
    const getResponse = await GET(
      new NextRequest('http://localhost/api/share-links/BILLING_STATEMENT/bs-1'),
      { params: { documentType: 'BILLING_STATEMENT', documentId: 'bs-1' } }
    )
    const getData = await getResponse.json()

    expect(getData.links).toHaveLength(1)
    expect(getData.links[0].isRevoked).toBe(false)

    // Revoke link
    mockPrisma.shareableLink.findUnique.mockResolvedValue(mockLink)
    const revokedLink = { ...mockLink, isRevoked: true, revokedAt: new Date() }
    mockPrisma.shareableLink.update.mockResolvedValue(revokedLink)

    const { DELETE } = await import('@/app/api/share-links/[linkId]/route')
    await DELETE(
      new NextRequest('http://localhost/api/share-links/link-1'),
      { params: { linkId: 'link-1' } }
    )

    // Verify link is revoked in subsequent queries
    mockPrisma.shareableLink.findMany.mockResolvedValue([revokedLink])

    const getAfterRevokeResponse = await GET(
      new NextRequest('http://localhost/api/share-links/BILLING_STATEMENT/bs-1'),
      { params: { documentType: 'BILLING_STATEMENT', documentId: 'bs-1' } }
    )
    const getAfterRevokeData = await getAfterRevokeResponse.json()

    expect(getAfterRevokeData.links[0].isRevoked).toBe(true)
    expect(getAfterRevokeData.links[0].revokedAt).toBeDefined()
  })
})