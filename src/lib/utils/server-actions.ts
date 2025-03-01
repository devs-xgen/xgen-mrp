// src/lib/utils/server-actions.ts
'use server'

import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"
import { prisma } from "@/lib/db"

interface BaseEntity {
  id: string
  name: string
  description?: string | null
  status: Status
}

export async function getEntities<T>(
  model: any, 
  orderBy: object = { name: 'asc' }
) {
  try {
    return await model.findMany({ orderBy })
  } catch (error) {
    console.error(`Error fetching entities:`, error)
    throw new Error(`Failed to fetch entities`)
  }
}

// Generic create function
export async function createEntity<T extends BaseEntity>(
  model: any,
  data: Omit<T, 'id'>,
  path: string
) {
  try {
    const result = await model.create({
      data: {
        ...data,
        description: data.description || null,
      }
    })
    revalidatePath(path)
    return result
  } catch (error) {
    console.error(`Error creating entity:`, error)
    throw error
  }
}

// Generic update function
export async function updateEntity<T extends BaseEntity>(
  model: any,
  id: string,
  data: Partial<T>,
  path: string
) {
  try {
    const result = await model.update({
      where: { id },
      data: {
        ...data,
        description: data.description || null,
      }
    })
    revalidatePath(path)
    return result
  } catch (error) {
    console.error(`Error updating entity:`, error)
    throw error
  }
}

// Generic delete function
export async function deleteEntity(
  model: any,
  id: string,
  path: string
) {
  try {
    await model.delete({
      where: { id }
    })
    revalidatePath(path)
  } catch (error) {
    console.error(`Error deleting entity:`, error)
    throw error
  }
}