import { PrismaClient, Role, UserStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    try {
        // Create admin user with profile
        const admin = await prisma.user.upsert({
            where: { email: 'admin@example.com' },
            update: {},
            create: {
                email: 'admin@example.com',
                password: await hash('admin123', 12),
                role: Role.ADMIN,
                profile: {
                    create: {
                        firstName: 'Admin',
                        lastName: 'User',
                        department: 'Administration',
                        position: 'System Administrator',
                        employeeId: 'ADM001',
                    }
                }
            },
            include: {
                profile: true
            }
        })

        // Create worker/operator user with profile
        const worker = await prisma.user.upsert({
            where: { email: 'worker@example.com' },
            update: {},
            create: {
                email: 'worker@example.com',
                password: await hash('worker123', 12),
                role: Role.OPERATOR,
                profile: {
                    create: {
                        firstName: 'Worker',
                        lastName: 'User',
                        department: 'Operations',
                        position: 'Inventory Operator',
                        employeeId: 'OPR001',
                    }
                }
            },
            include: {
                profile: true
            }
        })

        // Optional: Create emergency contact for the worker
        if (worker.profile) {
            await prisma.emergencyContact.upsert({
                where: {
                    profileId: worker.profile.id
                },
                update: {},
                create: {
                    profileId: worker.profile.id,
                    name: 'Emergency Contact',
                    relationship: 'Family',
                    phoneNumber: '+1234567890',
                    email: 'emergency@example.com'
                }
            })
        }

        console.log('Seed completed successfully')
        console.log('Created users:', {
            admin: { email: admin.email, role: admin.role },
            worker: { email: worker.email, role: worker.role }
        })
    } catch (error) {
        console.error('Error seeding database:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })