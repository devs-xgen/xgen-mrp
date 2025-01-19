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

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const materialTypes = await prisma.materialType.findMany({
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(materialTypes)
    } catch (error) {
        console.error("[MATERIAL_TYPES_GET]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const json = await req.json()
        const body = materialTypeSchema.parse(json)

        const materialType = await prisma.materialType.create({
            data: {
                ...body,
                createdBy: session.user.id,
            },
        })

        return NextResponse.json(materialType)
    } catch (error) {
        console.error("[MATERIAL_TYPES_POST]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}