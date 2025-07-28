#!/usr/bin/env tsx
/**
 * CLI script for cleaning up expired shareable links
 * Usage: npx tsx scripts/cleanup-shareable-links.ts [options]
 */

import { Command } from 'commander';
import {
  cleanupExpiredShareableLinks,
  runManualCleanup,
  hardDeleteOldRevokedLinks,
  getShareableLinkStats
} from '../src/lib/utils/share-link-cleanup';
import { validateConfigOrThrow } from '../src/lib/config';

const program = new Command();

program
  .name('cleanup-shareable-links')
  .description('Clean up expired shareable links')
  .version('1.0.0');

program
  .command('stats')
  .description('Show shareable links statistics')
  .action(async () => {
    try {
      console.log('📊 Fetching shareable links statistics...\n');
      
      const stats = await getShareableLinkStats();
      
      console.log('Shareable Links Statistics:');
      console.log('==========================');
      console.log(`Total links:      ${stats.total}`);
      console.log(`Active links:     ${stats.active}`);
      console.log(`Expired links:    ${stats.expired}`);
      console.log(`Revoked links:    ${stats.revoked}`);
      console.log(`Expiring soon:    ${stats.expiringSoon} (within 7 days)`);
      
      if (stats.expired > 0) {
        console.log(`\n⚠️  You have ${stats.expired} expired links that can be cleaned up.`);
      }
      
      if (stats.expiringSoon > 0) {
        console.log(`\n⏰ ${stats.expiringSoon} links will expire within 7 days.`);
      }
      
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Clean up expired shareable links')
  .option('--dry-run', 'Show what would be cleaned without actually doing it')
  .option('--user-id <userId>', 'User ID for audit logging', 'system')
  .action(async (options) => {
    try {
      // Validate configuration before running
      validateConfigOrThrow();
      
      console.log(`🧹 ${options.dryRun ? 'DRY RUN: ' : ''}Cleaning up expired shareable links...\n`);
      
      const result = await cleanupExpiredShareableLinks(options.userId, options.dryRun);
      
      if (result.expiredLinks.length === 0) {
        console.log('✅ No expired links found. Nothing to clean up.');
      } else {
        console.log(`Found ${result.expiredLinks.length} expired links:`);
        
        // Group by document type
        const byType = result.expiredLinks.reduce((acc, link) => {
          acc[link.documentType] = (acc[link.documentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        Object.entries(byType).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count} links`);
        });
        
        if (!options.dryRun) {
          console.log(`\n✅ Successfully cleaned up ${result.cleanedCount} expired links.`);
        } else {
          console.log(`\n🔍 DRY RUN: Would clean up ${result.expiredLinks.length} expired links.`);
        }
      }
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors occurred during cleanup:');
        result.errors.forEach(error => console.log(`  - ${error}`));
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      process.exit(1);
    }
  });

program
  .command('manual')
  .description('Run manual cleanup with custom options')
  .option('--dry-run', 'Show what would be cleaned without actually doing it')
  .option('--older-than <days>', 'Clean links older than specified days', parseInt)
  .option('--hard-delete', 'Permanently delete links instead of marking as revoked')
  .option('--user-id <userId>', 'User ID for audit logging', 'manual-script')
  .action(async (options) => {
    try {
      validateConfigOrThrow();
      
      const { dryRun, olderThan, hardDelete, userId } = options;
      
      console.log(`🔧 ${dryRun ? 'DRY RUN: ' : ''}Running manual cleanup...`);
      if (olderThan) {
        console.log(`   - Links older than: ${olderThan} days`);
      }
      if (hardDelete) {
        console.log('   - Mode: HARD DELETE (permanent removal)');
      }
      console.log();
      
      const result = await runManualCleanup(userId, {
        dryRun,
        olderThanDays: olderThan,
        hardDelete
      });
      
      if (result.expiredLinks.length === 0) {
        console.log('✅ No links found matching the criteria.');
      } else {
        console.log(`Found ${result.expiredLinks.length} links matching criteria:`);
        
        // Show age distribution
        const now = new Date();
        const ageGroups = {
          '< 30 days': 0,
          '30-90 days': 0,
          '90-365 days': 0,
          '> 365 days': 0
        };
        
        result.expiredLinks.forEach(link => {
          const ageMs = now.getTime() - link.expiresAt.getTime();
          const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
          
          if (ageDays < 30) ageGroups['< 30 days']++;
          else if (ageDays < 90) ageGroups['30-90 days']++;
          else if (ageDays < 365) ageGroups['90-365 days']++;
          else ageGroups['> 365 days']++;
        });
        
        Object.entries(ageGroups).forEach(([group, count]) => {
          if (count > 0) {
            console.log(`  - ${group}: ${count} links`);
          }
        });
        
        if (!dryRun) {
          console.log(`\n✅ Successfully processed ${result.cleanedCount} links.`);
        } else {
          console.log(`\n🔍 DRY RUN: Would process ${result.expiredLinks.length} links.`);
        }
      }
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors occurred:');
        result.errors.forEach(error => console.log(`  - ${error}`));
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error during manual cleanup:', error);
      process.exit(1);
    }
  });

program
  .command('hard-delete')
  .description('Permanently delete old revoked links (database maintenance)')
  .option('--dry-run', 'Show what would be deleted without actually doing it')
  .option('--older-than <days>', 'Delete revoked links older than specified days', parseInt, 90)
  .option('--user-id <userId>', 'User ID for audit logging', 'maintenance-script')
  .action(async (options) => {
    try {
      validateConfigOrThrow();
      
      const { dryRun, olderThan, userId } = options;
      
      console.log(`🗑️  ${dryRun ? 'DRY RUN: ' : ''}Hard deleting old revoked links...`);
      console.log(`   - Revoked links older than: ${olderThan} days`);
      console.log('   - ⚠️  WARNING: This permanently removes data from the database!');
      console.log();
      
      if (!dryRun) {
        // Additional confirmation for hard delete
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise<string>((resolve) => {
          readline.question('Are you sure you want to permanently delete these links? (yes/no): ', resolve);
        });
        
        readline.close();
        
        if (answer.toLowerCase() !== 'yes') {
          console.log('❌ Operation cancelled.');
          process.exit(0);
        }
      }
      
      const result = await hardDeleteOldRevokedLinks(userId, olderThan, dryRun);
      
      if (result.expiredLinks.length === 0) {
        console.log('✅ No old revoked links found for deletion.');
      } else {
        if (!dryRun) {
          console.log(`✅ Successfully hard deleted ${result.cleanedCount} old revoked links.`);
        } else {
          console.log(`🔍 DRY RUN: Would hard delete ${result.expiredLinks.length} old revoked links.`);
        }
      }
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors occurred:');
        result.errors.forEach(error => console.log(`  - ${error}`));
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error during hard delete:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}