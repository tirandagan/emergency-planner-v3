/**
 * Enhanced Sidebar Component with Aceternity Animations
 *
 * Features:
 * - Smooth hover-expand animations (framer-motion)
 * - Lock/unlock sidebar functionality
 * - Admin mode badge indicator
 * - Graphical tier badges
 * - Clickable user avatar (navigates to profile)
 * - Mobile responsive with slide-in animation
 * - Dark mode optimized with neutral colors
 */

'use client'

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Package,
  ClipboardList,
  Activity,
  GraduationCap,
  Video,
  ShoppingBag,
  Sun,
  Moon,
  LogOut,
  Users,
  Factory,
  Tags,
  Boxes,
  Upload,
  Wrench,
  Brain,
  ArrowLeftRight,
  Info,
  MessageSquare,
  Pin,
  PinOff,
  Menu,
  X,
  Shield,
  ChevronRight
} from 'lucide-react'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { UserAvatar } from './UserAvatar'
import { TierBadge } from './TierBadge'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/app/actions/auth'
import { BrandText } from '@/components/ui/brand-text'

// Context for sidebar state (open/closed)
const SidebarStateContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export const useSidebarState = (): { isOpen: boolean; setIsOpen: (open: boolean) => void } => useContext(SidebarStateContext)

export const SidebarStateProvider = SidebarStateContext.Provider

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
  { href: '/consulting/my-bookings', label: 'Consulting', icon: MessageSquare },
  { href: '/readiness', label: 'Readiness', icon: Activity },
  { href: '/skills', label: 'Skills', icon: GraduationCap },
  { href: '/expert-calls', label: 'Expert Calls', icon: Video },
  { href: '/about', label: 'About', icon: Info },
]

const adminNavigationLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/consulting', label: 'Consulting', icon: MessageSquare },
  { href: '/admin/ai-usage', label: 'AI Usage', icon: Brain },
  { href: '/admin/suppliers', label: 'Suppliers', icon: Factory },
  { href: '/admin/products', label: 'Products', icon: Tags },
  { href: '/admin/bundles', label: 'Bundles', icon: Boxes },
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
  open,
  isLocked,
  onToggleLock
}: SidebarProps & {
  onNavigate?: () => void
  open: boolean
  isLocked: boolean
  onToggleLock: () => void
}): React.JSX.Element {
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

  const handleLogout = async (): Promise<void> => {
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

  const toggleAdminView = (): void => {
    const newAdminView = !viewAdminMenu
    setViewAdminMenu(newAdminView)

    if (newAdminView) {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }

    if (onNavigate) {
      onNavigate()
    }
  }

  const handleProfileClick = (): void => {
    router.push('/profile')
    if (onNavigate) {
      onNavigate()
    }
  }

  const navigationLinks = viewAdminMenu ? adminNavigationLinks : userNavigationLinks

  // Direct background color based on theme and view mode
  const backgroundColor = theme === 'dark'
    ? viewAdminMenu
      ? 'rgb(14, 18, 26)' // slate-800 for admin dark mode
      : 'rgb(10, 10, 10)' // Near-black for user dark mode
    : viewAdminMenu
      ? 'rgb(241, 245, 249)' // slate-100 for admin light mode
      : 'rgb(245, 245, 245)' // neutral-100 for user light mode

  return (
    <div
      className="flex flex-col h-full transition-colors duration-200"
      style={{ backgroundColor }}
    >
      {/* Header with Logo and Lock Button */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-150 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="BePrepared.ai logo"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <motion.span
              animate={{
                display: open ? "inline-block" : "none",
                opacity: open ? 1 : 0,
              }}
              className="text-xl font-bold text-neutral-900 dark:text-primary transition-colors truncate"
            >
              <BrandText withDomain />
            </motion.span>
          </Link>
        </div>

        {/* Lock/Unlock Button (desktop only, when expanded) */}
        {open && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onToggleLock}
            className={cn(
              "p-1.5 rounded-md transition-colors ml-2",
              isLocked
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : viewAdminMenu
                  ? "text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700"
                  : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
            title={isLocked ? "Unlock sidebar (auto-collapse)" : "Lock sidebar (keep open)"}
          >
            {isLocked ? (
              <Pin className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <PinOff className="w-4 h-4" strokeWidth={2.5} />
            )}
          </motion.button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navigationLinks.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 relative',
                active && 'text-primary dark:text-primary',
                !active && viewAdminMenu && 'text-slate-700 dark:text-slate-100',
                !active && !viewAdminMenu && 'text-neutral-700 dark:text-neutral-100',
                active
                  ? viewAdminMenu
                    ? 'hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white hover:shadow-md'
                    : 'hover:bg-primary/80 dark:hover:bg-primary/80 hover:text-white dark:hover:text-white hover:shadow-md'
                  : viewAdminMenu
                    ? 'hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white hover:shadow-md'
                    : 'hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white hover:shadow-md'
              )}
            >
              {active && (
                <ChevronRight className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primary group-hover:text-white z-20" strokeWidth={3} />
              )}
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform",
                active && "scale-105",
                !active && viewAdminMenu && "text-slate-700 dark:text-slate-100",
                !active && !viewAdminMenu && "text-neutral-700 dark:text-neutral-100"
              )} strokeWidth={active ? 2.5 : 2} />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="whitespace-nowrap ml-3"
              >
                {link.label}
              </motion.span>
            </Link>
          )
        })}
      </nav>

      {/* Usage Indicator (FREE tier only, hide in admin view) */}
      {!viewAdminMenu && userTier === 'FREE' && (
        <motion.div
          animate={{
            display: open ? "block" : "none",
            opacity: open ? 1 : 0,
          }}
          className="px-4 py-3 border-t border-neutral-300 dark:border-neutral-700"
        >
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Plans Saved</p>
              <p className={cn(
                "text-sm font-bold tabular-nums",
                hasReachedLimit ? "text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-neutral-100"
              )}>
                {planCount} / {planLimit}
              </p>
            </div>

            <div className="w-full bg-neutral-300 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-500 ease-out',
                  hasReachedLimit ? 'bg-red-500' : 'bg-primary'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

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
        </motion.div>
      )}

      {/* Bottom Actions: User Profile Card, Admin Switch, Theme Toggle & Logout */}
      <div className="px-2 py-3 space-y-0.5">
        {/* User Profile Card - Avatar as icon, name as label */}
        <button
          onClick={handleProfileClick}
          className={cn(
            "group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            viewAdminMenu
              ? "text-slate-700 dark:text-slate-300"
              : "text-neutral-700 dark:text-neutral-300",
            viewAdminMenu
              ? "hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white hover:shadow-md"
              : "hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white hover:shadow-md"
          )}
        >
          <div className="flex-shrink-0 -ml-1">
            <UserAvatar name={userName} email={userEmail} />
          </div>
          <motion.span
            animate={{
              width: open ? "auto" : 0,
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="ml-3 overflow-hidden whitespace-nowrap"
          >
            {userName}
          </motion.span>
        </button>

        {/* Admin/User Switch Button (admins only) - Always reserves space */}
        {isAdmin ? (
          <button
            onClick={toggleAdminView}
            className={cn(
              'group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
              viewAdminMenu
                ? 'bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/80 dark:hover:bg-primary/80 hover:text-white dark:hover:text-white'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white',
              'hover:shadow-md'
            )}
          >
            <ArrowLeftRight className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
            <motion.span
              animate={{
                width: open ? "auto" : 0,
                opacity: open ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              {viewAdminMenu ? 'Switch to User' : 'Switch to Admin'}
            </motion.span>
          </button>
        ) : (
          <div className="w-full h-[42px]" />
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            viewAdminMenu
              ? "text-slate-700 dark:text-slate-300"
              : "text-neutral-700 dark:text-neutral-300",
            viewAdminMenu
              ? "hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white hover:shadow-md"
              : "hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white hover:shadow-md"
          )}
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
              <motion.span
                animate={{
                  width: open ? "auto" : 0,
                  opacity: open ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="ml-3 overflow-hidden whitespace-nowrap"
              >
                Dark Mode
              </motion.span>
            </>
          ) : (
            <>
              <Sun className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
              <motion.span
                animate={{
                  width: open ? "auto" : 0,
                  opacity: open ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="ml-3 overflow-hidden whitespace-nowrap"
              >
                Light Mode
              </motion.span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 text-neutral-700 dark:text-neutral-300 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white hover:shadow-md"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
          <motion.span
            animate={{
              width: open ? "auto" : 0,
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="ml-3 overflow-hidden whitespace-nowrap"
          >
            Logout
          </motion.span>
        </button>
      </div>
    </div>
  )
}

export function SidebarNew(props: SidebarProps): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const pathname = usePathname()
  const { refreshProfile } = useAuth()
  const lastRefreshedPathRef = useRef<string | null>(null)
  const { setIsOpen } = useSidebarState()

  // Load lock state from localStorage
  useEffect(() => {
    const savedLockState = localStorage.getItem('sidebar-locked')
    if (savedLockState === 'true') {
      setIsLocked(true)
      setOpen(true)
      setIsOpen(true)
    }
  }, [setIsOpen])

  // Sync open state with context
  useEffect(() => {
    setIsOpen(open)
  }, [open, setIsOpen])

  // Admin route refresh logic
  useEffect(() => {
    if (!props.userName) return

    const isAdminRoute = pathname?.startsWith('/admin')
    const isDashboard = pathname === '/dashboard' || pathname === '/'

    if ((isAdminRoute || isDashboard) && pathname !== lastRefreshedPathRef.current) {
      lastRefreshedPathRef.current = pathname
      refreshProfile()
    }
  }, [pathname, props.userName, refreshProfile])

  const toggleLock = (): void => {
    const newLockState = !isLocked
    setIsLocked(newLockState)
    localStorage.setItem('sidebar-locked', String(newLockState))

    if (newLockState) {
      setOpen(true)
    }
  }

  const handleMouseEnter = (): void => {
    if (!isLocked) {
      setOpen(true)
    }
  }

  const handleMouseLeave = (): void => {
    if (!isLocked) {
      setOpen(false)
    }
  }

  return (
    <>
      {/* Mobile nav toggle - Top LEFT */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop sidebar with hover-expand */}
      <motion.aside
        className="hidden md:flex md:flex-shrink-0 md:fixed md:inset-y-0 md:left-0 md:z-10"
        animate={{
          width: open ? "300px" : "60px",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col w-full">
          <SidebarContent
            {...props}
            open={open}
            isLocked={isLocked}
            onToggleLock={toggleLock}
          />
        </div>
      </motion.aside>

      {/* Mobile Sheet with Aceternity animation */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-[90]"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="md:hidden fixed h-full w-64 inset-y-0 left-0 bg-white dark:bg-neutral-900 z-[100] flex flex-col"
            >
              {/* Close button */}
              <button
                className="absolute right-4 top-4 z-50 p-2 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <SidebarContent
                {...props}
                onNavigate={() => setMobileOpen(false)}
                open={true}
                isLocked={false}
                onToggleLock={() => {}}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
