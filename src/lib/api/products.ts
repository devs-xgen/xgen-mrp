import { prisma } from "@/lib/db"

export async function getProducts() {
    const products = await prisma.product.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    })
    return products
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