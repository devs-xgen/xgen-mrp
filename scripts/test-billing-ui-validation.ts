#!/usr/bin/env tsx

/**
 * Billing UI Validation Test
 * 
 * This script tests the UI components and server actions for the billing system
 * to ensure they work correctly with the updated schema.
 */

import { PrismaClient } from '@prisma/client';
import { BillingStatus, InvoiceStatus, DeliveryStatus } from '@prisma/client';

// Import server actions to test
import { 
  createBillingStatement, 
  getBillingStatementById, 
  updateBillingStatement, 
  getAllBillingStatements 
} from '../src/lib/actions/billing-statements';

import { 
  createSalesInvoice, 
  getSalesInvoiceById, 
  updateSalesInvoice, 
  getAllSalesInvoices 
} from '../src/lib/actions/sales-invoices';

import { 
  createDeliveryReceipt, 
  getDeliveryReceiptById, 
  updateDeliveryReceipt, 
  getAllDeliveryReceipts 
} from '../src/lib/actions/delivery-receipts';

const prisma = new PrismaClient();

interface UITestResult {
  testName: string;
  passed: boolean;
  message: string;
  error?: any;
}

class BillingUIValidator {
  private results: UITestResult[] = [];

  private addResult(testName: string, passed: boolean, message: string, error?: any) {
    this.results.push({ testName, passed, message, error });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName} - ${message}`);
    if (error) {
      console.error('Error details:', error);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Billing UI Validation Tests...\n');

    try {
      // Test server actions
      await this.testBillingStatementActions();
      await this.testSalesInvoiceActions();
      await this.testDeliveryReceiptActions();

      // Test data validation
      await this.testFormValidation();

      // Test error handling
      await this.testErrorHandling();

    } catch (error) {
      this.addResult('UI Test Suite', false, 'UI test suite failed with unexpected error', error);
    } finally {
      await this.cleanup();
      this.printSummary();
    }
  }

  async testBillingStatementActions() {
    try {
      // Create test customer
      const customer = await prisma.customer.create({
        data: {
          name: 'UI Test Customer',
          code: `UI-CUST-${Date.now()}`,
          contactPerson: 'UI Test Contact',
          email: 'ui-test@customer.com',
          phone: '+1234567890'
        }
      });

      // Test createBillingStatement with customer
      const billingStatementData = {
        statementNumber: `UI-BS-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        totalAmount: 1500.00,
        taxAmount: 150.00,
        discountAmount: 75.00,
        netAmount: 1575.00,
        status: BillingStatus.DRAFT,
        notes: 'UI test billing statement'
      };

      const createdStatement = await createBillingStatement(billingStatementData);
      
      if (!createdStatement.success) {
        throw new Error(createdStatement.error || 'Failed to create billing statement');
      }

      this.addResult(
        'Create Billing Statement Action',
        true,
        'Successfully created billing statement via server action'
      );

      // Test getBillingStatementById
      const retrievedStatement = await getBillingStatementById(createdStatement.data.id);
      
      if (!retrievedStatement.success) {
        throw new Error(retrievedStatement.error || 'Failed to retrieve billing statement');
      }

      this.addResult(
        'Get Billing Statement Action',
        true,
        'Successfully retrieved billing statement via server action'
      );

      // Test updateBillingStatement
      const updateData = {
        ...retrievedStatement.data,
        status: BillingStatus.SENT,
        notes: 'Updated via UI test'
      };

      const updatedStatement = await updateBillingStatement(createdStatement.data.id, updateData);
      
      if (!updatedStatement.success) {
        throw new Error(updatedStatement.error || 'Failed to update billing statement');
      }

      this.addResult(
        'Update Billing Statement Action',
        true,
        'Successfully updated billing statement via server action'
      );

      // Test getAllBillingStatements
      const allStatements = await getAllBillingStatements();
      
      if (!allStatements.success) {
        throw new Error(allStatements.error || 'Failed to get all billing statements');
      }

      const foundStatement = allStatements.data.find(
        stmt => stmt.id === createdStatement.data.id
      );

      this.addResult(
        'Get All Billing Statements Action',
        !!foundStatement,
        foundStatement ? 'Successfully retrieved all billing statements' : 'Created statement not found in list'
      );

      return createdStatement.data;
    } catch (error) {
      this.addResult(
        'Billing Statement Actions',
        false,
        'Failed to test billing statement server actions',
        error
      );
      return null;
    }
  }

  async testSalesInvoiceActions() {
    try {
      // Create a billing statement first
      const billingStatement = await this.testBillingStatementActions();
      if (!billingStatement) {
        throw new Error('Failed to create billing statement for invoice test');
      }

      // Test createSalesInvoice
      const invoiceData = {
        invoiceNumber: `UI-INV-${Date.now()}`,
        billingStatementId: billingStatement.id,
        subtotal: 1500.00,
        taxRate: 10.00,
        taxAmount: 150.00,
        discountAmount: 75.00,
        totalAmount: 1575.00,
        status: InvoiceStatus.DRAFT,
        paymentTerms: 'Net 30',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const createdInvoice = await createSalesInvoice(invoiceData);
      
      if (!createdInvoice.success) {
        throw new Error(createdInvoice.error || 'Failed to create sales invoice');
      }

      this.addResult(
        'Create Sales Invoice Action',
        true,
        'Successfully created sales invoice via server action'
      );

      // Test getSalesInvoiceById
      const retrievedInvoice = await getSalesInvoiceById(createdInvoice.data.id);
      
      if (!retrievedInvoice.success) {
        throw new Error(retrievedInvoice.error || 'Failed to retrieve sales invoice');
      }

      this.addResult(
        'Get Sales Invoice Action',
        true,
        'Successfully retrieved sales invoice via server action'
      );

      // Test updateSalesInvoice
      const updateData = {
        ...retrievedInvoice.data,
        status: InvoiceStatus.SENT,
        terms: 'Updated payment terms'
      };

      const updatedInvoice = await updateSalesInvoice(createdInvoice.data.id, updateData);
      
      if (!updatedInvoice.success) {
        throw new Error(updatedInvoice.error || 'Failed to update sales invoice');
      }

      this.addResult(
        'Update Sales Invoice Action',
        true,
        'Successfully updated sales invoice via server action'
      );

      // Test getAllSalesInvoices
      const allInvoices = await getAllSalesInvoices();
      
      if (!allInvoices.success) {
        throw new Error(allInvoices.error || 'Failed to get all sales invoices');
      }

      const foundInvoice = allInvoices.data.find(
        inv => inv.id === createdInvoice.data.id
      );

      this.addResult(
        'Get All Sales Invoices Action',
        !!foundInvoice,
        foundInvoice ? 'Successfully retrieved all sales invoices' : 'Created invoice not found in list'
      );

      return createdInvoice.data;
    } catch (error) {
      this.addResult(
        'Sales Invoice Actions',
        false,
        'Failed to test sales invoice server actions',
        error
      );
      return null;
    }
  }

  async testDeliveryReceiptActions() {
    try {
      // Create a billing statement first
      const billingStatement = await this.testBillingStatementActions();
      if (!billingStatement) {
        throw new Error('Failed to create billing statement for delivery receipt test');
      }

      // Test createDeliveryReceipt
      const receiptData = {
        receiptNumber: `UI-DR-${Date.now()}`,
        billingStatementId: billingStatement.id,
        deliveryDate: new Date(),
        deliveryAddress: '123 UI Test Street, Test City, TC 12345',
        receivedBy: 'UI Test Receiver',
        receivedByTitle: 'Test Manager',
        deliveryStatus: DeliveryStatus.DELIVERED,
        deliveryNotes: 'UI test delivery receipt',
        trackingNumber: 'UI-TRACK-123',
        courierService: 'UI Test Courier'
      };

      const createdReceipt = await createDeliveryReceipt(receiptData);
      
      if (!createdReceipt.success) {
        throw new Error(createdReceipt.error || 'Failed to create delivery receipt');
      }

      this.addResult(
        'Create Delivery Receipt Action',
        true,
        'Successfully created delivery receipt via server action'
      );

      // Test getDeliveryReceiptById
      const retrievedReceipt = await getDeliveryReceiptById(createdReceipt.data.id);
      
      if (!retrievedReceipt.success) {
        throw new Error(retrievedReceipt.error || 'Failed to retrieve delivery receipt');
      }

      this.addResult(
        'Get Delivery Receipt Action',
        true,
        'Successfully retrieved delivery receipt via server action'
      );

      // Test updateDeliveryReceipt
      const updateData = {
        ...retrievedReceipt.data,
        deliveryStatus: DeliveryStatus.DELIVERED,
        deliveryNotes: 'Updated via UI test'
      };

      const updatedReceipt = await updateDeliveryReceipt(createdReceipt.data.id, updateData);
      
      if (!updatedReceipt.success) {
        throw new Error(updatedReceipt.error || 'Failed to update delivery receipt');
      }

      this.addResult(
        'Update Delivery Receipt Action',
        true,
        'Successfully updated delivery receipt via server action'
      );

      // Test getAllDeliveryReceipts
      const allReceipts = await getAllDeliveryReceipts();
      
      if (!allReceipts.success) {
        throw new Error(allReceipts.error || 'Failed to get all delivery receipts');
      }

      const foundReceipt = allReceipts.data.find(
        receipt => receipt.id === createdReceipt.data.id
      );

      this.addResult(
        'Get All Delivery Receipts Action',
        !!foundReceipt,
        foundReceipt ? 'Successfully retrieved all delivery receipts' : 'Created receipt not found in list'
      );

      return createdReceipt.data;
    } catch (error) {
      this.addResult(
        'Delivery Receipt Actions',
        false,
        'Failed to test delivery receipt server actions',
        error
      );
      return null;
    }
  }

  async testFormValidation() {
    try {
      let validationTests = 0;
      let passedTests = 0;

      // Test 1: Billing statement without customer info
      try {
        await createBillingStatement({
          statementNumber: `INVALID-BS-${Date.now()}`,
          totalAmount: 100.00,
          netAmount: 100.00
          // Missing customerId and customerOrderId
        });
        validationTests++;
      } catch (error) {
        validationTests++;
        passedTests++;
      }

      // Test 2: Sales invoice without billing statement
      try {
        await createSalesInvoice({
          invoiceNumber: `INVALID-INV-${Date.now()}`,
          subtotal: 100.00,
          totalAmount: 100.00
          // Missing billingStatementId
        });
        validationTests++;
      } catch (error) {
        validationTests++;
        passedTests++;
      }

      // Test 3: Delivery receipt without billing statement
      try {
        await createDeliveryReceipt({
          receiptNumber: `INVALID-DR-${Date.now()}`,
          deliveryDate: new Date(),
          deliveryAddress: 'Test Address',
          receivedBy: 'Test Receiver'
          // Missing billingStatementId
        });
        validationTests++;
      } catch (error) {
        validationTests++;
        passedTests++;
      }

      const isValid = passedTests >= validationTests * 0.8; // Allow some flexibility

      this.addResult(
        'Form Validation',
        isValid,
        `${passedTests}/${validationTests} validation tests passed`
      );
    } catch (error) {
      this.addResult(
        'Form Validation',
        false,
        'Failed to test form validation',
        error
      );
    }
  }

  async testErrorHandling() {
    try {
      let errorTests = 0;
      let handledErrors = 0;

      // Test 1: Get non-existent billing statement
      try {
        const result = await getBillingStatementById('non-existent-id');
        if (!result.success) {
          handledErrors++;
        }
        errorTests++;
      } catch (error) {
        errorTests++;
        handledErrors++;
      }

      // Test 2: Get non-existent sales invoice
      try {
        const result = await getSalesInvoiceById('non-existent-id');
        if (!result.success) {
          handledErrors++;
        }
        errorTests++;
      } catch (error) {
        errorTests++;
        handledErrors++;
      }

      // Test 3: Get non-existent delivery receipt
      try {
        const result = await getDeliveryReceiptById('non-existent-id');
        if (!result.success) {
          handledErrors++;
        }
        errorTests++;
      } catch (error) {
        errorTests++;
        handledErrors++;
      }

      const isValid = handledErrors >= errorTests * 0.8;

      this.addResult(
        'Error Handling',
        isValid,
        `${handledErrors}/${errorTests} error handling tests passed`
      );
    } catch (error) {
      this.addResult(
        'Error Handling',
        false,
        'Failed to test error handling',
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
            contains: 'UI-DR-'
          }
        }
      });

      await prisma.salesInvoice.deleteMany({
        where: {
          invoiceNumber: {
            contains: 'UI-INV-'
          }
        }
      });

      await prisma.billingStatement.deleteMany({
        where: {
          statementNumber: {
            contains: 'UI-BS-'
          }
        }
      });

      await prisma.customer.deleteMany({
        where: {
          code: {
            startsWith: 'UI-CUST-'
          }
        }
      });

      console.log('\n🧹 UI test data cleanup completed');
    } catch (error) {
      console.error('UI cleanup failed:', error);
    }
  }

  printSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('\n' + '='.repeat(60));
    console.log('📊 BILLING UI VALIDATION SUMMARY');
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
      console.log('\n🎉 All UI tests passed! The billing system UI is working correctly.');
    } else {
      console.log('\n⚠️  Some UI tests failed. Please review the issues above.');
    }
  }
}

// Run the UI validation
async function main() {
  const validator = new BillingUIValidator();
  await validator.runAllTests();
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('UI validation failed:', error);
    process.exit(1);
  });
}

export { BillingUIValidator };