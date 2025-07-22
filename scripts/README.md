# Billing Schema Migration Scripts

This directory contains scripts for migrating the billing system to the new simplified schema structure.

## Overview

The billing schema simplification involves:
- Streamlining relationships between BillingStatement, SalesInvoice, and DeliveryReceipt
- Ensuring proper data integrity and foreign key relationships
- Populating customer names from related customer records
- Handling orphaned records by creating appropriate billing statements

## Scripts

### 1. `billing-schema-migration.ts`
The main migration script that handles:
- Updating existing BillingStatement records with proper customer names
- Creating billing statements for orphaned SalesInvoice records
- Creating billing statements for orphaned DeliveryReceipt records
- Validating data integrity
- Updating financial calculations

### 2. `test-billing-migration.ts`
A comprehensive test script that:
- Creates sample data for testing
- Runs the migration process
- Validates the results
- Cleans up test data

### 3. `run-billing-migration.ts`
A production-ready script to run the migration with:
- Safety confirmations for production environments
- Comprehensive error reporting
- Migration statistics

## Usage

### Testing the Migration
Before running on production data, test the migration:

```bash
npx tsx scripts/test-billing-migration.ts
```

This will:
1. Create sample billing data
2. Run the migration
3. Validate the results
4. Clean up test data

### Running the Migration
To run the actual migration on your database:

```bash
npx tsx scripts/run-billing-migration.ts
```

**⚠️ Important:** Make sure to backup your database before running the migration!

### Manual SQL Migration
If you prefer to run the SQL migration manually:

```bash
psql -d your_database -f prisma/migrations/billing-schema-data-migration.sql
```

## Migration Process

The migration follows these steps:

1. **Update Customer Names**: Ensures all BillingStatement records have proper customer names derived from related Customer or CustomerOrder records.

2. **Handle Orphaned Invoices**: Creates billing statements for any SalesInvoice records that don't have proper billing statement references.

3. **Handle Orphaned Receipts**: Creates billing statements for any DeliveryReceipt records that don't have proper billing statement references.

4. **Data Validation**: Checks for data integrity issues and reports them.

5. **Financial Calculations**: Updates net amounts to ensure consistency.

6. **Final Validation**: Performs comprehensive checks to ensure all relationships are properly established.

## Data Integrity Checks

The migration includes several validation steps:

- All BillingStatement records have meaningful customer names
- All SalesInvoice records are linked to valid billing statements
- All DeliveryReceipt records are linked to valid billing statements
- Financial calculations are consistent
- Relationship integrity is maintained

## Error Handling

The migration script includes comprehensive error handling:
- Individual record failures don't stop the entire migration
- All errors are logged and reported
- Migration statistics provide visibility into the process
- Validation ensures data integrity after migration

## Rollback

If you need to rollback the migration:
1. Restore from your database backup
2. Review the migration logs to understand what changes were made
3. Consider running only specific parts of the migration if needed

## Support

If you encounter issues with the migration:
1. Check the error logs for specific issues
2. Verify your database schema matches the expected structure
3. Ensure all required relationships exist in your data
4. Test with the test script first to identify potential issues