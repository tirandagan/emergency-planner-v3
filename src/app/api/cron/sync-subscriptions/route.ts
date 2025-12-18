import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { isNotNull } from 'drizzle-orm';
import { syncUserSubscription } from '@/app/actions/subscriptions';
import { logPaymentError } from '@/lib/system-logger';

/**
 * Daily cron job to reconcile subscription status with Stripe
 * Call this endpoint from a cron service (Vercel Cron, external cron, etc.)
 * 
 * Usage:
 * - Vercel Cron: Add to vercel.json
 * - Manual: curl http://localhost:3000/api/cron/sync-subscriptions
 * - External: Configure cron job to hit production URL
 * 
 * Security: Add authorization header check in production
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log('🔄 Starting subscription sync job...');

    // Get all users with Stripe subscriptions
    const usersWithSubscriptions = await db
      .select()
      .from(profiles)
      .where(isNotNull(profiles.stripeSubscriptionId));

    console.log(`Found ${usersWithSubscriptions.length} users with subscriptions`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const user of usersWithSubscriptions) {
      try {
        // Fetch subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId!
        );

        // Map Stripe status to our status
        const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing'> = {
          active: 'active',
          canceled: 'canceled',
          past_due: 'past_due',
          trialing: 'trialing',
          incomplete: 'past_due',
          incomplete_expired: 'canceled',
          unpaid: 'past_due',
        };

        const status = statusMap[subscription.status] || 'canceled';

        // Determine tier from price ID
        let tier: 'FREE' | 'BASIC' | 'PRO' = user.subscriptionTier as 'FREE' | 'BASIC' | 'PRO';
        
        // If subscription is active/trialing, keep current tier
        // If canceled/past_due, downgrade to FREE
        if (status === 'canceled') {
          tier = 'FREE';
        }

        // Update database if there's a mismatch
        if (
          user.subscriptionStatus !== status ||
          user.subscriptionTier !== tier
        ) {
          await syncUserSubscription(user.id, {
            subscriptionTier: tier,
            subscriptionStatus: status,
            stripeCustomerId: user.stripeCustomerId!,
            stripeSubscriptionId: user.stripeSubscriptionId!,
          });

          console.log(`Synced user ${user.id}: ${user.subscriptionStatus} → ${status}`);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error syncing user ${user.id}:`, error);

        await logPaymentError(error, {
          userId: user.id,
          stripeCustomerId: user.stripeCustomerId || undefined,
          component: 'SubscriptionSyncCron',
          route: '/api/cron/sync-subscriptions',
          userAction: 'Syncing subscription status with Stripe',
          metadata: {
            stripeSubscriptionId: user.stripeSubscriptionId || undefined,
          },
        });

        errorCount++;
        errors.push({
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} updated, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      totalUsers: usersWithSubscriptions.length,
      syncedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Subscription sync job failed:', error);

    await logPaymentError(error, {
      component: 'SubscriptionSyncCron',
      route: '/api/cron/sync-subscriptions',
      userAction: 'Running subscription sync cron job',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync job failed',
      },
      { status: 500 }
    );
  }
}

