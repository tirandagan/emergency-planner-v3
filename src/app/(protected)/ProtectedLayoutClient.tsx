'use client'

import { useState, useEffect } from 'react'
import { Sidebar, SidebarCollapseProvider, useSidebarCollapse } from '@/components/protected/Sidebar'
import { cn } from '@/lib/utils'
import type { SubscriptionTier } from '@/lib/types/subscription'

interface ProtectedLayoutClientProps {
  children: React.ReactNode
  userName: string
  userEmail: string
  userTier: SubscriptionTier
  planCount: number
  planLimit: number
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarCollapse()

  return (
    <main
      className="h-full overflow-auto transition-all duration-200"
      style={{
        marginLeft: isCollapsed ? '5rem' : '16rem', // 80px : 256px
      }}
    >
      <div className="p-4 md:p-8">
        {children}
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
  // Always start with false to match server-side rendering
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage after hydration
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(true)
    }
  }, [])

  // Toggle collapse and save to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  return (
    <SidebarCollapseProvider value={{ isCollapsed, toggleCollapse }}>
      <div className="h-screen overflow-hidden">
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          userTier={userTier}
          planCount={planCount}
          planLimit={planLimit}
        />

        <MainContent>{children}</MainContent>
      </div>
    </SidebarCollapseProvider>
  )
}
