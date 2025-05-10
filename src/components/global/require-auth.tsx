'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function RequireAuth({
  children,
  allowedRoles = []
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    // If we're still loading, don't do anything yet
    if (status === 'loading') return
    
    // Not logged in - redirect to appropriate login page
    if (status === 'unauthenticated') {
      let loginPage = '/login'
      
      // Determine which portal login page to use based on current URL
      if (pathname.startsWith('/admin')) {
        loginPage = '/admin/login'
      } else if (pathname.startsWith('/worker')) {
        loginPage = '/worker/login'
      } else if (pathname.startsWith('/inspector')) {
        loginPage = '/inspector/login'
      } else if (pathname.startsWith('/delivery')) {
        loginPage = '/delivery/login'
      }
      
      router.replace(loginPage)
      return
    }
    
    // Check role permissions if roles are specified
    if (allowedRoles.length > 0 && session?.user?.role) {
      const hasPermission = allowedRoles.includes(session.user.role)
      
      if (!hasPermission) {
        // Redirect to appropriate dashboard based on user's role
        const role = session.user.role.toLowerCase()
        if (role === 'admin') {
          router.replace('/admin/dashboard')
        } else if (role === 'worker') {
          router.replace('/worker/dashboard')
        } else if (role === 'inspector') {
          router.replace('/inspector/dashboard')
        } else if (role === 'delivery') {
          router.replace('/delivery/dashboard')
        } else {
          // Fallback for unknown roles
          router.replace('/')
        }
      }
    }
  }, [status, session, router, pathname, allowedRoles])
  
  // Show loading indicator while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If authenticated and authorized (or no roles specified), render the children
  if (status === 'authenticated' && 
      (allowedRoles.length === 0 || allowedRoles.includes(session.user.role))) {
    return <>{children}</>
  }
  
  // Don't render anything while redirecting
  return null
} 