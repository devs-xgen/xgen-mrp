"use server"

import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db" // Updated to use your db path
import { authOptions } from "../auth"

interface CreateMaterialRequestData {
  workCenterId: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  requiredDate: Date
  notes?: string
  productionOrderId?: string
  items: {
    inventoryItemId: string
    quantityRequested: number
    unit: string
    notes?: string
  }[]
}

export async function createMaterialRequest(data: CreateMaterialRequestData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const materialRequest = await prisma.materialRequest.create({
      data: {
        requestedById: session.user.id,
        workCenterId: data.workCenterId,
        priority: data.priority,
        requiredDate: data.requiredDate,
        notes: data.notes,
        productionOrderId: data.productionOrderId,
        items: {
          create: data.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantityRequested: item.quantityRequested,
            unit: item.unit,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
        workCenter: true,
        requestedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return { success: true, materialRequest }
  } catch (error) {
    console.error("Error creating material request:", error)
    return { success: false, error: "Failed to create material request" }
  }
}

export async function getMaterialRequests() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const materialRequests = await prisma.materialRequest.findMany({
      include: {
        items: {
          include: {
            inventoryItem: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        workCenter: {
          select: {
            name: true,
          },
        },
        requestedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        requestDate: "desc",
      },
    })

    return materialRequests
  } catch (error) {
    console.error("Error fetching material requests:", error)
    throw new Error("Failed to fetch material requests")
  }
}

export async function getWorkCenters() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const workCenters = await prisma.workCenter.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return workCenters
  } catch (error) {
    console.error("Error fetching work centers:", error)
    throw new Error("Failed to fetch work centers")
  }
}

export async function getInventoryItems() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        availableQuantity: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return inventoryItems
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    throw new Error("Failed to fetch inventory items")
  }
}
