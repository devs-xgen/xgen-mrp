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