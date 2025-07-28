/**
 * Utility for cleaning up expired shareable links with audit logging
 * Enhanced with configuration integration and robust error handling
 */

import { prisma } from "@/lib/db"
import { logShareLinkCleanup } from "./audit-logger"
import { 
  getShareableLinksConfig, 
  isAutoCleanupEnabled,
  CLEANUP_CONFIG 
} from "@/lib/config"

interface CleanupResult {
  cleanedCount: number
  expiredLinks: Array<{
    id: string
    documentType: string
    createdAt: Date
    expiresAt: Date
  }>
  errors: string[]
}

/**
 * Clean up expired shareable links with batch processing
 */
export async function cleanupExpiredShareableLinks(
  userId: string = 'system',
  dryRun: boolean = false
): Promise<CleanupResult> {
  const result: CleanupResult = {
    cleanedCount: 0,
    expiredLinks: [],
    errors: []
  }

  try {
    const now = new Date()
    const batchSize = CLEANUP_CONFIG.BATCH_SIZE
    let totalProcessed = 0
    let hasMore = true

    console.log(`[SHARE_LINK_CLEANUP] Starting cleanup with batch size: ${batchSize}`)

    while (hasMore) {
      // Find expired links in batches
      const expiredLinks = await prisma.shareableLink.findMany({
        where: {
          expiresAt: {
            lt: now
          },
          isRevoked: false // Only clean up non-revoked expired links
        },
        select: {
          id: true,
          documentType: true,
          documentId: true,
          createdAt: true,
          expiresAt: true,
          token: true
        },
        take: batchSize,
        skip: totalProcessed
      })

      if (expiredLinks.length === 0) {
        hasMore = false
        break
      }

      const batchExpiredLinks = expiredLinks.map(link => ({
        id: link.id,
        documentType: link.documentType,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt
      }))

      result.expiredLinks.push(...batchExpiredLinks)

      if (!dryRun) {
        // Process batch with retry logic
        let retryCount = 0
        let batchSuccess = false

        while (retryCount < CLEANUP_CONFIG.MAX_RETRIES && !batchSuccess) {
          try {
            // Mark expired links as revoked (soft delete approach)
            const updateResult = await prisma.shareableLink.updateMany({
              where: {
                id: {
                  in: expiredLinks.map(link => link.id)
                }
              },
              data: {
                isRevoked: true,
                revokedAt: now
              }
            })

            result.cleanedCount += updateResult.count
            batchSuccess = true

            console.log(`[SHARE_LINK_CLEANUP] Processed batch: ${updateResult.count} links cleaned`)

          } catch (batchError) {
            retryCount++
            const errorMessage = batchError instanceof Error ? batchError.message : 'Unknown batch error'
            
            if (retryCount >= CLEANUP_CONFIG.MAX_RETRIES) {
              result.errors.push(`Batch failed after ${CLEANUP_CONFIG.MAX_RETRIES} retries: ${errorMessage}`)
              console.error(`[SHARE_LINK_CLEANUP] Batch failed after retries:`, batchError)
            } else {
              console.warn(`[SHARE_LINK_CLEANUP] Batch retry ${retryCount}/${CLEANUP_CONFIG.MAX_RETRIES}:`, errorMessage)
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
            }
          }
        }
      }

      totalProcessed += expiredLinks.length

      // Check if we have more records
      if (expiredLinks.length < batchSize) {
        hasMore = false
      }
    }

    if (result.expiredLinks.length === 0) {
      console.log('[SHARE_LINK_CLEANUP] No expired links found')
      return result
    }

    if (dryRun) {
      console.log(`[SHARE_LINK_CLEANUP] DRY RUN: Would clean up ${result.expiredLinks.length} expired links`)
      return result
    }

    // Log the cleanup operation
    if (result.cleanedCount > 0) {
      await logShareLinkCleanup(userId, {
        cleanedCount: result.cleanedCount,
        expiredLinks: result.expiredLinks,
        additionalInfo: {
          cleanupDate: now.toISOString(),
          method: 'automated_cleanup',
          batchSize,
          totalBatches: Math.ceil(result.expiredLinks.length / batchSize)
        }
      })

      console.log(`[SHARE_LINK_CLEANUP] Successfully cleaned up ${result.cleanedCount} expired links in ${Math.ceil(result.expiredLinks.length / batchSize)} batches`)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(errorMessage)
    console.error('[SHARE_LINK_CLEANUP] Error during cleanup:', error)
  }

  return result
}

/**
 * Get statistics about shareable links
 */
export async function getShareableLinkStats(): Promise<{
  total: number
  active: number
  expired: number
  revoked: number
  expiringSoon: number // Expiring within 7 days
}> {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [total, active, expired, revoked, expiringSoon] = await Promise.all([
      // Total links
      prisma.shareableLink.count(),
      
      // Active links (not revoked and not expired)
      prisma.shareableLink.count({
        where: {
          isRevoked: false,
          expiresAt: {
            gt: now
          }
        }
      }),
      
      // Expired links (not revoked but past expiration)
      prisma.shareableLink.count({
        where: {
          isRevoked: false,
          expiresAt: {
            lt: now
          }
        }
      }),
      
      // Revoked links
      prisma.shareableLink.count({
        where: {
          isRevoked: true
        }
      }),
      
      // Expiring soon (within 7 days)
      prisma.shareableLink.count({
        where: {
          isRevoked: false,
          expiresAt: {
            gt: now,
            lt: sevenDaysFromNow
          }
        }
      })
    ])

    return {
      total,
      active,
      expired,
      revoked,
      expiringSoon
    }
  } catch (error) {
    console.error('[SHARE_LINK_STATS] Error getting stats:', error)
    return {
      total: 0,
      active: 0,
      expired: 0,
      revoked: 0,
      expiringSoon: 0
    }
  }
}

/**
 * Schedule periodic cleanup (call this once when your application starts)
 * Uses configuration settings for interval and auto-cleanup enablement
 */
export function scheduleShareableLinkCleanup(
  userId: string = 'system'
): NodeJS.Timeout | null {
  // Check if auto-cleanup is enabled
  if (!isAutoCleanupEnabled()) {
    console.log('[SHARE_LINK_CLEANUP] Auto-cleanup is disabled via configuration')
    return null
  }

  const config = getShareableLinksConfig()
  const intervalMs = CLEANUP_CONFIG.INTERVAL_MS
  
  console.log(`[SHARE_LINK_CLEANUP] Scheduling cleanup every ${config.cleanupIntervalHours} hours`)
  
  return setInterval(async () => {
    console.log('[SHARE_LINK_CLEANUP] Running scheduled cleanup...')
    
    try {
      const result = await cleanupExpiredShareableLinks(userId)
      
      if (result.cleanedCount > 0) {
        console.log(`[SHARE_LINK_CLEANUP] Scheduled cleanup completed: ${result.cleanedCount} links cleaned`)
      } else {
        console.log('[SHARE_LINK_CLEANUP] Scheduled cleanup completed: no expired links found')
      }
      
      if (result.errors.length > 0) {
        console.error('[SHARE_LINK_CLEANUP] Scheduled cleanup had errors:', result.errors)
      }
    } catch (error) {
      console.error('[SHARE_LINK_CLEANUP] Scheduled cleanup failed:', error)
    }
  }, intervalMs)
}

/**
 * Manual cleanup command (for scripts or admin interface)
 */
export async function runManualCleanup(
  userId: string,
  options: {
    dryRun?: boolean
    olderThanDays?: number
    hardDelete?: boolean
  } = {}
): Promise<CleanupResult> {
  const { dryRun = false, olderThanDays, hardDelete = false } = options
  
  console.log(`[SHARE_LINK_CLEANUP] Running manual cleanup${dryRun ? ' (DRY RUN)' : ''}${hardDelete ? ' with HARD DELETE' : ''}`)
  
  if (olderThanDays) {
    // Custom cleanup for links older than specified days
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    
    const expiredLinks = await prisma.shareableLink.findMany({
      where: {
        expiresAt: {
          lt: cutoffDate
        },
        ...(hardDelete ? {} : { isRevoked: false }) // For hard delete, include already revoked links
      },
      select: {
        id: true,
        documentType: true,
        documentId: true,
        createdAt: true,
        expiresAt: true,
        isRevoked: true
      }
    })

    if (!dryRun && expiredLinks.length > 0) {
      if (hardDelete) {
        // Permanently delete the links
        await prisma.shareableLink.deleteMany({
          where: {
            id: {
              in: expiredLinks.map(link => link.id)
            }
          }
        })
      } else {
        // Soft delete (mark as revoked)
        await prisma.shareableLink.updateMany({
          where: {
            id: {
              in: expiredLinks.map(link => link.id)
            }
          },
          data: {
            isRevoked: true,
            revokedAt: new Date()
          }
        })
      }

      await logShareLinkCleanup(userId, {
        cleanedCount: expiredLinks.length,
        expiredLinks: expiredLinks.map(link => ({
          id: link.id,
          documentType: link.documentType,
          createdAt: link.createdAt,
          expiresAt: link.expiresAt
        })),
        additionalInfo: {
          cleanupDate: new Date().toISOString(),
          method: 'manual_cleanup',
          olderThanDays,
          hardDelete
        }
      })
    }

    return {
      cleanedCount: dryRun ? 0 : expiredLinks.length,
      expiredLinks: expiredLinks.map(link => ({
        id: link.id,
        documentType: link.documentType,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt
      })),
      errors: []
    }
  }
  
  return cleanupExpiredShareableLinks(userId, dryRun)
}

/**
 * Hard delete very old revoked links (for database maintenance)
 * This permanently removes links that have been revoked for a long time
 */
export async function hardDeleteOldRevokedLinks(
  userId: string,
  olderThanDays: number = 90,
  dryRun: boolean = false
): Promise<CleanupResult> {
  const result: CleanupResult = {
    cleanedCount: 0,
    expiredLinks: [],
    errors: []
  }

  try {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    
    console.log(`[SHARE_LINK_CLEANUP] Hard delete for revoked links older than ${olderThanDays} days${dryRun ? ' (DRY RUN)' : ''}`)

    // Find old revoked links
    const oldRevokedLinks = await prisma.shareableLink.findMany({
      where: {
        isRevoked: true,
        revokedAt: {
          lt: cutoffDate
        }
      },
      select: {
        id: true,
        documentType: true,
        documentId: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true
      }
    })

    if (oldRevokedLinks.length === 0) {
      console.log('[SHARE_LINK_CLEANUP] No old revoked links found for hard deletion')
      return result
    }

    result.expiredLinks = oldRevokedLinks.map(link => ({
      id: link.id,
      documentType: link.documentType,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt
    }))

    if (dryRun) {
      console.log(`[SHARE_LINK_CLEANUP] DRY RUN: Would hard delete ${oldRevokedLinks.length} old revoked links`)
      return result
    }

    // Permanently delete the links
    const deleteResult = await prisma.shareableLink.deleteMany({
      where: {
        id: {
          in: oldRevokedLinks.map(link => link.id)
        }
      }
    })

    result.cleanedCount = deleteResult.count

    // Log the hard delete operation
    await logShareLinkCleanup(userId, {
      cleanedCount: result.cleanedCount,
      expiredLinks: result.expiredLinks,
      additionalInfo: {
        cleanupDate: new Date().toISOString(),
        method: 'hard_delete_old_revoked',
        olderThanDays,
        hardDelete: true
      }
    })

    console.log(`[SHARE_LINK_CLEANUP] Successfully hard deleted ${result.cleanedCount} old revoked links`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(errorMessage)
    console.error('[SHARE_LINK_CLEANUP] Error during hard delete:', error)
  }

  return result
}