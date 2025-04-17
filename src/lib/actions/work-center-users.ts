'use server'

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Fetch users assigned to a work center
export async function getUsersInWorkCenter(workCenterId: string) {
  try {
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: {
        workCenterId
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        user: {
          profile: {
            firstName: 'asc'
          }
        }
      }
    })

    return userWorkCenters.map(uwc => ({
      id: uwc.id,
      userId: uwc.userId,
      workCenterId: uwc.workCenterId,
      isResponsible: uwc.isResponsible,
      user: {
        id: uwc.user.id,
        email: uwc.user.email,
        role: uwc.user.role,
        profile: uwc.user.profile
      }
    }))
  } catch (error) {
    console.error('Error fetching users in work center:', error)
    throw new Error('Failed to fetch users in work center')
  }
}

// Get available users not in work center
export async function getAvailableUsers(workCenterId: string) {
  try {
    // Get IDs of users already in this work center
    const assignedUserIds = await prisma.userWorkCenter.findMany({
      where: {
        workCenterId
      },
      select: {
        userId: true
      }
    })

    const userIds = assignedUserIds.map(u => u.userId)

    // Get users that are not assigned to this work center
    const availableUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: userIds
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

    return availableUsers
  } catch (error) {
    console.error('Error fetching available users:', error)
    throw new Error('Failed to fetch available users')
  }
}

// Add a user to a work center
export async function addUserToWorkCenter(workCenterId: string, userId: string, isResponsible: boolean = false) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Check if user is already in work center
    const existing = await prisma.userWorkCenter.findUnique({
      where: {
        userId_workCenterId: {
          userId,
          workCenterId
        }
      }
    })

    if (existing) {
      throw new Error('User is already assigned to this work center')
    }

    // Add user to work center
    await prisma.userWorkCenter.create({
      data: {
        userId,
        workCenterId,
        isResponsible
      }
    })

    revalidatePath(`/admin/work-centers/${workCenterId}/users`)
    revalidatePath(`/admin/work-centers/${workCenterId}`)
  } catch (error) {
    console.error('Error adding user to work center:', error)
    throw error
  }
}

// Remove a user from a work center
export async function removeUserFromWorkCenter(userWorkCenterId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const userWorkCenter = await prisma.userWorkCenter.findUnique({
      where: { id: userWorkCenterId },
      select: { workCenterId: true }
    })

    if (!userWorkCenter) {
      throw new Error('User assignment not found')
    }

    // Delete the assignment
    await prisma.userWorkCenter.delete({
      where: { id: userWorkCenterId }
    })

    revalidatePath(`/admin/work-centers/${userWorkCenter.workCenterId}/users`)
    revalidatePath(`/admin/work-centers/${userWorkCenter.workCenterId}`)
  } catch (error) {
    console.error('Error removing user from work center:', error)
    throw error
  }
}

// Update user responsibility in work center
export async function updateUserResponsibility(userWorkCenterId: string, isResponsible: boolean) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const userWorkCenter = await prisma.userWorkCenter.findUnique({
      where: { id: userWorkCenterId },
      select: { workCenterId: true }
    })

    if (!userWorkCenter) {
      throw new Error('User assignment not found')
    }

    // Update the responsibility
    await prisma.userWorkCenter.update({
      where: { id: userWorkCenterId },
      data: { isResponsible }
    })

    revalidatePath(`/admin/work-centers/${userWorkCenter.workCenterId}/users`)
  } catch (error) {
    console.error('Error updating user responsibility:', error)
    throw error
  }
}

// Get work center details
export async function getWorkCenterDetails(workCenterId: string) {
  try {
    const workCenter = await prisma.workCenter.findUnique({
      where: { id: workCenterId }
    })
    
    if (!workCenter) {
      throw new Error('Work center not found')
    }
    
    return workCenter
  } catch (error) {
    console.error('Error fetching work center details:', error)
    throw error
  }
}