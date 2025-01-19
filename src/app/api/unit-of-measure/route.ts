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

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const unitOfMeasures = await prisma.unitOfMeasure.findMany({
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(unitOfMeasures)
    } catch (error) {
        console.error("[UNIT_OF_MEASURES_GET]", error)
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}

export async function POST(req: Request) {
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
        console.log('Validated body:', body)

        // Check for duplicate name or symbol
        const existingUnit = await prisma.unitOfMeasure.findFirst({
            where: {
                OR: [
                    { name: body.name },
                    { symbol: body.symbol }
                ]
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

        const unitOfMeasure = await prisma.unitOfMeasure.create({
            data: {
                ...body,
                createdBy: session.user.id,
            },
        })

        return NextResponse.json(unitOfMeasure)
    } catch (error) {
        console.error("[UNIT_OF_MEASURES_POST]", error)
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