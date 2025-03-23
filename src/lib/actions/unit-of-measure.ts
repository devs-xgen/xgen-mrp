// src/lib/actions/unit-of-measure.ts
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"

interface UnitOfMeasureInput {
  name: string
  symbol: string
  description?: string | null
  status: Status
}

export async function getUnitOfMeasures() {
  try {
    return await prisma.unitOfMeasure.findMany({
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true,
        status: true,
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error("Error fetching units of measure:", error)
    throw new Error('Failed to fetch units of measure')
  }
}

export async function createUnitOfMeasure(data: UnitOfMeasureInput) {
  try {
    const result = await prisma.unitOfMeasure.create({
      data: {
        name: data.name,
        symbol: data.symbol,
        description: data.description || null,
        status: data.status
      }
    })
    revalidatePath('/admin/materials')
    return result
  } catch (error) {
    console.error("Error creating unit of measure:", error)
    throw new Error('Failed to create unit of measure')
  }
}

export async function updateUnitOfMeasure(id: string, data: Partial<UnitOfMeasureInput>) {
  try {
    const result = await prisma.unitOfMeasure.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.symbol !== undefined && { symbol: data.symbol }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.status !== undefined && { status: data.status }),
      }
    })
    revalidatePath('/admin/materials')
    return result
  } catch (error) {
    console.error("Error updating unit of measure:", error)
    throw new Error('Failed to update unit of measure')
  }
}

export async function deleteUnitOfMeasure(id: string) {
  try {
    // Check if the unit of measure is associated with any materials
    const materialsCount = await prisma.material.count({
      where: { unitOfMeasureId: id }
    });
    
    if (materialsCount > 0) {
      throw new Error(`Cannot delete this unit of measure as it's used by ${materialsCount} materials`);
    }
    
    await prisma.unitOfMeasure.delete({
      where: { id }
    })
    revalidatePath('/admin/materials')
  } catch (error) {
    console.error("Error deleting unit of measure:", error)
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete unit of measure')
  }
}