import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const ADMIN_ROLES = ['ADMIN', 'MANAGER']
const WORKER_ROLES = ['OPERATOR', 'USER']

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const pathname = req.nextUrl.pathname

        // Handle root path
        if (pathname === '/') {
            if (token) {
                // Redirect based on role
                if (ADMIN_ROLES.includes(token.role as string)) {
                    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
                } else {
                    return NextResponse.redirect(new URL('/worker/dashboard', req.url))
                }
            }
            return NextResponse.next()
        }

        // Handle authenticated users
        if (token) {
            const isAdminRole = ADMIN_ROLES.includes(token.role as string)
            const isWorkerRole = WORKER_ROLES.includes(token.role as string)

            // Prevent accessing login pages when authenticated
            if (pathname.includes('/login')) {
                const redirectPath = isAdminRole ? '/admin/dashboard' : '/worker/dashboard'
                return NextResponse.redirect(new URL(redirectPath, req.url))
            }

            // Redirect admin trying to access worker routes
            if (isAdminRole && pathname.startsWith('/worker')) {
                return NextResponse.redirect(new URL('/admin/dashboard', req.url))
            }

            // Redirect worker trying to access admin routes
            if (isWorkerRole && pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/worker/dashboard', req.url))
            }
        }

        // Handle unauthenticated users
        if (!token && !pathname.includes('/login') && pathname !== '/') {
            return NextResponse.redirect(new URL('/admin/login', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname

                // Public routes
                if (pathname === '/' || pathname.includes('/login')) {
                    return true
                }

                if (!token) {
                    return false
                }

                // Admin routes
                if (pathname.startsWith('/admin/')) {
                    return ADMIN_ROLES.includes(token.role as string)
                }

                // Worker routes
                if (pathname.startsWith('/worker/')) {
                    return WORKER_ROLES.includes(token.role as string)
                }

                return false
            }
        }
    }
)

export const config = {
    matcher: [

        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}