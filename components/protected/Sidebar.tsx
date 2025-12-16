/**
 * Sidebar Component (Server Component)
 * 
 * Main navigation sidebar for protected routes.
 * Displays user info, tier badge, navigation links, and usage indicator.
 * Responsive: persistent on desktop, Sheet drawer on mobile.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  ClipboardList, 
  Activity, 
  GraduationCap, 
  Video, 
  User,
  ShoppingBag,
  Sun,
  Moon,
  LogOut,
  Users,
  FolderTree,
  CheckCircle,
  Factory,
  Tags,
  Boxes,
  Upload,
  Wrench,
  Brain,
  ArrowLeftRight
} from 'lucide-react'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { UserAvatar } from './UserAvatar'
import { TierBadge } from './TierBadge'
import { MobileNav } from './MobileNav'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  userName: string
  userEmail: string
  userTier: SubscriptionTier
  planCount?: number
  planLimit?: number
}

const userNavigationLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/plans', label: 'My Plans', icon: FileText },
  { href: '/bundles', label: 'Bundles', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: ClipboardList },
  { href: '/store', label: 'Store', icon: ShoppingBag },
  { href: '/readiness', label: 'Readiness', icon: Activity },
  { href: '/skills', label: 'Skills', icon: GraduationCap },
  { href: '/expert-calls', label: 'Expert Calls', icon: Video },
  { href: '/profile', label: 'Profile', icon: User },
]

const adminNavigationLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/ai-usage', label: 'AI Usage', icon: Brain },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/suppliers', label: 'Suppliers', icon: Factory },
  { href: '/admin/products', label: 'Products', icon: Tags },
  { href: '/admin/bundles', label: 'Bundles', icon: Boxes },
  { href: '/admin/approvals', label: 'Approvals', icon: CheckCircle },
  { href: '/admin/import', label: 'Import', icon: Upload },
  { href: '/admin/debug', label: 'Debug', icon: Wrench },
]

function SidebarContent({ 
  userName, 
  userEmail, 
  userTier,
  planCount = 0,
  planLimit = 1,
  onNavigate
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { isAdmin, user, isLoading } = useAuth()
  const [viewAdminMenu, setViewAdminMenu] = useState(pathname.startsWith('/admin'))
  
 
  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(href) || false
  }
  
  const percentage = planLimit === -1 ? 100 : Math.min(100, (planCount / planLimit) * 100)
  const hasReachedLimit = planLimit !== -1 && planCount >= planLimit
  
  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      if (error && typeof error === 'object' && 'digest' in error &&
          typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        window.location.href = '/'
        return
      }
      console.error('Logout failed:', error)
      window.location.href = '/'
    }
  }
  
  const toggleAdminView = () => {
    setViewAdminMenu(!viewAdminMenu)
  }
  
  // Choose navigation links based on view mode
  const navigationLinks = viewAdminMenu ? adminNavigationLinks : userNavigationLinks
  
  return (
    <div className="flex flex-col h-full bg-muted">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Link href="/dashboard" className="text-xl font-bold text-foreground">
          beprepared.ai
        </Link>
        {isAdmin && (
          <Button
            onClick={toggleAdminView}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={viewAdminMenu ? 'Switch to User Menu' : 'Switch to Admin Menu'}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* User Info */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={userName} email={userEmail} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <div className="mt-2">
          <TierBadge tier={userTier} />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navigationLinks.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)
          
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>
      
      {/* Usage Indicator (FREE tier only) */}
      {userTier === 'FREE' && (
        <div className="px-4 py-3 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Plans Saved</p>
              <p className="text-sm font-medium">
                {planCount} / {planLimit}
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-background rounded-full h-1.5">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  hasReachedLimit ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            {/* Upgrade link */}
            <Link
              href="/pricing"
              className="text-xs text-primary hover:underline block"
              onClick={onNavigate}
            >
              {hasReachedLimit 
                ? 'Upgrade to save more plans' 
                : 'Upgrade for unlimited plans'}
            </Link>
          </div>
        </div>
      )}
      
      {/* Bottom Actions: Theme Toggle & Logout */}
      <div className="px-4 py-3 border-t border-border space-y-2">
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'text-muted-foreground hover:bg-background/50 hover:text-foreground'
          )}
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-5 w-5 flex-shrink-0" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-5 w-5 flex-shrink-0" />
              <span>Light Mode</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'text-muted-foreground hover:bg-background/50 hover:text-foreground'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  
  return (
    <>
      {/* Mobile nav toggle - hide if viewing admin menu */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <MobileNav onClick={() => setMobileOpen(true)} />
      </div>
      
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent {...props} />
        </div>
      </aside>
      
      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent 
            {...props} 
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

