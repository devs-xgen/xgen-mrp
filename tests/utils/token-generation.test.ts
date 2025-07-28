import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSecureToken, validateToken } from '@/lib/utils/token-generator'
import crypto from 'crypto'

// Mock crypto module
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn()
  }
}))

describe('Token Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateSecureToken', () => {
    it('should generate a 32-byte token', () => {
      const mockBuffer = Buffer.from('a'.repeat(32))
      vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer)
      
      const token = generateSecureToken()
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(32)
      expect(token).toBe(mockBuffer.toString('base64url'))
    })

    it('should generate unique tokens on multiple calls', () => {
      const mockBuffer1 = Buffer.from('a'.repeat(32))
      const mockBuffer2 = Buffer.from('b'.repeat(32))
      
      vi.mocked(crypto.randomBytes)
        .mockReturnValueOnce(mockBuffer1)
        .mockReturnValueOnce(mockBuffer2)
      
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      
      expect(token1).not.toBe(token2)
      expect(crypto.randomBytes).toHaveBeenCalledTimes(2)
    })

    it('should generate URL-safe tokens', () => {
      const mockBuffer = Buffer.from('test+/=data', 'utf8')
      vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer)
      
      const token = generateSecureToken()
      
      // base64url encoding should not contain +, /, or = characters
      expect(token).not.toMatch(/[+/=]/)
    })

    it('should handle crypto errors gracefully', () => {
      vi.mocked(crypto.randomBytes).mockImplementation(() => {
        throw new Error('Crypto error')
      })
      
      expect(() => generateSecureToken()).toThrow('Crypto error')
    })
  })

  describe('validateToken', () => {
    it('should validate token format', () => {
      // Valid base64url token (43 characters for 32 bytes)
      const validToken = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO'
      expect(validateToken(validToken)).toBe(true)
    })

    it('should reject invalid token formats', () => {
      expect(validateToken('')).toBe(false)
      expect(validateToken('short')).toBe(false)
      expect(validateToken('contains+invalid/chars=')).toBe(false)
      expect(validateToken(null)).toBe(false)
      expect(validateToken(undefined)).toBe(false)
    })

    it('should reject tokens with invalid length', () => {
      const tooShort = 'abc'
      const tooLong = 'a'.repeat(100)
      
      expect(validateToken(tooShort)).toBe(false)
      expect(validateToken(tooLong)).toBe(false)
    })
  })
})