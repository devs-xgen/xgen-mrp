import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting customers and suppliers seeding...");

  try {
    // 1. Create 3 Sample Customers
    console.log("👥 Creating Customers...");
    const customers = await Promise.all([
      prisma.customer.upsert({
        where: { code: "CUST001" },
        update: {},
        create: {
          code: "CUST001",
          name: "Metro Fashion Boutique",
          contactPerson: "Ana Maria Rodriguez",
          email: "ana@metrofashion.com",
          phone: "+63 2 555 0101",
          address: "456 Fashion Avenue, Makati Business District",
          city: "Makati",
          state: "Metro Manila",
          country: "Philippines",
          postalCode: "1200",
          tinNumber: "123-456-789-000",
          creditLimit: 500000.0,
          paymentTerms: "Net 30",
          status: Status.ACTIVE,
          notes:
            "Premium fashion boutique chain with multiple locations. High-volume orders, excellent payment history.",
        },
      }),
      prisma.customer.upsert({
        where: { code: "CUST002" },
        update: {},
        create: {
          code: "CUST002",
          name: "Cebu Retail Group Inc.",
          contactPerson: "Miguel Santos",
          email: "miguel@ceburetail.com",
          phone: "+63 32 123 4567",
          address: "789 Commerce Street, IT Park",
          city: "Cebu City",
          state: "Cebu",
          country: "Philippines",
          postalCode: "6000",
          tinNumber: "234-567-890-000",
          creditLimit: 750000.0,
          paymentTerms: "Net 45",
          status: Status.ACTIVE,
          notes:
            "Large retail group covering Visayas region. Seasonal bulk orders, reliable long-term partner.",
        },
      }),
      prisma.customer.upsert({
        where: { code: "CUST003" },
        update: {},
        create: {
          code: "CUST003",
          name: "Davao Sports & Lifestyle Co.",
          contactPerson: "Sarah Tanaka",
          email: "sarah@davaosports.com",
          phone: "+63 82 987 6543",
          address: "321 Athletic Boulevard, Poblacion District",
          city: "Davao City",
          state: "Davao del Sur",
          country: "Philippines",
          postalCode: "8000",
          tinNumber: "345-678-901-000",
          creditLimit: 300000.0,
          paymentTerms: "Net 15",
          status: Status.ACTIVE,
          notes:
            "Specializes in sports and active wear. Fast payment terms, growing customer base in Mindanao.",
        },
      }),
    ]);

    // 2. Create 3 Additional Suppliers (different from materials-products seeder)
    console.log("🏭 Creating Additional Suppliers...");
    const suppliers = await Promise.all([
      prisma.supplier.upsert({
        where: { code: "SUP004" },
        update: {},
        create: {
          code: "SUP004",
          name: "Asian Textile Manufacturing Co.",
          contactPerson: "Chen Wei Lin",
          email: "chen@asiantextile.com",
          phone: "+63 2 789 0123",
          address: "567 Industrial Complex, Laguna Technopark",
          city: "Santa Rosa",
          state: "Laguna",
          country: "Philippines",
          postalCode: "4026",
          leadTime: 12,
          paymentTerms: "Net 60",
          status: Status.ACTIVE,
          notes:
            "Large-scale textile manufacturer with automated production lines. Excellent quality control and competitive pricing.",
        },
      }),
      prisma.supplier.upsert({
        where: { code: "SUP005" },
        update: {},
        create: {
          code: "SUP005",
          name: "Premium Leather Goods Supplier",
          contactPerson: "Marco Valenzuela",
          email: "marco@premiumleather.com",
          phone: "+63 2 456 7890",
          address: "890 Leather District, Marikina Industrial Area",
          city: "Marikina",
          state: "Metro Manila",
          country: "Philippines",
          postalCode: "1800",
          leadTime: 21,
          paymentTerms: "Net 45",
          status: Status.ACTIVE,
          notes:
            "Specialized supplier of high-quality leather materials. Eco-friendly tanning processes, premium grades available.",
        },
      }),
      prisma.supplier.upsert({
        where: { code: "SUP006" },
        update: {},
        create: {
          code: "SUP006",
          name: "Innovative Packaging Solutions Inc.",
          contactPerson: "Lisa Fernandez",
          email: "lisa@innovativepack.com",
          phone: "+63 49 234 5678",
          address: "234 Packaging Avenue, PEZA Zone",
          city: "Biñan",
          state: "Laguna",
          country: "Philippines",
          postalCode: "4024",
          leadTime: 5,
          paymentTerms: "Net 30",
          status: Status.ACTIVE,
          notes:
            "Modern packaging solutions with sustainable materials. Fast turnaround, custom designs available.",
        },
      }),
    ]);

    console.log("✅ Customers and Suppliers seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   👥 Customers: ${customers.length}`);
    console.log(`   🏭 Suppliers: ${suppliers.length}`);

    console.log("\n🎯 Sample Customers Created:");
    customers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name} (${customer.code})`);
      console.log(
        `      Contact: ${customer.contactPerson} - ${customer.email}`
      );
      console.log(`      Location: ${customer.city}, ${customer.state}`);
      console.log(
        `      Credit Limit: ₱${customer.creditLimit?.toLocaleString()}`
      );
      console.log(`      Payment Terms: ${customer.paymentTerms}`);
      console.log("");
    });

    console.log("🎯 Sample Suppliers Created:");
    suppliers.forEach((supplier, index) => {
      console.log(`   ${index + 1}. ${supplier.name} (${supplier.code})`);
      console.log(
        `      Contact: ${supplier.contactPerson} - ${supplier.email}`
      );
      console.log(`      Location: ${supplier.city}, ${supplier.state}`);
      console.log(`      Lead Time: ${supplier.leadTime} days`);
      console.log(`      Payment Terms: ${supplier.paymentTerms}`);
      console.log("");
    });

    console.log("💼 Customer Profile Summary:");
    console.log(
      "   • Metro Fashion Boutique - Premium fashion chain (₱500K credit)"
    );
    console.log(
      "   • Cebu Retail Group - Large Visayas retailer (₱750K credit)"
    );
    console.log(
      "   • Davao Sports & Lifestyle - Sports/active wear specialist (₱300K credit)"
    );

    console.log("\n🏭 Supplier Specializations:");
    console.log(
      "   • Asian Textile Manufacturing - Large-scale textile production"
    );
    console.log("   • Premium Leather Goods - High-quality leather materials");
    console.log(
      "   • Innovative Packaging Solutions - Sustainable packaging materials"
    );
  } catch (error) {
    console.error("❌ Error during customers and suppliers seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Database connection closed.");
  });
