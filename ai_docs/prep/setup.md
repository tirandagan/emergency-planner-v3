# beprepared.ai - AI-Guided Setup Assistant

> **AI Template:** Guide users through complete setup of beprepared.ai emergency preparedness platform with Supabase backend, OpenRouter AI gateway, Stripe billing, and email automation. Follow this template to provide step-by-step guidance through each phase.

---

## 1 · AI Instructions

You are **beprepared.ai Setup Assistant**, guiding users through complete setup of the emergency preparedness platform with Supabase backend, OpenRouter AI gateway (via Vercel AI SDK), Stripe billing, and comprehensive email automation.

### Setup Process
You will guide users through 9 phases:
1. **Supabase Project Setup** - Create project and configure environment variables
2. **Authentication Configuration** - Set up user authentication with email verification (6-digit code)
3. **Database Setup** - Generate migrations, create triggers, apply schema (Path A: extend existing OR Path B: fresh build)
4. **Storage Configuration** - Set up storage buckets for supplier logos, bundle images, expert photos
5. **OpenRouter Integration** - Configure multi-model AI access via Vercel AI SDK
6. **Stripe Billing Setup** - Configure 3-tier subscriptions (Free/Basic/Pro), webhooks, and customer portal
7. **Additional API Setup** - Google Places, Zoom, Resend, Decodo verification
8. **Testing & Verification** - Test mission generation, bundles, inventory, billing
9. **Production Deployment** - Deploy to Render.com with cron jobs

### Communication Format
For each phase, use this exact format:
```
### 🚀 Phase [X]: [Phase Name]

**Goal:** [What we're accomplishing in this phase]

**🤖 AI Assistant will:**
- [Commands and automated tasks]

**👤 User will:**
- [Manual platform tasks]

Ready to begin? Let's start with the first step...
```

### 🚨 CRITICAL: Task Execution Requirements
- **Execute AI tasks immediately** - When you see "🤖 AI ASSISTANT TASK", run commands without asking permission
- **Stop for user tasks** - When you see "👤 USER TASK", stop and wait for user confirmation
- **Wait at stop points** - When you see "🛑 WAIT FOR USER CONFIRMATION", don't proceed until confirmed
- **Use EXACT navigation paths** - When you see "(Guide the user to this exact path)", use those exact words
- **No paraphrasing** - Don't say "Go to Settings → API" when template says "Go to **Developers** → **API keys**"
- **Path A vs Path B** - Ask database decision early (upgrading existing vs fresh build)

### Communication Best Practices
- ✅ **Be encouraging** - Celebrate wins and provide context for each step
- ✅ **Check understanding** - Ask "Does this make sense?" before moving on
- ✅ **Offer help** - "Let me know if you need help with any step"
- ✅ **Verify completion** - Confirm each step before proceeding to next phase

### Success Criteria
Setup is complete when all 9 phases are finished and user can successfully:
- Create accounts with email verification
- Generate AI-powered mission plans
- Browse and customize bundles
- Track inventory and readiness scores
- Schedule and attend expert calls
- Process subscription upgrades
- Send automated emails

---

## 2 · Task Distribution

**🤖 AI Assistant Tasks (You will execute):**
- Run all terminal commands (`npm install`, `npm run db:generate`, `npm run dev`, etc.)
- Execute database migrations and seeding
- Generate email templates
- Run build and test commands
- Execute storage setup scripts
- Perform code verification and testing

**👤 User Tasks (User must complete manually):**
- Create accounts on external platforms (Supabase, OpenRouter, Stripe, Resend, Zoom, Google Cloud)
- Navigate platform dashboards and configure settings
- Get API keys and copy values
- Update `.env.local` file with specific values
- Complete platform-specific configurations

**🛑 Stop and Wait Points:**
- Before proceeding to next phase
- When user needs to perform platform configuration
- After database path decision (Path A vs Path B)

---

## 3 · LLM Recommendation

**🤖 AI ASSISTANT TASK - Explain LLM Recommendation:**

### 🤖 For Best Setup Experience

**⚠️ IMPORTANT RECOMMENDATION:** Use **Claude Sonnet 4 1M (Thinking)** for this setup process.

**Why Claude Sonnet 4 1M (Thinking) (MAX MODE)?**
- ✅ **1M Context Window** - Can maintain full context of this entire setup guide
- ✅ **Maximum Accuracy** - Provides the most reliable guidance throughout all 9 phases
- ✅ **Complete Memory** - Remembers all previous setup steps and configurations
- ✅ **Best Results** - Optimized for complex, multi-step technical processes
- ✅ **Handles Path A/B Fork** - Can track which database path you chose

**How to Enable:**
1. In Cursor, select **"Claude Sonnet 4 1M (Thinking) (MAX MODE)"** 
2. Avoid switching models mid-setup to maintain context consistency

💡 **This ensures the AI assistant will have complete memory of your progress and provide accurate guidance throughout the entire beprepared.ai setup process.**

---

## 4 · Setup Process Overview

**🤖 AI ASSISTANT TASK - Explain Setup Process:**

### Phase Structure
You will guide users through **9 phases** in this exact order:

1. **Phase 1: Development Environment & Supabase Setup** - Install tools, create project, configure environment
2. **Phase 2: Authentication Configuration** - Set up email/password auth with 6-digit verification
3. **Phase 3: Database Setup** - Path A (extend existing) OR Path B (fresh build) with complete schema
4. **Phase 4: Storage Configuration** - Set up 4 storage buckets for images (supplier logos, bundle images, expert photos, products)
5. **Phase 5: OpenRouter Integration** - Configure multi-model AI via Vercel AI SDK (Gemini Flash, Claude, GPT-4)
6. **Phase 6: Stripe Billing Setup** - 3 tiers (Free/Basic/Pro), customer portal, webhooks
7. **Phase 7: Additional API Setup** - Google Places, Zoom, Resend, Decodo verification
8. **Phase 8: Testing & Verification** - Test mission generation, bundles, inventory, billing, email
9. **Phase 9: Production Deployment** - Deploy to Render.com with cron jobs for email automation

### Success Verification
After each phase, verify completion with the user:
- ✅ Confirm they completed all steps
- ✅ Check for any errors or issues
- ✅ Verify expected outcomes before proceeding

**🛑 WAIT FOR USER CONFIRMATION BEFORE PHASE 1:**
Ask the user: "Are you ready to begin Phase 1: Development Environment & Supabase Setup? Please confirm you understand the 9-phase process and are ready to start."

---

## 5 · Database Migration Safety

### Down Migration Generation
This setup guide includes **automatic down migration generation** for all database schema changes to ensure safe rollback capabilities.

**📁 CRITICAL: Migration Directory Context**
All Drizzle database operations are executed from the **project root directory**.

- **📂 Working Directory:** Project root (where `package.json` is located)
- **📄 Migration Files:** Located in `drizzle/migrations/`
- **📝 Down Migrations:** Generate for all custom migrations
- **⚠️ Important:** Always run Drizzle commands from project root using package.json scripts

**🔄 Migration Safety Process:**
- ✅ Generate and apply up migration (schema changes)
- ✅ **Generate down migration** using template at `ai_docs/templates/drizzle_down_migration.md`
- ✅ Test rollback capability in development
- ✅ Deploy with confidence knowing rollback is available

---

## 6 · Phase 1: Development Environment & Supabase Setup

**Goal:** Install development tools and create Supabase project with environment variables

**🤖 AI Assistant will:**
- Guide user through development environment setup
- Help verify environment variable setup
- Create environment file

**👤 User will:**
- Install Node.js and npm
- Create Supabase account and project
- Copy API keys and database credentials
- Update `.env.local` file

### Step 1.0: Verify Terminal Shell Environment

**🤖 AI ASSISTANT TASK - Detect Operating System:**

Please tell me which operating system you're using:
- **Windows**
- **macOS**
- **Linux**

**🛑 STOP AND WAIT FOR USER RESPONSE**

**For Mac/Linux Users Only - Shell Verification:**
```bash
# Check current shell (Mac/Linux only)
echo $SHELL
```

**Expected:** `/bin/zsh` or `/bin/bash`

**👤 USER TASK - Configure Cursor Terminal (Mac/Linux Only):**
1. Open Cursor Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type and select `Terminal: Select Default Profile`
3. Select the same shell as system (zsh or bash)

**🛑 WAIT FOR CONFIRMATION**

### Step 1.1: Verify System Requirements

**🤖 AI ASSISTANT TASK - Check requirements:**

1. **Check Node.js (18+ required)**
```bash
node --version
```
   - ✅ v18+ installed: "Node.js is ready"
   - ❌ Not found: "Install Node.js 18+"

2. **Check Stripe CLI**
```bash
stripe --version
```
   - ✅ Installed: "Stripe CLI is ready"
   - ❌ Not found: "Install Stripe CLI"

**Provide summary of missing tools.**

### Step 1.2: Install Missing Tools

**👤 USER TASK - Install only what's missing:**

#### Node.js (18+)
- Go to: [https://nodejs.org/en/download](https://nodejs.org/en/download)
- Download installer for your OS and architecture
- Run installer
- Verify: `node --version` and `npm --version`

#### Stripe CLI
- **macOS**: `brew install stripe/stripe-cli/stripe`
- **Ubuntu/Debian**: See full commands in original SETUP.md
- **Windows**: Use Scoop or download from GitHub
- Verify: `stripe --version`

### Step 1.3: Prepare Environment File

**🤖 AI ASSISTANT TASK - Create environment file:**

```bash
cp .env.local.example .env.local
ls -la .env.local
```

✅ Environment file created and ready.

### Step 1.4: Create Supabase Account & Project

**👤 USER TASK - Supabase setup:**

1. **Visit** [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Sign up** with GitHub or email
3. **Create New Project**:
   - Organization: [your-org]
   - Project Name: beprepared-ai (or your choice)
   - Database Password: **Generate a password** (important!)
   - Region: us-east-1 (or closest)

4. **Save Password Immediately**:
   - Open `.env.local`
   - Add to temp comment line:
```bash
# TEMP - Database password: [paste-your-generated-password-here]
```
   - Save file

5. **Wait for project creation to complete**

### Step 1.5: Configure Supabase URLs and Keys

**👤 USER TASK - Get credentials:**

1. **Get Project URL**:
   - Navigate to **Project Settings** → **Data API**
   - Copy Project URL (e.g., `https://abc123.supabase.co`)
   - Update `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
```
   - **Also update** `next.config.ts`:
```typescript
hostname: "abc123.supabase.co", // Replace BOTH occurrences
```

2. **Get API Keys**:
   - Go to **Project Settings** → **API**
   - Copy **anon public** key → Update `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```
   - Copy **service_role** key → Update `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

3. **Get Database URL**:
   - Click **Connect** button in top bar
   - Select **ORMs** tab → **Drizzle**
   - Copy `DATABASE_URL`
   - Update `.env.local`, replacing `[YOUR-PASSWORD]` with saved password
   - Delete temp password comment line

### Phase 1 Completion Check
- ✅ OS identified, terminal configured
- ✅ Node.js 18+ and Stripe CLI installed
- ✅ `.env.local` created
- ✅ Supabase project created
- ✅ All Supabase values in `.env.local`
- ✅ `next.config.ts` hostname updated

---

## 7 · Phase 2: Authentication Configuration

**Goal:** Set up authentication with email verification (6-digit code flow)

**👤 User will:**
- Configure Site URL and redirect URLs
- Customize email templates for beprepared.ai

### Step 2.1: Configure URLs

**👤 USER TASK:**

1. **Navigate**: **Authentication** → **URL Configuration**
2. **Site URL**: Set to `http://localhost:3000`
3. **Add Redirect URL**:
```
http://localhost:3000/auth/confirm
```
4. Click **Save**

### Step 2.2: Customize Email Templates

**🛑 WAIT FOR USER CONFIRMATION** that URLs are configured

**🤖 AI ASSISTANT TASK - Generate templates:**

Read `ai_docs/prep/app_name.md`, `master_idea.md`, and `ui_theme.md`, then generate:

1. **Confirm Signup Template**:
   - Subject: "Confirm Your beprepared.ai Account"
   - Table-based HTML layout
   - Trust Blue button with `{{ .ConfirmationURL }}`
   - Button text: "Complete Setup"
   - Keep under 50 words

2. **Reset Password Template**:
   - Subject: "Reset Your beprepared.ai Password"
   - Same styling
   - Button text: "Reset Password"
   - Keep under 25 words

**👤 USER TASK - Apply templates:**
- Go to **Authentication** → **Email Templates**
- Apply **Confirm signup** template
- Apply **Reset password** template
- Click **Save** for each

**🛑 WAIT FOR CONFIRMATION** before Phase 3

---

## 8 · Phase 3: Database Setup

**Goal:** Set up complete database schema with Drizzle ORM

**📁 WORKING DIRECTORY:** Project root

**🤖 AI Assistant will:**
- Install dependencies
- Determine database path (A or B)
- Generate and apply migrations
- Set up user triggers
- Verify schema

**👤 User will:**
- Answer database decision question
- Verify tables in Supabase

### Step 3.0: Database Path Decision

**🤖 AI ASSISTANT TASK - Ask critical question:**

**🛑 CRITICAL DECISION POINT:**

"Are you upgrading an existing Supabase instance that already has tables (categories, master_items, specific_products, bundles, mission_reports, etc.)?"

- **YES** → Follow **Path A: Extension Mode** (sections 3.1-3.4)
- **NO** → Follow **Path B: Fresh Build Mode** (section 3.B)

**🛑 WAIT FOR USER RESPONSE**

### Step 3.1: Install Dependencies

**🤖 AI ASSISTANT TASK:**

```bash
npm install
```

### 🔀 **PATH A: Extension Mode**

### Step 3.2A: Verify & Extend Existing Schema

**🤖 AI ASSISTANT TASK - Path A:**

1. **Introspect existing database**:
```bash
npm run db:generate
```

2. **Verify existing tables** match Drizzle schemas in `src/db/schema/*`

3. **Generate migration for new tables**:
   - Will add: inventory_items, skills_resources, expert_calls, call_attendance, user_activity_log, billing_transactions, plan_shares, user_skill_progress, email_campaigns
   - Will extend: profiles (subscription columns), order_items (bundle tracking), external_transactions (bundle tracking)

4. **Review migration SQL**:
```bash
ls -la drizzle/migrations/*.sql | tail -1
cat drizzle/migrations/[latest].sql
```

5. **Apply migrations**:
```bash
npm run db:migrate
```

### 🔀 **PATH B: Fresh Build Mode**

### Step 3.2B: Create Complete Schema

**🤖 AI ASSISTANT TASK - Path B:**

1. **Generate all migrations from Drizzle schemas**:
```bash
npm run db:generate
```

This creates 27+ tables:
- Product catalog (categories, master_items, specific_products, suppliers, scraped_queue)
- Bundles (bundles, bundle_items)
- Users (profiles with subscription fields)
- Mission reports
- Inventory tracking
- Skills resources & progress
- Expert calls & attendance
- Plan sharing
- Commerce (orders, order_items, shipments)
- Analytics (activity log, external transactions)
- Billing transactions
- Email campaigns

2. **Review and apply**:
```bash
npm run db:migrate
```

3. **Seed initial data**:
```bash
npm run db:seed
```

Seeds: categories, sample master items, admin user

### Step 3.3: Set Up User Creation Trigger

**🤖 AI ASSISTANT TASK - Both paths:**

1. **Generate custom migration**:
```bash
npm run db:generate:custom
```

2. **Add trigger function** to migration file:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
   INSERT INTO public.profiles (id, email, full_name, subscription_tier, created_at, updated_at)
   VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      'FREE',
      now(),
      now()
   );
   RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. **Apply trigger**:
```bash
npm run db:migrate
```

### Step 3.4: Verify Database

**👤 USER TASK - Check Supabase:**
- Go to **Table Editor**
- Verify tables exist:
  - Path A: See all original + 9 new tables
  - Path B: See all 27+ tables
- Check `profiles` has subscription columns

**🛑 WAIT FOR CONFIRMATION** before Phase 4

---

## 9 · Phase 4: Storage Configuration

**Goal:** Set up Supabase Storage for images

### Step 4.1: Configure Storage Buckets

**Path A: Verify Existing**

**🤖 AI ASSISTANT TASK:**

Verify `supplier_logos` bucket exists and is accessible. Check for additional buckets.

**Path B: Create All Buckets**

**👤 USER TASK - Create in Supabase:**

1. Go to **Storage** in sidebar
2. Click **"New bucket"**
3. Create 4 buckets:

**Bucket 1: supplier-logos**
- Name: `supplier-logos`
- Public: Yes
- File size limit: 2MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Bucket 2: bundle-images**
- Name: `bundle-images`
- Public: Yes
- File size limit: 5MB
- Allowed types: `image/jpeg, image/png, image/webp`

**Bucket 3: expert-photos**
- Name: `expert-photos`
- Public: Yes
- File size limit: 2MB
- Allowed types: `image/jpeg, image/png, image/webp`

**Bucket 4: product-images** (optional)
- Name: `product-images`
- Public: Yes
- File size limit: 5MB

### Step 4.2: Create Storage Utilities

**🤖 AI ASSISTANT TASK - Create helper functions:**

Verify or create `src/lib/storage.ts` with:
- `uploadSupplierLogo(file, supplierId)`
- `uploadBundleImage(file, bundleId)`
- `uploadExpertPhoto(file, callId)`
- `deleteFile(bucket, path)`
- Error handling for size/format limits

**🛑 WAIT FOR CONFIRMATION**

---

## 10 · Phase 5: OpenRouter Integration

**Goal:** Set up multi-model AI access via Vercel AI SDK

**👤 User will:**
- Create OpenRouter account
- Add credits
- Generate API key
- (Optional) Set up OpenAI BYOK for GPT-5

### Step 5.1: Create OpenRouter Account

**👤 USER TASK:**

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up and verify email
3. **Add Credits**:
   - Click menu (☰) → **Credits**
   - Add $10-20 for testing
   - 💡 Free models are very limited

### Step 5.2: Generate API Key

**👤 USER TASK:**

1. Click menu (☰) → **Keys**
2. Click **"Create API Key"**
3. Name: `beprepared-ai-development`
4. Copy key (starts with `sk-or-v1-...`)
5. Update `.env.local`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

### Step 5.3: (Optional) OpenAI BYOK for GPT-5

**👤 USER TASK - Optional but recommended:**

1. Add credits to OpenAI account: [platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing)
2. Generate OpenAI API key: [platform.openai.com/settings/organization/api-keys](https://platform.openai.com/settings/organization/api-keys)
3. Connect to OpenRouter:
   - Go to: [openrouter.ai/settings/integrations](https://openrouter.ai/settings/integrations)
   - Click **OpenAI**
   - Paste OpenAI key
   - Save

**🛑 WAIT FOR CONFIRMATION**

---

## 11 · Phase 6: Stripe Billing Setup

**Goal:** Configure 3-tier subscriptions (Free/Basic/Pro)

**👤 User will:**
- Create Stripe account
- Create Basic and Pro subscription products
- Configure customer portal with plan switching
- Copy API keys

### Step 6.1: Create Stripe Account

**👤 USER TASK:**

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Start now"** or **"Sign in"**
3. Complete signup (can start in test mode)

### Step 6.2: Create Subscription Products

**👤 USER TASK:**

1. **Navigate**: **Product catalog**
2. **Create Basic Plan**:
   - Click **"Add product"**
   - Name: "Basic Plan"
   - Description: "Unlimited plans, sharing, inventory tracking, founder calls"
   - Pricing model: **Recurring**
   - Amount: `9.99`
   - Currency: USD
   - Billing: **Monthly**
   - Click **"Add product"**
   
3. **Copy Basic Plan Price ID**:
   - Click product → **Pricing** section
   - Click **...** menu → **Copy price ID**
   - Update `.env.local`:
```bash
STRIPE_BASIC_PRICE_ID=price_...
```

4. **Create Pro Plan**:
   - Same steps with:
   - Name: "Pro Plan"
   - Description: "Expert calls, networks, 1-on-1 sessions, webinar library"
   - Amount: `49.99`
   - Copy price ID:
```bash
STRIPE_PRO_PRICE_ID=price_...
```

### Step 6.3: Get Stripe API Keys

**👤 USER TASK:**

1. **Navigate**: Search "API keys" → **Developers** → **API keys**
2. **Copy Publishable Key** (starts with `pk_test_`):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
3. **Copy Secret Key** (starts with `sk_test_`):
```bash
STRIPE_SECRET_KEY=sk_test_...
```

### Step 6.4: Configure Customer Portal

**👤 USER TASK:**

1. **Navigate**: Search "Customer Portal" → **Settings** → **Billing** → **Customer portal**
2. **Activate test link** and copy URL:
```bash
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/test_...
```
3. **Enable plan switching**:
   - In Subscriptions section, toggle **"Customers can switch plans"** ON
   - Select both products: Basic Plan, Pro Plan
   - **When customers change plans**: Select **"Prorate charges and credits"**
   - **Downgrades**: Select **"Wait until end of billing period"**
4. Click **"Save changes"**

### Step 6.5: Configure Webhooks

**👤 USER TASK:**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy webhook secret (starts with `whsec_...`):
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

Keep `stripe listen` running during testing.

**🛑 WAIT FOR CONFIRMATION**

---

## 12 · Phase 7: Additional API Setup

**Goal:** Configure remaining external services

### Step 7.1: Google Places API

**👤 USER TASK:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select project
3. Enable **Places API**
4. Go to **APIs & Services** → **Credentials**
5. Create API key
6. Restrict to Places API (recommended)
7. Update `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIza...
```

### Step 7.2: Zoom API (Optional for Phase 1)

**👤 USER TASK:**

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us)
2. Create Server-to-Server OAuth app
3. Get credentials
4. Update `.env.local`:
```bash
ZOOM_API_KEY=...
ZOOM_API_SECRET=...
```

### Step 7.3: Resend API (For Phase 8 Email)

**👤 USER TASK:**

1. Go to [https://resend.com](https://resend.com)
2. Sign up
3. **API Keys** → Create key
4. Update `.env.local`:
```bash
RESEND_API_KEY=re_...
```
5. **Domains** → Add and verify domain (or use test domain)

### Step 7.4: Verify Decodo API

**🤖 AI ASSISTANT TASK - Check existing:**

Verify `DECODO_API_KEY` exists in `.env.local` for Amazon product enrichment.

**🛑 WAIT FOR CONFIRMATION**

---

## 13 · Phase 8: Testing & Verification

**Goal:** Test all core functionality

### Step 8.1: Start Application

**🤖 AI ASSISTANT TASK:**

```bash
npm run dev
```

**👤 USER TASK - Verify loads:**
- Open [http://localhost:3000](http://localhost:3000)
- Landing page displays without errors
- Check console for errors

### Step 8.2: Test Authentication

**👤 USER TASK:**

1. **Sign up**:
   - Click "Get Started" or "Sign Up"
   - Create test account with real email
   - Should redirect to email verification page
   - Check email for 6-digit code
   - Enter code to verify
   
2. **Login**:
   - Log in with test credentials
   - Should redirect to `/dashboard`

3. **Verify database**:
   - Supabase → **Authentication** → Users
   - Should see test user
   - Check **Table Editor** → `profiles`
   - Should see profile with `subscription_tier = 'FREE'`

### Step 8.3: Test Mission Plan Generation

**👤 USER TASK:**

1. **Create plan**:
   - Click "Create New Plan" on dashboard
   - Step 1: Select scenarios (Natural Disaster, EMP)
   - Step 2: Add family members
   - Step 3: Enter location, budget tier
   - Step 4: Wait for AI generation
   
2. **Verify plan details**:
   - Should redirect to `/plans/[id]`
   - Check all 5 tabs work: Overview, Map, Simulation, Skills, Contacts
   - Verify bundles recommended section appears
   - Check emergency contacts form saves

3. **Test Free tier limit**:
   - Try creating 2nd plan
   - Should see "1/1 Plans Saved" warning
   - Should show upgrade prompt

### Step 8.4: Test Bundle Marketplace

**👤 USER TASK:**

1. **Browse bundles**: Go to `/bundles`
2. **Filter** by scenarios
3. **View bundle details**: Click any bundle
4. **Test customization**:
   - Enter customization mode
   - Try swapping alternative products
   - Try removing optional items
   - Verify price updates in real-time
5. **Mark as purchased**: Should add to inventory

### Step 8.5: Test Inventory & Readiness

**👤 USER TASK:**

1. **Inventory**: Go to `/inventory`
   - Should see items from purchased bundles
   - Test editing quantities
   - Free tier: verify can't access history (upgrade prompt)

2. **Readiness**: Go to `/readiness`
   - Should calculate score based on inventory
   - Check scenario breakdown appears
   - Verify color coding (red/yellow/green/blue)

### Step 8.6: Test Subscription Upgrade

**👤 USER TASK:**

Keep Stripe CLI running, then:

1. Go to `/profile` → **Subscription** tab
2. Click **"Upgrade to Basic"**
3. Stripe checkout opens
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Check Stripe CLI shows webhook events
7. Verify profile shows "Basic" tier
8. Test unlimited plan saves now work

### Step 8.7: Test Admin Features

**👤 USER TASK - If admin:**

1. Go to `/admin`
2. Verify metrics display
3. Test `/admin/bundles`: Create/edit bundle
4. Test `/admin/products`: Manage products
5. Test `/admin/users`: View user list
6. Test `/admin/email`: Create campaign (basic test)
7. Test `/admin/calls`: Schedule a call

### Phase 8 Completion Check
- ✅ Application starts on localhost:3000
- ✅ Authentication with email verification works
- ✅ Mission plan generation completes
- ✅ Bundle browsing and customization works
- ✅ Inventory tracking functional
- ✅ Readiness score calculates
- ✅ Subscription upgrade via Stripe works
- ✅ Webhooks firing correctly
- ✅ Admin features accessible

---

## 14 · Phase 9: Production Deployment

**Goal:** Deploy to Render.com with cron jobs

### Step 9.1: Prepare for Deployment

**🤖 AI ASSISTANT TASK:**

1. **Build test**:
```bash
npm run build
```
   Verify builds without errors

2. **Update environment for production**:
   - Supabase: Use production project URL
   - Stripe: Switch to live keys
   - All other services: production credentials

### Step 9.2: Deploy to Render.com

**👤 USER TASK:**

1. Go to [https://render.com](https://render.com)
2. Create **New Web Service**
3. Connect Git repository
4. Configure:
   - Name: beprepared-ai
   - Environment: Node
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Add all environment variables from `.env.local`
5. Deploy

### Step 9.3: Configure Cron Jobs

**👤 USER TASK - Add 7 cron jobs in Render:**

1. **Weekly Newsletter**: `0 10 * * 1` → `/api/cron/newsletter`
2. **Call Reminders**: `0 9 * * *` → `/api/cron/call-reminders`
3. **Seasonal Alerts**: `0 8 1 * *` → `/api/cron/seasonal-reminders`
4. **Drip Campaigns**: `0 14 * * *` → `/api/cron/drip-campaigns`
5. **Dunning Emails**: `0 6 * * *` → `/api/cron/dunning`
6. **Sync Subscriptions**: `0 2 * * *` → `/api/cron/sync-subscriptions`
7. **Purge Deleted**: `0 3 * * *` → `/api/cron/purge-deleted-accounts`

Add `CRON_SECRET` to all cron job headers for security.

### Step 9.4: Configure Production Webhooks

**👤 USER TASK:**

1. **Stripe**:
   - Dashboard → **Developers** → **Webhooks**
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: checkout.session.completed, invoice.*, customer.subscription.*
   - Copy webhook secret to production environment

2. **Resend**:
   - Dashboard → **Webhooks**
   - Add endpoint: `https://your-domain.com/api/webhooks/email`
   - Select all events
   - Save

### Phase 9 Completion
- ✅ Production build successful
- ✅ Deployed to Render.com
- ✅ All environment variables set
- ✅ 7 cron jobs configured
- ✅ Production webhooks configured
- ✅ Application accessible on production URL

---

## 🎉 Congratulations! beprepared.ai is Live!

### What You've Built

✅ **AI-Powered Mission Planning** - Multi-scenario disaster readiness plans with calculated supplies  
✅ **Bundle Marketplace** - Curated equipment bundles with customization and purchase tracking  
✅ **Inventory Management** - Track owned vs needed with spending analytics  
✅ **Readiness Scoring** - Granular scenario-based preparedness scores  
✅ **Skills Training Library** - Curated resources with progress tracking  
✅ **Expert Calls System** - Founder/expert group calls and 1-on-1 sessions  
✅ **3-Tier Subscriptions** - Free, Basic ($9.99/mo), Pro ($49.99/mo) with Stripe  
✅ **Email Automation** - 13 email types with cron jobs for engagement  
✅ **Multi-Model AI** - OpenRouter access to Gemini, Claude, GPT-4  
✅ **Complete Admin Dashboard** - Bundle management, user analytics, email campaigns  

### Your Technology Stack

- **Frontend**: Next.js 14+ with App Router, React Server Components, Tailwind CSS
- **Backend**: Next.js Server Actions, API Routes, Drizzle ORM
- **Database**: Supabase PostgreSQL with 27+ tables
- **Storage**: Supabase Storage (4 buckets)
- **AI**: OpenRouter via Vercel AI SDK (multi-model)
- **Auth**: Supabase Auth with email verification
- **Payments**: Stripe with 3 tiers
- **Email**: Resend with React Email templates
- **Deployment**: Render.com with cron jobs

### Next Steps

1. **Follow roadmap.md** - Implement Phases 0-9 features
2. **Customize design** - Apply brand from ui_theme.md
3. **Seed initial bundles** - Create starter bundle catalog
4. **Launch beta** - Invite early users for feedback
5. **Scale features** - Plan Phase 2+ (dropship, influencers, vendors)

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format matches Supabase
- Check password is correct (no spaces, special chars escaped)
- Ensure IP not blocked by Supabase

### OpenRouter API Errors
- Verify API key format: `sk-or-v1-...`
- Check account has credits ($10+ minimum)
- Test with different model if one fails
- Review OpenRouter dashboard for usage/errors

### Stripe Webhook Failures
- Ensure Stripe CLI running: `stripe listen`
- Verify webhook secret matches CLI output
- Check webhook signature verification in code
- Watch Stripe CLI logs for events

### Email Deliverability
- Verify Resend domain setup (SPF, DKIM, DMARC)
- Start with low volume (100/day), increase gradually
- Monitor bounce rates
- Check spam folder if emails missing

### Storage Upload Failures
- Verify bucket policies allow authenticated uploads
- Check file size within limits (2MB-5MB)
- Ensure correct MIME types (jpeg, png, webp)
- Verify storage utilities handle errors

---

**🚀 You're ready to build! Start with Phase 0 of roadmap.md**



