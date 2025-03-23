import { PrismaClient, Role, UserStatus } from '@prisma/client'
import { hash } from 'bcryptjs'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

async function main() {
    try {
        const admin = await prisma.user.create({
            data: {
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
        const worker = await prisma.user.create({
            data: {
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
            await prisma.emergencyContact.create({
                data: {
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
    } catch (error: any) {
        console.error('Error seeding database:', error)
        if (error.meta) console.error('Error metadata:', error.meta)
        if (error.message) console.error('Error message:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((e: any) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })