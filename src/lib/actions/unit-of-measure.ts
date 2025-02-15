// src/lib/actions/unit-of-measure.ts
'use server'

import { prisma } from "@/lib/db"
import { getEntities, createEntity, updateEntity, deleteEntity } from "@/lib/utils/server-actions"
import { Status } from "@prisma/client"

const PATH = '/admin/materials'

export async function getUnitOfMeasures() {
  return getEntities(prisma.unitOfMeasure)
}

export async function createUnitOfMeasure(data: {
  name: string
  symbol: string
  description?: string | null
  status: Status
}) {
  return createEntity(prisma.unitOfMeasure, data, PATH)
}

export async function updateUnitOfMeasure(id: string, data: {
  name?: string
  symbol?: string
  description?: string | null
  status?: Status
}) {
  return updateEntity(prisma.unitOfMeasure, id, data, PATH)
}

export async function deleteUnitOfMeasure(id: string) {
  return deleteEntity(prisma.unitOfMeasure, id, PATH)
}