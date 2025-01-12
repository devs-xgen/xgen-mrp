import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const customer = await prisma.customer.create({
            data: {
                ...body,
                createdBy: session.user.id,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error('[CUSTOMERS_POST]', error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(customers)
    } catch (error) {
        console.error('[CUSTOMERS_GET]', error)
        return new NextResponse("Internal error", { status: 500 })
    }
} 