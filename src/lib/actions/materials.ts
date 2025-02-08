// src/lib/actions/materials.ts
'use server'

import { prisma } from "@/lib/db"

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

// src/lib/actions/materialTypes.ts

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

// src/lib/actions/unitMeasures.ts

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
