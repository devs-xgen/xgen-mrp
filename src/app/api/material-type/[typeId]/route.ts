import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"

const materialTypeSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().max(500).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

interface RouteParams {
    params: {
        typeId: string
    }
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const materialType = await prisma.materialType.findUnique({
            where: {
                id: params.typeId,
            },
        })

        if (!materialType) {
            return new NextResponse("Material type not found", { status: 404 })
        }

        return NextResponse.json(materialType)
    } catch (error) {
        console.error("[MATERIAL_TYPE_GET]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const json = await req.json()
        const body = materialTypeSchema.parse(json)

        const materialType = await prisma.materialType.update({
            where: {
                id: params.typeId,
            },
            data: {
                ...body,
                modifiedBy: session.user.id,
            },
        })

        return NextResponse.json(materialType)
    } catch (error) {
        console.error("[MATERIAL_TYPE_PATCH]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Check if material type is being used by any materials
        const materialsUsingType = await prisma.material.findFirst({
            where: {
                typeId: params.typeId
            }
        })

        if (materialsUsingType) {
            return new NextResponse(
                "Cannot delete material type as it is being used by materials", 
                { status: 400 }
            )
        }

        await prisma.materialType.delete({
            where: {
                id: params.typeId,
            },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[MATERIAL_TYPE_DELETE]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}