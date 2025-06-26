# XGen MRP Database Seeder

This directory contains scripts for populating the XGen MRP database with test data.

## Comprehensive Seeder

The `comprehensive-seed.ts` file creates a complete set of test data for the XGen MRP system, including:

### What Gets Created

- **3 Test Users** with different roles (Admin, Worker, Inspector)
- **4 Units of Measure** (Pieces, Meters, Kilograms, Liters)
- **4 Material Types** (Fabric, Thread, Accessories, Packaging)
- **2 Product Categories** (Clothing, Accessories)
- **2 Suppliers** with contact information
- **5 Materials** with stock levels and costs
- **4 Work Centers** for production operations
- **2 Products** with variant support (T-Shirt, Polo Shirt)
- **42 Product Variants** (combinations of sizes and colors)
- **Complete BOMs** (both product-level and variant-specific)
- **2 Customers** with complete business information
- **2 Customer Orders** with line items
- **4 Order Lines** referencing specific product variants
- **2 Production Orders** linked to customer orders and variants
- **2 Operations** with work center assignments
- **1 Quality Check** with inspection results
- **1 Purchase Order** with line items

### Running the Seeder

```bash
# Run the comprehensive seeder
npm run seed:comprehensive
```

**⚠️ Warning**: This script will **DELETE ALL EXISTING DATA** in the database before creating new test data. Only run this on development/test databases.

### Test Login Credentials

After running the seeder, you can login with these credentials:

- **Admin**: `admin@xgenmrp.com` / `password123`
- **Worker**: `worker@xgenmrp.com` / `password123`
- **Inspector**: `inspector@xgenmrp.com` / `password123`

### What This Enables You to Test

1. **Production Variant Tracking**: Production orders are created with specific variants (e.g., "T-Shirt Medium White")
2. **Variant-Specific BOMs**: Different material requirements based on size and color
3. **Customer Order Processing**: Complete workflow from customer order to production
4. **Material Management**: Stock levels, suppliers, and procurement
5. **Work Center Operations**: Production operations across different work centers
6. **Quality Control**: Inspection processes and quality checks
7. **User Role Management**: Different access levels and permissions

### Key Features Demonstrated

- **Product Variants**: T-shirts in 6 sizes × 5 colors = 30 variants, Polo shirts in 4 sizes × 3 colors = 12 variants
- **Size-Based Material Calculations**: Different material quantities based on garment size
- **Production Tracking**: Complete traceability from customer order to production completion
- **Multi-Role System**: Admin, Worker, and Inspector roles with appropriate permissions

### Modifying the Seeder

To customize the test data:

1. **Add More Products**: Extend the product creation section with new product types
2. **Change Variants**: Modify the `sizes` and `colors` arrays to create different combinations
3. **Adjust Stock Levels**: Update the `currentStock` and `minimumStockLevel` values
4. **Add More Customers/Orders**: Create additional customer scenarios
5. **Configure Work Centers**: Add more work centers or modify capacities

### Safety Features

The seeder includes proper:
- **Foreign Key Constraint Handling**: Deletes data in the correct order
- **Error Handling**: Catches and reports any seeding failures
- **Type Safety**: Uses Prisma types to ensure data consistency
- **Decimal Handling**: Properly handles Prisma Decimal types for prices and costs

### Troubleshooting

If the seeder fails:

1. **Check Database Connection**: Ensure your `.env` file has the correct `DATABASE_URL`
2. **Verify Schema**: Run `npx prisma db push` to ensure schema is up to date
3. **Check Dependencies**: Ensure `bcryptjs` is installed for password hashing
4. **Foreign Key Errors**: The script handles deletion order, but check for any new relationships

### Alternative Seeders

- `prisma/seed.ts` - Original Prisma seeder (basic data)
- `scripts/link-inspectors.ts` - Links existing inspectors to user accounts

Choose the appropriate seeder based on your testing needs. 