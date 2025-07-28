/**
 * Startup initialization for shareable links cleanup
 * This should be called when the application starts
 */

import { scheduleShareableLinkCleanup } from './share-link-cleanup';
import { isAutoCleanupEnabled, getShareableLinksConfig } from '@/lib/config';

// Global reference to the cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the cleanup scheduler on application startup
 */
export function initializeShareableLinkCleanup(): void {
  try {
    // Check if auto-cleanup is enabled
    if (!isAutoCleanupEnabled()) {
      console.log('[STARTUP] Shareable links auto-cleanup is disabled');
      return;
    }

    const config = getShareableLinksConfig();
    
    console.log(`[STARTUP] Initializing shareable links cleanup scheduler (interval: ${config.cleanupIntervalHours}h)`);
    
    // Schedule the cleanup
    cleanupInterval = scheduleShareableLinkCleanup('system');
    
    if (cleanupInterval) {
      console.log('[STARTUP] ✅ Shareable links cleanup scheduler started successfully');
      
      // Handle graceful shutdown
      process.on('SIGTERM', stopShareableLinkCleanup);
      process.on('SIGINT', stopShareableLinkCleanup);
      process.on('exit', stopShareableLinkCleanup);
    } else {
      console.log('[STARTUP] ⚠️  Shareable links cleanup scheduler not started (disabled via config)');
    }
    
  } catch (error) {
    console.error('[STARTUP] ❌ Failed to initialize shareable links cleanup:', error);
  }
}

/**
 * Stop the cleanup scheduler (for graceful shutdown)
 */
export function stopShareableLinkCleanup(): void {
  if (cleanupInterval) {
    console.log('[SHUTDOWN] Stopping shareable links cleanup scheduler...');
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[SHUTDOWN] ✅ Shareable links cleanup scheduler stopped');
  }
}

/**
 * Get the current cleanup scheduler status
 */
export function getCleanupSchedulerStatus(): {
  isRunning: boolean;
  isEnabled: boolean;
  intervalHours: number;
} {
  const config = getShareableLinksConfig();
  
  return {
    isRunning: cleanupInterval !== null,
    isEnabled: isAutoCleanupEnabled(),
    intervalHours: config.cleanupIntervalHours,
  };
}

/**
 * Restart the cleanup scheduler (useful for configuration changes)
 */
export function restartShareableLinkCleanup(): void {
  console.log('[RESTART] Restarting shareable links cleanup scheduler...');
  
  stopShareableLinkCleanup();
  
  // Small delay to ensure cleanup
  setTimeout(() => {
    initializeShareableLinkCleanup();
  }, 1000);
}