import { prisma } from '@/lib/db'
import { compare } from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Portal to roles mapping
const PORTAL_ROLES = {
    'ADMIN': ['ADMIN'],
    'WORKER': ['WORKER'],
    'INSPECTOR': ['INSPECTOR'],
    'DELIVERY': ['DELIVERY']
}

// Login pages for different portals
const PORTAL_LOGIN_PAGES = {
    'ADMIN': '/admin/login',
    'WORKER': '/worker/login',
    'INSPECTOR': '/inspector/login',
    'DELIVERY': '/delivery/login'
}

// Extend the User and Session types
declare module "next-auth" {
    interface User {
        id: string
        email: string
        role: string
        name?: string | null
        portal: string
    }
    
    interface Session {
        user: {
            id: string
            email?: string | null
            name?: string | null
            role: string
            portal: string
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
        portal: string
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'credentials',
            credentials: {
                email: { type: "text" },
                password: { type: "password" },
                portal: { type: "text" } // The portal user is trying to access
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password || !credentials?.portal) {
                        throw new Error("Please provide all required fields")
                    }

                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    })

                    if (!user) {
                        throw new Error("Invalid email or password")
                    }

                    const isPasswordValid = await compare(credentials.password, user.password)

                    if (!isPasswordValid) {
                        throw new Error("Invalid email or password")
                    }

                    // Check if user role is allowed in the requested portal
                    const requestedPortal = credentials.portal.toUpperCase()
                    const allowedRoles = PORTAL_ROLES[requestedPortal as keyof typeof PORTAL_ROLES] || []

                    if (!allowedRoles.includes(user.role)) {
                        throw new Error("You don't have permission to access this portal")
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        name: user.email.split("@")[0],
                        portal: requestedPortal,
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        throw new Error(error.message)
                    }
                    throw new Error("An error occurred during login")
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.portal = user.portal
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.portal = token.portal as string
            }
            return session
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
        signIn: '/admin/login', // Default sign in page
        error: '/admin/login', // Redirect to admin login on error
    },
    secret: process.env.NEXTAUTH_SECRET,
}