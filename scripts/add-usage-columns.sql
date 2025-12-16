-- Add usage tracking columns to profiles table
-- Run this in Supabase SQL Editor if the migration didn't apply

-- Step 1: Add columns to profiles table (will skip if they already exist)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_tokens_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_token_update timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

-- Step 2: Create indexes (will skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_profiles_total_tokens ON profiles (total_tokens_used);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles (last_login_at);

-- Step 3: Create billing_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS billing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_charge_id text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  description text,
  invoice_pdf_url text,
  metadata jsonb,
  transaction_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 4: Create billing_transactions indexes
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user_id ON billing_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_transaction_type ON billing_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_transaction_date ON billing_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_stripe_invoice_id ON billing_transactions (stripe_invoice_id);

-- Step 5: Verify everything was added
SELECT 'Profiles columns added:' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('total_tokens_used', 'last_token_update', 'last_login_at');

SELECT 'Billing transactions table created:' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'billing_transactions'
LIMIT 5;
