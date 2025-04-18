'use server'

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Link a user to an existing inspector
 */
export async function linkUserToInspector(userId: string, inspectorId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    if (!user) throw new Error('User not found')

    // Check if inspector exists
    const inspector = await prisma.inspector.findUnique({
      where: { inspectorId }
    })
    if (!inspector) throw new Error('Inspector not found')

    // Check if inspector is already linked to another user
    if (inspector.userId && inspector.userId !== userId) {
      throw new Error('Inspector is already linked to another user')
    }

    // Check if user is already linked to another inspector
    const existingInspector = await prisma.inspector.findUnique({
      where: { userId }
    })
    if (existingInspector && existingInspector.inspectorId !== inspectorId) {
      throw new Error('User is already linked to another inspector')
    }

    // Update the inspector
    await prisma.inspector.update({
      where: { inspectorId },
      data: { 
        userId,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      }
    })

    // Make sure the user has the INSPECTOR role
    if (user.role !== 'INSPECTOR') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          role: 'INSPECTOR',
          modifiedBy: session.user.id
        }
      })
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/inspectors')
    
    return { success: true }
  } catch (error) {
    console.error('Error linking user to inspector:', error)
    throw error
  }
}

/**
 * Unlink a user from an inspector
 */
export async function unlinkUserFromInspector(inspectorId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Check if inspector exists
    const inspector = await prisma.inspector.findUnique({
      where: { inspectorId }
    })
    if (!inspector) throw new Error('Inspector not found')

    // If inspector is not linked to any user, do nothing
    if (!inspector.userId) {
      return { success: true, message: 'Inspector is not linked to any user' }
    }

    // Update the inspector
    await prisma.inspector.update({
      where: { inspectorId },
      data: { 
        userId: null,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      }
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/inspectors')
    
    return { success: true }
  } catch (error) {
    console.error('Error unlinking user from inspector:', error)
    throw error
  }
}

/**
 * Create new inspector and link to user
 */
export async function createInspectorForUser(
  userId: string, 
  inspectorData: { 
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string | null
    department?: string | null
    specialization?: string | null
    certificationLevel?: string | null
    yearsOfExperience?: number | null
    notes?: string | null
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })
    if (!user) throw new Error('User not found')

    // Check if user is already linked to an inspector
    const existingInspector = await prisma.inspector.findUnique({
      where: { userId }
    })
    if (existingInspector) {
      throw new Error('User is already linked to an inspector')
    }

    // Create the inspector with data from user profile if available
    await prisma.inspector.create({
      data: {
        firstName: inspectorData.firstName || user.profile?.firstName || '',
        lastName: inspectorData.lastName || user.profile?.lastName || '',
        email: inspectorData.email || user.email,
        phoneNumber: inspectorData.phoneNumber || user.profile?.phoneNumber || null,
        department: inspectorData.department || user.profile?.department || null,
        specialization: inspectorData.specialization || null,
        certificationLevel: inspectorData.certificationLevel || null,
        yearsOfExperience: inspectorData.yearsOfExperience || null,
        notes: inspectorData.notes || null,
        isActive: true,
        userId: userId,
        createdBy: session.user.id
      }
    })

    // Make sure the user has the INSPECTOR role
    if (user.role !== 'INSPECTOR') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          role: 'INSPECTOR',
          modifiedBy: session.user.id
        }
      })
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/inspectors')
    
    return { success: true }
  } catch (error) {
    console.error('Error creating inspector for user:', error)
    throw error
  }
}

/**
 * Get available inspectors (not linked to users)
 */
export async function getAvailableInspectors() {
  try {
    return await prisma.inspector.findMany({
      where: { 
        userId: null,
        isActive: true 
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })
  } catch (error) {
    console.error('Error fetching available inspectors:', error)
    throw error
  }
}

/**
 * Get all users that are not linked to inspectors
 */
export async function getAvailableUsers() {
  try {
    // Get IDs of users already linked to inspectors
    const inspectors = await prisma.inspector.findMany({
      where: {
        userId: {
          not: null
        }
      },
      select: {
        userId: true
      }
    })
    
    const linkedUserIds = inspectors
      .filter(i => i.userId !== null)
      .map(i => i.userId as string)
    
    // Get users that are not linked to inspectors
    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: linkedUserIds
        },
        status: 'ACTIVE'
      },
      include: {
        profile: true
      },
      orderBy: [
        {
          profile: {
            firstName: 'asc'
          }
        },
        {
          email: 'asc'
        }
      ]
    })
    
    return users
  } catch (error) {
    console.error('Error fetching available users:', error)
    throw error
  }
}

/**
 * Get inspector details with linked user info
 */
export async function getInspectorWithUser(inspectorId: string) {
  try {
    const inspector = await prisma.inspector.findUnique({
      where: { inspectorId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    
    if (!inspector) throw new Error('Inspector not found')
    
    return inspector
  } catch (error) {
    console.error('Error fetching inspector with user details:', error)
    throw error
  }
}