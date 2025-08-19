import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
      },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
      return;
    }

    // Create admin user
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
      include: {
        profile: true,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", adminUser.email);
    console.log("🔑 Password: admin123");
    console.log("👤 Role:", adminUser.role);
    console.log(
      "📋 Profile:",
      adminUser.profile?.firstName,
      adminUser.profile?.lastName
    );

    console.log("\n🚀 You can now login with:");
    console.log("   Email: admin@xgen-mrp.com");
    console.log("   Password: admin123");
    console.log("\n⚠️  Please change the password after first login!");
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
