/**
 * Tests for shareable links cleanup utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import {
  cleanupExpiredShareableLinks,
  runManualCleanup,
  hardDeleteOldRevokedLinks,
  getShareableLinkStats,
  scheduleShareableLinkCleanup
} from '@/lib/utils/share-link-cleanup';

// Mock the configuration
vi.mock('@/lib/config', () => ({
  getShareableLinksConfig: () => ({
    cleanupIntervalHours: 24,
  }),
  isAutoCleanupEnabled: () => true,
  CLEANUP_CONFIG: {
    BATCH_SIZE: 10,
    MAX_RETRIES: 3,
    INTERVAL_MS: 24 * 60 * 60 * 1000,
  },
}));

// Mock the audit logger
vi.mock('@/lib/utils/audit-logger', () => ({
  logShareLinkCleanup: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    shareableLink: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Share Link Cleanup Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cleanupExpiredShareableLinks', () => {
    it('should return empty result when no expired links found', async () => {
      // Mock empty result
      (prisma.shareableLink.findMany as any).mockResolvedValue([]);

      const result = await cleanupExpiredShareableLinks('test-user');

      expect(result.cleanedCount).toBe(0);
      expect(result.expiredLinks).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should clean up expired links successfully', async () => {
      const mockExpiredLinks = [
        {
          id: 'link1',
          documentType: 'BILLING_STATEMENT',
          documentId: 'doc1',
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-31'),
          token: 'token1',
        },
        {
          id: 'link2',
          documentType: 'SALES_INVOICE',
          documentId: 'doc2',
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-31'),
          token: 'token2',
        },
      ];

      (prisma.shareableLink.findMany as any).mockResolvedValue(mockExpiredLinks);
      (prisma.shareableLink.updateMany as any).mockResolvedValue({ count: 2 });

      const result = await cleanupExpiredShareableLinks('test-user');

      expect(result.cleanedCount).toBe(2);
      expect(result.expiredLinks).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(prisma.shareableLink.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['link1', 'link2'],
          },
        },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date),
        },
      });
    });

    it('should handle dry run correctly', async () => {
      const mockExpiredLinks = [
        {
          id: 'link1',
          documentType: 'BILLING_STATEMENT',
          documentId: 'doc1',
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-31'),
          token: 'token1',
        },
      ];

      (prisma.shareableLink.findMany as any).mockResolvedValue(mockExpiredLinks);

      const result = await cleanupExpiredShareableLinks('test-user', true);

      expect(result.cleanedCount).toBe(0);
      expect(result.expiredLinks).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.shareableLink.updateMany).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (prisma.shareableLink.findMany as any).mockRejectedValue(error);

      const result = await cleanupExpiredShareableLinks('test-user');

      expect(result.cleanedCount).toBe(0);
      expect(result.expiredLinks).toHaveLength(0);
      expect(result.errors).toContain('Database connection failed');
    });
  });

  describe('getShareableLinkStats', () => {
    it('should return correct statistics', async () => {
      // Mock the count queries
      (prisma.shareableLink.count as any)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75)  // active
        .mockResolvedValueOnce(15)  // expired
        .mockResolvedValueOnce(10)  // revoked
        .mockResolvedValueOnce(5);  // expiring soon

      const stats = await getShareableLinkStats();

      expect(stats).toEqual({
        total: 100,
        active: 75,
        expired: 15,
        revoked: 10,
        expiringSoon: 5,
      });
    });

    it('should handle database errors and return zero stats', async () => {
      (prisma.shareableLink.count as any).mockRejectedValue(new Error('DB Error'));

      const stats = await getShareableLinkStats();

      expect(stats).toEqual({
        total: 0,
        active: 0,
        expired: 0,
        revoked: 0,
        expiringSoon: 0,
      });
    });
  });

  describe('runManualCleanup', () => {
    it('should run standard cleanup when no options provided', async () => {
      (prisma.shareableLink.findMany as any).mockResolvedValue([]);

      const result = await runManualCleanup('test-user');

      expect(result.cleanedCount).toBe(0);
      expect(result.expiredLinks).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should clean up links older than specified days', async () => {
      const mockOldLinks = [
        {
          id: 'old-link1',
          documentType: 'BILLING_STATEMENT',
          documentId: 'doc1',
          createdAt: new Date('2023-01-01'),
          expiresAt: new Date('2023-01-31'),
          isRevoked: false,
        },
      ];

      (prisma.shareableLink.findMany as any).mockResolvedValue(mockOldLinks);
      (prisma.shareableLink.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await runManualCleanup('test-user', {
        olderThanDays: 365,
      });

      expect(result.cleanedCount).toBe(1);
      expect(result.expiredLinks).toHaveLength(1);
      expect(prisma.shareableLink.updateMany).toHaveBeenCalled();
    });

    it('should perform hard delete when requested', async () => {
      const mockOldLinks = [
        {
          id: 'old-link1',
          documentType: 'BILLING_STATEMENT',
          documentId: 'doc1',
          createdAt: new Date('2023-01-01'),
          expiresAt: new Date('2023-01-31'),
          isRevoked: true,
        },
      ];

      (prisma.shareableLink.findMany as any).mockResolvedValue(mockOldLinks);
      (prisma.shareableLink.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await runManualCleanup('test-user', {
        olderThanDays: 365,
        hardDelete: true,
      });

      expect(result.cleanedCount).toBe(1);
      expect(prisma.shareableLink.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['old-link1'],
          },
        },
      });
    });
  });

  describe('hardDeleteOldRevokedLinks', () => {
    it('should hard delete old revoked links', async () => {
      const mockOldRevokedLinks = [
        {
          id: 'revoked-link1',
          documentType: 'BILLING_STATEMENT',
          documentId: 'doc1',
          createdAt: new Date('2023-01-01'),
          expiresAt: new Date('2023-01-31'),
          revokedAt: new Date('2023-02-01'),
        },
      ];

      (prisma.shareableLink.findMany as any).mockResolvedValue(mockOldRevokedLinks);
      (prisma.shareableLink.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await hardDeleteOldRevokedLinks('test-user', 90);

      expect(result.cleanedCount).toBe(1);
      expect(result.expiredLinks).toHaveLength(1);
      expect(prisma.shareableLink.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['revoked-link1'],
          },
        },
      });
    });

    it('should return empty result when no old revoked links found', async () => {
      (prisma.shareableLink.findMany as any).mockResolvedValue([]);

      const result = await hardDeleteOldRevokedLinks('test-user', 90);

      expect(result.cleanedCount).toBe(0);
      expect(result.expiredLinks).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(prisma.shareableLink.deleteMany).not.toHaveBeenCalled();
    });

    it('should handle dry run for hard delete', async () => {
      const mockOldRevokedLinks = [
        {
          id: 'revoked-link1',
          documentType: 'BILLING_STATEMENT',
          documentId: 'doc1',
          createdAt: new Date('2023-01-01'),
          expiresAt: new Date('2023-01-31'),
          revokedAt: new Date('2023-02-01'),
        },
      ];

      (prisma.shareableLink.findMany as any).mockResolvedValue(mockOldRevokedLinks);

      const result = await hardDeleteOldRevokedLinks('test-user', 90, true);

      expect(result.cleanedCount).toBe(0);
      expect(result.expiredLinks).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.shareableLink.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('scheduleShareableLinkCleanup', () => {
    it('should return null when auto-cleanup is disabled', async () => {
      // Mock auto-cleanup as disabled by re-importing with different mock
      vi.resetModules();
      vi.doMock('@/lib/config', () => ({
        getShareableLinksConfig: () => ({
          cleanupIntervalHours: 24,
        }),
        isAutoCleanupEnabled: () => false,
        CLEANUP_CONFIG: {
          INTERVAL_MS: 24 * 60 * 60 * 1000,
        },
      }));

      const { scheduleShareableLinkCleanup } = await import('@/lib/utils/share-link-cleanup');
      const interval = scheduleShareableLinkCleanup('test-user');

      expect(interval).toBeNull();
    });

    it('should schedule cleanup when auto-cleanup is enabled', async () => {
      // Mock setInterval
      const mockSetInterval = vi.fn().mockReturnValue('mock-interval');
      global.setInterval = mockSetInterval;

      const interval = scheduleShareableLinkCleanup('test-user');

      expect(interval).toBe('mock-interval');
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        24 * 60 * 60 * 1000
      );
    });
  });
});