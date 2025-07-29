/**
 * Comprehensive audit logging utility for shareable document activities
 */

import { prisma } from "@/lib/db"

// Audit log types for shareable documents
export const AUDIT_LOG_TYPES = {
  // Share link management
  SHARE_LINK_GENERATED: 'SHARE_LINK_GENERATED',
  SHARE_LINK_REVOKED: 'SHARE_LINK_REVOKED',
  SHARE_LINK_EXPIRED: 'SHARE_LINK_EXPIRED',
  
  // Document access
  SHARED_DOCUMENT_ACCESSED: 'SHARED_DOCUMENT_ACCESSED',
  SHARED_DOCUMENT_ACCESS_DENIED: 'SHARED_DOCUMENT_ACCESS_DENIED',
  
  // Security events
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  
  // System events
  SHARE_LINK_CLEANUP: 'SHARE_LINK_CLEANUP'
} as const

export type AuditLogType = typeof AUDIT_LOG_TYPES[keyof typeof AUDIT_LOG_TYPES]

interface BaseAuditLogData {
  ip?: string
  userAgent?: string
  timestamp?: Date
  additionalInfo?: Record<string, any>
}

interface ShareLinkGeneratedData extends BaseAuditLogData {
  documentType: string
  documentId: string
  shareableLink: {
    id: string
    token: string
    expiresAt: Date
  }
}

interface ShareLinkRevokedData extends BaseAuditLogData {
  shareableLinkId: string
  documentType: string
  documentId: string
  reason?: string
}

interface DocumentAccessedData extends BaseAuditLogData {
  shareableLinkId: string
  documentType: string
  documentId: string
  accessCount: number
  success: boolean
}

interface DocumentAccessDeniedData extends BaseAuditLogData {
  token: string
  reason: 'expired' | 'revoked' | 'not-found' | 'rate-limited'
  documentType?: string
  documentId?: string
}

interface RateLimitExceededData extends BaseAuditLogData {
  endpoint: string
  limit: number
  windowMs: number
  violations: number
}

interface SuspiciousActivityData extends BaseAuditLogData {
  activityType: string
  details: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high'
}

interface ShareLinkCleanupData extends BaseAuditLogData {
  cleanedCount: number
  expiredLinks: Array<{
    id: string
    documentType: string
    createdAt: Date
    expiresAt: Date
  }>
}

/**
 * Log share link generation
 */
export async function logShareLinkGenerated(
  userId: string,
  data: ShareLinkGeneratedData
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        type: AUDIT_LOG_TYPES.SHARE_LINK_GENERATED,
        userId,
        details: {
          documentType: data.documentType,
          documentId: data.documentId,
          shareableLink: {
            id: data.shareableLink.id,
            token: data.shareableLink.token.substring(0, 8) + '...', // Partial token for security
            expiresAt: data.shareableLink.expiresAt.toISOString()
          },
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: (data.timestamp || new Date()).toISOString(),
          ...data.additionalInfo
        }
      }
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to log share link generation:', error)
  }
}

/**
 * Log share link revocation
 */
export async function logShareLinkRevoked(
  userId: string,
  data: ShareLinkRevokedData
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        type: AUDIT_LOG_TYPES.SHARE_LINK_REVOKED,
        userId,
        details: {
          shareableLinkId: data.shareableLinkId,
          documentType: data.documentType,
          documentId: data.documentId,
          reason: data.reason,
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: (data.timestamp || new Date()).toISOString(),
          ...data.additionalInfo
        }
      }
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to log share link revocation:', error)
  }
}

/**
 * Get or create system user for audit logging
 */
async function getSystemUserId(): Promise<string> {
  try {
    // Try to find existing system user
    let systemUser = await prisma.user.findFirst({
      where: {
        email: 'system@xgenmanufacturing.com'
      }
    })

    // Create system user if it doesn't exist
    if (!systemUser) {
      // Generate a secure random password for the system user (it won't be used for login)
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('system-user-' + Date.now(), 12)
      
      systemUser = await prisma.user.create({
        data: {
          email: 'system@xgenmanufacturing.com',
          firstName: 'System',
          lastName: 'User',
          role: 'ADMIN', // Assuming ADMIN role exists
          status: 'ACTIVE',
          password: hashedPassword
        }
      })
    }

    return systemUser.id
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to get/create system user:', error)
    // Return a fallback - this should be handled better in production
    return 'system-fallback'
  }
}

/**
 * Log document access (both successful and failed)
 */
export async function logDocumentAccessed(
  data: DocumentAccessedData
): Promise<void> {
  try {
    const systemUserId = await getSystemUserId()
    
    await prisma.activityLog.create({
      data: {
        type: AUDIT_LOG_TYPES.SHARED_DOCUMENT_ACCESSED,
        userId: systemUserId,
        details: {
          shareableLinkId: data.shareableLinkId,
          documentType: data.documentType,
          documentId: data.documentId,
          accessCount: data.accessCount,
          success: data.success,
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: (data.timestamp || new Date()).toISOString(),
          ...data.additionalInfo
        }
      }
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to log document access:', error)
  }
}

/**
 * Log document access denied
 */
export async function logDocumentAccessDenied(
  data: DocumentAccessDeniedData
): Promise<void> {
  try {
    const systemUserId = await getSystemUserId()
    
    await prisma.activityLog.create({
      data: {
        type: AUDIT_LOG_TYPES.SHARED_DOCUMENT_ACCESS_DENIED,
        userId: systemUserId,
        details: {
          token: data.token.substring(0, 8) + '...', // Partial token for security
          reason: data.reason,
          documentType: data.documentType,
          documentId: data.documentId,
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: (data.timestamp || new Date()).toISOString(),
          ...data.additionalInfo
        }
      }
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to log document access denied:', error)
  }
}

/**
 * Log rate limit exceeded events
 */
export async function logRateLimitExceeded(
  data: RateLimitExceededData
): Promise<void> {
  try {
    const systemUserId = await getSystemUserId()
    
    await prisma.activityLog.create({
      data: {
        type: AUDIT_LOG_TYPES.RATE_LIMIT_EXCEEDED,
        userId: systemUserId,
        details: {
          endpoint: data.endpoint,
          limit: data.limit,
          windowMs: data.windowMs,
          violations: data.violations,
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: (data.timestamp || new Date()).toISOString(),
          ...data.additionalInfo
        }
      }
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to log rate limit exceeded:', error)
  }
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  data: SuspiciousActivityData
): Promise<void> {
  try {
    const systemUserId = await getSystemUserId()
    
    await prisma.activityLog.create({
      data: {
        type: AUDIT_LOG_TYPES.SUSPICIOUS_ACTIVITY,
        userId: systemUserId,
        details: {
          activityType: data.activityType,
          riskLevel: data.riskLevel,
          details: data.details,
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: (data.timestamp || new Date()).toISOString(),
          ...data.additionalInfo
        }
      }
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to log suspicious activity:', error)
  }
}

/**
 * Log share link cleanup operations
 */
export async function logShareLinkCleanup(
  userId: string,
  data: ShareLinkCleanupData
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        type: AUDIT_LOG_TYPES.SHARE_LINK_CLEANUP,
        userId,
        details: {
          cleanedCount: data.cleanedCount,
          expiredLinks: data.expiredLinks.map(link => ({
            id: link.id,
            documentType: link.documentType,
            createdAt: link.createdAt.toISOString(),
            expiresAt: link.expiresAt.toISOString()
          })),
          timestamp: (data.timestamp || new Date()).toISOString(),
          ...data.additionalInfo
        }
      }
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to log share link cleanup:', error)
  }
}

/**
 * Get audit logs for a specific document
 */
export async function getDocumentAuditLogs(
  documentType: string,
  documentId: string,
  limit: number = 50
) {
  try {
    return await prisma.activityLog.findMany({
      where: {
        type: {
          in: [
            AUDIT_LOG_TYPES.SHARE_LINK_GENERATED,
            AUDIT_LOG_TYPES.SHARE_LINK_REVOKED,
            AUDIT_LOG_TYPES.SHARED_DOCUMENT_ACCESSED,
            AUDIT_LOG_TYPES.SHARED_DOCUMENT_ACCESS_DENIED
          ]
        },
        OR: [
          {
            details: {
              path: ['documentType'],
              equals: documentType
            }
          },
          {
            details: {
              path: ['documentId'],
              equals: documentId
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to get document audit logs:', error)
    return []
  }
}

/**
 * Get security-related audit logs
 */
export async function getSecurityAuditLogs(
  limit: number = 100,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const whereClause: any = {
      type: {
        in: [
          AUDIT_LOG_TYPES.RATE_LIMIT_EXCEEDED,
          AUDIT_LOG_TYPES.SUSPICIOUS_ACTIVITY,
          AUDIT_LOG_TYPES.SHARED_DOCUMENT_ACCESS_DENIED
        ]
      }
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = startDate
      if (endDate) whereClause.createdAt.lte = endDate
    }

    return await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to get security audit logs:', error)
    return []
  }
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(ip: string): Promise<{
  isSuspicious: boolean
  riskLevel: 'low' | 'medium' | 'high'
  reasons: string[]
}> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get recent activity for this IP
    const recentLogs = await prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: last24Hours
        },
        details: {
          path: ['ip'],
          equals: ip
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const reasons: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    // Check for excessive rate limiting
    const rateLimitViolations = recentLogs.filter(log => 
      log.type === AUDIT_LOG_TYPES.RATE_LIMIT_EXCEEDED
    ).length

    if (rateLimitViolations > 10) {
      reasons.push('Excessive rate limit violations')
      riskLevel = 'high'
    } else if (rateLimitViolations > 5) {
      reasons.push('Multiple rate limit violations')
      riskLevel = 'medium'
    }

    // Check for excessive access denials
    const accessDenials = recentLogs.filter(log => 
      log.type === AUDIT_LOG_TYPES.SHARED_DOCUMENT_ACCESS_DENIED
    ).length

    if (accessDenials > 20) {
      reasons.push('Excessive access denials')
      riskLevel = 'high'
    } else if (accessDenials > 10) {
      reasons.push('Multiple access denials')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Check for rapid successive requests
    const accessLogs = recentLogs.filter(log => 
      log.type === AUDIT_LOG_TYPES.SHARED_DOCUMENT_ACCESSED
    )

    if (accessLogs.length > 100) {
      reasons.push('Excessive document access attempts')
      riskLevel = 'high'
    }

    return {
      isSuspicious: reasons.length > 0,
      riskLevel,
      reasons
    }
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to detect suspicious activity:', error)
    return {
      isSuspicious: false,
      riskLevel: 'low',
      reasons: []
    }
  }
}