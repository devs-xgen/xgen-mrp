// src/lib/actions/materials.ts
'use server'

import { prisma } from "@/lib/db"

import { revalidatePath } from "next/cache"
import { Material, MaterialCreateInput, MaterialUpdateInput } from "@/types/admin/materials"

// was used in purchase order
export async function getAllMaterials() {
  try {
    const materials = await prisma.material.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        sku: true,
        costPerUnit: true,
        currentStock: true,
        unitOfMeasure: {
          select: {
            symbol: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return materials.map((material: { costPerUnit: { toNumber: () => any } }) => ({
      ...material,
      costPerUnit: material.costPerUnit.toNumber()
    }))
  } catch (error) {
    throw new Error('Failed to fetch materials')
  }
}

export async function getAllMaterialTypes() {
  try {
    const materialTypes = await prisma.materialType.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return materialTypes;
  } catch (error) {
    throw new Error('Failed to fetch material types');
  }
}
// was used in purchase order
export async function getAllUnitMeasures() {
  try {
    const unitMeasures = await prisma.unitOfMeasure.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return unitMeasures;
  } catch (error) {
    throw new Error('Failed to fetch unit measures');
  }
}



// MAIN ACTIONS
export async function getMaterials(): Promise<Material[]> {
  try {
    const materials = await prisma.material.findMany({
      include: {
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        unitOfMeasure: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    return materials
  } catch (error) {
    throw new Error('Failed to fetch materials')
  }
}

export async function createMaterial(data: MaterialCreateInput) {
  try {
    const material = await prisma.material.create({
      data: {
        ...data,
        status: 'ACTIVE',
      },
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
      },
    })
    revalidatePath('/admin/materials')
    return material
  } catch (error) {
    throw new Error('Failed to create material')
  }
}

export async function updateMaterial(data: MaterialUpdateInput) {
  try {
    const material = await prisma.material.update({
      where: { id: data.id },
      data,
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
      },
    })
    revalidatePath('/admin/materials')
    return material
  } catch (error) {
    throw new Error('Failed to update material')
  }
}

export async function deleteMaterial(id: string) {
  try {
    await prisma.material.delete({
      where: { id },
    })
    revalidatePath('/admin/materials')
  } catch (error) {
    throw new Error('Failed to delete material')
  }
}


export async function getMaterialTypes() {
  try {
    return await prisma.materialType.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true
      }
    })
  } catch (error) {
    throw new Error('Failed to fetch material types')
  }
}

export async function getUnitOfMeasures() {
  try {
    return await prisma.unitOfMeasure.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        symbol: true
      }
    })
  } catch (error) {
    throw new Error('Failed to fetch units of measure')
  }
}

export async function getSuppliers() {
  try {
    return await prisma.supplier.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true
      }
    })
  } catch (error) {
    throw new Error('Failed to fetch suppliers')
  }
}