import { PrismaClient, Role, UserStatus, Status, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureUser(email: string, role: Role, firstName: string, lastName: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const password = await bcrypt.hash("worker123", 12);
    user = await prisma.user.create({
      data: {
        email,
        password,
        role,
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date(),
        createdBy: "worker-demo-seed",
        profile: {
          create: {
            firstName,
            lastName,
            department: "Production",
            position: "Worker",
            employeeId: "WORKER-DEMO",
            country: "Philippines",
          },
        },
      },
    });
    console.log(`✅ Created user ${email} (password: worker123)`);
  } else {
    console.log(`ℹ️ Using existing user ${email}`);
  }
  return user;
}

async function ensureUnitOfMeasure(name: string, symbol: string) {
  let uom = await prisma.unitOfMeasure.findFirst({ where: { name } });
  if (!uom) {
    uom = await prisma.unitOfMeasure.create({
      data: { name, symbol, description: `${name} unit`, createdBy: "worker-demo-seed" },
    });
    console.log(`✅ Created unit of measure: ${name}`);
  } else {
    console.log(`ℹ️ Using existing unit of measure: ${name}`);
  }
  return uom;
}

async function ensureMaterialType(name: string) {
  let mt = await prisma.materialType.findFirst({ where: { name } });
  if (!mt) {
    mt = await prisma.materialType.create({
      data: { name, description: `${name} materials`, createdBy: "worker-demo-seed" },
    });
    console.log(`✅ Created material type: ${name}`);
  } else {
    console.log(`ℹ️ Using existing material type: ${name}`);
  }
  return mt;
}

async function ensureMaterial(sku: string, name: string, typeId: string, unitOfMeasureId: string) {
  let material = await prisma.material.findUnique({ where: { sku } });
  if (!material) {
    material = await prisma.material.create({
      data: {
        sku,
        name,
        type: { connect: { id: typeId } },
        unitOfMeasure: { connect: { id: unitOfMeasureId } },
        costPerUnit: 12.5,
        currentStock: 1000,
        minimumStockLevel: 100,
        committedStock: 0,
        availableStock: 1000,
        leadTime: 7,
        // Create a simple supplier if none exists
        supplier: {
          connectOrCreate: {
            where: { code: "SUP-WORKER-DEMO" },
            create: {
              code: "SUP-WORKER-DEMO",
              name: "Worker Demo Supplier",
              contactPerson: "Demo",
              email: "supplier@example.com",
              phone: "+63 900 000 0001",
              leadTime: 7,
              createdBy: "worker-demo-seed",
            },
          },
        },
        status: Status.ACTIVE,
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created material: ${name} (${sku})`);
  } else {
    console.log(`ℹ️ Using existing material: ${name} (${sku})`);
  }
  return material;
}

async function ensureBOM(productId: string, materialId: string) {
  const existing = await prisma.bOM.findFirst({ where: { productId, materialId } });
  if (!existing) {
    await prisma.bOM.create({
      data: {
        productId,
        materialId,
        quantityNeeded: 1.0,
        wastePercentage: 2.0,
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created BOM linking product -> material`);
  } else {
    console.log(`ℹ️ Using existing BOM for product -> material`);
  }
}

async function ensureWorkCenter(name: string, description: string) {
  let wc = await prisma.workCenter.findFirst({ where: { name } });
  if (!wc) {
    wc = await prisma.workCenter.create({
      data: {
        name,
        description,
        capacityPerHour: 20,
        operatingHours: 8,
        efficiencyRate: 90.0,
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created work center: ${name}`);
  } else {
    console.log(`ℹ️ Using existing work center: ${name}`);
  }
  return wc;
}

async function ensureUserWorkCenter(userId: string, workCenterId: string) {
  const existing = await prisma.userWorkCenter.findFirst({ where: { userId, workCenterId } });
  if (!existing) {
    await prisma.userWorkCenter.create({
      data: { userId, workCenterId, isResponsible: true },
    });
    console.log(`✅ Linked user to work center (${userId} -> ${workCenterId})`);
  }
}

async function ensureProductCategory(name: string) {
  let cat = await prisma.productCategory.findFirst({ where: { name } });
  if (!cat) {
    cat = await prisma.productCategory.create({
      data: { name, description: "Demo category", createdBy: "worker-demo-seed" },
    });
    console.log(`✅ Created product category: ${name}`);
  } else {
    console.log(`ℹ️ Using existing product category: ${name}`);
  }
  return cat;
}

async function ensureProduct(sku: string, name: string, categoryId: string) {
  let product = await prisma.product.findUnique({ where: { sku } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        sku,
        name,
        description: "Demo product for worker tasks",
        categoryId,
        sizeRange: [],
        colorOptions: [],
        unitCost: 10.0,
        sellingPrice: 20.0,
        minimumStockLevel: 0,
        currentStock: 0,
        expectedStock: 0,
        committedStock: 0,
        calculatedStock: 0,
        leadTime: 5,
        hasVariants: false,
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created product: ${name} (${sku})`);
  } else {
    console.log(`ℹ️ Using existing product: ${name} (${sku})`);
  }
  return product;
}

async function ensureCustomer(code: string, name: string) {
  let customer = await prisma.customer.findFirst({ where: { code } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        code,
        name,
        contactPerson: "Demo Contact",
        email: `demo-${code.toLowerCase()}@example.com`,
        phone: "+63 900 000 0000",
        city: "Makati",
        country: "Philippines",
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created customer: ${name}`);
  } else {
    console.log(`ℹ️ Using existing customer: ${name}`);
  }
  return customer;
}

async function ensureCustomerOrder(orderNumber: string, customerId: string) {
  let order = await prisma.customerOrder.findFirst({ where: { orderNumber } });
  if (!order) {
    order = await prisma.customerOrder.create({
      data: {
        orderNumber,
        customerId,
        orderDate: new Date(),
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalAmount: 200.0,
        shippingAddress: "Demo shipping address",
        billingAddress: "Demo billing address",
        notes: "Worker demo seed order",
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created customer order: ${orderNumber}`);
  } else {
    console.log(`ℹ️ Using existing customer order: ${orderNumber}`);
  }
  return order;
}

async function ensureOrderLine(orderId: string, productId: string, qty: number, unitPrice: number) {
  const existing = await prisma.orderLine.findFirst({ where: { orderId, productId, unitPrice } });
  if (!existing) {
    await prisma.orderLine.create({
      data: {
        orderId,
        productId,
        quantity: qty,
        unitPrice,
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created order line for product ${productId}`);
  }
}

async function ensureProductionOrder(
  key: string,
  productId: string,
  customerOrderId: string | null,
  status: Status,
  quantity = 10,
  createdByUserId: string
) {
  // Use notes field to identify demo entries idempotently
  const notesKey = `worker-demo:${key}`;
  let po = await prisma.productionOrder.findFirst({ where: { productId, notes: notesKey } });
  if (!po) {
    po = await prisma.productionOrder.create({
      data: {
        productId,
        quantity,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status,
        priority: Priority.MEDIUM,
        customerOrderId: customerOrderId ?? undefined,
        notes: notesKey,
        plannedMaterialCost: 0,
        createdBy: createdByUserId,
      },
    });
    console.log(`✅ Created production order (${key}) with status ${status}`);
  } else {
    // If existing but wrong status, update to requested
    if (po.status !== status) {
      po = await prisma.productionOrder.update({ where: { id: po.id }, data: { status } });
      console.log(`♻️ Updated production order (${key}) status to ${status}`);
    } else {
      console.log(`ℹ️ Using existing production order (${key})`);
    }
  }
  return po;
}

async function ensureOperation(poId: string, wcId: string, assignedToId: string, status: Status, offsetHours: number, durationHours: number, label: string) {
  const notesKey = `worker-demo:op:${label}`;
  let op = await prisma.operation.findFirst({ where: { productionOrderId: poId, workCenterId: wcId, notes: notesKey } });
  if (!op) {
    const start = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    op = await prisma.operation.create({
      data: {
        productionOrderId: poId,
        workCenterId: wcId,
        startTime: start,
        endTime: end,
        status,
        cost: 10.0,
        assignedToId,
        notes: notesKey,
        createdBy: "worker-demo-seed",
      },
    });
    console.log(`✅ Created operation ${label} (${status}) assigned to worker`);
  } else {
    console.log(`ℹ️ Using existing operation ${label}`);
  }
  return op;
}

async function main() {
  console.log("🌱 Worker demo seeding...");

  // 1) Ensure worker user
  const worker = await ensureUser("worker@xgen-mrp.com", Role.WORKER, "John", "Worker");

  // 2) Ensure two work centers and link worker
  const cutting = await ensureWorkCenter("Cutting Station", "Fabric cutting and preparation");
  const sewing = await ensureWorkCenter("Sewing Line A", "Main garment assembly line");
  await ensureUserWorkCenter(worker.id, cutting.id);
  await ensureUserWorkCenter(worker.id, sewing.id);

  // 3) Minimal product setup
  const category = await ensureProductCategory("Demo Category");
  const product = await ensureProduct("DEMO-TSHIRT-001", "Demo T-Shirt", category.id);

  // 3b) Minimal material setup and BOM
  const pcs = await ensureUnitOfMeasure("Pieces", "pcs");
  const fabricType = await ensureMaterialType("Fabric");
  const cotton = await ensureMaterial("MAT-COT-DEMO-001", "Cotton Fabric - White", fabricType.id, pcs.id);
  await ensureBOM(product.id, cotton.id);

  // 4) Customer and order
  const customer = await ensureCustomer("DEMO-CUST-001", "Demo Customer");
  const order = await ensureCustomerOrder("DEMO-ORD-001", customer.id);
  await ensureOrderLine(order.id, product.id, 10, 20.0);

  // 5) Production orders
  const poActive = await ensureProductionOrder("active", product.id, order.id, Status.IN_PROGRESS, 10, worker.id);
  const poPending = await ensureProductionOrder("pending", product.id, order.id, Status.PENDING, 5, worker.id);

  // 6) Operations assigned to worker
  await ensureOperation(poActive.id, cutting.id, worker.id, Status.IN_PROGRESS, 0, 2, "cutting-active");
  await ensureOperation(poActive.id, sewing.id, worker.id, Status.PENDING, 2, 3, "sewing-active");

  await ensureOperation(poPending.id, cutting.id, worker.id, Status.PENDING, 24, 2, "cutting-pending");

  console.log("✅ Worker demo seed complete. Login as worker@xgen-mrp.com / worker123 to test /worker/tasks");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
