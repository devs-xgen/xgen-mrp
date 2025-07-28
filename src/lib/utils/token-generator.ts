import crypto from 'crypto'

/**
 * Generates a cryptographically secure random token for shareable links
 * @returns A base64url encoded token string
 */
export function generateSecureToken(): string {
  const buffer = crypto.randomBytes(32)
  return buffer.toString('base64url')
}

/**
 * Validates if a token has the correct format
 * @param token The token to validate
 * @returns True if the token is valid, false otherwise
 */
export function validateToken(token: any): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  // Check if token is base64url format and has reasonable length
  // 32 bytes encoded as base64url should be 43 characters
  const base64urlRegex = /^[A-Za-z0-9_-]+$/
  return base64urlRegex.test(token) && token.length >= 40 && token.length <= 50
}