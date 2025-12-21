'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SidebarNew, SidebarStateProvider, useSidebarState } from '@/components/protected/SidebarNew'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { Loader2 } from 'lucide-react'

interface ProtectedLayoutClientProps {
  children: React.ReactNode
  userName: string
  userEmail: string
  userTier: SubscriptionTier
  planCount: number
  planLimit: number
}

function MainContent({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isOpen } = useSidebarState()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <main
      className="h-full overflow-hidden transition-all duration-200 bg-neutral-50 dark:bg-neutral-900"
      style={{
        marginLeft: isMobile ? '0' : (isOpen ? '300px' : '60px'),
      }}
    >
      {/* Elevated paper-like content container */}
      <div className="h-full pl-4 pr-4 py-2 md:pl-6 md:pr-4 md:py-3 lg:pl-8 lg:pr-6 lg:py-4">
        <div className="h-full bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}

export function ProtectedLayoutClient({
  children,
  userName,
  userEmail,
  userTier,
  planCount,
  planLimit
}: ProtectedLayoutClientProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Cache invalidation for admin routes
  const pathname = usePathname()
  const { user, refreshProfile } = useAuth()
  const lastRefreshedPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) return

    const isAdminRoute = pathname?.startsWith('/admin')
    const isDashboard = pathname === '/dashboard' || pathname === '/'

    if ((isAdminRoute || isDashboard) && pathname !== lastRefreshedPathRef.current) {
      console.debug('[ProtectedLayoutClient] Admin/dashboard route detected, refreshing profile')
      lastRefreshedPathRef.current = pathname
      refreshProfile()
    }
  }, [pathname, user, refreshProfile])

  // Hide loading screen after a brief moment to allow auth context to settle
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  // Show clean loading screen during initial mount
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <SidebarStateProvider value={{ isOpen, setIsOpen }}>
      <div className="h-screen overflow-hidden">
        <SidebarNew
          userName={userName}
          userEmail={userEmail}
          userTier={userTier}
          planCount={planCount}
          planLimit={planLimit}
        />

        <MainContent>{children}</MainContent>
      </div>
    </SidebarStateProvider>
  )
}
