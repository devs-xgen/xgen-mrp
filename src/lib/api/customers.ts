import { prisma } from "@/lib/db"

export async function getCustomers() {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        })
        return customers
    } catch (error) {
        console.error('Error fetching customers:', error)
        throw error
    }
} 