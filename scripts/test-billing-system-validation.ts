#!/usr/bin/env tsx

/**
 * Comprehensive Billing System Validation Test
 * 
 * This script tests and validates the updated billing system according to the requirements:
 * - Test billing statement creation with customer and customerOrder scenarios
 * - Verify sales invoice creation is properly linked to billing statements
 * - Test delivery receipt creation with simplified fields
 * - Validate all relationships work correctly
 * - Test data integrity and constraint enforcement
 * - Verify existing functionality still works after migration
 */

import { PrismaClient } from '@prisma/client';
import { BillingStatus, InvoiceStatus, DeliveryStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  error?: any;
}

class BillingSystemValidator {
  private results: TestResult[] = [];

  private addResult(testName: string, passed: boolean, message: string, error?: any) {
    this.results.push({ testName, passed, message, error });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName} - ${message}`);
    if (error) {
      console.error('Error details:', error);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Billing System Validation Tests...\n');

    try {
      // Test 1: Database schema validation
      await this.testDatabaseSchema();

      // Test 2: Billing statement creation with customer scenarios
      await this.testBillingStatementWithCustomer();

      // Test 3: Billing statement creation with customer order scenarios
      await this.testBillingStatementWithCustomerOrder();

      // Test 4: Sales invoice creation and linking
      await this.testSalesInvoiceCreation();

      // Test 5: Delivery receipt creation with simplified fields
      await this.testDeliveryReceiptCreation();

      // Test 6: Relationship integrity tests
      await this.testRelationshipIntegrity();

      // Test 7: Data constraint enforcement
      await this.testDataConstraints();

      // Test 8: Migration data integrity
      await this.testMigrationDataIntegrity();

      // Test 9: Query performance and optimization
      await this.testQueryPerformance();

      // Test 10: End-to-end workflow test
      await this.testEndToEndWorkflow();

    } catch (error) {
      this.addResult('Test Suite', false, 'Test suite failed with unexpected error', error);
    } finally {
      await this.cleanup();
      this.printSummary();
    }
  }

  async testDatabaseSchema() {
    try {
      // Test that all required models exist and have correct structure
      const billingStatement = await prisma.billingStatement.findFirst();
      const salesInvoice = await prisma.salesInvoice.findFirst();
      const deliveryReceipt = await prisma.deliveryReceipt.findFirst();

      this.addResult(
        'Database Schema Validation',
        true,
        'All billing models exist and are accessible'
      );
    } catch (error) {
      this.addResult(
        'Database Schema Validation',
        false,
        'Failed to access billing models',
        error
      );
    }
  }

  async testBillingStatementWithCustomer() {
    try {
      // First, ensure we have a customer to test with
      let customer = await prisma.customer.findFirst();
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: 'Test Customer',
            code: 'TC001',
            contactPerson: 'John Doe',
            email: 'john@testcustomer.com',
            phone: '+1234567890'
          }
        });
      }

      // Test creating billing statement with direct customer reference
      const billingStatement = await prisma.billingStatement.create({
        data: {
          statementNumber: `BS-CUST-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          totalAmount: 1000.00,
          taxAmount: 100.00,
          discountAmount: 50.00,
          netAmount: 1050.00,
          status: BillingStatus.DRAFT
        }
      });

      // Verify the relationship works
      const retrievedStatement = await prisma.billingStatement.findUnique({
        where: { id: billingStatement.id },
        include: { customer: true }
      });

      const isValid = retrievedStatement?.customer?.id === customer.id &&
                     retrievedStatement?.customerName === customer.name;

      this.addResult(
        'Billing Statement with Customer',
        isValid,
        isValid ? 'Successfully created and linked billing statement to customer' : 'Failed to properly link customer'
      );

      return billingStatement;
    } catch (error) {
      this.addResult(
        'Billing Statement with Customer',
        false,
        'Failed to create billing statement with customer',
        error
      );
      return null;
    }
  }

  async testBillingStatementWithCustomerOrder() {
    try {
      // First, ensure we have a customer and customer order
      let customer = await prisma.customer.findFirst();
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: 'Test Customer Order',
            code: 'TCO001',
            contactPerson: 'Jane Doe',
            email: 'jane@testcustomer.com',
            phone: '+1234567891'
          }
        });
      }

      const customerOrder = await prisma.customerOrder.create({
        data: {
          orderNumber: `CO-${Date.now()}`,
          customerId: customer.id,
          orderDate: new Date(),
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          totalAmount: 2000.00,
          status: 'ACTIVE'
        }
      });

      // Test creating billing statement with customer order reference
      const billingStatement = await prisma.billingStatement.create({
        data: {
          statementNumber: `BS-ORDER-${Date.now()}`,
          customerOrderId: customerOrder.id,
          customerName: customer.name, // Should be derived from customer order
          totalAmount: 2000.00,
          taxAmount: 200.00,
          discountAmount: 100.00,
          netAmount: 2100.00,
          status: BillingStatus.DRAFT
        }
      });

      // Verify the relationship works
      const retrievedStatement = await prisma.billingStatement.findUnique({
        where: { id: billingStatement.id },
        include: { 
          customerOrder: {
            include: { customer: true }
          }
        }
      });

      const isValid = retrievedStatement?.customerOrder?.id === customerOrder.id &&
                     retrievedStatement?.customerOrder?.customer?.id === customer.id;

      this.addResult(
        'Billing Statement with Customer Order',
        isValid,
        isValid ? 'Successfully created and linked billing statement to customer order' : 'Failed to properly link customer order'
      );

      return billingStatement;
    } catch (error) {
      this.addResult(
        'Billing Statement with Customer Order',
        false,
        'Failed to create billing statement with customer order',
        error
      );
      return null;
    }
  }

  async testSalesInvoiceCreation() {
    try {
      // Create a billing statement first
      const billingStatement = await this.testBillingStatementWithCustomer();
      if (!billingStatement) {
        throw new Error('Failed to create billing statement for invoice test');
      }

      // Test creating sales invoice linked to billing statement
      const salesInvoice = await prisma.salesInvoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}`,
          billingStatementId: billingStatement.id,
          subtotal: 1000.00,
          taxRate: 10.00,
          taxAmount: 100.00,
          discountAmount: 50.00,
          totalAmount: 1050.00,
          status: InvoiceStatus.DRAFT,
          paymentTerms: 'Net 30',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      // Verify one-to-one relationship
      const retrievedInvoice = await prisma.salesInvoice.findUnique({
        where: { id: salesInvoice.id },
        include: { billingStatement: true }
      });

      const retrievedStatement = await prisma.billingStatement.findUnique({
        where: { id: billingStatement.id },
        include: { salesInvoice: true }
      });

      const isValid = retrievedInvoice?.billingStatement?.id === billingStatement.id &&
                     retrievedStatement?.salesInvoice?.id === salesInvoice.id;

      this.addResult(
        'Sales Invoice Creation and Linking',
        isValid,
        isValid ? 'Successfully created and linked sales invoice to billing statement' : 'Failed to properly link sales invoice'
      );

      // Test constraint: Try to create duplicate invoice for same billing statement
      try {
        await prisma.salesInvoice.create({
          data: {
            invoiceNumber: `INV-DUP-${Date.now()}`,
            billingStatementId: billingStatement.id,
            subtotal: 500.00,
            totalAmount: 500.00,
            status: InvoiceStatus.DRAFT
          }
        });
        
        this.addResult(
          'Sales Invoice Duplicate Prevention',
          false,
          'Should not allow duplicate invoices for same billing statement'
        );
      } catch (duplicateError) {
        this.addResult(
          'Sales Invoice Duplicate Prevention',
          true,
          'Correctly prevented duplicate invoice creation'
        );
      }

      return salesInvoice;
    } catch (error) {
      this.addResult(
        'Sales Invoice Creation and Linking',
        false,
        'Failed to create or link sales invoice',
        error
      );
      return null;
    }
  }

  async testDeliveryReceiptCreation() {
    try {
      // Create a billing statement first
      const billingStatement = await this.testBillingStatementWithCustomer();
      if (!billingStatement) {
        throw new Error('Failed to create billing statement for delivery receipt test');
      }

      // Test creating delivery receipt with simplified fields
      const deliveryReceipt1 = await prisma.deliveryReceipt.create({
        data: {
          receiptNumber: `DR-${Date.now()}-1`,
          billingStatementId: billingStatement.id,
          deliveryDate: new Date(),
          deliveryAddress: '123 Test Street, Test City, TC 12345',
          receivedBy: 'John Smith',
          receivedByTitle: 'Warehouse Manager',
          deliveryStatus: DeliveryStatus.DELIVERED,
          deliveryNotes: 'Delivered successfully to main entrance'
        }
      });

      // Test creating second delivery receipt (multiple deliveries allowed)
      const deliveryReceipt2 = await prisma.deliveryReceipt.create({
        data: {
          receiptNumber: `DR-${Date.now()}-2`,
          billingStatementId: billingStatement.id,
          deliveryDate: new Date(),
          deliveryAddress: '456 Another Street, Test City, TC 12346',
          receivedBy: 'Jane Doe',
          trackingNumber: 'TRK123456789',
          courierService: 'Express Delivery Co.',
          deliveryStatus: DeliveryStatus.DELIVERED
        }
      });

      // Verify one-to-many relationship
      const retrievedStatement = await prisma.billingStatement.findUnique({
        where: { id: billingStatement.id },
        include: { deliveryReceipts: true }
      });

      const isValid = retrievedStatement?.deliveryReceipts?.length === 2 &&
                     retrievedStatement.deliveryReceipts.some(dr => dr.id === deliveryReceipt1.id) &&
                     retrievedStatement.deliveryReceipts.some(dr => dr.id === deliveryReceipt2.id);

      this.addResult(
        'Delivery Receipt Creation and Linking',
        isValid,
        isValid ? 'Successfully created and linked multiple delivery receipts to billing statement' : 'Failed to properly link delivery receipts'
      );

      return [deliveryReceipt1, deliveryReceipt2];
    } catch (error) {
      this.addResult(
        'Delivery Receipt Creation and Linking',
        false,
        'Failed to create or link delivery receipts',
        error
      );
      return null;
    }
  }

  async testRelationshipIntegrity() {
    try {
      // Test cascade delete behavior
      const billingStatement = await this.testBillingStatementWithCustomer();
      if (!billingStatement) {
        throw new Error('Failed to create billing statement for relationship test');
      }

      const salesInvoice = await prisma.salesInvoice.create({
        data: {
          invoiceNumber: `INV-CASCADE-${Date.now()}`,
          billingStatementId: billingStatement.id,
          subtotal: 500.00,
          totalAmount: 500.00,
          status: InvoiceStatus.DRAFT
        }
      });

      const deliveryReceipt = await prisma.deliveryReceipt.create({
        data: {
          receiptNumber: `DR-CASCADE-${Date.now()}`,
          billingStatementId: billingStatement.id,
          deliveryDate: new Date(),
          deliveryAddress: 'Test Address',
          receivedBy: 'Test Receiver',
          deliveryStatus: DeliveryStatus.DELIVERED
        }
      });

      // Delete billing statement and verify cascade
      await prisma.billingStatement.delete({
        where: { id: billingStatement.id }
      });

      // Verify related records are deleted
      const orphanedInvoice = await prisma.salesInvoice.findUnique({
        where: { id: salesInvoice.id }
      });

      const orphanedReceipt = await prisma.deliveryReceipt.findUnique({
        where: { id: deliveryReceipt.id }
      });

      const isValid = orphanedInvoice === null && orphanedReceipt === null;

      this.addResult(
        'Relationship Integrity (Cascade Delete)',
        isValid,
        isValid ? 'Cascade delete works correctly for related records' : 'Cascade delete failed to remove related records'
      );
    } catch (error) {
      this.addResult(
        'Relationship Integrity (Cascade Delete)',
        false,
        'Failed to test relationship integrity',
        error
      );
    }
  }

  async testDataConstraints() {
    try {
      let constraintTests = 0;
      let passedTests = 0;

      // Test 1: BillingStatement requires customerName
      try {
        await prisma.billingStatement.create({
          data: {
            statementNumber: `BS-NO-NAME-${Date.now()}`,
            totalAmount: 100.00,
            netAmount: 100.00
            // Missing customerName
          }
        });
        constraintTests++;
      } catch (error) {
        constraintTests++;
        passedTests++;
      }

      // Test 2: SalesInvoice requires billingStatementId
      try {
        await prisma.salesInvoice.create({
          data: {
            invoiceNumber: `INV-NO-BILLING-${Date.now()}`,
            subtotal: 100.00,
            totalAmount: 100.00
            // Missing billingStatementId
          }
        });
        constraintTests++;
      } catch (error) {
        constraintTests++;
        passedTests++;
      }

      // Test 3: DeliveryReceipt requires billingStatementId
      try {
        await prisma.deliveryReceipt.create({
          data: {
            receiptNumber: `DR-NO-BILLING-${Date.now()}`,
            deliveryDate: new Date(),
            deliveryAddress: 'Test Address',
            receivedBy: 'Test Receiver'
            // Missing billingStatementId
          }
        });
        constraintTests++;
      } catch (error) {
        constraintTests++;
        passedTests++;
      }

      const isValid = passedTests === constraintTests && constraintTests > 0;

      this.addResult(
        'Data Constraint Enforcement',
        isValid,
        `${passedTests}/${constraintTests} constraint tests passed`
      );
    } catch (error) {
      this.addResult(
        'Data Constraint Enforcement',
        false,
        'Failed to test data constraints',
        error
      );
    }
  }

  async testMigrationDataIntegrity() {
    try {
      // Check if there are any billing statements without proper customer information
      const statementsWithoutCustomer = await prisma.billingStatement.findMany({
        where: {
          AND: [
            { customerId: null },
            { customerOrderId: null }
          ]
        }
      });

      // Check if there are any sales invoices without billing statements
      const orphanedInvoices = await prisma.salesInvoice.findMany({
        where: {
          billingStatementId: {
            not: {
              in: (await prisma.billingStatement.findMany({ select: { id: true } })).map(bs => bs.id)
            }
          }
        }
      });

      // Check if there are any delivery receipts without billing statements
      const orphanedReceipts = await prisma.deliveryReceipt.findMany({
        where: {
          billingStatementId: {
            not: {
              in: (await prisma.billingStatement.findMany({ select: { id: true } })).map(bs => bs.id)
            }
          }
        }
      });

      // Check if all billing statements have customerName populated
      const allStatements = await prisma.billingStatement.findMany({
        select: { id: true, customerName: true }
      });
      const statementsWithoutName = allStatements.filter(
        stmt => !stmt.customerName || stmt.customerName.trim() === ''
      );

      const isValid = statementsWithoutCustomer.length === 0 &&
                     orphanedInvoices.length === 0 &&
                     orphanedReceipts.length === 0 &&
                     statementsWithoutName.length === 0;

      this.addResult(
        'Migration Data Integrity',
        isValid,
        isValid ? 'All migrated data maintains proper relationships and constraints' : 
                 `Found issues: ${statementsWithoutCustomer.length} statements without customer, ${orphanedInvoices.length} orphaned invoices, ${orphanedReceipts.length} orphaned receipts, ${statementsWithoutName.length} statements without names`
      );
    } catch (error) {
      this.addResult(
        'Migration Data Integrity',
        false,
        'Failed to validate migration data integrity',
        error
      );
    }
  }

  async testQueryPerformance() {
    try {
      const startTime = Date.now();

      // Test complex query with joins
      const results = await prisma.billingStatement.findMany({
        include: {
          customer: true,
          customerOrder: {
            include: { customer: true }
          },
          salesInvoice: {
            include: { invoiceItems: true }
          },
          deliveryReceipts: true
        },
        take: 10
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Query should complete within reasonable time (< 1000ms for small dataset)
      const isValid = queryTime < 1000;

      this.addResult(
        'Query Performance',
        isValid,
        `Complex billing query completed in ${queryTime}ms (${results.length} records)`
      );
    } catch (error) {
      this.addResult(
        'Query Performance',
        false,
        'Failed to test query performance',
        error
      );
    }
  }

  async testEndToEndWorkflow() {
    try {
      // Create complete billing workflow
      const customer = await prisma.customer.create({
        data: {
          name: 'End-to-End Customer',
          code: `E2E-${Date.now()}`,
          contactPerson: 'E2E Contact',
          email: 'e2e@test.com',
          phone: '+1234567892'
        }
      });

      const customerOrder = await prisma.customerOrder.create({
        data: {
          orderNumber: `E2E-ORDER-${Date.now()}`,
          customerId: customer.id,
          orderDate: new Date(),
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          totalAmount: 5000.00,
          status: 'ACTIVE'
        }
      });

      const billingStatement = await prisma.billingStatement.create({
        data: {
          statementNumber: `E2E-BS-${Date.now()}`,
          customerOrderId: customerOrder.id,
          customerName: customer.name,
          totalAmount: 5000.00,
          taxAmount: 500.00,
          discountAmount: 250.00,
          netAmount: 5250.00,
          status: BillingStatus.SENT
        }
      });

      const salesInvoice = await prisma.salesInvoice.create({
        data: {
          invoiceNumber: `E2E-INV-${Date.now()}`,
          billingStatementId: billingStatement.id,
          subtotal: 5000.00,
          taxRate: 10.00,
          taxAmount: 500.00,
          discountAmount: 250.00,
          totalAmount: 5250.00,
          status: InvoiceStatus.SENT,
          paymentTerms: 'Net 30'
        }
      });

      const deliveryReceipt = await prisma.deliveryReceipt.create({
        data: {
          receiptNumber: `E2E-DR-${Date.now()}`,
          billingStatementId: billingStatement.id,
          deliveryDate: new Date(),
          deliveryAddress: 'E2E Delivery Address',
          receivedBy: 'E2E Receiver',
          deliveryStatus: DeliveryStatus.DELIVERED
        }
      });

      // Verify complete workflow
      const completeRecord = await prisma.billingStatement.findUnique({
        where: { id: billingStatement.id },
        include: {
          customer: false,
          customerOrder: {
            include: { customer: true }
          },
          salesInvoice: true,
          deliveryReceipts: true
        }
      });

      const isValid = completeRecord &&
                     completeRecord.customerOrder?.customer?.id === customer.id &&
                     completeRecord.salesInvoice?.id === salesInvoice.id &&
                     completeRecord.deliveryReceipts.length === 1 &&
                     completeRecord.deliveryReceipts[0].id === deliveryReceipt.id;

      this.addResult(
        'End-to-End Workflow',
        isValid,
        isValid ? 'Complete billing workflow created and linked successfully' : 'End-to-end workflow validation failed'
      );
    } catch (error) {
      this.addResult(
        'End-to-End Workflow',
        false,
        'Failed to test end-to-end workflow',
        error
      );
    }
  }

  async cleanup() {
    try {
      // Clean up test data
      await prisma.deliveryReceipt.deleteMany({
        where: {
          receiptNumber: {
            contains: 'DR-'
          }
        }
      });

      await prisma.salesInvoice.deleteMany({
        where: {
          invoiceNumber: {
            contains: 'INV-'
          }
        }
      });

      await prisma.billingStatement.deleteMany({
        where: {
          statementNumber: {
            contains: 'BS-'
          }
        }
      });

      await prisma.customerOrder.deleteMany({
        where: {
          orderNumber: {
            contains: 'CO-'
          }
        }
      });

      await prisma.customer.deleteMany({
        where: {
          code: {
            startsWith: 'TC'
          }
        }
      });

      console.log('\n🧹 Test data cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  printSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('\n' + '='.repeat(60));
    console.log('📊 BILLING SYSTEM VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`- ${result.testName}: ${result.message}`);
      });
    }

    console.log('\n✅ PASSED TESTS:');
    this.results.filter(r => r.passed).forEach(result => {
      console.log(`- ${result.testName}: ${result.message}`);
    });

    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! The billing system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
  }
}

// Run the validation
async function main() {
  const validator = new BillingSystemValidator();
  await validator.runAllTests();
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export { BillingSystemValidator };