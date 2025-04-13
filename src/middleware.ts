import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Define which roles belong to each portal
const PORTAL_ROLES = {
    'ADMIN_PORTAL': ['ADMIN'],
    'WORKER_PORTAL': ['WORKER'],
    'INSPECTOR_PORTAL': ['INSPECTOR'],
    'DELIVERY_PORTAL': ['DELIVERY']
}

// Portal path mappings
const PORTAL_PATHS = {
    'ADMIN_PORTAL': '/admin',
    'WORKER_PORTAL': '/worker',
    'INSPECTOR_PORTAL': '/inspector',
    'DELIVERY_PORTAL': '/delivery'
}

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const pathname = req.nextUrl.pathname

        if (pathname === '/') {
            if (token) {
                // Get portal path based on role
                const role = token.role as string
                let redirectPath = '/admin/dashboard' // Default

                // Find which portal the role belongs to
                for (const [portal, roles] of Object.entries(PORTAL_ROLES)) {
                    if (roles.includes(role)) {
                        const portalPath = PORTAL_PATHS[portal as keyof typeof PORTAL_PATHS]
                        redirectPath = `${portalPath}/dashboard`
                        break
                    }
                }
                
                return NextResponse.redirect(new URL(redirectPath, req.url))
            }
            return NextResponse.next()
        }

        // Handle authenticated users
        if (token) {
            const userRole = token.role as string
            
            // Prevent accessing login pages when authenticated
            if (pathname.includes('/login')) {
                // Determine correct portal based on role
                let redirectPath = '/admin/dashboard' // Default
                
                for (const [portal, roles] of Object.entries(PORTAL_ROLES)) {
                    if (roles.includes(userRole)) {
                        const portalPath = PORTAL_PATHS[portal as keyof typeof PORTAL_PATHS]
                        redirectPath = `${portalPath}/dashboard`
                        break
                    }
                }
                
                return NextResponse.redirect(new URL(redirectPath, req.url))
            }

            // Check if user is accessing the correct portal for their role
            for (const [portal, paths] of Object.entries(PORTAL_PATHS)) {
                if (pathname.startsWith(paths)) {
                    // If user is in this portal, check if they have permission
                    const portalRoles = PORTAL_ROLES[portal as keyof typeof PORTAL_ROLES]
                    if (!portalRoles.includes(userRole)) {
                        // Redirect to appropriate portal
                        for (const [userPortal, roles] of Object.entries(PORTAL_ROLES)) {
                            if (roles.includes(userRole)) {
                                const correctPath = PORTAL_PATHS[userPortal as keyof typeof PORTAL_PATHS]
                                return NextResponse.redirect(new URL(`${correctPath}/dashboard`, req.url))
                            }
                        }
                    }
                }
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

                const userRole = token.role as string

                // Check authorization based on portal paths
                for (const [portal, path] of Object.entries(PORTAL_PATHS)) {
                    if (pathname.startsWith(path)) {
                        const portalRoles = PORTAL_ROLES[portal as keyof typeof PORTAL_ROLES]
                        return portalRoles.includes(userRole)
                    }
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