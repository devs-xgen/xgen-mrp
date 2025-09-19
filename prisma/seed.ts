import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1) Admin user (idempotent)
    const existingAdmin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });
    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
    } else {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      const adminUser = await prisma.user.create({
        data: {
          email: "admin@xgen-mrp.com",
          password: hashedPassword,
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
          createdBy: "system",
          profile: {
            create: {
              firstName: "System",
              lastName: "Administrator",
              phoneNumber: "+63 9XX XXX XXXX",
              department: "Administration",
              position: "System Administrator",
              employeeId: "ADMIN001",
              country: "Philippines",
            },
          },
        },
        include: { profile: true },
      });
      console.log("✅ Admin user created successfully!");
      console.log("📧 Email:", adminUser.email);
      console.log("🔑 Password: admin123");
    }

    // 2) Worker user (idempotent)
    const workerEmail = "worker@xgen-mrp.com";
    const existingWorker = await prisma.user.findUnique({
      where: { email: workerEmail },
    });
    if (existingWorker) {
      console.log("✅ Worker user already exists:", existingWorker.email);
    } else {
      const workerPassword = await bcrypt.hash("worker123", 12);
      await prisma.user.create({
        data: {
          email: workerEmail,
          password: workerPassword,
          role: Role.WORKER,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
          createdBy: "system",
          profile: {
            create: {
              firstName: "John",
              lastName: "Worker",
              department: "Production",
              position: "Worker",
              employeeId: "WORKER001",
              country: "Philippines",
            },
          },
        },
      });
      console.log(
        "✅ Worker user created (📧 worker@xgen-mrp.com / 🔑 worker123)"
      );
    }

    // 3) Inspector user + Inspector record (idempotent)
    const inspectorEmail = "inspector@xgen-mrp.com";
    let inspectorUser = await prisma.user.findUnique({
      where: { email: inspectorEmail },
    });
    if (!inspectorUser) {
      const inspectorPassword = await bcrypt.hash("inspector123", 12);
      inspectorUser = await prisma.user.create({
        data: {
          email: inspectorEmail,
          password: inspectorPassword,
          role: Role.INSPECTOR,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
          createdBy: "system",
          profile: {
            create: {
              firstName: "Ivy",
              lastName: "Inspector",
              department: "Quality",
              position: "Inspector",
              employeeId: "INSP001",
              country: "Philippines",
            },
          },
        },
      });
      console.log(
        "✅ Inspector user created (📧 inspector@xgen-mrp.com / 🔑 inspector123)"
      );
    } else {
      console.log("✅ Inspector user already exists:", inspectorUser.email);
    }

    // Link/create Inspector entity by email
    const existingInspector = await prisma.inspector.findUnique({
      where: { email: inspectorEmail },
    });
    if (existingInspector) {
      console.log(
        "✅ Inspector record already exists:",
        existingInspector.email
      );
    } else {
      await prisma.inspector.create({
        data: {
          email: inspectorEmail,
          firstName: "Ivy",
          lastName: "Inspector",
          userId: inspectorUser.id,
          department: "Quality",
          isActive: true,
        },
      });
      console.log("✅ Inspector record created and linked to user");
    }

    // 4) Delivery user (role uses WORKER) (idempotent)
    const deliveryEmail = "delivery@xgen-mrp.com";
    const existingDelivery = await prisma.user.findUnique({
      where: { email: deliveryEmail },
    });
    if (existingDelivery) {
      console.log("✅ Delivery user already exists:", existingDelivery.email);
    } else {
      const deliveryPassword = await bcrypt.hash("delivery123", 12);
      await prisma.user.create({
        data: {
          email: deliveryEmail,
          password: deliveryPassword,
          role: Role.WORKER, // using WORKER role for delivery assignments
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
          createdBy: "system",
          profile: {
            create: {
              firstName: "Derek",
              lastName: "Delivery",
              department: "Logistics",
              position: "Delivery",
              employeeId: "DELV001",
              country: "Philippines",
            },
          },
        },
      });
      console.log(
        "✅ Delivery user created (📧 delivery@xgen-mrp.com / 🔑 delivery123)"
      );
    }

    // 5) Super Admin user (idempotent)
    const superAdminEmail = "superadmin@xgen-mrp.com";
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });
    if (existingSuperAdmin) {
      console.log(
        "✅ Super Admin user already exists:",
        existingSuperAdmin.email
      );
    } else {
      const superAdminPassword = await bcrypt.hash("superadmin123", 12);
      await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: superAdminPassword,
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
          createdBy: "system",
          profile: {
            create: {
              firstName: "Supreme",
              lastName: "Administrator",
              phoneNumber: "+63 9XX XXX XXXX",
              department: "Executive",
              position: "Super Administrator",
              employeeId: "SUPER001",
              country: "Philippines",
            },
          },
        },
      });
      console.log(
        "✅ Super Admin user created (📧 superadmin@xgen-mrp.com / 🔑 superadmin123)"
      );
    }

    console.log("\n🚀 Seed complete. Default credentials:");
    console.log("- Admin:      admin@xgen-mrp.com / admin123");
    console.log("- Super Admin: superadmin@xgen-mrp.com / superadmin123");
    console.log("- Worker:     worker@xgen-mrp.com / worker123");
    console.log("- Inspector:  inspector@xgen-mrp.com / inspector123");
    console.log("- Delivery:   delivery@xgen-mrp.com / delivery123");
    console.log("\n⚠️  Please change passwords after first login!");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
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
