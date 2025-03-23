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
        status: true,
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error("Error fetching material types:", error)
    throw new Error('Failed to fetch material types')
  }
}

export async function createMaterialType(data: MaterialTypeInput) {
  try {
    const result = await prisma.materialType.create({
      data: {
        name: data.name,
        description: data.description || null,
        status: data.status
      }
    })
    revalidatePath('/admin/materials')
    return result
  } catch (error) {
    console.error("Error creating material type:", error)
    throw new Error('Failed to create material type')
  }
}

export async function updateMaterialType(id: string, data: MaterialTypeInput) {
  try {
    const result = await prisma.materialType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        status: data.status
      }
    })
    revalidatePath('/admin/materials')
    return result
  } catch (error) {
    console.error("Error updating material type:", error)
    throw new Error('Failed to update material type')
  }
}

export async function deleteMaterialType(id: string) {
  try {
    // Check if the material type is associated with any materials
    const materialsCount = await prisma.material.count({
      where: { typeId: id }
    });
    
    if (materialsCount > 0) {
      throw new Error(`Cannot delete this material type as it's used by ${materialsCount} materials`);
    }
    
    await prisma.materialType.delete({
      where: { id }
    })
    revalidatePath('/admin/materials')
  } catch (error) {
    console.error("Error deleting material type:", error)
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete material type')
  }
}