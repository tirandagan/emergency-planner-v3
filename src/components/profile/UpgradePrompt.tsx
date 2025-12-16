'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  feature: 'usage' | 'billing';
}

export function UpgradePrompt({ feature }: UpgradePromptProps): React.JSX.Element {
  const title = feature === 'usage' ? 'Usage Tracking' : 'Billing History';
  const description =
    feature === 'usage'
      ? 'Track your platform activity, plan creation, and account usage over time.'
      : 'Access your complete billing history, download invoices, and export transaction records.';

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>{title} - Premium Feature</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Upgrade to Basic or Pro to unlock this feature and gain full visibility into your account
          activity and billing.
        </p>
        <Button asChild>
          <Link href="/pricing">
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
