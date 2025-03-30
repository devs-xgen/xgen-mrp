'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  CreateBOMEntryInput, 
  UpdateBOMEntryInput 
} from "@/types/admin/bom"

export async function getBOMForProduct(productId: string) {
  try {
    const bom = await prisma.bOM.findMany({
      where: { productId },
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      }
    })
    
    return bom
  } catch (error) {
    console.error('Error fetching BOM:', error)
    throw new Error('Failed to fetch bill of materials')
  }
}

export async function createBOMEntry(data: CreateBOMEntryInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const bomEntry = await prisma.bOM.create({
      data: {
        productId: data.productId,
        materialId: data.materialId,
        quantityNeeded: data.quantityNeeded,
        wastePercentage: data.wastePercentage,
        createdBy: session.user.id
      },
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      }
    })

    revalidatePath(`/admin/products/${data.productId}`)
    return bomEntry
  } catch (error) {
    console.error('Error creating BOM entry:', error)
    throw error
  }
}

export async function updateBOMEntry(data: UpdateBOMEntryInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const bomEntry = await prisma.bOM.update({
      where: { id: data.id },
      data: {
        ...(data.quantityNeeded !== undefined && { quantityNeeded: data.quantityNeeded }),
        ...(data.wastePercentage !== undefined && { wastePercentage: data.wastePercentage }),
        modifiedBy: session.user.id
      },
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      }
    })

    const product = await prisma.bOM.findUnique({
      where: { id: data.id },
      select: { productId: true }
    })

    if (product) {
      revalidatePath(`/admin/products/${product.productId}`)
    }
    
    return bomEntry
  } catch (error) {
    console.error('Error updating BOM entry:', error)
    throw error
  }
}

export async function deleteBOMEntry(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Get the product ID before deletion for revalidation
    const bomEntry = await prisma.bOM.findUnique({
      where: { id },
      select: { productId: true }
    })

    if (!bomEntry) {
      throw new Error('BOM entry not found')
    }

    await prisma.bOM.delete({
      where: { id }
    })

    revalidatePath(`/admin/products/${bomEntry.productId}`)
  } catch (error) {
    console.error('Error deleting BOM entry:', error)
    throw error
  }
}

export async function getAvailableMaterials() {
  try {
    const materials = await prisma.material.findMany({
      where: { status: 'ACTIVE' },
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return materials
  } catch (error) {
    console.error('Error fetching materials:', error)
    throw new Error('Failed to fetch available materials')
  }
}