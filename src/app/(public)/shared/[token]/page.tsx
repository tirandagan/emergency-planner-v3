import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Lock, ExternalLink } from 'lucide-react';
import { getSharedPlanByToken } from '@/lib/mission-reports';
import { createClient } from '@/utils/supabase/server';
import { GuestUpgradeBanner } from '@/components/shared/GuestUpgradeBanner';
import { PlanContent } from '@/components/plans/detail/PlanContent';
import { PlanMetadata } from '@/components/plans/detail/PlanMetadata';
import { PlanDetailsTabs } from '@/components/plans/plan-details/PlanDetailsTabs';
import { QuickStatsCards } from '@/components/plans/plan-details/QuickStatsCards';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReportData, ReportDataV2 } from '@/types/mission-report';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function SharedPlanPage({ params }: PageProps) {
  const { token } = await params;

  // Fetch shared plan
  const { report, share, error } = await getSharedPlanByToken(token);

  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Handle errors
  if (error || !report || !share) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <Card className="p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-destructive/10 p-4">
              {share?.isDisabled ? (
                <Lock className="h-8 w-8 text-destructive" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {share?.isDisabled
                  ? 'Share Link Disabled'
                  : share?.isExpired
                  ? 'Share Link Expired'
                  : 'Share Link Not Found'}
              </h1>
              <p className="text-muted-foreground mb-6">{error || 'This share link is no longer available'}</p>
            </div>

            {share && (
              <div className="w-full bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shared by:</span>
                  <span className="font-medium">
                    {share.sharedByName || share.sharedByEmail || 'Unknown'}
                  </span>
                </div>
                {share.isExpired && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expired on:</span>
                    <span className="font-medium">
                      {new Date(share.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {share.isDisabled && share.disabledReason && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span className="font-medium capitalize">
                      {share.disabledReason.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button asChild variant="default">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Cast report data and check if this is a V2 report
  const reportData = report.reportData as ReportData;
  const isV2Report = reportData.version === '2.0' && 'sections' in reportData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 md:py-6 px-4 max-w-6xl">
        {/* Guest Upgrade Banner - Only show for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mb-6">
            <GuestUpgradeBanner variant="compact" />
          </div>
        )}

        {/* Shared Plan Notice */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <ExternalLink className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Viewing Shared Plan</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            This emergency plan was shared with you by{' '}
            <span className="font-medium text-foreground">
              {share.sharedByName || share.sharedByEmail}
            </span>
            . {share.permissions === 'view' ? 'View-only access.' : 'You can view and suggest edits.'}
            {!isAuthenticated && (
              <>
                {' '}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Create a free account
                </Link>{' '}
                to make your own personalized plan.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Plan Header - Simplified for shared view */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground truncate">{report.title}</h1>
                <Badge variant="secondary" className="shrink-0">
                  Shared
                </Badge>
              </div>
              {report.location && (
                <p className="text-muted-foreground flex items-center gap-2">
                  📍 {report.location}
                </p>
              )}
            </div>

            {/* Login/Register CTAs for guests */}
            {!isAuthenticated && (
              <div className="flex gap-2 shrink-0">
                <Button asChild variant="outline" size="sm">
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">Sign Up Free</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Plan Content */}
        {isV2Report ? (
          // V2 Report: Full-width tabbed interface with Quick Stats
          <div className="mt-4">
            {/* Quick Stats Cards */}
            <QuickStatsCards reportData={reportData as ReportDataV2} reportId={report.id} />

            {/* Tabbed Interface */}
            <PlanDetailsTabs
              reportId={report.id}
              reportData={reportData as ReportDataV2}
              evacuationRoutes={report.evacuationRoutes}
              userTier="FREE" // Guest view shows free tier features
              isSharedView={true} // Flag to disable edit actions
            />
          </div>
        ) : (
          // V1 Report: Original two-column layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Main Content - 2/3 width on large screens */}
            <div className="lg:col-span-2">
              <PlanContent content={reportData.content} />
            </div>

            {/* Sidebar - 1/3 width on large screens */}
            <div className="lg:col-span-1">
              <PlanMetadata report={report} />
            </div>
          </div>
        )}

        {/* Bottom CTA for guests */}
        {!isAuthenticated && (
          <div className="mt-12 mb-6">
            <GuestUpgradeBanner variant="full" />
          </div>
        )}
      </div>
    </div>
  );
}
