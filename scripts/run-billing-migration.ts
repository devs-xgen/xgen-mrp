#!/usr/bin/env tsx

/**
 * Production billing schema migration runner
 * 
 * This script runs the billing schema migration on the production database
 */

import { migrateBillingSchema } from './billing-schema-migration';

async function main() {
  console.log('🚀 Starting production billing schema migration...');
  console.log('⚠️  This will modify your database. Make sure you have a backup!');
  
  // Add a confirmation prompt in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🛑 Production environment detected. Please confirm you want to proceed.');
    console.log('   Type "YES" to continue:');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('', (answer: string) => {
        rl.close();
        resolve(answer);
      });
    });
    
    if (answer !== 'YES') {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }
  }

  try {
    const stats = await migrateBillingSchema();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Migration Statistics:');
    console.log(`   Billing Statements Updated: ${stats.billingStatementsUpdated}`);
    console.log(`   Billing Statements Created: ${stats.billingStatementsCreated}`);
    console.log(`   Sales Invoices Linked: ${stats.salesInvoicesLinked}`);
    console.log(`   Delivery Receipts Linked: ${stats.deliveryReceiptsLinked}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      
      if (stats.errors.length > 5) {
        console.log('\n❌ Too many errors encountered. Please review and fix issues before proceeding.');
        process.exit(1);
      }
    }
    
    console.log('\n✅ Billing schema migration completed successfully!');
    console.log('🔍 Please verify your data integrity and test the billing functionality.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}