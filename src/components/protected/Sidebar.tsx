/**
 * Sidebar Component (Server Component)
 * 
 * Main navigation sidebar for protected routes.
 * Displays user info, tier badge, navigation links, and usage indicator.
 * Responsive: persistent on desktop, Sheet drawer on mobile.
 */

'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
  CheckCircle,
  Factory,
  Tags,
  Boxes,
  Upload,
  Wrench,
  Brain,
  ArrowLeftRight,
  Info,
  ChevronLeft,
  ChevronRight
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Context for sidebar collapse state
const SidebarCollapseContext = createContext<{
  isCollapsed: boolean
  toggleCollapse: () => void
}>({
  isCollapsed: false,
  toggleCollapse: () => {},
})

export const useSidebarCollapse = () => useContext(SidebarCollapseContext)

export const SidebarCollapseProvider = SidebarCollapseContext.Provider

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
  { href: '/about', label: 'About', icon: Info },
]

const adminNavigationLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/ai-usage', label: 'AI Usage', icon: Brain },
  { href: '/admin/suppliers', label: 'Suppliers', icon: Factory },
  { href: '/admin/products', label: 'Products', icon: Tags },
  { href: '/admin/bundles', label: 'Bundles', icon: Boxes },
  { href: '/admin/approvals', label: 'Approvals', icon: CheckCircle },
  { href: '/admin/import', label: 'Import', icon: Upload },
  { href: '/admin/debug', label: 'System', icon: Wrench },
]

function SidebarContent({
  userName,
  userEmail,
  userTier,
  planCount = 0,
  planLimit = 1,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps & {
  onNavigate?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { isAdmin } = useAuth()
  const [viewAdminMenu, setViewAdminMenu] = useState(pathname.startsWith('/admin'))


  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    if (href === '/admin') {
      return pathname === '/admin'
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
    const newAdminView = !viewAdminMenu
    setViewAdminMenu(newAdminView)

    // Navigate to the appropriate dashboard
    if (newAdminView) {
      // Switching to admin mode → navigate to /admin
      router.push('/admin')
    } else {
      // Switching to user mode → navigate to /dashboard
      router.push('/dashboard')
    }

    // Close mobile nav if open
    if (onNavigate) {
      onNavigate()
    }
  }
  
  // Choose navigation links based on view mode
  const navigationLinks = viewAdminMenu ? adminNavigationLinks : userNavigationLinks
  
  return (
    <div className={cn(
      "flex flex-col h-full transition-all duration-200",
      viewAdminMenu ? "bg-slate-100 dark:bg-slate-900" : "bg-muted"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 relative">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-150 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="beprepared.ai logo"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                beprepared.ai
              </span>
            )}
          </Link>
          {viewAdminMenu && !isCollapsed && (
            <div className="flex items-center gap-1.5 ml-11">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Admin Mode
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-1">
            {/* Collapse Button - Desktop only */}
            {onToggleCollapse && (
              <Button
                onClick={onToggleCollapse}
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
        {/* Expand Button - Floating at right edge when collapsed */}
        {isCollapsed && onToggleCollapse && (
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 absolute -right-4 top-5 bg-background border border-border shadow-md hover:shadow-lg transition-all"
            title="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
      
      {/* User Info */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={userName} email={userEmail} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          {!viewAdminMenu && (
            <div className="mt-2">
              <TierBadge tier={userTier} />
            </div>
          )}
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        <TooltipProvider delayDuration={200}>
          {navigationLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            // Show user's name instead of "Profile" for profile link
            const displayLabel = link.href === '/profile' && !viewAdminMenu ? userName : link.label

            const linkContent = (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                  isCollapsed && 'justify-center',
                  active
                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm'
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-150",
                  active ? "scale-110" : "group-hover:scale-105"
                )} strokeWidth={2.5} />
                {!isCollapsed && <span className="transition-colors">{displayLabel}</span>}
              </Link>
            )

            // Wrap in tooltip when collapsed
            if (isCollapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {displayLabel}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </TooltipProvider>
      </nav>
      
      {/* Usage Indicator (FREE tier only, hide in admin view or when collapsed) */}
      {!viewAdminMenu && !isCollapsed && userTier === 'FREE' && (
        <div className="px-4 py-3 border-t border-border/50">
          <div className="space-y-3 bg-background/50 dark:bg-background/30 p-3 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Plans Saved</p>
              <p className={cn(
                "text-sm font-bold tabular-nums",
                hasReachedLimit ? "text-destructive" : "text-foreground"
              )}>
                {planCount} / {planLimit}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-500 ease-out',
                  hasReachedLimit ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Upgrade link */}
            <Link
              href="/pricing"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors block text-center"
              onClick={onNavigate}
            >
              {hasReachedLimit
                ? '⚡ Upgrade to save more plans'
                : '✨ Upgrade for unlimited plans'}
            </Link>
          </div>
        </div>
      )}
      
      {/* Bottom Actions: Admin Switch, Theme Toggle & Logout */}
      <div className="px-4 py-3 border-t border-border/50 space-y-1.5">
        <TooltipProvider delayDuration={200}>
          {/* Admin/User Switch Button (admins only) */}
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleAdminView}
                  className={cn(
                    'group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                    viewAdminMenu
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-sm'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <ArrowLeftRight className={cn(
                    "h-5 w-5 flex-shrink-0 group-hover:scale-105 transition-transform duration-150",
                    viewAdminMenu && "text-primary"
                  )} strokeWidth={2.5} />
                  {!isCollapsed && (
                    <span className="transition-colors">
                      {viewAdminMenu ? 'Switch to User' : 'Switch to Admin'}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  {viewAdminMenu ? 'Switch to User' : 'Switch to Admin'}
                </TooltipContent>
              )}
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className={cn(
                  'group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                  'text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm',
                  isCollapsed && 'justify-center'
                )}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-5 w-5 flex-shrink-0 group-hover:scale-105 transition-transform duration-150" strokeWidth={2.5} />
                    {!isCollapsed && <span className="transition-colors">Dark Mode</span>}
                  </>
                ) : (
                  <>
                    <Sun className="h-5 w-5 flex-shrink-0 group-hover:scale-105 transition-transform duration-150" strokeWidth={2.5} />
                    {!isCollapsed && <span className="transition-colors">Light Mode</span>}
                  </>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="font-medium">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  'group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                  'text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-sm',
                  isCollapsed && 'justify-center'
                )}
              >
                <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-105 transition-transform duration-150" strokeWidth={2.5} />
                {!isCollapsed && <span className="transition-colors">Logout</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="font-medium">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isCollapsed, toggleCollapse } = useSidebarCollapse()

  return (
    <>
      {/* Mobile nav toggle */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <MobileNav onClick={() => setMobileOpen(true)} />
      </div>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex md:flex-shrink-0 md:fixed md:inset-y-0 md:left-0 md:z-10 transition-all duration-200",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}>
        <div className={cn(
          "flex flex-col transition-all duration-200 relative",
          isCollapsed ? "w-20" : "w-64"
        )}>
          <SidebarContent
            {...props}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />
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

