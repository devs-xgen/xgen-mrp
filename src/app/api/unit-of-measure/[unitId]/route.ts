import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"

const unitOfMeasureSchema = z.object({
    name: z.string().min(2).max(50),
    symbol: z.string().min(1).max(10),
    description: z.string().max(500).optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

interface RouteParams {
    params: {
        unitId: string
    }
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse(
                JSON.stringify({ message: "Unauthorized" }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // Log the incoming request body
        const rawBody = await req.text()
        console.log('Raw request body:', rawBody)

        // Parse the JSON
        let json
        try {
            json = JSON.parse(rawBody)
            console.log('Parsed JSON:', json)
        } catch (e) {
            return new NextResponse(
                JSON.stringify({ message: "Invalid JSON format" }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // Validate the data
        const body = unitOfMeasureSchema.parse(json)

        // Check for duplicate name or symbol, excluding current record
        const existingUnit = await prisma.unitOfMeasure.findFirst({
            where: {
                OR: [
                    { name: body.name },
                    { symbol: body.symbol }
                ],
                NOT: {
                    id: params.unitId
                }
            },
        })

        if (existingUnit) {
            if (existingUnit.name === body.name) {
                return new NextResponse(
                    JSON.stringify({ message: "A unit of measure with this name already exists" }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                )
            }
            if (existingUnit.symbol === body.symbol) {
                return new NextResponse(
                    JSON.stringify({ message: "A unit of measure with this symbol already exists" }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                )
            }
        }

        const unitOfMeasure = await prisma.unitOfMeasure.update({
            where: {
                id: params.unitId,
            },
            data: {
                ...body,
                modifiedBy: session.user.id,
            },
        })

        return NextResponse.json(unitOfMeasure)
    } catch (error) {
        console.error("[UNIT_OF_MEASURE_PATCH]", error)
        if (error instanceof z.ZodError) {
            return new NextResponse(
                JSON.stringify({
                    message: "Validation error",
                    errors: error.errors
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse(
                JSON.stringify({ message: "Unauthorized" }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // Check if unit of measure is being used
        const materialsUsingUnit = await prisma.material.findFirst({
            where: {
                unitOfMeasureId: params.unitId
            }
        })

        if (materialsUsingUnit) {
            return new NextResponse(
                JSON.stringify({
                    message: "Cannot delete unit of measure as it is being used by materials"
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        await prisma.unitOfMeasure.delete({
            where: {
                id: params.unitId,
            },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[UNIT_OF_MEASURE_DELETE]", error)
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}