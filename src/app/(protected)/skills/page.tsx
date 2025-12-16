import Link from 'next/link'
import { Construction, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SkillsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Construction className="h-16 w-16 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Skills - Coming Soon
          </h1>
          <p className="text-xl text-muted-foreground">
            We're building this feature
          </p>
        </div>

        <p className="text-muted-foreground">
          Learn essential emergency skills. Access training guides, videos, and track your skill development for first aid, fire safety, and more.
        </p>

        <Button asChild size="lg">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}


