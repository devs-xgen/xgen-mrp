'use server'

import { prisma } from "@/lib/db"

export async function getAllCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return customers
  } catch (error) {
    console.error("Error fetching customers:", error)
    throw new Error("Failed to fetch customers")
  }
}
