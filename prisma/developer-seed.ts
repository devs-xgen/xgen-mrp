import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createDeveloperUser() {
  try {
    // Check if developer user already exists
    const existingDev = await prisma.user.findUnique({
      where: { email: 'dev@xgen-mrp.local' },
    });

    if (existingDev) {
      console.log('✅ Developer user already exists');
      return existingDev;
    }

    // Hash a placeholder password (won't be used since we use hardcoded auth)
    const hashedPassword = await hash('dev123!@#', 12);

    // Create developer user
    const developerUser = await prisma.user.create({
      data: {
        email: 'dev@xgen-mrp.local',
        password: hashedPassword,
        role: 'DEVELOPER' as any,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        profile: {
          create: {
            firstName: 'Developer',
            lastName: 'Account',
            phoneNumber: '+1-555-DEV-USER',
            address: 'Development Environment',
            city: 'Local',
            state: 'Development',
            country: 'System',
            postalCode: '00000',
            department: 'Development',
            position: 'System Developer',
            employeeId: 'DEV-001',
            bio: 'System developer account for testing and development purposes',
          },
        },
      },
      include: {
        profile: true,
      },
    });

    console.log('✅ Developer user created successfully:', {
      id: developerUser.id,
      email: developerUser.email,
      role: developerUser.role,
    });

    return developerUser;
  } catch (error) {
    console.error('❌ Error creating developer user:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Creating developer user...');
  await createDeveloperUser();
  console.log('✅ Developer seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Developer seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
