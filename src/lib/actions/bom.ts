'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Decimal } from "@prisma/client/runtime/library"
import { CreateBOMEntryInput, UpdateBOMEntryInput } from "@/types/admin/bom"
import { 
  adaptBOMEntryForDisplay, 
  adaptCreateInputForPrisma, 
  adaptUpdateInputForPrisma,
  adaptProductBOM
} from "@/lib/adapters/bom-adapters"

/**
 * Fetches all BOM entries for a specific product with material details
 * 
 * @param productId The product ID to fetch BOM entries for
 * @returns Array of BOM entries with material details
 */
export async function getBOMForProduct(productId: string) {
  try {
    const bomEntries = await prisma.bOM.findMany({
      where: { 
        productId 
      },
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      },
      orderBy: {
        material: {
          name: 'asc'
        }
      }
    })
    
    // Get product name to include in response
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true }
    })
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    // Convert to display format with total costs
    return adaptProductBOM(productId, product.name, bomEntries)
  } catch (error) {
    console.error('Error fetching BOM for product:', error)
    throw new Error('Failed to fetch bill of materials')
  }
}

/**
 * Creates a new BOM entry linking a material to a product
 * 
 * @param data The input data for creating a BOM entry
 * @returns The created BOM entry
 */
export async function createBOMEntry(data: CreateBOMEntryInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    })
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })
    
    if (!material) {
      throw new Error('Material not found')
    }
    
    // Check if this material is already in the BOM
    const existingEntry = await prisma.bOM.findFirst({
      where: {
        productId: data.productId,
        materialId: data.materialId
      }
    })
    
    if (existingEntry) {
      throw new Error('This material is already in the bill of materials')
    }
    
    // Convert input to Prisma-compatible format with Decimal
    const prismaData = adaptCreateInputForPrisma(data)
    
    const bomEntry = await prisma.bOM.create({
      data: {
        ...prismaData,
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
    return adaptBOMEntryForDisplay(bomEntry)
  } catch (error) {
    console.error('Error creating BOM entry:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to add material to bill of materials')
  }
}

/**
 * Updates an existing BOM entry
 * 
 * @param data The input data for updating a BOM entry
 * @returns The updated BOM entry
 */
export async function updateBOMEntry(data: UpdateBOMEntryInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    // Find the existing entry to get productId for revalidation
    const existingEntry = await prisma.bOM.findUnique({
      where: { id: data.id },
      select: { productId: true }
    })
    
    if (!existingEntry) {
      throw new Error('BOM entry not found')
    }
    
    // Convert input to Prisma-compatible format with Decimal
    const updateData = adaptUpdateInputForPrisma(data)
    
    // Remove id from update data
    const { id, ...updateFields } = updateData
    
    const bomEntry = await prisma.bOM.update({
      where: { id: data.id },
      data: {
        ...updateFields,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      },
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      }
    })
    
    revalidatePath(`/admin/products/${existingEntry.productId}`)
    return adaptBOMEntryForDisplay(bomEntry)
  } catch (error) {
    console.error('Error updating BOM entry:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to update material in bill of materials')
  }
}

/**
 * Deletes a BOM entry
 * 
 * @param id The ID of the BOM entry to delete
 * @returns Void
 */
export async function deleteBOMEntry(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    // Find the existing entry to get productId for revalidation
    const existingEntry = await prisma.bOM.findUnique({
      where: { id },
      select: { productId: true }
    })
    
    if (!existingEntry) {
      throw new Error('BOM entry not found')
    }
    
    await prisma.bOM.delete({
      where: { id }
    })
    
    revalidatePath(`/admin/products/${existingEntry.productId}`)
  } catch (error) {
    console.error('Error deleting BOM entry:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to remove material from bill of materials')
  }
}

/**
 * Fetches available materials that can be added to a product's BOM
 * 
 * @returns Array of materials with their details
 */
export async function getAvailableMaterials() {
  try {
    const materials = await prisma.material.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        unitOfMeasure: {
          select: {
            name: true,
            symbol: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    // Convert any Decimal values to numbers
    return materials.map(material => ({
      ...material,
      costPerUnit: material.costPerUnit instanceof Decimal ? 
        material.costPerUnit.toNumber() : 
        Number(material.costPerUnit)
    }))
  } catch (error) {
    console.error('Error fetching available materials:', error)
    throw new Error('Failed to fetch available materials')
  }
}

/**
 * Gets materials that match a search query
 * 
 * @param query The search query string
 * @returns Array of filtered materials
 */
export async function searchMaterials(query: string) {
  try {
    const materials = await prisma.material.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } }
        ],
        status: 'ACTIVE'
      },
      include: {
        unitOfMeasure: {
          select: {
            name: true,
            symbol: true
          }
        }
      },
      take: 10 // Limit results for performance
    })
    
    // Convert any Decimal values to numbers
    return materials.map(material => ({
      ...material,
      costPerUnit: material.costPerUnit instanceof Decimal ? 
        material.costPerUnit.toNumber() : 
        Number(material.costPerUnit)
    }))
  } catch (error) {
    console.error('Error searching materials:', error)
    throw new Error('Failed to search materials')
  }
}

/**
 * Gets detailed information for a BOM entry
 * 
 * @param id The ID of the BOM entry
 * @returns The BOM entry with material details
 */
export async function getBOMEntryById(id: string) {
  try {
    const bomEntry = await prisma.bOM.findUnique({
      where: { id },
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      }
    })
    
    if (!bomEntry) {
      throw new Error('BOM entry not found')
    }
    
    return adaptBOMEntryForDisplay(bomEntry)
  } catch (error) {
    console.error('Error fetching BOM entry:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to fetch BOM entry')
  }
}

/**
 * Calculates the material cost for a product
 * 
 * @param productId The product ID to calculate cost for
 * @returns The total material cost
 */
export async function calculateMaterialCost(productId: string) {
  try {
    const bom = await getBOMForProduct(productId)
    return bom.totalMaterialCost
  } catch (error) {
    console.error('Error calculating material cost:', error)
    throw new Error('Failed to calculate material cost')
  }
}