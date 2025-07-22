import {
  PrismaClient,
  BillingStatus,
  DeliveryStatus,
  InvoiceStatus,
  Role,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("💰 Starting enhanced billing data seeding...");

  try {
    // Get existing users and data
    const adminUser = await prisma.user.findFirst({
      where: { role: Role.ADMIN }
    });

    const deliveryUser = await prisma.user.findFirst({
      where: { role: Role.DELIVERY }
    });

    if (!adminUser) {
      console.log("❌ No admin user found. Please run the comprehensive seed first.");
      return;
    }

    // Create delivery user if not exists
    let deliveryUserFinal = deliveryUser;
    if (!deliveryUser) {
      console.log("📦 Creating delivery user...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      deliveryUserFinal = await prisma.user.create({
        data: {
          email: "delivery@xgenmrp.com",
          password: hashedPassword,
          role: Role.DELIVERY,
          profile: {
            create: {
              firstName: "Delivery",
              lastName: "Driver",
              phoneNumber: "+1234567893",
              department: "Logistics",
              position: "Delivery Personnel",
            },
          },
        },
      });
    }

    // Get existing customers and orders
    const customers = await prisma.customer.findMany();
    const customerOrders = await prisma.customerOrder.findMany();
    const productionOrders = await prisma.productionOrder.findMany();

    if (customers.length === 0 || customerOrders.length === 0) {
      console.log("❌ No customers or orders found. Please run the comprehensive seed first.");
      return;
    }

    console.log("💳 Creating billing statements...");

    // Create billing statements for existing customer orders
    const billingStatements = [];

    for (let i = 0; i < customerOrders.length; i++) {
      const customerOrder = customerOrders[i];
      const customer = customers.find(c => c.id === customerOrder.customerId);
      const productionOrder = productionOrders.find(po => po.customerOrderId === customerOrder.id);

      const billingStatement = await prisma.billingStatement.create({
        data: {
          statementNumber: `BILL-2024-${String(i + 1).padStart(3, '0')}`,
          customerId: customer?.id,
          customerOrderId: customerOrder.id,
          customerName: customer?.name || 'Unknown Customer',
          productionOrderId: productionOrder?.id,
          totalAmount: customerOrder.totalAmount,
          taxAmount: new Decimal(customerOrder.totalAmount.toString()).mul(0.1), // 10% tax
          discountAmount: 0,
          netAmount: new Decimal(customerOrder.totalAmount.toString()).mul(1.1), // Total + tax
          status: i === 0 ? BillingStatus.SENT : BillingStatus.DRAFT,
          billingDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: `Billing for order ${customerOrder.orderNumber}`,
          createdBy: adminUser.id,
        },
      });

      billingStatements.push(billingStatement);
    }

    console.log("📄 Creating sales invoices...");

    // Create sales invoices for billing statements
    for (let i = 0; i < billingStatements.length; i++) {
      const billingStatement = billingStatements[i];
      const customerOrder = customerOrders.find(co => co.id === billingStatement.customerOrderId);
      const orderLines = await prisma.orderLine.findMany({
        where: { orderId: customerOrder?.id },
        include: { product: true, productVariant: true }
      });

      const salesInvoice = await prisma.salesInvoice.create({
        data: {
          invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
          billingStatementId: billingStatement.id,
          invoiceDate: new Date(),
          subtotal: billingStatement.totalAmount,
          taxRate: 10.0,
          taxAmount: billingStatement.taxAmount,
          discountAmount: billingStatement.discountAmount,
          totalAmount: billingStatement.netAmount,
          paymentTerms: "Net 30",
          dueDate: billingStatement.dueDate,
          status: i === 0 ? InvoiceStatus.SENT : InvoiceStatus.DRAFT,
          poNumber: customerOrder?.orderNumber,
          terms: "Payment due within 30 days",
          footerNotes: "Thank you for your business!",
          createdBy: adminUser.id,
        },
      });

      // Create invoice items
      for (const orderLine of orderLines) {
        await prisma.salesInvoiceItem.create({
          data: {
            salesInvoiceId: salesInvoice.id,
            productId: orderLine.productId,
            description: `${orderLine.product.name}${orderLine.productVariant ? ` - ${orderLine.productVariant.displayName}` : ''}`,
            quantity: orderLine.quantity,
            unitPrice: orderLine.unitPrice,
            totalPrice: new Decimal(orderLine.unitPrice.toString()).mul(orderLine.quantity),
            productCode: orderLine.product.sku,
            unit: "pcs",
            discountPercent: 0,
            taxable: true,
          },
        });
      }
    }

    console.log("🚚 Creating delivery receipts...");

    // Create delivery receipts for some billing statements
    for (let i = 0; i < Math.min(billingStatements.length, 2); i++) {
      const billingStatement = billingStatements[i];
      const customer = customers.find(c => c.id === billingStatement.customerId);

      await prisma.deliveryReceipt.create({
        data: {
          receiptNumber: `DEL-2024-${String(i + 1).padStart(3, '0')}`,
          billingStatementId: billingStatement.id,
          deliveryDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), // Delivered yesterday/day before
          deliveryAddress: customer?.address || 'Customer Address',
          receivedBy: customer?.contactPerson || 'Customer Representative',
          receivedByTitle: 'Receiving Manager',
          trackingNumber: `TRK${Date.now()}${i}`,
          courierService: i === 0 ? 'FedEx' : 'UPS',
          deliveryStatus: DeliveryStatus.DELIVERED,
          deliveryNotes: `Successfully delivered to ${customer?.name}`,
          createdBy: deliveryUserFinal?.id || adminUser.id,
        },
      });
    }

    console.log("📊 Creating additional sample data...");

    // Create some additional customers for more variety
    const additionalCustomers = [
      {
        name: "Tech Startup Co.",
        code: "CUS-003",
        contactPerson: "Alex Johnson",
        email: "orders@techstartup.com",
        phone: "+1555-1003",
        address: "123 Innovation Drive",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        postalCode: "94105",
        tinNumber: "TIN-456789123",
        creditLimit: 25000.0,
        paymentTerms: "Net 15",
      },
      {
        name: "Retail Chain Plus",
        code: "CUS-004",
        contactPerson: "Maria Garcia",
        email: "procurement@retailchain.com",
        phone: "+1555-1004",
        address: "789 Commerce Blvd",
        city: "Dallas",
        state: "TX",
        country: "USA",
        postalCode: "75201",
        tinNumber: "TIN-789123456",
        creditLimit: 100000.0,
        paymentTerms: "Net 45",
      }
    ];

    for (const customerData of additionalCustomers) {
      await prisma.customer.create({
        data: {
          ...customerData,
          createdBy: adminUser.id,
        },
      });
    }

    // Create some standalone billing statements (not tied to customer orders)
    const standaloneCustomer = await prisma.customer.findFirst({
      where: { code: "CUS-003" }
    });

    if (standaloneCustomer) {
      const standaloneBilling = await prisma.billingStatement.create({
        data: {
          statementNumber: "BILL-2024-999",
          customerId: standaloneCustomer.id,
          customerName: standaloneCustomer.name,
          totalAmount: 1500.00,
          taxAmount: 150.00,
          discountAmount: 50.00,
          netAmount: 1600.00,
          status: BillingStatus.PAID,
          billingDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Paid 5 days ago
          notes: "Custom service billing - consulting work",
          createdBy: adminUser.id,
        },
      });

      // Create sales invoice for standalone billing
      await prisma.salesInvoice.create({
        data: {
          invoiceNumber: "INV-2024-999",
          billingStatementId: standaloneBilling.id,
          invoiceDate: standaloneBilling.billingDate,
          subtotal: standaloneBilling.totalAmount,
          taxRate: 10.0,
          taxAmount: standaloneBilling.taxAmount,
          discountAmount: standaloneBilling.discountAmount,
          totalAmount: standaloneBilling.netAmount,
          paymentTerms: "Net 30",
          dueDate: standaloneBilling.dueDate,
          status: InvoiceStatus.PAID,
          terms: "Payment due within 30 days",
          footerNotes: "Thank you for choosing our services!",
          createdBy: adminUser.id,
        },
      });

      // Create delivery receipt for standalone billing
      await prisma.deliveryReceipt.create({
        data: {
          receiptNumber: "DEL-2024-999",
          billingStatementId: standaloneBilling.id,
          deliveryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          deliveryAddress: standaloneCustomer.address || 'Customer Address',
          receivedBy: standaloneCustomer.contactPerson,
          receivedByTitle: 'CTO',
          trackingNumber: `TRK${Date.now()}999`,
          courierService: 'DHL',
          deliveryStatus: DeliveryStatus.DELIVERED,
          deliveryNotes: 'Consulting materials and documentation delivered',
          createdBy: deliveryUserFinal?.id || adminUser.id,
        },
      });
    }

    console.log("✅ Enhanced billing data seeding completed successfully!");
    console.log("\n📊 Summary of additional records created:");
    console.log(`💳 Billing Statements: ${billingStatements.length + 1}`);
    console.log(`📄 Sales Invoices: ${billingStatements.length + 1}`);
    console.log(`🚚 Delivery Receipts: ${Math.min(billingStatements.length, 2) + 1}`);
    console.log(`👥 Additional Customers: 2`);
    console.log(`📦 Delivery User: ${deliveryUserFinal ? 'Created/Found' : 'Not created'}`);

    console.log("\n🔑 Updated Login Credentials:");
    console.log("Admin: admin@xgenmrp.com / password123");
    console.log("Worker: worker@xgenmrp.com / password123");
    console.log("Inspector: inspector@xgenmrp.com / password123");
    console.log("Delivery: delivery@xgenmrp.com / password123");

    console.log("\n💡 Billing System Features Available:");
    console.log("- Billing Statements with various statuses");
    console.log("- Sales Invoices linked to billing statements");
    console.log("- Delivery Receipts with tracking information");
    console.log("- Customer relationships and order linkages");
    console.log("- Tax calculations and discount handling");

  } catch (error) {
    console.error("❌ Enhanced billing seeding failed:", error);
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
  });