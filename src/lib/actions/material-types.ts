// src/lib/actions/material-types.ts
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"

interface MaterialTypeInput {
  name: string
  description?: string | null
  status: Status
}

export async function getMaterialTypes() {
    try {
      return await prisma.materialType.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true, // Make sure this is included
        },
        orderBy: {
          name: 'asc'
        }
      })
    } catch (error) {
      throw new Error('Failed to fetch material types')
    }
  }

export async function createMaterialType(data: MaterialTypeInput) {
  try {
    const result = await prisma.materialType.create({
      data
    })
    revalidatePath('/admin/materials')
    return result
  } catch (error) {
    throw new Error('Failed to create material type')
  }
}

export async function updateMaterialType(id: string, data: MaterialTypeInput) {
  try {
    const result = await prisma.materialType.update({
      where: { id },
      data
    })
    revalidatePath('/admin/materials')
    return result
  } catch (error) {
    throw new Error('Failed to update material type')
  }
}

export async function deleteMaterialType(id: string) {
  try {
    await prisma.materialType.delete({
      where: { id }
    })
    revalidatePath('/admin/materials')
  } catch (error) {
    throw new Error('Failed to delete material type')
  }
}