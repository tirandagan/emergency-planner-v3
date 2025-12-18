# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**beprepared.ai** - AI-powered disaster preparedness platform that generates personalized emergency plans using Claude Sonnet 3.5 via OpenRouter. Built with Next.js 15+, React 19, Drizzle ORM, Supabase Auth, PostgreSQL, and Shadcn UI components.

## Essential Development Commands

### Development Server
```bash
npm run dev                    # Start Next.js dev server (http://localhost:3000)
npm run build                  # Production build
npm run start                  # Start production server
npm run lint                   # Run ESLint
```

### Database Operations (Drizzle ORM)
```bash
npm run db:generate            # Generate migrations from schema changes
npm run db:generate:custom     # Generate custom migration file
npm run db:migrate             # Run pending migrations
npm run db:push                # Push schema directly to database (dev only)
npm run db:studio              # Open Drizzle Studio UI
npm run db:seed                # Seed database with initial data
npm run db:import-products     # Import product catalog
npm run db:compare-schemas     # Compare database schema versions
```

**CRITICAL**: Always use `npm run db:*` scripts, NEVER `npx drizzle-kit` directly. Scripts ensure proper `.env.local` loading via `dotenv-cli`.

### Version Management
```bash
npm run version:patch          # Bump patch version (5.0.1 -> 5.0.2)
npm run version:minor          # Bump minor version (5.0.1 -> 5.1.0)
npm run version:major          # Bump major version (5.0.1 -> 6.0.0)
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15+ with App Router, React 19, TypeScript 5+
- **AI Integration**: Vercel AI SDK + OpenRouter (Claude Sonnet 3.5)
- **Authentication**: Supabase Auth with email-first OTP flow
- **Database**: PostgreSQL via Supabase, Drizzle ORM for queries
- **UI Components**: Shadcn UI (Radix primitives + Tailwind CSS v4)
- **Mapping**: Google Maps API (Maps JavaScript, Geocoding, Routes)
- **Payments**: Stripe (subscriptions with Basic/Pro tiers)
- **Styling**: Tailwind CSS v4 with custom design system

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes (grouped layout)
│   ├── (protected)/       # Protected routes requiring auth
│   ├── api/               # API routes (REST endpoints)
│   └── planner/           # Main planning wizard interface
├── components/            # React components
│   ├── admin/             # Admin dashboard components
│   ├── auth/              # Authentication UI components
│   ├── plans/             # Plan display and management
│   │   ├── wizard/        # Multi-step plan creation wizard
│   │   ├── map/           # Map and route visualization
│   │   └── plan-details/  # Plan detail views and tabs
│   └── ui/                # Shadcn UI components
├── db/
│   ├── schema/            # Drizzle ORM schemas (modular by domain)
│   └── queries/           # Reusable database queries
├── lib/
│   ├── ai/                # AI mission generation logic
│   ├── auth/              # Authentication utilities
│   ├── prompts/           # AI prompt building and management
│   ├── supabase/          # Supabase client configurations
│   └── validation/        # Zod schemas for form validation
├── actions/               # Server actions (form submissions)
└── types/                 # TypeScript type definitions

drizzle/
└── migrations/            # Database migration files

prompts/                   # AI prompt templates organized by domain
├── mission-generation/    # Core mission plan generation
├── evacuation-routes/     # Route planning prompts
└── bundle-recommendations/# Product recommendation prompts
```

### Authentication System
- **Flow**: Email-first → OTP verification (passwordless by default)
- **Session**: Supabase Auth with cookie-based sessions via `@supabase/ssr`
- **Server**: Use `createClient()` from `@/utils/supabase/server` (async function)
- **Client**: Use `createClient()` from `@/utils/supabase/client`
- **Role-Based**: Admin role checked via `profiles.role` column in PostgreSQL

### Database Architecture (Drizzle ORM)
- **Schema Location**: `src/db/schema/` (modular files by domain)
- **Migration Pattern**: Generate → Review → Migrate (never push to production)
- **Type Safety**: Drizzle provides full TypeScript types for tables
- **Query Pattern**: Use type-safe operators (`eq`, `inArray`, `and`) instead of raw SQL
- **Connection**: Direct PostgreSQL connection via Supabase pooler
- **CRITICAL**: NEVER use Supabase client REST API (`supabase.from()`) for database queries - ALWAYS use Drizzle ORM with direct PostgreSQL connection via `db.query` or `db.select()`

### AI Mission Generation System
- **Provider**: OpenRouter API (`anthropic/claude-3.5-sonnet`)
- **Architecture**: Multi-phase prompt system with domain-specific context
- **Prompts**: File-based templates in `prompts/` directory loaded server-side
- **Flow**: Wizard form data → Mega prompt builder → Streaming generation → Parse response
- **Logging**: All AI usage tracked in `calls` table (tokens, duration, cost)
- **Models Available**: Sonnet 3.5 (default), Opus 4, Haiku 3 via `src/lib/openrouter.ts`

## Critical Framework-Specific Rules

### Next.js 15 Breaking Changes
**params and searchParams are now Promises**:
```tsx
// ❌ Wrong (Next.js 14 style)
interface PageProps {
  params: { id: string };
}
export default async function Page({ params }: PageProps) {
  const { id } = params;
}

// ✅ Correct (Next.js 15)
interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
}

// Client components use React's use() hook
'use client';
import { use } from 'react';
export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}
```

**revalidatePath requires type parameter**:
```tsx
// ✅ Correct
revalidatePath('/path/[...param]', 'page');
```

### Drizzle ORM Type Safety
**Always use type-safe operators, never raw SQL for basic operations**:
```tsx
// ❌ Wrong - SQL injection risk
sql`${users.id} = ANY(${array})`

// ✅ Correct - Type-safe
import { eq, inArray, and, or } from "drizzle-orm";
inArray(users.id, array)
```

**Common operators**: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `inArray`, `notInArray`, `isNull`, `isNotNull`, `like`, `ilike`, `between`, `and`, `or`, `not`, `exists`

**Only use raw SQL for database-specific functions**:
```tsx
// ✅ Acceptable use case
sql<string>`to_tsvector('simple', ${posts.content})`
```

### Shadcn UI Component Installation
```bash
# ✅ Always use this exact format
npx shadcn@latest add <component>

# ❌ Never use these
npx shadcn-ui add <component>
pnpm dlx shadcn add <component>
```

### Supabase Client Usage
**Server Components/Actions** (async required):
```tsx
import { createClient } from '@/utils/supabase/server';

export default async function ServerComponent() {
  const supabase = await createClient(); // Must await
  const { data: { user } } = await supabase.auth.getUser();
}
```

**Client Components**:
```tsx
'use client';
import { createClient } from '@/utils/supabase/client';

export default function ClientComponent() {
  const supabase = createClient(); // No await
}
```

### Code Style Enforcement
- **No `any` types**: Use proper TypeScript types or generics
- **No `@ts-expect-error`**: Fix type issues properly
- **No `eslint-disable` comments**: Address linting issues at source
- **No inline styles**: Use Tailwind classes or `cn()` utility
- **Client directive**: Only use `'use client'` when necessary (interactivity/hooks)
- **Async components**: Server Components can be async, Client Components cannot
- **Explicit return types**: All functions must have explicit return type annotations
- **No toast in Server Actions**: Toast notifications only in client-side code

## Environment Variables

Required environment variables (use `.env.local` in development):
```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (Authentication & Storage)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...        # Required: OpenRouter API for AI generation and embeddings
GEMINI_API_KEY=AIza...                  # Optional: Legacy survival plan generation only

# Google Cloud APIs (Maps, Geocoding, Routes)
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=AIza...

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=your-email@domain.com
ADMIN_EMAIL=admin@domain.com
```

### Google Cloud API Setup
1. Enable required APIs in Google Cloud Console:
   - **Maps JavaScript API** (required for map rendering)
   - **Geocoding API** (required for waypoint conversion)
   - **Routes API** (required for drivable route calculation)
2. Create API key and add to `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY`
3. Restrict API key to your domain in production

## Design System & Brand

### Color Palette
- **Primary (Trust Blue)**: `hsl(220, 85%, 55%)` light / `hsl(220, 75%, 65%)` dark
- **Success**: `hsl(120, 60%, 45%)` light / `hsl(120, 55%, 50%)` dark
- **Warning**: `hsl(45, 80%, 55%)` light / `hsl(45, 75%, 60%)` dark
- **Error**: `hsl(0, 70%, 50%)` light / `hsl(0, 65%, 55%)` dark
- **Background**: `#ffffff` light / `hsl(220, 15%, 8%)` dark
- **Reference**: See `ai_docs/prep/brand_package.md` for complete brand guidelines

### Component Patterns
- Use Shadcn components from `src/components/ui/`
- Apply Tailwind utilities via `cn()` helper from `@/lib/utils`
- Follow responsive-first design (mobile → desktop)
- Maintain accessibility (WCAG 2.1 AA minimum)

## Key Implementation Patterns

### Server Actions Pattern
```tsx
'use server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function myServerAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Perform database operations
  await db.insert(table).values({...});

  // Revalidate affected paths
  revalidatePath('/dashboard', 'page');

  return { success: true };
}
```

### Protected Route Pattern
```tsx
// app/(protected)/admin/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/auth/login');

  // Check admin role via Drizzle query
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role !== 'ADMIN') return redirect('/');

  return <AdminDashboard />;
}
```

### AI Generation Pattern
```tsx
import { generateMissionPlan } from '@/lib/ai/mission-generator';
import type { WizardFormData } from '@/types/wizard';

export async function generatePlan(formData: WizardFormData, userId: string) {
  const result = await generateMissionPlan(formData, userId);

  // result contains:
  // - content: Full markdown plan
  // - metadata: Model, tokens, duration
  // - formData: Original input

  return result;
}
```

## Common Workflows

### Adding a New Database Table
1. Create schema file: `src/db/schema/my-table.ts`
2. Export from `src/db/schema/index.ts`
3. Generate migration: `npm run db:generate`
4. Review generated SQL in `drizzle/migrations/`
5. Apply migration: `npm run db:migrate`
6. Create queries in `src/db/queries/` if needed

### Adding a New API Route
1. Create route handler: `src/app/api/my-route/route.ts`
2. Implement `GET`, `POST`, etc. with proper types
3. Use `createClient()` from `@/utils/supabase/server` for auth
4. Return `NextResponse.json()` with proper status codes
5. Handle errors with try/catch and appropriate error responses

### Adding a New Shadcn Component
1. Install component: `npx shadcn@latest add <component>`
2. Component added to `src/components/ui/<component>.tsx`
3. Import and use: `import { Button } from '@/components/ui/button'`
4. Customize via Tailwind classes or extend component

### Modifying AI Prompts
1. Edit prompt files in `prompts/` directory
2. Prompts are loaded server-side by `buildMegaPrompt()` in `src/lib/prompts/`
3. Test with wizard flow: `/planner/wizard`
4. Monitor token usage in `calls` table

## Testing & Quality Assurance

- **Type Checking**: TypeScript strict mode enabled
- **Linting**: ESLint with Next.js recommended config
- **Browser Console**: Check for API errors (Google Maps, Supabase)
- **Database Studio**: Use `npm run db:studio` to inspect data
- **AI Usage Monitoring**: Check `calls` table for token consumption and costs

## AI Documentation Resources

- **Brand Identity**: `ai_docs/prep/brand_package.md`
- **Roadmap**: `ai_docs/prep/roadmap.md`
- **Prompt System**: `prompts/README.md` and `prompts/IMPLEMENTATION_GUIDE.md`
- **Implementation Plans**: `ai_docs/implementation_plans/`
- **Task Tracking**: `ai_docs/tasks/`

## Known Issues & Limitations

- **PostgreSQL Functions**: Changes to function parameters require manual migration (see `.cursor/rules/postgresql-function-parameter-changes.mdc`)
- **Amazon PAAPI**: Webpack config includes parser override for `paapi5-nodejs-sdk` compatibility
- **Decodo API (Amazon Product Data)**: The `autoselect_variant: true` parameter is required in Decodo API calls to return correct pricing for Amazon products with multiple variants (size, count, color). Without this parameter, Decodo returns the base variant price instead of the specific variant's price. See `src/lib/decodo.ts` line 292.
- **React Compiler**: Enabled (`reactCompiler: true`) - may cause issues with certain patterns
- **Image Optimization**: Only Supabase storage domain whitelisted in Next.js config
- **IPv6 Connectivity (Render/Railway)**: Some hosting platforms don't support IPv6 outbound connections. If you see `ENETUNREACH` errors connecting to Supabase, use the IPv4 resolution script:
  ```bash
  DATABASE_URL="your-connection-string" node scripts/resolve-db-ipv4.js
  ```
  Then set the outputted IPv4 connection string as `DATABASE_URL` in your hosting platform's environment variables. **Note**: The IP address may change over time - re-run if connection fails.

## Production Deployment

1. Set `NEXT_PUBLIC_SITE_URL` to production domain
2. Configure Stripe webhook endpoint
3. Restrict Google API key to production domain
4. Enable Supabase RLS policies
5. Run `npm run build` to verify production build
6. Deploy via Vercel (recommended) or custom server
7. Set environment variables in deployment platform
8. Run database migrations on production database
