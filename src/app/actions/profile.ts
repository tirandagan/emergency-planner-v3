"use server";

import { revalidatePath } from 'next/cache';
import { updateUserProfileData, type UpdateProfileData } from '@/db/queries/users';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { logSystemError, logPaymentError } from '@/lib/system-logger';

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string };

export type GetPaymentMethodResult =
  | { success: true; data: { brand: string; last4: string } | null }
  | { success: false; error: string };

export interface EmailPreferences {
  newsletterOptIn: boolean;
  marketingEmailsOptIn: boolean;
  systemEmailsOptIn: boolean;
  dripCampaignsOptIn: boolean;
  callRemindersOptIn: boolean;
}

export type UpdateEmailPreferencesResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Update user profile information
 * Called from ProfileForm on save
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData
): Promise<UpdateProfileResult> {
  try {
    // Validate required fields
    if (!data.fullName.trim()) {
      return { success: false, error: 'Full name is required' };
    }

    if (!data.firstName.trim()) {
      return { success: false, error: 'First name is required' };
    }

    if (!data.lastName.trim()) {
      return { success: false, error: 'Last name is required' };
    }

    // Validate birth year if provided
    if (data.birthYear !== null) {
      const currentYear = new Date().getFullYear();
      if (data.birthYear < 1900 || data.birthYear > currentYear) {
        return { 
          success: false, 
          error: `Birth year must be between 1900 and ${currentYear}` 
        };
      }
    }

    // Validate phone format if provided
    if (data.phone && data.phone.trim() !== '') {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(data.phone)) {
        return { success: false, error: 'Invalid phone number format' };
      }
    }

    // Update profile in database
    const result = await updateUserProfileData(userId, data);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to update profile' };
    }

    // Revalidate profile page
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'ProfileActions',
      route: '/app/actions/profile',
      userAction: 'Updating user profile information',
      metadata: {
        operation: 'updateUserProfile',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues updating your profile. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Fetch payment method from Stripe
 * Returns brand and last 4 digits for display
 */
export async function getPaymentMethod(
  stripeCustomerId: string
): Promise<GetPaymentMethodResult> {
  try {
    if (!stripeCustomerId) {
      return { success: false, error: 'No Stripe customer ID provided' };
    }

    // Fetch customer with expanded payment method
    const customer = (await stripe.customers.retrieve(stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    })) as Stripe.Customer;

    // Check if customer has default payment method
    const paymentMethod = customer.invoice_settings?.default_payment_method;

    if (!paymentMethod || typeof paymentMethod === 'string') {
      return { success: true, data: null };
    }

    // Extract card details
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      return {
        success: true,
        data: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
        },
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error('Error fetching payment method:', error);

    await logPaymentError(error, {
      stripeCustomerId,
      component: 'ProfileActions',
      route: '/app/actions/profile',
      userAction: 'Fetching payment method from Stripe',
      metadata: {
        operation: 'getPaymentMethod',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues fetching your payment method. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Update user email preferences
 * Called from NotificationsTab component
 */
export async function updateEmailPreferences(
  userId: string,
  preferences: EmailPreferences
): Promise<UpdateEmailPreferencesResult> {
  try {
    // Validate userId
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // System emails cannot be disabled - enforce server-side for security
    if (preferences.systemEmailsOptIn === false) {
      return {
        success: false,
        error: 'System emails cannot be disabled for security reasons',
      };
    }

    const supabase = await createClient();

    // Verify authenticated user matches userId parameter (authorization check)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update email preferences in database
    const { error } = await supabase
      .from('profiles')
      .update({
        newsletter_opt_in: preferences.newsletterOptIn,
        marketing_emails_opt_in: preferences.marketingEmailsOptIn,
        system_emails_opt_in: preferences.systemEmailsOptIn,
        drip_campaigns_opt_in: preferences.dripCampaignsOptIn,
        call_reminders_opt_in: preferences.callRemindersOptIn,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[Profile] Failed to update email preferences:', error);
      return {
        success: false,
        error: error.message || 'Failed to update preferences',
      };
    }

    // Revalidate profile page to reflect changes
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('[Profile] Error updating email preferences:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'ProfileActions',
      route: '/app/actions/profile',
      userAction: 'Updating email notification preferences',
      metadata: {
        operation: 'updateEmailPreferences',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues updating your preferences. Our team has been notified and will resolve this shortly.",
    };
  }
}

export type SendPasswordChangeEmailResult =
  | { success: true }
  | { success: false; error?: string };

/**
 * Server action to send password change confirmation email
 * Called after successful password change
 */
export async function sendPasswordChangeEmail(
  email: string,
  name?: string
): Promise<SendPasswordChangeEmailResult> {
  try {
    const { sendPasswordChangeConfirmationEmail } = await import('@/lib/email');
    const result = await sendPasswordChangeConfirmationEmail(email, name);
    return result;
  } catch (error) {
    console.error('[Profile] Error sending password change email:', error);

    await logSystemError(error, {
      category: 'external_service',
      component: 'ProfileActions',
      route: '/app/actions/profile',
      userAction: 'Sending password change confirmation email',
      metadata: {
        operation: 'sendPasswordChangeEmail',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues sending the confirmation email. Our team has been notified and will resolve this shortly.",
    };
  }
}

export interface UserDataExport {
  profile: {
    id: string;
    email: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    birthYear: number | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  emailPreferences: {
    newsletterOptIn: boolean;
    marketingEmailsOptIn: boolean;
    systemEmailsOptIn: boolean;
    dripCampaignsOptIn: boolean;
    callRemindersOptIn: boolean;
  };
  subscription: {
    tier: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  missionReports: Array<{
    id: string;
    reportData: any;
    createdAt: string;
  }>;
  inventory: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    expirationDate: string | null;
    createdAt: string;
  }>;
  billingHistory: Array<{
    id: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
  }>;
  exportMetadata: {
    exportedAt: string;
    exportedBy: string;
    version: string;
  };
}

export type ExportUserDataResult =
  | { success: true; data: UserDataExport }
  | { success: false; error: string };

/**
 * Export all user data for GDPR compliance (Article 15 - Right of Access)
 * Returns sanitized JSON export of all user data
 */
export async function exportUserData(
  userId: string,
  firstName: string,
  lastName: string
): Promise<ExportUserDataResult> {
  try {
    const supabase = await createClient();

    // Verify authenticated user matches userId (authorization check)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Query profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Export] Failed to fetch profile:', profileError);
      return { success: false, error: 'Failed to fetch profile data' };
    }

    // Query mission reports
    const { data: reports, error: reportsError } = await supabase
      .from('mission_reports')
      .select('id, report_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('[Export] Failed to fetch mission reports:', reportsError);
    }

    // Query inventory items
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('id, name, category, quantity, expiration_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (inventoryError) {
      console.error('[Export] Failed to fetch inventory:', inventoryError);
    }

    // Query billing history
    const { data: billing, error: billingError } = await supabase
      .from('billing_history')
      .select('id, amount, description, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (billingError) {
      console.error('[Export] Failed to fetch billing history:', billingError);
    }

    // Build sanitized export data
    const exportData: UserDataExport = {
      profile: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        firstName: profile.first_name,
        lastName: profile.last_name,
        birthYear: profile.birth_year,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zip_code,
        emailVerified: profile.email_verified,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      emailPreferences: {
        newsletterOptIn: profile.newsletter_opt_in ?? true,
        marketingEmailsOptIn: profile.marketing_emails_opt_in ?? true,
        systemEmailsOptIn: profile.system_emails_opt_in ?? true,
        dripCampaignsOptIn: profile.drip_campaigns_opt_in ?? true,
        callRemindersOptIn: profile.call_reminders_opt_in ?? true,
      },
      subscription: profile.subscription_tier
        ? {
            tier: profile.subscription_tier,
            status: profile.subscription_status || 'unknown',
            currentPeriodStart: profile.current_period_start,
            currentPeriodEnd: profile.current_period_end,
          }
        : null,
      missionReports: (reports || []).map((report: any) => ({
        id: report.id,
        reportData: report.report_data,
        createdAt: report.created_at,
      })),
      inventory: (inventory || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        expirationDate: item.expiration_date,
        createdAt: item.created_at,
      })),
      billingHistory: (billing || []).map((bill: any) => ({
        id: bill.id,
        amount: bill.amount,
        description: bill.description,
        status: bill.status,
        createdAt: bill.created_at,
      })),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        version: '1.0.0',
      },
    };

    // Log export action for audit trail
    try {
      await supabase.from('user_activity_log').insert({
        user_id: userId,
        action: 'data_export',
        details: {
          exportedAt: exportData.exportMetadata.exportedAt,
          recordCounts: {
            missionReports: exportData.missionReports.length,
            inventory: exportData.inventory.length,
            billingHistory: exportData.billingHistory.length,
          },
        },
      });
    } catch (logError) {
      console.error('[Export] Failed to log export action:', logError);
      // Don't block export if logging fails
    }

    return { success: true, data: exportData };
  } catch (error) {
    console.error('[Export] Error exporting user data:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'ProfileActions',
      route: '/app/actions/profile',
      userAction: 'Exporting user data for GDPR compliance',
      metadata: {
        operation: 'exportUserData',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues exporting your data. Our team has been notified and will resolve this shortly.",
    };
  }
}

export type UpdateHouseholdMembersResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Update user's saved household members configuration
 * Called when user completes Step 2 with "Save to profile" toggle enabled
 */
export async function updateHouseholdMembers(
  householdMembers: import('@/types/wizard').FamilyMember[],
  savePreference: boolean
): Promise<UpdateHouseholdMembersResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { db } = await import('@/db');
    const { profiles } = await import('@/db/schema/profiles');
    const { eq } = await import('drizzle-orm');

    await db
      .update(profiles)
      .set({
        householdMembers: householdMembers,
        saveHouseholdPreference: savePreference,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    revalidatePath('/plans/new', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error updating household members:', error);

    await logSystemError(error, {
      category: 'database_error',
      component: 'ProfileActions',
      route: '/app/actions/profile',
      userAction: 'Updating saved household members configuration',
      metadata: {
        operation: 'updateHouseholdMembers',
      },
    });

    return {
      success: false,
      error: 'Failed to save household members',
    };
  }
}

