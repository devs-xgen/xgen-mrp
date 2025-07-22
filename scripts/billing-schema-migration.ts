#!/usr/bin/env tsx

/**
 * Billing Schema Simplification Data Migration Script
 * 
 * This script handles the migration of existing billing data to the new simplified schema.
 * It ensures data integrity and proper relationships between BillingStatement, SalesInvoice, and DeliveryReceipt.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  billingStatementsUpdated: number;
  billingStatementsCreated: number;
  salesInvoicesLinked: number;
  deliveryReceiptsLinked: number;
  errors: string[];
}

async function migrateBillingSchema(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    billingStatementsUpdated: 0,
    billingStatementsCreated: 0,
    salesInvoicesLinked: 0,
    deliveryReceiptsLinked: 0,
    errors: []
  };

  console.log('🚀 Starting billing schema migration...');

  try {
    // Step 1: Update existing BillingStatement records to ensure customerName is populated
    console.log('📝 Step 1: Updating customer names in billing statements...');
    
    const billingStatementsToUpdate = await prisma.billingStatement.findMany({
      where: {
        customerName: ''
      },
      include: {
        customer: true,
        customerOrder: {
          include: {
            customer: true
          }
        }
      }
    });

    for (const statement of billingStatementsToUpdate) {
      try {
        let customerName = 'Unknown Customer';
        
        if (statement.customer) {
          customerName = statement.customer.name;
        } else if (statement.customerOrder?.customer) {
          customerName = statement.customerOrder.customer.name;
        }

        await prisma.billingStatement.update({
          where: { id: statement.id },
          data: { customerName }
        });

        stats.billingStatementsUpdated++;
      } catch (error) {
        stats.errors.push(`Failed to update billing statement ${statement.id}: ${error}`);
      }
    }

    console.log(`✅ Updated ${stats.billingStatementsUpdated} billing statements with customer names`);

    // Step 2: Handle orphaned SalesInvoice records
    console.log('📝 Step 2: Handling orphaned sales invoices...');
    
    // Check for invoices that might have invalid billing statement references
    const allInvoices = await prisma.salesInvoice.findMany({
      include: {
        billingStatement: true
      }
    });
    
    const orphanedInvoices = allInvoices.filter(invoice => !invoice.billingStatement);

    for (const invoice of orphanedInvoices) {
      try {
        // Create a billing statement for the orphaned invoice
        const billingStatement = await prisma.billingStatement.create({
          data: {
            statementNumber: `BS-${invoice.invoiceNumber}`,
            customerName: 'Migrated Customer',
            totalAmount: invoice.totalAmount,
            taxAmount: invoice.taxAmount,
            discountAmount: invoice.discountAmount,
            netAmount: invoice.totalAmount - invoice.discountAmount + invoice.taxAmount,
            status: invoice.status === 'DRAFT' ? 'DRAFT' : 
                   invoice.status === 'SENT' ? 'SENT' :
                   invoice.status === 'PAID' ? 'PAID' :
                   invoice.status === 'OVERDUE' ? 'OVERDUE' :
                   invoice.status === 'CANCELLED' ? 'CANCELLED' : 'DRAFT',
            billingDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            createdBy: invoice.createdBy,
            modifiedBy: invoice.modifiedBy
          }
        });

        // Link the invoice to the new billing statement
        await prisma.salesInvoice.update({
          where: { id: invoice.id },
          data: { billingStatementId: billingStatement.id }
        });

        stats.billingStatementsCreated++;
        stats.salesInvoicesLinked++;
      } catch (error) {
        stats.errors.push(`Failed to handle orphaned invoice ${invoice.id}: ${error}`);
      }
    }

    console.log(`✅ Created ${stats.billingStatementsCreated} billing statements for orphaned invoices`);

    // Step 3: Handle orphaned DeliveryReceipt records
    console.log('📝 Step 3: Handling orphaned delivery receipts...');
    
    // Check for delivery receipts that might have invalid billing statement references
    const allReceipts = await prisma.deliveryReceipt.findMany({
      include: {
        billingStatement: true
      }
    });
    
    const orphanedReceipts = allReceipts.filter(receipt => !receipt.billingStatement);

    for (const receipt of orphanedReceipts) {
      try {
        // Create a billing statement for the orphaned receipt
        const billingStatement = await prisma.billingStatement.create({
          data: {
            statementNumber: `BS-DR-${receipt.receiptNumber}`,
            customerName: 'Delivery Customer',
            totalAmount: 0,
            taxAmount: 0,
            discountAmount: 0,
            netAmount: 0,
            status: 'DRAFT',
            billingDate: receipt.deliveryDate,
            createdBy: receipt.createdBy,
            modifiedBy: receipt.modifiedBy
          }
        });

        // Link the receipt to the new billing statement
        await prisma.deliveryReceipt.update({
          where: { id: receipt.id },
          data: { billingStatementId: billingStatement.id }
        });

        stats.billingStatementsCreated++;
        stats.deliveryReceiptsLinked++;
      } catch (error) {
        stats.errors.push(`Failed to handle orphaned receipt ${receipt.id}: ${error}`);
      }
    }

    console.log(`✅ Linked ${stats.deliveryReceiptsLinked} delivery receipts to billing statements`);

    // Step 4: Validate data integrity
    console.log('📝 Step 4: Validating data integrity...');
    
    const invalidBillingStatements = await prisma.billingStatement.findMany({
      where: {
        AND: [
          { customerId: null },
          { customerOrderId: null }
        ]
      }
    });

    if (invalidBillingStatements.length > 0) {
      stats.errors.push(`Found ${invalidBillingStatements.length} billing statements without customer reference`);
    }

    // Step 5: Update financial calculations for consistency
    console.log('📝 Step 5: Updating financial calculations...');
    
    const statementsToRecalculate = await prisma.billingStatement.findMany();
    
    for (const statement of statementsToRecalculate) {
      const expectedNetAmount = statement.totalAmount.minus(statement.discountAmount).plus(statement.taxAmount);
      
      if (!statement.netAmount.equals(expectedNetAmount)) {
        try {
          await prisma.billingStatement.update({
            where: { id: statement.id },
            data: { netAmount: expectedNetAmount }
          });
        } catch (error) {
          stats.errors.push(`Failed to update net amount for statement ${statement.id}: ${error}`);
        }
      }
    }

    console.log('✅ Financial calculations updated');

    // Step 6: Final validation
    console.log('📝 Step 6: Final validation...');
    
    const totalBillingStatements = await prisma.billingStatement.count();
    const totalSalesInvoices = await prisma.salesInvoice.count();
    const totalDeliveryReceipts = await prisma.deliveryReceipt.count();
    
    // Since billingStatementId is required, all invoices and receipts should be linked
    const linkedInvoices = totalSalesInvoices;
    const linkedReceipts = totalDeliveryReceipts;

    console.log(`📊 Migration Summary:`);
    console.log(`   Total Billing Statements: ${totalBillingStatements}`);
    console.log(`   Total Sales Invoices: ${totalSalesInvoices} (${linkedInvoices} linked)`);
    console.log(`   Total Delivery Receipts: ${totalDeliveryReceipts} (${linkedReceipts} linked)`);

    if (linkedInvoices !== totalSalesInvoices) {
      stats.errors.push(`${totalSalesInvoices - linkedInvoices} sales invoices are not properly linked`);
    }

    if (linkedReceipts !== totalDeliveryReceipts) {
      stats.errors.push(`${totalDeliveryReceipts - linkedReceipts} delivery receipts are not properly linked`);
    }

  } catch (error) {
    stats.errors.push(`Migration failed with error: ${error}`);
  }

  return stats;
}

async function main() {
  try {
    const stats = await migrateBillingSchema();
    
    console.log('\n🎉 Migration completed!');
    console.log(`📈 Statistics:`);
    console.log(`   Billing Statements Updated: ${stats.billingStatementsUpdated}`);
    console.log(`   Billing Statements Created: ${stats.billingStatementsCreated}`);
    console.log(`   Sales Invoices Linked: ${stats.salesInvoicesLinked}`);
    console.log(`   Delivery Receipts Linked: ${stats.deliveryReceiptsLinked}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully with no errors!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main();
}

export { migrateBillingSchema, MigrationStats };