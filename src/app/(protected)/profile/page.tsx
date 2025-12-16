import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/db/queries/users';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { SubscriptionCard } from '@/components/profile/SubscriptionCard';
import { UsageTab } from '@/components/profile/UsageTab';
import { BillingHistoryTab } from '@/components/profile/BillingHistoryTab';
import { NotificationsTab } from '@/components/profile/NotificationsTab';
import { AccountTab } from '@/components/profile/AccountTab';
import { UpgradePrompt } from '@/components/profile/UpgradePrompt';
import { getUserUsageMetrics, getBillingTransactions } from '@/lib/usage';

export const metadata: Metadata = {
  title: 'Profile Settings - beprepared.ai',
  description: 'Manage your account, subscription, and preferences',
};

interface ProfilePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const { tab = 'profile' } = await searchParams;

  // Get authenticated user
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect('/auth/login');
  }

  // Fetch full profile from database
  let profile;
  try {
    profile = await getUserProfile(authUser.id);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Database Error
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-2">
            Failed to load your profile from the database.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 font-mono">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Profile Not Found
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300">
            Your profile could not be loaded. Please contact support for assistance.
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            User ID: {authUser.id}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Profile Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account information and subscription
        </p>
      </div>

      {/* Tab Navigation */}
      <Suspense
        fallback={
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-2 h-[60px] animate-pulse" />
        }
      >
        <ProfileTabs activeTab={tab as 'profile' | 'subscription' | 'usage' | 'billing' | 'notifications' | 'account'} />
      </Suspense>

      {/* Tab Content */}
      <div className="mt-6">
        {tab === 'profile' && <ProfileForm initialData={profile} userId={authUser.id} />}

        {tab === 'subscription' && (
          <SubscriptionCard
            subscription={{
              tier: profile.subscriptionTier,
              status: profile.subscriptionStatus,
              periodEnd: profile.subscriptionPeriodEnd,
              stripeCustomerId: profile.stripeCustomerId,
              stripeSubscriptionId: profile.stripeSubscriptionId,
            }}
            userId={authUser.id}
            userEmail={profile.email}
          />
        )}

        {tab === 'usage' && (
          <UsageTabContent userId={authUser.id} isPaidUser={profile.subscriptionTier !== 'FREE'} />
        )}

        {tab === 'billing' && (
          <BillingTabContent userId={authUser.id} isPaidUser={profile.subscriptionTier !== 'FREE'} />
        )}

        {tab === 'notifications' && (
          <NotificationsTab
            initialPreferences={{
              newsletterOptIn: profile.newsletterOptIn,
              marketingEmailsOptIn: profile.marketingEmailsOptIn,
              systemEmailsOptIn: profile.systemEmailsOptIn,
              dripCampaignsOptIn: profile.dripCampaignsOptIn,
              callRemindersOptIn: profile.callRemindersOptIn,
            }}
            userId={authUser.id}
          />
        )}

        {tab === 'account' && (
          <AccountTab
            userId={authUser.id}
            userEmail={profile.email}
            userFirstName={profile.firstName || 'User'}
            userLastName={profile.lastName || 'Data'}
          />
        )}
      </div>
    </div>
  );
}

async function UsageTabContent({ userId, isPaidUser }: { userId: string; isPaidUser: boolean }) {
  if (!isPaidUser) {
    return <UpgradePrompt feature="usage" />;
  }

  const metrics = await getUserUsageMetrics(userId);
  return <UsageTab metrics={metrics} />;
}

async function BillingTabContent({ userId, isPaidUser }: { userId: string; isPaidUser: boolean }) {
  if (!isPaidUser) {
    return <UpgradePrompt feature="billing" />;
  }

  const billingHistory = await getBillingTransactions(userId, {
    page: 1,
    pageSize: 20,
    transactionType: 'all',
  });

  return (
    <BillingHistoryTab
      initialTransactions={billingHistory.transactions}
      initialTotal={billingHistory.total}
    />
  );
}
