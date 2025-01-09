import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Status } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const json = await req.json()

        const product = await prisma.product.create({
            data: {
                name: json.name,
                sku: json.sku,
                description: json.description,
                categoryId: json.categoryId,
                sizeRange: json.sizeRange || [],
                colorOptions: json.colorOptions || [],
                unitCost: json.unitCost,
                sellingPrice: json.sellingPrice,
                minimumStockLevel: json.minimumStockLevel,
                currentStock: 0, // Initial stock is 0
                leadTime: json.leadTime,
                status: 'ACTIVE' as Status
            }
        })

        return NextResponse.json(product)
    } catch (error: any) {
        console.error('Product creation error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A product with this SKU already exists" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: "Error creating product" },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const categoryId = searchParams.get('categoryId')
        const statusParam = searchParams.get('status')

        // Validate status is a valid enum value
        const status = statusParam && Object.values(Status).includes(statusParam as Status)
            ? statusParam as Status
            : undefined

        const where = {
            ...(categoryId && { categoryId }),
            ...(status && { status }),
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: "Error fetching products" },
            { status: 500 }
        )
    }
}