import Link from 'next/link'
import { Construction, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PlansPage() {
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
            My Plans - Coming Soon
          </h1>
          <p className="text-xl text-muted-foreground">
            We're building this feature
          </p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          View and manage all your emergency preparedness plans in one place. Create custom plans for different scenarios, track progress, and share with family members.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


