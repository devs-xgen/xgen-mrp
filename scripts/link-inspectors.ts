import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting inspector linking process...')
    
    // Get all inspectors without a user ID
    const inspectors = await prisma.inspector.findMany({
      where: {
        NOT: {
          userId: { not: null }
        }
      }
    })
    
    console.log(`Found ${inspectors.length} inspectors to link`)
    
    // For each inspector, find or create a user
    for (const inspector of inspectors) {
      console.log(`Processing inspector: ${inspector.firstName} ${inspector.lastName}`)
      
      // Check if user already exists with the same email
      let user = await prisma.user.findUnique({
        where: {
          email: inspector.email
        }
      })
      
      if (!user) {
        // If no user exists, create one
        console.log(`Creating new user for inspector: ${inspector.email}`)
        const password = await hash('inspector123', 12) // Default password
        
        user = await prisma.user.create({
          data: {
            email: inspector.email,
            password: password,
            role: 'INSPECTOR',
            profile: {
              create: {
                firstName: inspector.firstName,
                lastName: inspector.lastName,
                phoneNumber: inspector.phoneNumber,
                department: inspector.department,
                position: 'Quality Inspector',
                employeeId: `QC${inspector.inspectorId.substring(0, 4).toUpperCase()}`
              }
            }
          }
        })
      } else if (user.role !== 'INSPECTOR') {
        // If user exists but is not an inspector, update role
        console.log(`Updating role for existing user: ${user.email}`)
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'INSPECTOR' }
        })
      }
      
      // Link the inspector to the user
      await prisma.inspector.update({
        where: { inspectorId: inspector.inspectorId },
        data: { userId: user.id }
      })
      
      console.log(`Successfully linked inspector ${inspector.email} to user ${user.id}`)
    }
    
    console.log('Inspector linking completed successfully!')
  } catch (error) {
    console.error('Error linking inspectors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 