import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { syncUserSubscription } from '@/app/actions/subscriptions';
import {
  getUserByStripeCustomerId,
  getUserByStripeSubscriptionId,
} from '@/db/queries/users';
import { createBillingTransaction } from '@/db/queries/billing';
import Stripe from 'stripe';
import { logPaymentError } from '@/lib/system-logger';

/**
 * Stripe webhook handler
 * Processes subscription lifecycle events and syncs with database
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found in request');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);

    await logPaymentError(error, {
      component: 'StripeWebhookHandler',
      route: '/api/webhooks/stripe',
      userAction: 'Processing Stripe webhook event',
      metadata: {
        signaturePresent: !!signature,
        webhookSecretConfigured: !!STRIPE_CONFIG.webhookSecret,
      },
    });

    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);

    await logPaymentError(error, {
      component: 'StripeWebhookHandler',
      route: '/api/webhooks/stripe',
      userAction: 'Processing Stripe webhook event',
      metadata: {
        eventType: event?.type,
        eventId: event?.id,
      },
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  console.log('🎉 Checkout completed webhook received');
  console.log('Session metadata:', session.metadata);
  
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as 'BASIC' | 'PRO';

  if (!userId || !tier) {
    console.error('❌ Missing userId or tier in checkout session metadata');
    return;
  }

  console.log(`✅ Processing checkout for user: ${userId}, tier: ${tier}`);
  console.log(`Customer ID: ${session.customer}, Subscription ID: ${session.subscription}`);

  // Update user subscription
  const result = await syncUserSubscription(userId, {
    subscriptionTier: tier,
    subscriptionStatus: 'active',
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
  });
  
  console.log('📊 Sync result:', result);

  // Log billing transaction
  await createBillingTransaction({
    userId,
    transactionType: 'subscription_created',
    stripePaymentIntentId: session.payment_intent as string,
    stripeSubscriptionId: session.subscription as string,
    amount: session.amount_total ? (session.amount_total / 100).toFixed(2) : '0',
    currency: session.currency || 'usd',
    status: 'succeeded',
    description: `Subscription created: ${tier} tier`,
    transactionDate: new Date(),
  });

  console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  
  // Access properties which exist in runtime but not in type definition
  const invoiceWithExtras = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    payment_intent?: string | null;
    charge?: string | null;
    invoice_pdf?: string | null;
  };
  const subscription = invoiceWithExtras.subscription;
  
  // Handle subscription ID extraction based on type
  let subscriptionId = '';
  if (typeof subscription === 'string') {
    subscriptionId = subscription;
  } else if (subscription && typeof subscription === 'object' && 'id' in subscription) {
    subscriptionId = subscription.id;
  }

  // Find user by Stripe customer ID
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  // Log successful payment
  await createBillingTransaction({
    userId: user.id,
    transactionType: 'payment_succeeded',
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: invoiceWithExtras.payment_intent || '',
    stripeSubscriptionId: subscriptionId,
    stripeChargeId: invoiceWithExtras.charge || '',
    amount: (invoice.amount_paid / 100).toFixed(2),
    currency: invoice.currency,
    status: 'succeeded',
    description: invoice.description || 'Subscription payment',
    invoicePdfUrl: invoiceWithExtras.invoice_pdf || undefined,
    transactionDate: new Date(invoice.created * 1000),
  });

  console.log(`Payment succeeded for user ${user.id}, invoice: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  
  // Access properties which exist in runtime but not in type definition
  const invoiceWithExtras = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    payment_intent?: string | null;
  };
  const subscription = invoiceWithExtras.subscription;
  
  // Extract subscription ID - it can be a string or an expanded object
  let subscriptionId = '';
  if (typeof subscription === 'string') {
    subscriptionId = subscription;
  } else if (subscription && typeof subscription === 'object' && 'id' in subscription) {
    subscriptionId = subscription.id;
  }

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  // Update subscription status to past_due
  await syncUserSubscription(user.id, {
    subscriptionTier: user.subscriptionTier as 'BASIC' | 'PRO',
    subscriptionStatus: 'past_due',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });

  // Log failed payment
  await createBillingTransaction({
    userId: user.id,
    transactionType: 'payment_failed',
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: invoiceWithExtras.payment_intent || '',
    stripeSubscriptionId: subscriptionId,
    amount: (invoice.amount_due / 100).toFixed(2),
    currency: invoice.currency,
    status: 'failed',
    description: invoice.description || 'Subscription payment failed',
    transactionDate: new Date(invoice.created * 1000),
  });

  console.log(`Payment failed for user ${user.id}, invoice: ${invoice.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  // Downgrade to FREE tier
  await syncUserSubscription(user.id, {
    subscriptionTier: 'FREE',
    subscriptionStatus: 'canceled',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
  });

  // Log subscription cancellation
  await createBillingTransaction({
    userId: user.id,
    transactionType: 'subscription_canceled',
    stripeSubscriptionId: subscription.id,
    amount: '0',
    currency: 'usd',
    status: 'succeeded',
    description: 'Subscription canceled',
    transactionDate: new Date(),
  });

  console.log(`Subscription deleted for user ${user.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const user = await getUserByStripeSubscriptionId(subscription.id);

  if (!user) {
    console.error(`User not found for subscription: ${subscription.id}`);
    return;
  }

  // Map Stripe subscription status to our status
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

  await syncUserSubscription(user.id, {
    subscriptionTier: user.subscriptionTier as 'BASIC' | 'PRO',
    subscriptionStatus: status,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
  });

  console.log(`Subscription updated for user ${user.id}, status: ${status}`);
}

