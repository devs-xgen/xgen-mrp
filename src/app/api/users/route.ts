import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { Role, UserStatus } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        console.log('Received data:', json) // Debug log

        const { email, password, role, profile } = json

        if (!email || !password || !role || !profile) {
            return new NextResponse(
                JSON.stringify({
                    error: "Missing required fields",
                    details: { email: !email, password: !password, role: !role, profile: !profile }
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            )
        }

        // Validate role enum
        if (!Object.values(Role).includes(role)) {
            return new NextResponse(
                JSON.stringify({
                    error: `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`
                }),
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return new NextResponse(
                JSON.stringify({
                    error: "User with this email already exists"
                }),
                { status: 400 }
            )
        }

        // Validate profile data
        if (!profile.firstName || !profile.lastName) {
            return new NextResponse(
                JSON.stringify({
                    error: "First name and last name are required"
                }),
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user with profile
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role as Role,
                status: UserStatus.ACTIVE,
                profile: {
                    create: {
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        employeeId: profile.employeeId || null,
                        department: profile.department || null,
                        position: profile.position || null,
                        // Add other optional fields with null defaults
                        phoneNumber: null,
                        address: null,
                        city: null,
                        state: null,
                        country: null,
                        postalCode: null,
                        dateOfBirth: null,
                        gender: null,
                        avatar: null,
                        bio: null,
                    }
                }
            },
            include: {
                profile: true,
            },
        })

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user

        return new NextResponse(JSON.stringify(userWithoutPassword), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Error creating user:', error)

        // Handle Prisma-specific errors
        if (error?.code === 'P2002') {
            return new NextResponse(
                JSON.stringify({
                    error: "A user with this email already exists"
                }),
                { status: 400 }
            )
        }

        return new NextResponse(
            JSON.stringify({
                error: "Failed to create user",
                details: error instanceof Error ? error.message : "Unknown error occurred",
                code: error?.code
            }),
            { status: 500 }
        )
    }
}


export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: {
                profile: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // Remove password field from response
        const sanitizedUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user
            return userWithoutPassword
        })

        return NextResponse.json(sanitizedUsers)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}
