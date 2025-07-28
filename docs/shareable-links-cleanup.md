# Shareable Links Cleanup System

This document describes the cleanup system for expired shareable document links in the XGen MRP system.

## Overview

The cleanup system provides automated and manual methods to clean up expired shareable links, helping maintain database performance and security by removing outdated access tokens.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Cleanup Configuration
SHAREABLE_LINKS_CLEANUP_INTERVAL_HOURS=24
ENABLE_AUTO_CLEANUP=true

# Other shareable links settings
SHAREABLE_LINKS_DEFAULT_EXPIRY_DAYS=30
SHAREABLE_LINKS_MAX_PER_DOCUMENT=5
```

### Configuration Options

- `SHAREABLE_LINKS_CLEANUP_INTERVAL_HOURS`: How often to run automatic cleanup (default: 24 hours)
- `ENABLE_AUTO_CLEANUP`: Enable/disable automatic cleanup (default: true)
- `SHAREABLE_LINKS_DEFAULT_EXPIRY_DAYS`: Default expiration period for new links (default: 30 days)

## Automatic Cleanup

### Initialization

The cleanup scheduler is automatically initialized when the application starts:

```typescript
import { initializeShareableLinkCleanup } from '@/lib/utils/startup-cleanup';

// Call this in your application startup
initializeShareableLinkCleanup();
```

### How It Works

1. **Scheduled Execution**: Runs every N hours (configurable)
2. **Batch Processing**: Processes links in batches to avoid memory issues
3. **Soft Delete**: Marks expired links as revoked instead of hard deletion
4. **Audit Logging**: Logs all cleanup operations for audit trails
5. **Error Handling**: Includes retry logic and error recovery

## Manual Cleanup

### CLI Commands

The system provides several npm scripts for manual cleanup:

```bash
# Show statistics about shareable links
npm run cleanup:links:stats

# Run cleanup (dry run first to see what would be cleaned)
npm run cleanup:links:dry

# Actually run the cleanup
npm run cleanup:links

# Manual cleanup with custom options
npm run cleanup:links:manual -- --older-than 60 --dry-run

# Hard delete old revoked links (permanent removal)
npm run cleanup:links:hard-delete -- --older-than 90 --dry-run
```

### CLI Options

#### Basic Cleanup
```bash
npx tsx scripts/cleanup-shareable-links.ts cleanup [options]
```

Options:
- `--dry-run`: Show what would be cleaned without actually doing it
- `--user-id <userId>`: User ID for audit logging (default: 'system')

#### Manual Cleanup
```bash
npx tsx scripts/cleanup-shareable-links.ts manual [options]
```

Options:
- `--dry-run`: Preview mode
- `--older-than <days>`: Clean links older than specified days
- `--hard-delete`: Permanently delete instead of marking as revoked
- `--user-id <userId>`: User ID for audit logging

#### Statistics
```bash
npx tsx scripts/cleanup-shareable-links.ts stats
```

Shows:
- Total links
- Active links
- Expired links
- Revoked links
- Links expiring soon (within 7 days)

#### Hard Delete
```bash
npx tsx scripts/cleanup-shareable-links.ts hard-delete [options]
```

Options:
- `--dry-run`: Preview mode
- `--older-than <days>`: Delete revoked links older than specified days (default: 90)
- `--user-id <userId>`: User ID for audit logging

## Programmatic Usage

### Basic Cleanup

```typescript
import { cleanupExpiredShareableLinks } from '@/lib/utils/share-link-cleanup';

// Clean up expired links
const result = await cleanupExpiredShareableLinks('user-id');

console.log(`Cleaned up ${result.cleanedCount} expired links`);
console.log(`Found ${result.expiredLinks.length} total expired links`);

if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}
```

### Manual Cleanup with Options

```typescript
import { runManualCleanup } from '@/lib/utils/share-link-cleanup';

// Clean up links older than 60 days
const result = await runManualCleanup('user-id', {
  olderThanDays: 60,
  dryRun: false,
  hardDelete: false
});
```

### Get Statistics

```typescript
import { getShareableLinkStats } from '@/lib/utils/share-link-cleanup';

const stats = await getShareableLinkStats();
console.log('Link Statistics:', stats);
```

### Hard Delete Old Revoked Links

```typescript
import { hardDeleteOldRevokedLinks } from '@/lib/utils/share-link-cleanup';

// Permanently delete revoked links older than 90 days
const result = await hardDeleteOldRevokedLinks('user-id', 90, false);
```

## Scheduler Management

### Start/Stop Scheduler

```typescript
import { 
  initializeShareableLinkCleanup,
  stopShareableLinkCleanup,
  restartShareableLinkCleanup,
  getCleanupSchedulerStatus
} from '@/lib/utils/startup-cleanup';

// Initialize scheduler
initializeShareableLinkCleanup();

// Check status
const status = getCleanupSchedulerStatus();
console.log('Scheduler running:', status.isRunning);

// Restart scheduler (useful after configuration changes)
restartShareableLinkCleanup();

// Stop scheduler (for graceful shutdown)
stopShareableLinkCleanup();
```

## Cleanup Process

### Soft Delete (Default)

1. Finds expired links that are not already revoked
2. Marks them as `isRevoked: true` with `revokedAt` timestamp
3. Preserves data for audit purposes
4. Links become inaccessible but remain in database

### Hard Delete

1. Finds old revoked links (default: older than 90 days)
2. Permanently removes them from the database
3. Frees up database space
4. Cannot be undone

## Monitoring and Logging

### Audit Logs

All cleanup operations are logged with:
- User ID who initiated the cleanup
- Number of links cleaned
- Cleanup method (automated, manual, hard delete)
- Timestamp and additional metadata

### Console Logging

The system provides detailed console output:
- `[SHARE_LINK_CLEANUP]` prefix for cleanup operations
- `[STARTUP]` prefix for scheduler initialization
- `[SHUTDOWN]` prefix for graceful shutdown

### Error Handling

- Database connection errors are caught and logged
- Batch processing with retry logic
- Graceful degradation on partial failures
- Detailed error reporting in results

## Best Practices

### Regular Maintenance

1. **Monitor Statistics**: Check link statistics regularly
   ```bash
   npm run cleanup:links:stats
   ```

2. **Dry Run First**: Always test with `--dry-run` before actual cleanup
   ```bash
   npm run cleanup:links:dry
   ```

3. **Hard Delete Periodically**: Clean up very old revoked links
   ```bash
   npm run cleanup:links:hard-delete -- --older-than 180 --dry-run
   ```

### Configuration Recommendations

- **Development**: Short expiry (7-14 days), frequent cleanup (daily)
- **Production**: Longer expiry (30-90 days), less frequent cleanup (weekly)
- **High Volume**: Enable auto-cleanup, use smaller batch sizes

### Security Considerations

- Hard delete removes audit trail - use carefully
- Monitor cleanup logs for suspicious patterns
- Consider data retention policies
- Regular cleanup prevents token enumeration attacks

## Troubleshooting

### Common Issues

1. **Scheduler Not Starting**
   - Check `ENABLE_AUTO_CLEANUP` environment variable
   - Verify configuration is valid
   - Check application logs for errors

2. **Database Errors**
   - Verify database connection
   - Check Prisma schema is up to date
   - Monitor database performance during cleanup

3. **High Memory Usage**
   - Reduce `CLEANUP_CONFIG.BATCH_SIZE`
   - Increase cleanup frequency
   - Consider hard deleting old links

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will show configuration details and additional debug information.

## API Reference

See the TypeScript interfaces in the source code for detailed API documentation:

- `CleanupResult`: Return type for cleanup operations
- `ShareableLinkStats`: Statistics structure
- Configuration types in `@/lib/config`