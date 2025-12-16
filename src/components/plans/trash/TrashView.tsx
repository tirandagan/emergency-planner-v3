'use client';

/**
 * Trash View Component
 * Displays deleted plans with restoration capabilities
 */

import React, { useState } from 'react';
import { Trash2, ArchiveRestore, AlertCircle, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrashPlanCard } from './TrashPlanCard';

interface DeletedPlan {
  id: string;
  title: string;
  deletedAt: Date;
  daysUntilPermanentDeletion: number;
  canRestore: boolean;
}

interface TrashViewProps {
  deletedPlans: DeletedPlan[];
  userTier: 'FREE' | 'BASIC' | 'PRO';
}

const TIER_RESTORATION_DAYS = {
  FREE: 7,
  BASIC: 30,
  PRO: 90,
} as const;

export function TrashView({ deletedPlans, userTier }: TrashViewProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'restorable' | 'expired'>('restorable');

  const restorablePlans = deletedPlans.filter((plan) => plan.canRestore);
  const expiredPlans = deletedPlans.filter((plan) => !plan.canRestore);
  const restorationDays = TIER_RESTORATION_DAYS[userTier];

  const hasPlans = deletedPlans.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="h-8 w-8" />
            Trash
          </h1>
          <p className="text-muted-foreground mt-1">
            Deleted plans are kept for {restorationDays} days before permanent deletion
          </p>
        </div>
      </div>

      {/* Tier Upgrade Banner */}
      {userTier !== 'PRO' && restorablePlans.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-200">
            Upgrade for Extended Recovery
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {userTier === 'FREE'
              ? 'BASIC plan: 30-day recovery window (+23 days) • PRO plan: 90-day recovery window (+83 days)'
              : 'PRO plan: 90-day recovery window (+60 days)'}
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!hasPlans && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Trash2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Trash is Empty</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Deleted plans will appear here and can be restored within {restorationDays} days.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plans List with Tabs */}
      {hasPlans && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="restorable" className="flex items-center gap-2">
              <ArchiveRestore className="h-4 w-4" />
              Restorable ({restorablePlans.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Expired ({expiredPlans.length})
            </TabsTrigger>
          </TabsList>

          {/* Restorable Plans */}
          <TabsContent value="restorable" className="space-y-4">
            {restorablePlans.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No plans available for restoration
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {restorablePlans.map((plan) => (
                  <TrashPlanCard key={plan.id} plan={plan} userTier={userTier} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Expired Plans */}
          <TabsContent value="expired" className="space-y-4">
            {expiredPlans.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No expired plans
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Expired Plans</AlertTitle>
                  <AlertDescription>
                    These plans have passed the recovery window and will be permanently deleted
                    during the next cleanup.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-4">
                  {expiredPlans.map((plan) => (
                    <TrashPlanCard key={plan.id} plan={plan} userTier={userTier} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
