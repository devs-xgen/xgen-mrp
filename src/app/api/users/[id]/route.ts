import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Role, UserStatus } from '@prisma/client'


export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id

        // Delete user
        await prisma.user.delete({
            where: { id },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        )
    }
}


export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id
        const json = await request.json()
        const { role, status, firstName, lastName, employeeId, department, position } = json

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        })

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Update user and profile
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                role: role as Role,
                status: status as UserStatus,
                profile: {
                    update: {
                        firstName,
                        lastName,
                        employeeId: employeeId || null,
                        department: department || null,
                        position: position || null,
                    }
                }
            },
            include: {
                profile: true
            }
        })

        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser

        return NextResponse.json(userWithoutPassword)

    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}