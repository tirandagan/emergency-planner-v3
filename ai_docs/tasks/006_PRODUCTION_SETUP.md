# Production Deployment Guide - Profile & Subscription Feature

**Task:** 006 - Phase 3.1a Profile & Subscription UI  
**Environment:** Production Setup Instructions

---

## 🚀 Production Deployment Steps

### Step 1: Stripe Production Configuration

#### 1.1 Create Live Stripe Products

1. **Login to Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/products
   - **Switch to Live Mode** (toggle in top left)

2. **Create Basic Plan Product:**
   ```
   Name: Basic Plan
   Description: Basic tier subscription with essential features
   Pricing: $9.99 USD
   Billing Period: Monthly (recurring)
   ```
   - **Copy the Price ID** (starts with `price_live_...`)

3. **Create Pro Plan Product:**
   ```
   Name: Pro Plan
   Description: Pro tier subscription with advanced features
   Pricing: $49.99 USD
   Billing Period: Monthly (recurring)
   ```
   - **Copy the Price ID** (starts with `price_live_...`)

#### 1.2 Configure Production Webhook

1. **Navigate to:** https://dashboard.stripe.com/webhooks
2. **Click:** "Add endpoint"
3. **Endpoint URL:** `https://YOUR_DOMAIN.com/api/webhooks/stripe`
4. **Events to send:** Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Click:** "Add endpoint"
6. **Copy the Signing Secret** (starts with `whsec_...`)

#### 1.3 Get Production API Keys

1. **Navigate to:** https://dashboard.stripe.com/apikeys
2. **Ensure you're in Live Mode**
3. **Copy:**
   - Secret key (starts with `sk_live_...`)
   - Publishable key (starts with `pk_live_...`)

---

### Step 2: Environment Variables Configuration

Add these to your production environment (Vercel, Railway, etc.):

```bash
# Stripe Configuration (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_BASIC_PRICE_ID=price_live_YOUR_BASIC_PRICE_ID
STRIPE_PRO_PRICE_ID=price_live_YOUR_PRO_PRICE_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### Step 3: Database Preparation

#### 3.1 Verify Supabase Schema

Ensure the `profiles` table has these columns:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Required columns:
-- subscription_tier (text)
-- subscription_status (text)
-- stripe_customer_id (text)
-- stripe_subscription_id (text)
-- current_period_start (timestamptz)
-- current_period_end (timestamptz)
```

If any are missing, run the migration from `drizzle/` directory.

#### 3.2 Verify RLS Policies

Ensure users can update their own profiles:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Should have policy allowing users to UPDATE their own row
-- Policy name: "Users can update own profile" or similar
```

---

### Step 4: Deploy to Production

#### Option A: Vercel Deployment

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod

# Add environment variables via Vercel Dashboard
# Settings → Environment Variables → Add each variable
```

#### Option B: Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up

# Add environment variables
railway variables set STRIPE_SECRET_KEY=sk_live_...
# Repeat for all variables
```

#### Option C: Docker Deployment

```bash
# Build production image
docker build -t emergency-planner:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e STRIPE_BASIC_PRICE_ID=price_live_... \
  -e STRIPE_PRO_PRICE_ID=price_live_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  -e NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  emergency-planner:latest
```

---

### Step 5: Post-Deployment Testing

#### 5.1 Test Webhook Delivery

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Click your webhook endpoint**
3. **Click:** "Send test webhook"
4. **Select:** `checkout.session.completed`
5. **Verify:** Logs show webhook received (check your application logs)

#### 5.2 Test Complete Checkout Flow

1. **Navigate to:** https://yourdomain.com/profile?tab=subscription
2. **Click:** "Upgrade to Basic"
3. **Use Stripe Test Card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. **Complete payment**
5. **Verify:**
   - Redirected to profile subscription tab
   - Subscription shows "Basic" tier
   - Status is "Active"
   - Database updated in Supabase

#### 5.3 Test Billing Portal

1. **As a subscriber, click:** "Manage Billing"
2. **Verify:** Redirected to Stripe Customer Portal
3. **Verify:** Can see subscription details
4. **Test:** Update payment method
5. **Test:** Cancel subscription (test mode only!)

---

### Step 6: Monitoring Setup

#### 6.1 Stripe Dashboard Monitoring

1. **Navigate to:** https://dashboard.stripe.com/events
2. **Monitor for:**
   - Failed webhook deliveries
   - Payment failures
   - Subscription cancellations

#### 6.2 Application Logging

Add monitoring for these events:

```typescript
// In your webhook handler
console.log('Webhook event received:', event.type);
console.log('Processing result:', result);

// In production, use a service like:
// - Sentry for error tracking
// - DataDog for application monitoring
// - LogRocket for session replay
```

#### 6.3 Set Up Alerts

**Recommended alerts:**
- Webhook failure rate > 5%
- Payment failure notifications
- Subscription churn tracking
- Database sync failures

---

## 🔒 Security Checklist

Before going live:

- [ ] All API keys are production keys (not test mode)
- [ ] Webhook secret matches Stripe dashboard
- [ ] HTTPS enabled on production domain
- [ ] Environment variables secured (not in git)
- [ ] Supabase RLS policies tested
- [ ] Rate limiting enabled for API routes
- [ ] CORS configured correctly
- [ ] Stripe webhook signature verification enabled

---

## 🐛 Troubleshooting

### Webhooks Not Received

**Symptom:** Subscription doesn't update after payment

**Solutions:**
1. Check webhook URL is accessible (must be public HTTPS)
2. Verify webhook secret in environment matches Stripe
3. Check application logs for webhook processing errors
4. Test webhook delivery from Stripe Dashboard

### Payment Succeeds but Database Not Updated

**Symptom:** Stripe shows payment, but user still shows "Free" tier

**Solutions:**
1. Check webhook logs in Stripe Dashboard
2. Verify `userId` and `tier` in checkout session metadata
3. Check Supabase permissions (RLS policies)
4. Verify database connection from webhook handler

### "Manage Billing" Button Doesn't Work

**Symptom:** Button click does nothing or shows error

**Solutions:**
1. Verify `stripe_customer_id` exists in user's profile
2. Check Stripe API key has correct permissions
3. Verify customer exists in Stripe dashboard
4. Check browser console for JavaScript errors

---

## 📞 Support Resources

### Stripe Documentation
- Checkout: https://stripe.com/docs/checkout
- Webhooks: https://stripe.com/docs/webhooks
- Customer Portal: https://stripe.com/docs/billing/subscriptions/integrating-customer-portal

### Next.js Documentation
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### Supabase Documentation
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Database Functions: https://supabase.com/docs/guides/database/functions

---

## ✅ Production Readiness Checklist

Complete this checklist before launching:

### Stripe Configuration
- [ ] Live mode products created (Basic & Pro)
- [ ] Price IDs copied and saved
- [ ] Webhook endpoint configured
- [ ] Webhook secret saved
- [ ] Live API keys obtained
- [ ] Test checkout completed successfully

### Application Configuration
- [ ] All environment variables set in production
- [ ] NEXT_PUBLIC_SITE_URL points to production domain
- [ ] Application deployed and accessible
- [ ] SSL/HTTPS certificate active
- [ ] Database migrations applied

### Testing
- [ ] Test checkout flow end-to-end
- [ ] Verify webhook delivery
- [ ] Test subscription updates reflect in UI
- [ ] Test billing portal access
- [ ] Test profile form updates
- [ ] Test email preferences save correctly

### Monitoring
- [ ] Application logging configured
- [ ] Error tracking service setup (Sentry, etc.)
- [ ] Stripe webhook monitoring active
- [ ] Alerts configured for failures

### Security
- [ ] All secrets secured (not in git)
- [ ] RLS policies tested
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Webhook signature verification enabled

### Documentation
- [ ] Internal team trained on new features
- [ ] Customer support documentation updated
- [ ] Known issues documented
- [ ] Rollback plan documented

---

## 🎉 Launch Checklist

**Day of Launch:**

1. **Morning:**
   - [ ] Verify all production environment variables
   - [ ] Run final test checkout
   - [ ] Confirm webhook delivery working

2. **Launch:**
   - [ ] Deploy to production
   - [ ] Monitor application logs
   - [ ] Watch Stripe dashboard for events

3. **First Hour:**
   - [ ] Monitor for errors
   - [ ] Check webhook success rate
   - [ ] Verify first real customer checkout works

4. **First 24 Hours:**
   - [ ] Review all completed checkouts
   - [ ] Check for failed webhooks
   - [ ] Monitor customer support tickets

---

**Status:** Ready for Production Deployment  
**Last Updated:** December 10, 2025  
**Next Review:** After first production deployment

