import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const customer = await prisma.customer.update({
            where: {
                id: params.id,
            },
            data: {
                ...body,
                modifiedBy: session.user.id,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error('[CUSTOMER_PATCH]', error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const customer = await prisma.customer.delete({
            where: {
                id: params.id,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error('[CUSTOMER_DELETE]', error)
        return new NextResponse("Internal error", { status: 500 })
    }
} 