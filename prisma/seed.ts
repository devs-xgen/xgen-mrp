import { PrismaClient, Role, UserStatus } from '@prisma/client'
import { hash } from 'bcryptjs'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

async function main() {
    try {
        // First delete existing users if they exist (for clean seeding)
        console.log('Cleaning up existing seed data...')
        await prisma.emergencyContact.deleteMany({})
        await prisma.userProfile.deleteMany({})
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: ['admin@example.com', 'worker@example.com', 'inspector@example.com', 'delivery@example.com']
                }
            }
        })
        
        console.log('Creating seed users...')
        
        // Create Admin user
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

        // Create Worker user
        const worker = await prisma.user.create({
            data: {
                email: 'worker@example.com',
                password: await hash('worker123', 12),
                role: Role.WORKER,
                profile: {
                    create: {
                        firstName: 'Worker',
                        lastName: 'User',
                        department: 'Production',
                        position: 'Production Worker',
                        employeeId: 'WRK001',
                    }
                }
            },
            include: {
                profile: true
            }
        })

        // Create Inspector user
        const inspector = await prisma.user.create({
            data: {
                email: 'inspector@example.com',
                password: await hash('inspector123', 12),
                role: Role.INSPECTOR,
                profile: {
                    create: {
                        firstName: 'Quality',
                        lastName: 'Inspector',
                        department: 'Quality Control',
                        position: 'Quality Inspector',
                        employeeId: 'QC001',
                    }
                }
            },
            include: {
                profile: true
            }
        })

        // Create Delivery user
        const delivery = await prisma.user.create({
            data: {
                email: 'delivery@example.com',
                password: await hash('delivery123', 12),
                role: Role.DELIVERY,
                profile: {
                    create: {
                        firstName: 'Delivery',
                        lastName: 'Personnel',
                        department: 'Logistics',
                        position: 'Delivery Driver',
                        employeeId: 'DEL001',
                    }
                }
            },
            include: {
                profile: true
            }
        })

        // Create emergency contact for the worker
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
            worker: { email: worker.email, role: worker.role },
            inspector: { email: inspector.email, role: inspector.role },
            delivery: { email: delivery.email, role: delivery.role }
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