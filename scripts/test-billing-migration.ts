#!/usr/bin/env tsx

/**
 * Test script for billing schema migration
 * 
 * This script creates sample data and tests the migration process
 */

import { PrismaClient } from '@prisma/client';
import { migrateBillingSchema } from './billing-schema-migration';

const prisma = new PrismaClient();

async function createSampleData() {
  console.log('🔧 Creating sample data for migration testing...');

  try {
    // Create a test customer
    const customer = await prisma.customer.upsert({
      where: { code: 'TEST-CUST-001' },
      update: {},
      create: {
        name: 'Test Customer',
        code: 'TEST-CUST-001',
        contactPerson: 'John Doe',
        email: 'john@testcustomer.com',
        phone: '+1234567890',
        status: 'ACTIVE'
      }
    });

    // Create a test customer order
    const customerOrder = await prisma.customerOrder.upsert({
      where: { orderNumber: 'CO-TEST-001' },
      update: {},
      create: {
        orderNumber: 'CO-TEST-001',
        customerId: customer.id,
        orderDate: new Date(),
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        totalAmount: 1000.00,
        status: 'ACTIVE'
      }
    });

    // Create billing statements with different scenarios
    const billingStatement1 = await prisma.billingStatement.upsert({
      where: { statementNumber: 'BS-TEST-001' },
      update: {},
      create: {
        statementNumber: 'BS-TEST-001',
        customerId: customer.id,
        customerName: customer.name,
        totalAmount: 1000.00,
        taxAmount: 100.00,
        discountAmount: 50.00,
        netAmount: 1050.00,
        status: 'DRAFT'
      }
    });

    const billingStatement2 = await prisma.billingStatement.upsert({
      where: { statementNumber: 'BS-TEST-002' },
      update: {},
      create: {
        statementNumber: 'BS-TEST-002',
        customerOrderId: customerOrder.id,
        customerName: customer.name,
        totalAmount: 500.00,
        taxAmount: 50.00,
        discountAmount: 25.00,
        netAmount: 525.00,
        status: 'SENT'
      }
    });

    // Create a billing statement with missing customer name (to test migration)
    const billingStatement3 = await prisma.billingStatement.upsert({
      where: { statementNumber: 'BS-TEST-003' },
      update: {},
      create: {
        statementNumber: 'BS-TEST-003',
        customerId: customer.id,
        customerName: '', // Empty name to test migration
        totalAmount: 750.00,
        taxAmount: 75.00,
        discountAmount: 0.00,
        netAmount: 825.00,
        status: 'DRAFT'
      }
    });

    // Create sales invoices
    const salesInvoice1 = await prisma.salesInvoice.upsert({
      where: { invoiceNumber: 'INV-TEST-001' },
      update: {},
      create: {
        invoiceNumber: 'INV-TEST-001',
        billingStatementId: billingStatement1.id,
        subtotal: 1000.00,
        taxAmount: 100.00,
        discountAmount: 50.00,
        totalAmount: 1050.00,
        status: 'DRAFT'
      }
    });

    const salesInvoice2 = await prisma.salesInvoice.upsert({
      where: { invoiceNumber: 'INV-TEST-002' },
      update: {},
      create: {
        invoiceNumber: 'INV-TEST-002',
        billingStatementId: billingStatement2.id,
        subtotal: 500.00,
        taxAmount: 50.00,
        discountAmount: 25.00,
        totalAmount: 525.00,
        status: 'SENT'
      }
    });

    // Create delivery receipts
    const deliveryReceipt1 = await prisma.deliveryReceipt.upsert({
      where: { receiptNumber: 'DR-TEST-001' },
      update: {},
      create: {
        receiptNumber: 'DR-TEST-001',
        billingStatementId: billingStatement1.id,
        deliveryDate: new Date(),
        deliveryAddress: '123 Test Street, Test City',
        receivedBy: 'Jane Smith',
        deliveryStatus: 'DELIVERED'
      }
    });

    const deliveryReceipt2 = await prisma.deliveryReceipt.upsert({
      where: { receiptNumber: 'DR-TEST-002' },
      update: {},
      create: {
        receiptNumber: 'DR-TEST-002',
        billingStatementId: billingStatement2.id,
        deliveryDate: new Date(),
        deliveryAddress: '456 Another Street, Another City',
        receivedBy: 'Bob Johnson',
        deliveryStatus: 'DELIVERED'
      }
    });

    console.log('✅ Sample data created successfully');
    
    return {
      customer,
      customerOrder,
      billingStatements: [billingStatement1, billingStatement2, billingStatement3],
      salesInvoices: [salesInvoice1, salesInvoice2],
      deliveryReceipts: [deliveryReceipt1, deliveryReceipt2]
    };

  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
    throw error;
  }
}

async function validateMigration() {
  console.log('🔍 Validating migration results...');

  try {
    // Check that all billing statements have meaningful customer names
    const statementsWithoutNames = await prisma.billingStatement.findMany({
      where: {
        customerName: ''
      }
    });

    if (statementsWithoutNames.length > 0) {
      throw new Error(`Found ${statementsWithoutNames.length} billing statements without customer names`);
    }

    // Check that all sales invoices are properly linked to billing statements
    const allInvoices = await prisma.salesInvoice.findMany({
      include: {
        billingStatement: true
      }
    });

    const unlinkedInvoices = allInvoices.filter(invoice => !invoice.billingStatement);
    if (unlinkedInvoices.length > 0) {
      throw new Error(`Found ${unlinkedInvoices.length} unlinked sales invoices`);
    }

    // Check that all delivery receipts are properly linked to billing statements
    const allReceipts = await prisma.deliveryReceipt.findMany({
      include: {
        billingStatement: true
      }
    });

    const unlinkedReceipts = allReceipts.filter(receipt => !receipt.billingStatement);
    if (unlinkedReceipts.length > 0) {
      throw new Error(`Found ${unlinkedReceipts.length} unlinked delivery receipts`);
    }

    // Check financial calculations
    const statements = await prisma.billingStatement.findMany();
    for (const statement of statements) {
      const expectedNetAmount = statement.totalAmount.minus(statement.discountAmount).plus(statement.taxAmount);
      if (!statement.netAmount.equals(expectedNetAmount)) {
        throw new Error(`Billing statement ${statement.id} has incorrect net amount calculation`);
      }
    }

    // Check relationship integrity
    const statementsWithRelations = await prisma.billingStatement.findMany({
      include: {
        salesInvoice: true,
        deliveryReceipts: true,
        customer: true,
        customerOrder: {
          include: {
            customer: true
          }
        }
      }
    });

    for (const statement of statementsWithRelations) {
      // Verify customer name matches the related customer
      if (statement.customer && statement.customerName !== statement.customer.name) {
        console.warn(`Warning: Statement ${statement.id} customer name mismatch`);
      }
      
      if (statement.customerOrder?.customer && statement.customerName !== statement.customerOrder.customer.name) {
        console.warn(`Warning: Statement ${statement.id} customer order name mismatch`);
      }
    }

    console.log('✅ Migration validation passed');
    return true;

  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    return false;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');

  try {
    // Delete in reverse order of dependencies
    await prisma.deliveryReceipt.deleteMany({
      where: {
        receiptNumber: {
          startsWith: 'DR-TEST-'
        }
      }
    });

    await prisma.salesInvoice.deleteMany({
      where: {
        invoiceNumber: {
          startsWith: 'INV-TEST-'
        }
      }
    });

    await prisma.billingStatement.deleteMany({
      where: {
        statementNumber: {
          startsWith: 'BS-TEST-'
        }
      }
    });

    await prisma.customerOrder.deleteMany({
      where: {
        orderNumber: {
          startsWith: 'CO-TEST-'
        }
      }
    });

    await prisma.customer.deleteMany({
      where: {
        code: {
          startsWith: 'TEST-CUST-'
        }
      }
    });

    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

async function main() {
  try {
    console.log('🧪 Starting billing migration test...\n');

    // Create sample data
    const sampleData = await createSampleData();
    
    // Run the migration
    console.log('\n🚀 Running migration...');
    const migrationStats = await migrateBillingSchema();
    
    // Validate the results
    console.log('\n🔍 Validating results...');
    const isValid = await validateMigration();
    
    if (isValid) {
      console.log('\n🎉 Migration test completed successfully!');
      console.log('📊 Migration Statistics:');
      console.log(`   Billing Statements Updated: ${migrationStats.billingStatementsUpdated}`);
      console.log(`   Billing Statements Created: ${migrationStats.billingStatementsCreated}`);
      console.log(`   Sales Invoices Linked: ${migrationStats.salesInvoicesLinked}`);
      console.log(`   Delivery Receipts Linked: ${migrationStats.deliveryReceiptsLinked}`);
      
      if (migrationStats.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        migrationStats.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('\n❌ Migration test failed validation');
      process.exit(1);
    }

    // Cleanup test data
    await cleanupTestData();

  } catch (error) {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  main();
}

export { createSampleData, validateMigration, cleanupTestData };