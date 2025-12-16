/**
 * Mobile Navigation Toggle Component
 * 
 * Hamburger menu button that triggers sidebar Sheet on mobile.
 * Hidden on desktop (md:hidden).
 */

'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileNavProps {
  onClick: () => void
}

export function MobileNav({ onClick }: MobileNavProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={onClick}
      aria-label="Open navigation menu"
    >
      <Menu className="h-6 w-6" />
    </Button>
  )
}

