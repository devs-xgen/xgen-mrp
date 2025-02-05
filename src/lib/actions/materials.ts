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

    return materials.map(material => ({
      ...material,
      costPerUnit: material.costPerUnit.toNumber()
    }))
  } catch (error) {
    throw new Error('Failed to fetch materials')
  }
}