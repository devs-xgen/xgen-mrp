// src/lib/actions/suppliers.ts 
'use server'

import { prisma } from "@/lib/db"

export async function getAllSuppliers() {
  try {
    return await prisma.supplier.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        code: true,
        contactPerson: true,
        email: true,
        phone: true
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    throw new Error('Failed to fetch suppliers')
  }
}