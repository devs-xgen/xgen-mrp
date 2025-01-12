import { prisma } from '@/lib/db'
import { compare } from 'bcryptjs'
import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                }
            }
        })
    ],
    callbacks: {
        jwt: async ({ token, user }) => {
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    role: user.role,
                }
            }
            return token
        },
        session: async ({ session, token }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    role: token.role,
                }
            }
        }
    },
    pages: {
        signIn: '/auth/signin',
    },
    session: {
        strategy: 'jwt'
    },
    secret: process.env.NEXTAUTH_SECRET,
}