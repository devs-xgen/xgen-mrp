/**
 * Rate limiting utility for API endpoints
 * In production, this should be replaced with Redis-based storage
 */

interface RateLimitEntry {
  count: number
  resetTime: number
  violations: number
  lastViolation?: number
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (ip: string, path?: string) => string // Custom key generator
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

// In-memory storage (replace with Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (ip: string, path?: string) => `rate_limit:${ip}${path ? `:${path}` : ''}`
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  ip: string, 
  config: Partial<RateLimitConfig> = {},
  path?: string
): RateLimitResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const key = finalConfig.keyGenerator!(ip, path)
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // Initialize or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + finalConfig.windowMs,
      violations: entry?.violations || 0,
      lastViolation: entry?.lastViolation
    }
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - 1,
      resetTime: entry.resetTime
    }
  }
  
  // Check if limit exceeded
  if (entry.count >= finalConfig.maxRequests) {
    // Record violation
    entry.violations++
    entry.lastViolation = now
    
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    }
  }
  
  // Increment count
  entry.count++
  
  return {
    allowed: true,
    remaining: finalConfig.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Log rate limit violations for monitoring
 */
export function logRateLimitViolation(
  ip: string, 
  path: string, 
  userAgent?: string,
  additionalInfo?: Record<string, any>
): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    ip,
    path,
    userAgent,
    type: 'RATE_LIMIT_VIOLATION',
    ...additionalInfo
  }
  
  // In production, send this to your logging service
  console.warn('[RATE_LIMIT_VIOLATION]', JSON.stringify(logEntry))
}

/**
 * Get rate limit statistics for an IP
 */
export function getRateLimitStats(ip: string, path?: string): {
  current: number
  violations: number
  lastViolation?: number
  resetTime?: number
} | null {
  const key = DEFAULT_CONFIG.keyGenerator!(ip, path)
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    return null
  }
  
  return {
    current: entry.count,
    violations: entry.violations,
    lastViolation: entry.lastViolation,
    resetTime: entry.resetTime
  }
}

/**
 * Clean up expired entries (should be called periodically)
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now()
  let cleaned = 0
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }
  
  return cleaned
}

/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Shared documents - more restrictive
  SHARED_DOCUMENTS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (ip: string) => `shared_docs:${ip}`
  },
  
  // Share link generation - very restrictive
  SHARE_LINK_GENERATION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (ip: string) => `share_gen:${ip}`
  },
  
  // General API - less restrictive
  GENERAL_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (ip: string, path?: string) => `api:${ip}${path ? `:${path.split('/')[1]}` : ''}`
  }
} as const

/**
 * Middleware helper for Next.js API routes
 */
export function createRateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  return (req: Request): RateLimitResult => {
    // Extract IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    
    // Extract path for logging
    const url = new URL(req.url)
    const path = url.pathname
    
    return checkRateLimit(ip, config, path)
  }
}

/**
 * Initialize periodic cleanup of expired rate limit entries
 * Call this once when your application starts
 */
export function initRateLimitCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    const cleaned = cleanupExpiredEntries()
    if (cleaned > 0) {
      console.log(`[RATE_LIMIT_CLEANUP] Cleaned up ${cleaned} expired entries`)
    }
  }, intervalMs)
}

/**
 * Get all rate limit statistics (for monitoring/debugging)
 */
export function getAllRateLimitStats(): Array<{
  key: string
  current: number
  violations: number
  lastViolation?: number
  resetTime: number
}> {
  const stats: Array<{
    key: string
    current: number
    violations: number
    lastViolation?: number
    resetTime: number
  }> = []
  
  for (const [key, entry] of rateLimitStore.entries()) {
    stats.push({
      key,
      current: entry.count,
      violations: entry.violations,
      lastViolation: entry.lastViolation,
      resetTime: entry.resetTime
    })
  }
  
  return stats
}