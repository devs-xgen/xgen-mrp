import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { convertDecimals } from "@/lib/convertDecimals"


export async function POST(req: Request) {
    try {
        const json = await req.json()
        const category = await prisma.productCategory.create({
            data: {
                name: json.name,
                description: json.description,
                status: 'ACTIVE'
            }
        })
        return NextResponse.json(convertDecimals(category))
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: "Error creating category" },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const categories = await prisma.productCategory.findMany({
            orderBy: {
                name: 'asc'
            }
        })
        return NextResponse.json(convertDecimals(categories))
    } catch (error) {
        return NextResponse.json(
            { error: "Error fetching categories" },
            { status: 500 }
        )
    }
}