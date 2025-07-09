'use client'

import { SessionProvider } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

// Session monitoring component
function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [isIdle, setIsIdle] = useState(false)

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now())
      setIsIdle(false)
    }

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
    }
  }, [])

  // Idle detection
  useEffect(() => {
    const idleTimer = setInterval(() => {
      const now = Date.now()
      const idleTime = now - lastActivity
      const idleThreshold = 30 * 60 * 1000 // 30 minutes

      if (idleTime > idleThreshold && session && !isIdle) {
        setIsIdle(true)
        toast({
          title: "Session Warning",
          description: "You've been idle for 30 minutes. Your session will expire soon.",
          variant: "destructive",
        })
      }
    }, 60000) // Check every minute

    return () => clearInterval(idleTimer)
  }, [lastActivity, session, isIdle])

  // Session validation
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Validate session integrity
      const requiredFields = ['id', 'role', 'email']
      const missingFields = requiredFields.filter(field => !session.user[field])
      
      if (missingFields.length > 0) {
        console.error('Invalid session: missing fields:', missingFields)
        toast({
          title: "Session Error",
          description: "Your session is invalid. Please log in again.",
          variant: "destructive",
        })
        router.push('/admin/login')
        return
      }

      // Log successful session validation in development
      if (process.env.NODE_ENV === 'development') {
        console.info('✅ Session validated:', {
          userId: session.user.id,
          role: session.user.role,
          email: session.user.email
        })
      }
    }
  }, [session, status, router])

  // Handle authentication errors
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Clear any stale data
      localStorage.removeItem('user-preferences')
      sessionStorage.clear()
    }
  }, [status])

  return <>{children}</>
}

// Enhanced auth provider with session monitoring
export default function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider
      // Optimize session refresh
      refetchInterval={5 * 60} // 5 minutes
      refetchOnWindowFocus={true}
      // Reduce refetch when tab is hidden
      refetchWhenOffline={false}
    >
      <SessionMonitor>
        {children}
      </SessionMonitor>
    </SessionProvider>
  )
}