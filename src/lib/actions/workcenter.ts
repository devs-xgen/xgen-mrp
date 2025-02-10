// src/lib/actions/workCenters.ts
'use server'

import { prisma } from "@/lib/db"

export async function getAllWorkCenters() {
  try {
    const workCenters = await prisma.workCenter.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        // location: true,
        capacityPerHour: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return workCenters
  } catch (error) {
    throw new Error('Failed to fetch work centers')
  }
}
