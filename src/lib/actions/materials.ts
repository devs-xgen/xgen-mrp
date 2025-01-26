'use server'

import { prisma } from "@/lib/db"

export async function getMaterials() {
    return prisma.material.findMany({
        include: {
            type: true,
            unitOfMeasure: true,
            supplier: true,
        },
        orderBy: {
            name: 'asc',
        },
    })
}

export async function getMaterialTypes() {
    return prisma.materialType.findMany({
        where: {
            status: 'ACTIVE',
        },
        orderBy: {
            name: 'asc',
        },
    })
}

export async function getUnitOfMeasures() {
    return prisma.unitOfMeasure.findMany({
        where: {
            status: 'ACTIVE',
        },
        orderBy: {
            name: 'asc',
        },
    })
}

export async function getSuppliers() {
    return prisma.supplier.findMany({
        where: {
            status: 'ACTIVE',
        },
        orderBy: {
            name: 'asc',
        },
    })
}

export async function getPurchaseOrders() {
    return prisma.purchaseOrder.findMany({
      where: {
        status: 'ACTIVE', // Adjust this filter based on your application's logic
      },
      orderBy: {
        orderDate: 'desc', // Orders the results by orderDate in descending order
      },
      include: {
        supplier: true, // Includes the related supplier data
        orderLines: {
          include: {
            material: true, // Includes the related material data in each order line
          },
        },
      },
    });
  }