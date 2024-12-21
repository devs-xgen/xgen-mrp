import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"

const ROLE_MAPPING = {
    'ADMIN': ['ADMIN', 'MANAGER'],
    'OPERATOR': ['OPERATOR', 'USER']
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'credentials',
            credentials: {
                email: { type: "text" },
                password: { type: "password" },
                userType: { type: "text" }
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password || !credentials?.userType) {
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

                    const requestedUserType = credentials.userType.toUpperCase()
                    const allowedRoles = ROLE_MAPPING[requestedUserType as keyof typeof ROLE_MAPPING] || []

                    if (!allowedRoles.includes(user.role)) {
                        throw new Error("You don't have permission to access this portal")
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        name: user.email.split("@")[0],
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
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
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
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }