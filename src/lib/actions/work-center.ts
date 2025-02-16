// src/lib/actions/work-center.ts
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { CreateWorkCenterInput, UpdateWorkCenterInput } from "@/types/admin/work-center"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getWorkCenters() {
  try {
    const workCenters = await prisma.workCenter.findMany({
      orderBy: { name: 'asc' }
    })
    return workCenters
  } catch (error) {
    console.error('Error fetching work centers:', error)
    throw new Error('Failed to fetch work centers')
  }
}

export async function createWorkCenter(data: CreateWorkCenterInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const workCenter = await prisma.workCenter.create({
      data: {
        ...data,
        createdBy: session.user.id,
        description: data.description || null
      }
    })
    revalidatePath('/admin/work-centers')
    return workCenter
  } catch (error) {
    console.error('Error creating work center:', error)
    throw error
  }
}

export async function updateWorkCenter(data: UpdateWorkCenterInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const { id, ...updateData } = data
    const workCenter = await prisma.workCenter.update({
      where: { id },
      data: {
        ...updateData,
        modifiedBy: session.user.id,
        description: updateData.description || null
      }
    })
    revalidatePath('/admin/work-centers')
    return workCenter
  } catch (error) {
    console.error('Error updating work center:', error)
    throw error
  }
}

export async function deleteWorkCenter(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    await prisma.workCenter.delete({
      where: { id }
    })
    revalidatePath('/admin/work-centers')
  } catch (error) {
    console.error('Error deleting work center:', error)
    throw error
  }
}