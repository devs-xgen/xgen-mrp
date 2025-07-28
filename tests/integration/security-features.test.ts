import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock rate limiter
const mockRateLimiter = {
  checkRateLimit: vi.fn(),
  getRateLimitInfo: vi.fn(),
  resetRateLimit: vi.fn()
}

vi.mock('@/lib/utils/rate-limiter', () => mockRateLimiter)

// Mock audit logger
const mockAuditLogger = {
  logDocumentAccess: vi.fn(),
  logSuspiciousActivity: vi.fn(),
  logRateLimitViolation: vi.fn()
}

vi.mock('@/lib/utils/audit-logger', () => mockAuditLogger)

// Mock Prisma
const mockPrisma = {
  shareableLink: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  billingStatement: {
    findUnique: vi.fn()
  }
}

vi.mock('@/lib/db', () => ({
  default: mockPrisma
}))

// Mock document transformers
vi.mock('@/lib/utils/shared-document-transformers', () => ({
  transformBillingStatementToShared: vi.fn(() => ({ id: 'bs-1' })),
  extractCustomerInfo: vi.fn(() => ({ name: 'Test Customer' })),
  getCompanyInfo: vi.fn(() => ({ name: 'XGen Manufacturing' }))
}))

describe('Security Features Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits per IP address', async () => {
      const mockToken = 'valid-token-123'
      const clientIP = '192.168.1.100'

      // First request - allowed
      mockRateLimiter.checkRateLimit.mockReturnValueOnce({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 60000
      })

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
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })

      const request1 = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
        headers: { 'x-forwarded-for': clientIP }
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      const response1 = await GET(request1, { params: { token: mockToken } })

      expect(response1.status).toBe(200)
      expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(clientIP)

      // Second request - rate limited
      mockRateLimiter.checkRateLimit.mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000
      })

      const request2 = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
        headers: { 'x-forwarded-for': clientIP }
      })

      const response2 = await GET(request2, { params: { token: mockToken } })
      const data2 = await response2.json()

      expect(response2.status).toBe(429)
      expect(data2.success).toBe(false)
      expect(data2.error).toBe('Too many requests')
      expect(response2.headers.get('Retry-After')).toBeDefined()

      // Verify rate limit violation logging
      expect(mockAuditLogger.logRateLimitViolation).toHaveBeenCalledWith({
        ipAddress: clientIP,
        timestamp: expect.any(Date),
        attemptedResource: mockToken
      })
    })

    it('should handle different IP addresses independently', async () => {
      const mockToken = 'valid-token-123'
      const ip1 = '192.168.1.100'
      const ip2 = '192.168.1.101'

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
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })

      // IP1 is rate limited
      mockRateLimiter.checkRateLimit.mockImplementation((ip) => {
        if (ip === ip1) {
          return { allowed: false, remaining: 0, resetTime: Date.now() + 60000 }
        }
        return { allowed: true, remaining: 9, resetTime: Date.now() + 60000 }
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')

      // Request from IP1 - should be blocked
      const request1 = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
        headers: { 'x-forwarded-for': ip1 }
      })

      const response1 = await GET(request1, { params: { token: mockToken } })
      expect(response1.status).toBe(429)

      // Request from IP2 - should be allowed
      const request2 = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
        headers: { 'x-forwarded-for': ip2 }
      })

      const response2 = await GET(request2, { params: { token: mockToken } })
      expect(response2.status).toBe(200)

      // Verify both IPs were checked independently
      expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(ip1)
      expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(ip2)
    })

    it('should include rate limit headers in responses', async () => {
      const mockToken = 'valid-token-123'
      const clientIP = '192.168.1.100'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000
      })

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
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })

      const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
        headers: { 'x-forwarded-for': clientIP }
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      const response = await GET(request, { params: { token: mockToken } })

      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5')
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
  })

  describe('Access Logging and Audit Trail', () => {
    it('should log all document access attempts', async () => {
      const mockToken = 'valid-token-123'
      const clientIP = '192.168.1.100'
      const userAgent = 'Mozilla/5.0 Test Browser'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

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
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })

      const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
        headers: {
          'x-forwarded-for': clientIP,
          'user-agent': userAgent
        }
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      await GET(request, { params: { token: mockToken } })

      expect(mockAuditLogger.logDocumentAccess).toHaveBeenCalledWith({
        linkId: 'link-1',
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        ipAddress: clientIP,
        userAgent: userAgent,
        timestamp: expect.any(Date)
      })
    })

    it('should log suspicious activity for invalid tokens', async () => {
      const invalidToken = 'invalid-token-123'
      const clientIP = '192.168.1.100'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

      mockPrisma.shareableLink.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost/api/shared-documents/${invalidToken}`, {
        headers: { 'x-forwarded-for': clientIP }
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      const response = await GET(request, { params: { token: invalidToken } })

      expect(response.status).toBe(404)
      expect(mockAuditLogger.logSuspiciousActivity).toHaveBeenCalledWith({
        type: 'INVALID_TOKEN_ACCESS',
        ipAddress: clientIP,
        token: invalidToken,
        timestamp: expect.any(Date)
      })
    })

    it('should log access attempts to expired links', async () => {
      const expiredToken = 'expired-token-123'
      const clientIP = '192.168.1.100'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

      const mockExpiredLink = {
        id: 'link-1',
        token: expiredToken,
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        isRevoked: false,
        accessCount: 5
      }

      mockPrisma.shareableLink.findUnique.mockResolvedValue(mockExpiredLink)

      const request = new NextRequest(`http://localhost/api/shared-documents/${expiredToken}`, {
        headers: { 'x-forwarded-for': clientIP }
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      const response = await GET(request, { params: { token: expiredToken } })

      expect(response.status).toBe(410)
      expect(mockAuditLogger.logSuspiciousActivity).toHaveBeenCalledWith({
        type: 'EXPIRED_LINK_ACCESS',
        ipAddress: clientIP,
        linkId: 'link-1',
        token: expiredToken,
        timestamp: expect.any(Date)
      })
    })

    it('should log access attempts to revoked links', async () => {
      const revokedToken = 'revoked-token-123'
      const clientIP = '192.168.1.100'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

      const mockRevokedLink = {
        id: 'link-1',
        token: revokedToken,
        documentType: 'BILLING_STATEMENT',
        documentId: 'bs-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: true,
        revokedAt: new Date(),
        accessCount: 3
      }

      mockPrisma.shareableLink.findUnique.mockResolvedValue(mockRevokedLink)

      const request = new NextRequest(`http://localhost/api/shared-documents/${revokedToken}`, {
        headers: { 'x-forwarded-for': clientIP }
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      const response = await GET(request, { params: { token: revokedToken } })

      expect(response.status).toBe(403)
      expect(mockAuditLogger.logSuspiciousActivity).toHaveBeenCalledWith({
        type: 'REVOKED_LINK_ACCESS',
        ipAddress: clientIP,
        linkId: 'link-1',
        token: revokedToken,
        timestamp: expect.any(Date)
      })
    })

    it('should track multiple access attempts from same IP', async () => {
      const mockToken = 'valid-token-123'
      const clientIP = '192.168.1.100'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

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
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')

      // Make multiple requests
      for (let i = 0; i < 3; i++) {
        const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
          headers: { 'x-forwarded-for': clientIP }
        })

        await GET(request, { params: { token: mockToken } })
      }

      // Should log each access
      expect(mockAuditLogger.logDocumentAccess).toHaveBeenCalledTimes(3)

      // Should update access count each time
      expect(mockPrisma.shareableLink.update).toHaveBeenCalledTimes(3)
      expect(mockPrisma.shareableLink.update).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: expect.any(Date),
          lastAccessedIp: clientIP
        }
      })
    })
  })

  describe('Token Security', () => {
    it('should handle malformed tokens securely', async () => {
      const malformedTokens = [
        '',
        'short',
        'contains+invalid/chars=',
        'a'.repeat(1000), // Very long token
        '../../../etc/passwd', // Path traversal attempt
        '<script>alert("xss")</script>', // XSS attempt
        'SELECT * FROM users', // SQL injection attempt
      ]

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')

      for (const malformedToken of malformedTokens) {
        vi.clearAllMocks()
        mockPrisma.shareableLink.findUnique.mockResolvedValue(null)

        const request = new NextRequest(`http://localhost/api/shared-documents/${encodeURIComponent(malformedToken)}`, {
          headers: { 'x-forwarded-for': '192.168.1.100' }
        })

        const response = await GET(request, { params: { token: malformedToken } })

        expect(response.status).toBe(404)
        expect(mockAuditLogger.logSuspiciousActivity).toHaveBeenCalledWith({
          type: 'INVALID_TOKEN_ACCESS',
          ipAddress: '192.168.1.100',
          token: malformedToken,
          timestamp: expect.any(Date)
        })
      }
    })

    it('should not leak information about token validity', async () => {
      const tokens = [
        'non-existent-token',
        'expired-token',
        'revoked-token'
      ]

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

      // Mock different scenarios
      mockPrisma.shareableLink.findUnique
        .mockResolvedValueOnce(null) // Non-existent
        .mockResolvedValueOnce({ // Expired
          id: 'link-1',
          token: 'expired-token',
          expiresAt: new Date(Date.now() - 1000),
          isRevoked: false
        })
        .mockResolvedValueOnce({ // Revoked
          id: 'link-2',
          token: 'revoked-token',
          expiresAt: new Date(Date.now() + 1000),
          isRevoked: true
        })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')

      for (const token of tokens) {
        const request = new NextRequest(`http://localhost/api/shared-documents/${token}`, {
          headers: { 'x-forwarded-for': '192.168.1.100' }
        })

        const response = await GET(request, { params: { token } })
        const data = await response.json()

        // All should return appropriate error codes but not leak specific information
        expect([404, 410, 403]).toContain(response.status)
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
        expect(data.error).not.toContain('database')
        expect(data.error).not.toContain('internal')
      }
    })
  })

  describe('IP Address Handling', () => {
    it('should correctly extract IP addresses from various headers', async () => {
      const mockToken = 'valid-token-123'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

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
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })

      const { GET } = await import('@/app/api/shared-documents/[token]/route')

      const testCases = [
        { header: 'x-forwarded-for', value: '192.168.1.100', expected: '192.168.1.100' },
        { header: 'x-forwarded-for', value: '192.168.1.100, 10.0.0.1', expected: '192.168.1.100' },
        { header: 'x-real-ip', value: '192.168.1.101', expected: '192.168.1.101' },
        { header: 'cf-connecting-ip', value: '192.168.1.102', expected: '192.168.1.102' },
      ]

      for (const testCase of testCases) {
        vi.clearAllMocks()

        const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`, {
          headers: { [testCase.header]: testCase.value }
        })

        await GET(request, { params: { token: mockToken } })

        expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(testCase.expected)
        expect(mockAuditLogger.logDocumentAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: testCase.expected
          })
        )
      }
    })

    it('should handle missing IP address gracefully', async () => {
      const mockToken = 'valid-token-123'

      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9
      })

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
      mockPrisma.billingStatement.findUnique.mockResolvedValue({ id: 'bs-1' })

      const request = new NextRequest(`http://localhost/api/shared-documents/${mockToken}`)
      // No IP headers

      const { GET } = await import('@/app/api/shared-documents/[token]/route')
      const response = await GET(request, { params: { token: mockToken } })

      expect(response.status).toBe(200)
      expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith('unknown')
      expect(mockAuditLogger.logDocumentAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: 'unknown'
        })
      )
    })
  })
})