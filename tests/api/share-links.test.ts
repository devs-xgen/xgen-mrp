import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock Prisma
const mockPrisma = {
  shareableLink: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
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
  generateSecureToken: vi.fn(() => 'mock-secure-token-123'),
  validateToken: vi.fn((token) => token === 'valid-token')
}))

// Mock auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {}
}))

describe('Share Links API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/share-links', () => {
    it('should create a new shareable link successfully', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      const mockCreatedLink = {
        id: 'link-1',
        token: 'mock-secure-token-123',
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: 'user-1',
        isRevoked: false,
        accessCount: 0
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })
      mockPrisma.shareableLink.create.mockResolvedValue(mockCreatedLink)

      const request = new NextRequest('http://localhost/api/share-links', {
        method: 'POST',
        body: JSON.stringify({
          documentType: 'BILLING_STATEMENT',
          documentId: 'bs-1'
        })
      })

      const { POST } = await import('@/app/api/share-links/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.shareableLink.token).toBe('mock-secure-token-123')
      expect(data.shareableLink.url).toContain('/billing-statement/share/mock-secure-token-123')
    })

    it('should return 401 for unauthenticated requests', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/share-links', {
        method: 'POST',
        body: JSON.stringify({
          documentType: 'BILLING_STATEMENT',
          documentId: 'bs-1'
        })
      })

      const { POST } = await import('@/app/api/share-links/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid document type', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/share-links', {
        method: 'POST',
        body: JSON.stringify({
          documentType: 'INVALID_TYPE',
          documentId: 'doc-1'
        })
      })

      const { POST } = await import('@/app/api/share-links/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid document type')
    })

    it('should return 404 for non-existent document', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      mockPrisma.billingStatement.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/share-links', {
        method: 'POST',
        body: JSON.stringify({
          documentType: 'BILLING_STATEMENT',
          documentId: 'non-existent'
        })
      })

      const { POST } = await import('@/app/api/share-links/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Document not found')
    })

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })
      mockPrisma.shareableLink.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/share-links', {
        method: 'POST',
        body: JSON.stringify({
          documentType: 'BILLING_STATEMENT',
          documentId: 'bs-1'
        })
      })

      const { POST } = await import('@/app/api/share-links/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/share-links/[documentType]/[documentId]', () => {
    it('should retrieve existing share links for a document', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      const mockLinks = [
        {
          id: 'link-1',
          token: 'token-1',
          documentType: 'BILLING_STATEMENT',
          documentId: 'bs-1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isRevoked: false,
          accessCount: 5,
          createdByUser: {
            name: 'John Admin',
            email: 'john@example.com'
          }
        },
        {
          id: 'link-2',
          token: 'token-2',
          documentType: 'BILLING_STATEMENT',
          documentId: 'bs-1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
          isRevoked: false,
          accessCount: 2,
          createdByUser: {
            name: 'Jane Admin',
            email: 'jane@example.com'
          }
        }
      ]

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      mockPrisma.shareableLink.findMany.mockResolvedValue(mockLinks)

      const { GET } = await import('@/app/api/share-links/[documentType]/[documentId]/route')
      const response = await GET(
        new NextRequest('http://localhost/api/share-links/BILLING_STATEMENT/bs-1'),
        { params: { documentType: 'BILLING_STATEMENT', documentId: 'bs-1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.links).toHaveLength(2)
      expect(data.links[0].id).toBe('link-1')
    })

    it('should return 401 for unauthenticated requests', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const { GET } = await import('@/app/api/share-links/[documentType]/[documentId]/route')
      const response = await GET(
        new NextRequest('http://localhost/api/share-links/BILLING_STATEMENT/bs-1'),
        { params: { documentType: 'BILLING_STATEMENT', documentId: 'bs-1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('DELETE /api/share-links/[linkId]', () => {
    it('should revoke a shareable link successfully', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      const mockLink = {
        id: 'link-1',
        token: 'token-1',
        isRevoked: false,
        createdBy: 'user-1'
      }

      const mockUpdatedLink = {
        ...mockLink,
        isRevoked: true,
        revokedAt: new Date()
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      mockPrisma.shareableLink.findUnique.mockResolvedValue(mockLink)
      mockPrisma.shareableLink.update.mockResolvedValue(mockUpdatedLink)

      const { DELETE } = await import('@/app/api/share-links/[linkId]/route')
      const response = await DELETE(
        new NextRequest('http://localhost/api/share-links/link-1'),
        { params: { linkId: 'link-1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Share link revoked successfully')
    })

    it('should return 404 for non-existent link', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      mockPrisma.shareableLink.findUnique.mockResolvedValue(null)

      const { DELETE } = await import('@/app/api/share-links/[linkId]/route')
      const response = await DELETE(
        new NextRequest('http://localhost/api/share-links/non-existent'),
        { params: { linkId: 'non-existent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Share link not found')
    })

    it('should return 400 for already revoked link', async () => {
      const mockSession = {
        user: { id: 'user-1', role: 'ADMIN' }
      }

      const mockRevokedLink = {
        id: 'link-1',
        token: 'token-1',
        isRevoked: true,
        createdBy: 'user-1'
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      mockPrisma.shareableLink.findUnique.mockResolvedValue(mockRevokedLink)

      const { DELETE } = await import('@/app/api/share-links/[linkId]/route')
      const response = await DELETE(
        new NextRequest('http://localhost/api/share-links/link-1'),
        { params: { linkId: 'link-1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Share link is already revoked')
    })
  })
})