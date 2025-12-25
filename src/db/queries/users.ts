import { createClient } from '@/lib/supabase/server';
import { profiles } from '@/db/schema/profiles';

export type UserProfile = typeof profiles.$inferSelect;
export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface UpdateSubscriptionData {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Get user profile by ID
 * Returns user profile with subscription data
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Transform snake_case to camelCase to match TypeScript types
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      firstName: data.first_name,
      lastName: data.last_name,
      birthYear: data.birth_year,
      gender: data.gender,
      role: data.role,
      subscriptionTier: data.subscription_tier,
      subscriptionStatus: data.subscription_status,
      subscriptionPeriodEnd: data.subscription_period_end,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      location: data.location,
      phone: data.phone,
      timezone: data.timezone,
      newsletterOptIn: data.newsletter_opt_in,
      marketingEmailsOptIn: data.marketing_emails_opt_in,
      systemEmailsOptIn: data.system_emails_opt_in,
      dripCampaignsOptIn: data.drip_campaigns_opt_in,
      callRemindersOptIn: data.call_reminders_opt_in,
      householdMembers: data.household_members,
      saveHouseholdPreference: data.save_household_preference,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(
      `Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get user by Stripe customer ID
 * Used for webhook processing to find user from Stripe events
 */
export async function getUserByStripeCustomerId(
  stripeCustomerId: string
): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error) {
    console.error('Error fetching user by Stripe customer ID:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Transform snake_case to camelCase
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    firstName: data.first_name,
    lastName: data.last_name,
    birthYear: data.birth_year,
    gender: data.gender,
    role: data.role,
    subscriptionTier: data.subscription_tier,
    subscriptionStatus: data.subscription_status,
    subscriptionPeriodEnd: data.subscription_period_end,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    location: data.location,
    phone: data.phone,
    timezone: data.timezone,
    newsletterOptIn: data.newsletter_opt_in,
    marketingEmailsOptIn: data.marketing_emails_opt_in,
    systemEmailsOptIn: data.system_emails_opt_in,
    dripCampaignsOptIn: data.drip_campaigns_opt_in,
    callRemindersOptIn: data.call_reminders_opt_in,
    householdMembers: data.household_members,
    saveHouseholdPreference: data.save_household_preference,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as UserProfile;
}

/**
 * Get user by Stripe subscription ID
 * Used for webhook processing to find user from subscription events
 */
export async function getUserByStripeSubscriptionId(
  stripeSubscriptionId: string
): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (error) {
    console.error('Error fetching user by Stripe subscription ID:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Transform snake_case to camelCase
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    firstName: data.first_name,
    lastName: data.last_name,
    birthYear: data.birth_year,
    gender: data.gender,
    role: data.role,
    subscriptionTier: data.subscription_tier,
    subscriptionStatus: data.subscription_status,
    subscriptionPeriodEnd: data.subscription_period_end,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    location: data.location,
    phone: data.phone,
    timezone: data.timezone,
    newsletterOptIn: data.newsletter_opt_in,
    marketingEmailsOptIn: data.marketing_emails_opt_in,
    systemEmailsOptIn: data.system_emails_opt_in,
    dripCampaignsOptIn: data.drip_campaigns_opt_in,
    callRemindersOptIn: data.call_reminders_opt_in,
    householdMembers: data.household_members,
    saveHouseholdPreference: data.save_household_preference,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as UserProfile;
}

/**
 * Update user subscription data
 * Called from Stripe webhooks to sync subscription state
 */
export async function updateUserSubscription(
  userId: string,
  data: UpdateSubscriptionData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Updating user subscription in Supabase...');
    console.log('User ID:', userId);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    const supabase = await createClient();
    
    const updateData = {
      subscription_tier: data.subscriptionTier,
      subscription_status: data.subscriptionStatus,
      stripe_customer_id: data.stripeCustomerId,
      stripe_subscription_id: data.stripeSubscriptionId,
      updated_at: new Date().toISOString(),
    };
    
    console.log('Update payload (snake_case):', JSON.stringify(updateData, null, 2));
    
    const { error, data: result } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Supabase error updating user subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to update subscription',
      };
    }

    console.log('✅ Supabase update successful!', result);
    return { success: true };
  } catch (error) {
    console.error('❌ Exception updating user subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    };
  }
}

/**
 * Check if user has access to a specific tier
 * Implements tier hierarchy: PRO > BASIC > FREE
 */
export async function userHasAccess(
  userId: string,
  requiredTier: SubscriptionTier
): Promise<boolean> {
  const user = await getUserProfile(userId);

  if (!user) return false;

  // Check subscription status
  const status = user.subscriptionStatus as SubscriptionStatus | null;
  if (status && status !== 'active' && status !== 'trialing') {
    return false;
  }

  // Tier hierarchy
  const tierLevel: Record<SubscriptionTier, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
  };

  const userLevel = tierLevel[user.subscriptionTier as SubscriptionTier] || 0;
  const requiredLevel = tierLevel[requiredTier] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Get user's current subscription tier
 * Returns tier and status information
 */
export async function getUserSubscriptionInfo(userId: string): Promise<{
  tier: SubscriptionTier;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
} | null> {
  const user = await getUserProfile(userId);

  if (!user) return null;

  return {
    tier: (user.subscriptionTier as SubscriptionTier) || 'FREE',
    status: (user.subscriptionStatus as SubscriptionStatus | null) || null,
    stripeCustomerId: user.stripeCustomerId || null,
    stripeSubscriptionId: user.stripeSubscriptionId || null,
  };
}

export interface UpdateProfileData {
  fullName: string;
  firstName: string;
  lastName: string;
  birthYear: number | null;
  gender: string | null;
  location: string;
  phone: string;
  timezone: string;
}

/**
 * Update user profile information
 * Called from profile update Server Action
 */
export async function updateUserProfileData(
  userId: string,
  data: UpdateProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        first_name: data.firstName,
        last_name: data.lastName,
        birth_year: data.birthYear,
        gender: data.gender,
        location: data.location,
        phone: data.phone,
        timezone: data.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Database error updating profile:', error);
      return {
        success: false,
        error: error.message || 'Database update failed',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Database error updating profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database update failed',
    };
  }
}

