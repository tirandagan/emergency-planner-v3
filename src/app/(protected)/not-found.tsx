'use client'

import Link from 'next/link'
import { Construction, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Custom 404 page for protected routes
 * Inherits the protected layout (sidebar) automatically
 */
export default function ProtectedNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Construction className="h-16 w-16 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Coming Soon
          </h1>
          <p className="text-xl text-muted-foreground">
            We&rsquo;re working on this feature
          </p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          This page is currently under development. Check back soon for updates, or return to your dashboard to explore available features.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Coming Soon Features List */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Features in development:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>• My Plans</div>
            <div>• Bundles</div>
            <div>• Inventory</div>
            <div>• Readiness</div>
            <div>• Skills</div>
            <div>• Expert Calls</div>
          </div>
        </div>
      </div>
    </div>
  )
}


