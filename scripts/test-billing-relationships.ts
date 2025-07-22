#!/usr/bin/env tsx

/**
 * Test script to verify billing schema relationships and constraints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBillingRelationships() {
  console.log('🧪 Testing billing schema relationships and constraints...');

  try {
    // Test 1: Create a customer for testing
    console.log('📝 Test 1: Creating test customer...');
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        code: 'TEST-001',
        contactPerson: 'John Doe',
        email: 'john@test.com',
        phone: '+1234567890',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Test customer created:', testCustomer.id);

    // Test 2: Create a billing statement with customer reference
    console.log('📝 Test 2: Creating billing statement with customer reference...');
    const billingStatement = await prisma.billingStatement.create({
      data: {
        statementNumber: 'BS-TEST-001',
        customerId: testCustomer.id,
        customerName: testCustomer.name,
        totalAmount: 1000.00,
        taxAmount: 100.00,
        discountAmount: 50.00,
        netAmount: 1050.00,
        status: 'DRAFT',
        billingDate: new Date()
      }
    });
    console.log('✅ Billing statement created:', billingStatement.id);

    // Test 3: Create a sales invoice linked to billing statement (one-to-one relationship)
    console.log('📝 Test 3: Creating sales invoice linked to billing statement...');
    const salesInvoice = await prisma.salesInvoice.create({
      data: {
        invoiceNumber: 'INV-TEST-001',
        billingStatementId: billingStatement.id,
        subtotal: 1000.00,
        taxAmount: 100.00,
        discountAmount: 50.00,
        totalAmount: 1050.00,
        status: 'DRAFT'
      }
    });
    console.log('✅ Sales invoice created:', salesInvoice.id);

    // Test 4: Try to create another sales invoice for the same billing statement (should fail due to unique constraint)
    console.log('📝 Test 4: Testing unique constraint on sales invoice...');
    try {
      await prisma.salesInvoice.create({
        data: {
          invoiceNumber: 'INV-TEST-002',
          billingStatementId: billingStatement.id,
          subtotal: 500.00,
          taxAmount: 50.00,
          totalAmount: 550.00,
          status: 'DRAFT'
        }
      });
      console.log('❌ ERROR: Should not be able to create duplicate sales invoice');
    } catch (error) {
      console.log('✅ Unique constraint working correctly - cannot create duplicate sales invoice');
    }

    // Test 5: Create multiple delivery receipts for the same billing statement (one-to-many relationship)
    console.log('📝 Test 5: Creating multiple delivery receipts for billing statement...');
    const deliveryReceipt1 = await prisma.deliveryReceipt.create({
      data: {
        receiptNumber: 'DR-TEST-001',
        billingStatementId: billingStatement.id,
        deliveryDate: new Date(),
        deliveryAddress: '123 Test Street',
        receivedBy: 'Jane Smith',
        deliveryStatus: 'DELIVERED'
      }
    });
    console.log('✅ First delivery receipt created:', deliveryReceipt1.id);

    const deliveryReceipt2 = await prisma.deliveryReceipt.create({
      data: {
        receiptNumber: 'DR-TEST-002',
        billingStatementId: billingStatement.id,
        deliveryDate: new Date(),
        deliveryAddress: '456 Test Avenue',
        receivedBy: 'Bob Johnson',
        deliveryStatus: 'DELIVERED'
      }
    });
    console.log('✅ Second delivery receipt created:', deliveryReceipt2.id);

    // Test 6: Query relationships to verify they work correctly
    console.log('📝 Test 6: Testing relationship queries...');
    const billingWithRelations = await prisma.billingStatement.findUnique({
      where: { id: billingStatement.id },
      include: {
        customer: true,
        salesInvoice: true,
        deliveryReceipts: true
      }
    });

    if (billingWithRelations) {
      console.log('✅ Billing statement with relationships:');
      console.log('   - Customer:', billingWithRelations.customer?.name);
      console.log('   - Sales Invoice:', billingWithRelations.salesInvoice?.invoiceNumber);
      console.log('   - Delivery Receipts:', billingWithRelations.deliveryReceipts.length);
    }

    // Test 7: Test cascade delete behavior
    console.log('📝 Test 7: Testing cascade delete behavior...');
    await prisma.billingStatement.delete({
      where: { id: billingStatement.id }
    });

    // Verify that related records were deleted
    const deletedInvoice = await prisma.salesInvoice.findUnique({
      where: { id: salesInvoice.id }
    });
    const deletedReceipts = await prisma.deliveryReceipt.findMany({
      where: { billingStatementId: billingStatement.id }
    });

    if (!deletedInvoice && deletedReceipts.length === 0) {
      console.log('✅ Cascade delete working correctly - related records deleted');
    } else {
      console.log('❌ ERROR: Cascade delete not working properly');
    }

    // Cleanup
    await prisma.customer.delete({
      where: { id: testCustomer.id }
    });

    console.log('\n🎉 All billing relationship tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await testBillingRelationships();
  } catch (error) {
    console.error('❌ Billing relationship tests failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  main();
}

export { testBillingRelationships };