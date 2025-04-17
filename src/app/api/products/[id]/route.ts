import { convertDecimals } from "@/lib/convertDecimals"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

interface RouteParams {
    params: {
        id: string
    }
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const json = await req.json()
        const product = await prisma.product.update({
            where: {
                id: params.id
            },
            data: {
                name: json.name,
                description: json.description,
                categoryId: json.categoryId,
                sizeRange: json.sizeRange || [],
                colorOptions: json.colorOptions || [],
                unitCost: json.unitCost,
                sellingPrice: json.sellingPrice,
                minimumStockLevel: json.minimumStockLevel,
                leadTime: json.leadTime,
                status: json.status,
                updatedAt: new Date(),
            },
            include: {
                category: true,
            }
        })
        return NextResponse.json(convertDecimals(product))
    } catch (error: any) {
        console.error('Product update error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A product with this SKU already exists" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: "Error updating product" },
            { status: 500 }
        )
    }
}

export async function DELETE(_: Request, { params }: RouteParams) {
    try {
        await prisma.product.delete({
            where: {
                id: params.id
            }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Product deletion error:', error)
        return NextResponse.json(
            { error: "Error deleting product" },
            { status: 500 }
        )
    }
}

export async function GET(_: Request, { params }: RouteParams) {
    try {
        const product = await prisma.product.findUnique({
            where: {
                id: params.id
            },
            include: {
                category: true,
                boms: {
                    include: {
                        material: true
                    }
                }
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(convertDecimals(product))
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json(
            { error: "Error fetching product" },
            { status: 500 }
        )
    }
}