#!/usr/bin/env tsx

/**
 * Test script to verify billing query performance with new relationship structure
 * This script tests the optimized queries and joins implemented in task 10
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

interface QueryPerformanceResult {
  queryName: string;
  executionTime: number;
  recordCount: number;
  success: boolean;
  error?: string;
}

async function measureQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<QueryPerformanceResult> {
  try {
    const startTime = performance.now();
    const result = await queryFn();
    const endTime = performance.now();
    
    const recordCount = Array.isArray(result) ? result.length : 1;
    
    return {
      queryName,
      executionTime: endTime - startTime,
      recordCount,
      success: true,
    };
  } catch (error) {
    return {
      queryName,
      executionTime: 0,
      recordCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testBillingStatementQueries(): Promise<QueryPerformanceResult[]> {
  console.log('🔍 Testing Billing Statement Queries...');
  
  const results: QueryPerformanceResult[] = [];

  // Test 1: Get all billing statements with optimized relationships
  results.push(await measureQueryPerformance(
    'getAllBillingStatements_optimized',
    async () => {
      return await prisma.billingStatement.findMany({
        take: 50,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customerOrder: {
            select: {
              id: true,
              orderNumber: true,
              orderDate: true,
            },
          },
          // One-to-many relationship with delivery receipts
          deliveryReceipts: {
            select: {
              id: true,
              receiptNumber: true,
              deliveryDate: true,
              deliveryStatus: true,
            },
            orderBy: { deliveryDate: 'desc' },
          },
          // One-to-one relationship with sales invoice
          salesInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              status: true,
            },
          },
        },
        orderBy: { billingDate: 'desc' },
      });
    }
  ));

  // Test 2: Search billing statements using customerName field
  results.push(await measureQueryPerformance(
    'searchBillingStatements_customerName',
    async () => {
      return await prisma.billingStatement.findMany({
        where: {
          OR: [
            {
              customerName: {
                contains: 'test',
                mode: 'insensitive',
              },
            },
            {
              statementNumber: {
                contains: 'BS-',
                mode: 'insensitive',
              },
            },
          ],
        },
        take: 20,
      });
    }
  ));

  // Test 3: Get billing statement analytics using optimized groupBy
  results.push(await measureQueryPerformance(
    'getBillingAnalytics_optimized',
    async () => {
      return await prisma.billingStatement.groupBy({
        by: ['customerId', 'customerName'],
        _count: true,
        _sum: {
          totalAmount: true,
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: 10,
      });
    }
  ));

  return results;
}

async function testSalesInvoiceQueries(): Promise<QueryPerformanceResult[]> {
  console.log('💰 Testing Sales Invoice Queries...');
  
  const results: QueryPerformanceResult[] = [];

  // Test 1: Get sales invoices with billing statement relationship
  results.push(await measureQueryPerformance(
    'getSalesInvoices_withBillingStatement',
    async () => {
      return await prisma.salesInvoice.findMany({
        take: 50,
        include: {
          billingStatement: {
            select: {
              id: true,
              statementNumber: true,
              customerName: true, // Use cached customerName field
              billingDate: true,
              status: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          invoiceItems: {
            take: 5,
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { invoiceDate: 'desc' },
      });
    }
  ));

  // Test 2: Search sales invoices using billing statement customerName
  results.push(await measureQueryPerformance(
    'searchSalesInvoices_customerName',
    async () => {
      return await prisma.salesInvoice.findMany({
        where: {
          OR: [
            {
              invoiceNumber: {
                contains: 'INV-',
                mode: 'insensitive',
              },
            },
            {
              billingStatement: {
                customerName: {
                  contains: 'test',
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        take: 20,
      });
    }
  ));

  // Test 3: Get sales analytics by customer using optimized relationship
  results.push(await measureQueryPerformance(
    'getSalesAnalytics_byCustomer',
    async () => {
      return await prisma.salesInvoice.groupBy({
        by: ['billingStatementId'],
        where: {
          status: 'PAID',
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: 10,
      });
    }
  ));

  return results;
}

async function testDeliveryReceiptQueries(): Promise<QueryPerformanceResult[]> {
  console.log('🚚 Testing Delivery Receipt Queries...');
  
  const results: QueryPerformanceResult[] = [];

  // Test 1: Get delivery receipts with billing statement relationship
  results.push(await measureQueryPerformance(
    'getDeliveryReceipts_withBillingStatement',
    async () => {
      return await prisma.deliveryReceipt.findMany({
        take: 50,
        include: {
          billingStatement: {
            select: {
              id: true,
              statementNumber: true,
              customerName: true, // Use cached customerName field
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              customerOrder: {
                select: {
                  id: true,
                  orderNumber: true,
                },
              },
            },
          },
        },
        orderBy: { deliveryDate: 'desc' },
      });
    }
  ));

  // Test 2: Search delivery receipts using billing statement customerName
  results.push(await measureQueryPerformance(
    'searchDeliveryReceipts_customerName',
    async () => {
      return await prisma.deliveryReceipt.findMany({
        where: {
          OR: [
            {
              receiptNumber: {
                contains: 'DR-',
                mode: 'insensitive',
              },
            },
            {
              billingStatement: {
                customerName: {
                  contains: 'test',
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        take: 20,
      });
    }
  ));

  // Test 3: Get delivery analytics using optimized queries
  results.push(await measureQueryPerformance(
    'getDeliveryAnalytics_optimized',
    async () => {
      const [totalDeliveries, successfulDeliveries] = await Promise.all([
        prisma.deliveryReceipt.count(),
        prisma.deliveryReceipt.count({
          where: { deliveryStatus: 'DELIVERED' },
        }),
      ]);
      
      return { totalDeliveries, successfulDeliveries };
    }
  ));

  return results;
}

async function testReportingQueries(): Promise<QueryPerformanceResult[]> {
  console.log('📊 Testing Reporting Queries...');
  
  const results: QueryPerformanceResult[] = [];

  // Test 1: Monthly revenue trends using optimized groupBy
  results.push(await measureQueryPerformance(
    'getMonthlyRevenueTrends',
    async () => {
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
      const endDate = new Date();
      
      return await prisma.billingStatement.groupBy({
        by: ['billingDate'],
        where: {
          billingDate: {
            gte: startDate,
            lte: endDate,
          },
          status: 'PAID',
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      });
    }
  ));

  // Test 2: Top customers using customerName field
  results.push(await measureQueryPerformance(
    'getTopCustomers_optimized',
    async () => {
      return await prisma.billingStatement.groupBy({
        by: ['customerId', 'customerName'],
        _count: true,
        _sum: {
          totalAmount: true,
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: 10,
      });
    }
  ));

  // Test 3: Customer billing report with optimized joins
  results.push(await measureQueryPerformance(
    'getCustomerBillingReport',
    async () => {
      // Get first customer for testing
      const firstCustomer = await prisma.customer.findFirst();
      if (!firstCustomer) return [];
      
      return await prisma.billingStatement.findMany({
        where: {
          customerId: firstCustomer.id,
        },
        include: {
          customerOrder: {
            select: {
              orderNumber: true,
              orderDate: true,
            },
          },
          salesInvoice: {
            select: {
              invoiceNumber: true,
              invoiceDate: true,
            },
          },
          deliveryReceipts: {
            select: {
              receiptNumber: true,
              deliveryDate: true,
              deliveryStatus: true,
            },
          },
        },
        orderBy: { billingDate: 'desc' },
        take: 20,
      });
    }
  ));

  return results;
}

async function testIndexPerformance(): Promise<QueryPerformanceResult[]> {
  console.log('🔍 Testing Index Performance...');
  
  const results: QueryPerformanceResult[] = [];

  // Test 1: Query using customerName index
  results.push(await measureQueryPerformance(
    'customerName_index_performance',
    async () => {
      return await prisma.billingStatement.findMany({
        where: {
          customerName: {
            contains: 'test',
            mode: 'insensitive',
          },
        },
        take: 100,
      });
    }
  ));

  // Test 2: Query using status index
  results.push(await measureQueryPerformance(
    'status_index_performance',
    async () => {
      return await prisma.billingStatement.findMany({
        where: {
          status: 'PAID',
        },
        take: 100,
      });
    }
  ));

  // Test 3: Query using billingDate index
  results.push(await measureQueryPerformance(
    'billingDate_index_performance',
    async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return await prisma.billingStatement.findMany({
        where: {
          billingDate: {
            gte: startDate,
          },
        },
        take: 100,
      });
    }
  ));

  // Test 4: Query using billingStatementId index in sales invoices
  results.push(await measureQueryPerformance(
    'billingStatementId_index_performance',
    async () => {
      return await prisma.salesInvoice.findMany({
        where: {
          billingStatementId: {
            not: undefined,
          },
        },
        take: 100,
      });
    }
  ));

  return results;
}

function printResults(results: QueryPerformanceResult[], category: string) {
  console.log(`\n📈 ${category} Results:`);
  console.log('─'.repeat(80));
  
  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    const time = result.success ? `${result.executionTime.toFixed(2)}ms` : 'FAILED';
    const records = result.success ? `${result.recordCount} records` : '';
    
    console.log(`${status} ${result.queryName.padEnd(35)} ${time.padStart(10)} ${records}`);
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

function generatePerformanceReport(allResults: QueryPerformanceResult[]) {
  console.log('\n📊 Performance Summary:');
  console.log('─'.repeat(80));
  
  const successfulQueries = allResults.filter(r => r.success);
  const failedQueries = allResults.filter(r => !r.success);
  
  console.log(`Total Queries: ${allResults.length}`);
  console.log(`Successful: ${successfulQueries.length}`);
  console.log(`Failed: ${failedQueries.length}`);
  
  if (successfulQueries.length > 0) {
    const avgTime = successfulQueries.reduce((sum, r) => sum + r.executionTime, 0) / successfulQueries.length;
    const maxTime = Math.max(...successfulQueries.map(r => r.executionTime));
    const minTime = Math.min(...successfulQueries.map(r => r.executionTime));
    
    console.log(`Average Execution Time: ${avgTime.toFixed(2)}ms`);
    console.log(`Max Execution Time: ${maxTime.toFixed(2)}ms`);
    console.log(`Min Execution Time: ${minTime.toFixed(2)}ms`);
    
    // Identify slow queries (> 100ms)
    const slowQueries = successfulQueries.filter(r => r.executionTime > 100);
    if (slowQueries.length > 0) {
      console.log('\n⚠️  Slow Queries (>100ms):');
      slowQueries.forEach(q => {
        console.log(`   ${q.queryName}: ${q.executionTime.toFixed(2)}ms`);
      });
    }
  }
  
  if (failedQueries.length > 0) {
    console.log('\n❌ Failed Queries:');
    failedQueries.forEach(q => {
      console.log(`   ${q.queryName}: ${q.error}`);
    });
  }
}

async function main() {
  console.log('🚀 Starting Billing Query Performance Tests...\n');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Run all test suites
    const billingResults = await testBillingStatementQueries();
    const salesResults = await testSalesInvoiceQueries();
    const deliveryResults = await testDeliveryReceiptQueries();
    const reportingResults = await testReportingQueries();
    const indexResults = await testIndexPerformance();
    
    // Print results for each category
    printResults(billingResults, 'Billing Statement Queries');
    printResults(salesResults, 'Sales Invoice Queries');
    printResults(deliveryResults, 'Delivery Receipt Queries');
    printResults(reportingResults, 'Reporting Queries');
    printResults(indexResults, 'Index Performance');
    
    // Generate overall performance report
    const allResults = [
      ...billingResults,
      ...salesResults,
      ...deliveryResults,
      ...reportingResults,
      ...indexResults,
    ];
    
    generatePerformanceReport(allResults);
    
    console.log('\n✅ Query performance testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as testBillingQueryPerformance };