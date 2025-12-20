import React, { Suspense } from 'react';
import Link from 'next/link';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getMissionReportsByUserId } from '@/lib/mission-reports';
import { PlanCard } from '@/components/plans/PlanCard';
import { Button } from '@/components/ui/button';

async function PlansContent(): Promise<React.JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const plans = await getMissionReportsByUserId(user.id);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">My Emergency Plans</h1>
          </div>
          <p className="text-lg text-muted-foreground mt-2">
            View and manage your personalized emergency preparedness plans.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/plans/trash">
              <Trash2 className="mr-2 h-4 w-4" />
              Trash
            </Link>
          </Button>
          <Button asChild>
            <Link href="/plans/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-6">
              <FileText className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Plans Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first emergency preparedness plan to get started. Our AI will help you build
            a personalized plan based on your location, family size, and potential scenarios.
          </p>
          <Button asChild size="lg">
            <Link href="/plans/new">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Plan
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{plans.length} {plans.length === 1 ? 'plan' : 'plans'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlansLoading(): React.JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary animate-pulse" />
            <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-full max-w-lg bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function PlansPage(): React.JSX.Element {
  return (
    <Suspense fallback={<PlansLoading />}>
      <PlansContent />
    </Suspense>
  );
}
