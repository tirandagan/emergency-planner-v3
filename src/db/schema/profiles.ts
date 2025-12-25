import { pgTable, text, uuid, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import type { FamilyMember } from '@/types/wizard';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    birthYear: integer('birth_year'),
    gender: text('gender'), // 'male', 'female', 'other', 'prefer_not_to_say'
    role: text('role').notNull().default('USER'),
    subscriptionTier: text('subscription_tier').notNull().default('FREE'),
    subscriptionStatus: text('subscription_status'),
    subscriptionPeriodEnd: timestamp('subscription_period_end', { withTimezone: true }),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    location: text('location'),
    phone: text('phone'),
    timezone: text('timezone'),
    newsletterOptIn: boolean('newsletter_opt_in').notNull().default(true),
    marketingEmailsOptIn: boolean('marketing_emails_opt_in').notNull().default(true),
    systemEmailsOptIn: boolean('system_emails_opt_in').notNull().default(true),
    dripCampaignsOptIn: boolean('drip_campaigns_opt_in').notNull().default(true),
    callRemindersOptIn: boolean('call_reminders_opt_in').notNull().default(true),
    totalTokensUsed: integer('total_tokens_used').default(0),
    lastTokenUpdate: timestamp('last_token_update', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    isHighValue: boolean('is_high_value').notNull().default(false),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    loginCount: integer('login_count').notNull().default(0),
    lastOtpAt: timestamp('last_otp_at', { withTimezone: true }),
    passwordLoginsSinceOtp: integer('password_logins_since_otp').notNull().default(0),
    householdMembers: jsonb('household_members').$type<FamilyMember[]>(),
    saveHouseholdPreference: boolean('save_household_preference').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    subscriptionTierIdx: index('idx_profiles_subscription_tier').on(table.subscriptionTier),
    stripeCustomerIdIdx: index('idx_profiles_stripe_customer_id').on(table.stripeCustomerId),
    totalTokensIdx: index('idx_profiles_total_tokens').on(table.totalTokensUsed),
    lastLoginIdx: index('idx_profiles_last_login').on(table.lastLoginAt),
    isHighValueIdx: index('idx_profiles_is_high_value').on(table.isHighValue),
    lastActiveAtIdx: index('idx_profiles_last_active_at').on(table.lastActiveAt),
    householdMembersIdx: index('idx_profiles_household_members').using('gin', table.householdMembers),
  })
);

