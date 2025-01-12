import { prisma } from '@/lib/db'

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                category: true,
            }
        })
        return products
    } catch (error) {
        console.error('Error fetching products:', error)
        throw error
    }
}

export async function getCategories() {
    const categories = await prisma.productCategory.findMany({
        where: {
            status: 'ACTIVE',
        },
        orderBy: {
            name: 'asc',
        },
    })
    return categories
}   