/**
 * Tests for startup cleanup utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeShareableLinkCleanup,
  stopShareableLinkCleanup,
  getCleanupSchedulerStatus,
  restartShareableLinkCleanup
} from '@/lib/utils/startup-cleanup';

// Mock the configuration
vi.mock('@/lib/config', () => ({
  getShareableLinksConfig: () => ({
    cleanupIntervalHours: 24,
  }),
  isAutoCleanupEnabled: vi.fn(() => true),
}));

// Mock the cleanup scheduler
vi.mock('@/lib/utils/share-link-cleanup', () => ({
  scheduleShareableLinkCleanup: vi.fn(() => 'mock-interval'),
}));

describe('Startup Cleanup Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process listeners
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('exit');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    stopShareableLinkCleanup();
  });

  describe('initializeShareableLinkCleanup', () => {
    it('should initialize cleanup scheduler when auto-cleanup is enabled', async () => {
      const { scheduleShareableLinkCleanup } = await import('@/lib/utils/share-link-cleanup');
      
      initializeShareableLinkCleanup();

      expect(scheduleShareableLinkCleanup).toHaveBeenCalledWith('system');
    });

    it('should not initialize when auto-cleanup is disabled', async () => {
      // Mock auto-cleanup as disabled
      const { isAutoCleanupEnabled } = await import('@/lib/config');
      (isAutoCleanupEnabled as any).mockReturnValue(false);

      const { scheduleShareableLinkCleanup } = await import('@/lib/utils/share-link-cleanup');
      
      initializeShareableLinkCleanup();

      expect(scheduleShareableLinkCleanup).not.toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock scheduler to throw error
      const { scheduleShareableLinkCleanup } = await import('@/lib/utils/share-link-cleanup');
      (scheduleShareableLinkCleanup as any).mockImplementation(() => {
        throw new Error('Scheduler error');
      });

      // Mock console.error to verify error handling
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      initializeShareableLinkCleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[STARTUP] ❌ Failed to initialize shareable links cleanup:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should register process event listeners', () => {
      const processOnSpy = vi.spyOn(process, 'on');

      initializeShareableLinkCleanup();

      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', stopShareableLinkCleanup);
      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', stopShareableLinkCleanup);
      expect(processOnSpy).toHaveBeenCalledWith('exit', stopShareableLinkCleanup);
    });
  });

  describe('getCleanupSchedulerStatus', () => {
    it('should return correct status when scheduler is not running', () => {
      const status = getCleanupSchedulerStatus();

      expect(status).toEqual({
        isRunning: false,
        isEnabled: true,
        intervalHours: 24,
      });
    });

    it('should return correct status when scheduler is running', () => {
      // Initialize to start the scheduler
      initializeShareableLinkCleanup();

      const status = getCleanupSchedulerStatus();

      expect(status).toEqual({
        isRunning: true,
        isEnabled: true,
        intervalHours: 24,
      });
    });

    it('should reflect disabled state correctly', async () => {
      const { isAutoCleanupEnabled } = await import('@/lib/config');
      (isAutoCleanupEnabled as any).mockReturnValue(false);

      const status = getCleanupSchedulerStatus();

      expect(status.isEnabled).toBe(false);
    });
  });

  describe('stopShareableLinkCleanup', () => {
    it('should stop running scheduler', () => {
      // Mock clearInterval
      const mockClearInterval = vi.fn();
      global.clearInterval = mockClearInterval;

      // Initialize first
      initializeShareableLinkCleanup();

      // Then stop
      stopShareableLinkCleanup();

      expect(mockClearInterval).toHaveBeenCalledWith('mock-interval');
    });

    it('should handle stopping when no scheduler is running', () => {
      const mockClearInterval = vi.fn();
      global.clearInterval = mockClearInterval;

      // Stop without initializing
      stopShareableLinkCleanup();

      expect(mockClearInterval).not.toHaveBeenCalled();
    });
  });

  describe('restartShareableLinkCleanup', () => {
    it('should restart the scheduler', async () => {
      // Mock setTimeout
      const mockSetTimeout = vi.fn((callback) => {
        callback(); // Execute immediately for testing
        return 'timeout-id';
      });
      global.setTimeout = mockSetTimeout;

      const { scheduleShareableLinkCleanup } = await import('@/lib/utils/share-link-cleanup');

      // Initialize first
      initializeShareableLinkCleanup();

      // Clear the mock to track restart calls
      vi.clearAllMocks();

      // Restart
      restartShareableLinkCleanup();

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(scheduleShareableLinkCleanup).toHaveBeenCalledWith('system');
    });
  });
});