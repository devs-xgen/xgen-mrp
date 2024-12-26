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
        const category = await prisma.productCategory.update({
            where: {
                id: params.id
            },
            data: {
                name: json.name,
                description: json.description,
                updatedAt: new Date(),
            }
        })
        return NextResponse.json(category)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: "Error updating category" },
            { status: 500 }
        )
    }
}

export async function DELETE(_: Request, { params }: RouteParams) {
    try {
        // Check if the category has associated products
        const category = await prisma.productCategory.findUnique({
            where: { id: params.id },
            include: { products: { select: { id: true }, take: 1 } }
        })

        if (category?.products.length ?? 0 > 0) {
            return NextResponse.json(
                { error: "Cannot delete category with associated products" },
                { status: 400 }
            )
        }

        await prisma.productCategory.delete({
            where: {
                id: params.id
            }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return NextResponse.json(
            { error: "Error deleting category" },
            { status: 500 }
        )
    }
}