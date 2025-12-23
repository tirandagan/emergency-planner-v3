# Render Environment Variables Setup Guide

**Quick reference for setting environment variables after Blueprint deployment**

---

## Service 1: beprepared-nextjs

Go to: **beprepared-nextjs** → **Environment** tab

### Database & Auth (Supabase)
```bash
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-supabase-service-role-key]
```

### AI Services
```bash
OPENROUTER_API_KEY=sk-or-v1-[your-openrouter-api-key]
GEMINI_API_KEY=[your-gemini-api-key]  # Optional
```

### Google Services
```bash
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=[your-google-services-api-key]
GOOGLE_CUSTOM_SEARCH_CX=[your-custom-search-cx]  # Optional
```

### Weather API
```bash
NEXT_PUBLIC_WEATHERAPI_API_KEY=[your-weatherapi-key]
```

### Stripe
```bash
STRIPE_BASIC_PRICE_ID=price_[your-basic-price-id]
STRIPE_PRO_PRICE_ID=price_[your-pro-price-id]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[your-stripe-publishable-key]
STRIPE_SECRET_KEY=sk_test_[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-stripe-webhook-secret]
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/[your-portal-id]
```

### Email (Resend)
```bash
RESEND_API_KEY=re_[your-resend-api-key]
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### LLM Service Integration
```bash
LLM_SERVICE_URL=https://llm-service-api.onrender.com
```

### Generate Webhook Secret (ONE TIME)
```bash
# Run this command locally to generate a secure secret:
openssl rand -hex 32

# Example output:
# a3f7b2c8d9e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9

# Use the SAME secret in both Next.js and LLM services:
LLM_WEBHOOK_SECRET=[paste-your-generated-secret-here]
```

### Optional Features
```bash
SERPAPI_API_KEY=[your-serpapi-key]  # Optional
DECODO_USER=[your-decodo-user]  # Optional
DECODO_PASS=[your-decodo-password]  # Optional
ZOOM_API_KEY=[your-zoom-api-key]  # Optional
ZOOM_API_SECRET=[your-zoom-api-secret]  # Optional
```

---

## Service 2: llm-service-api

Go to: **llm-service-api** → **Environment** tab

### Database (Same as Next.js)
```bash
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:6543/postgres
```

### AI Service
```bash
OPENROUTER_API_KEY=sk-or-v1-[your-openrouter-api-key]
```

### External APIs
```bash
WEATHERAPI_API_KEY=[your-weatherapi-key]
GOOGLE_SERVICES_API_KEY=[your-google-services-api-key]
```

### Webhook Secret (MUST MATCH Next.js)
```bash
LLM_WEBHOOK_SECRET=[same-secret-as-nextjs]
```

### Email
```bash
RESEND_API_KEY=re_[your-resend-api-key]
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

**Note:** `REDIS_URL` is automatically configured by Render

---

## Service 3: llm-service-worker

Go to: **llm-service-worker** → **Environment** tab

**Use EXACTLY the same variables as llm-service-api:**

```bash
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:6543/postgres
OPENROUTER_API_KEY=sk-or-v1-[your-openrouter-api-key]
WEATHERAPI_API_KEY=[your-weatherapi-key]
GOOGLE_SERVICES_API_KEY=[your-google-services-api-key]
LLM_WEBHOOK_SECRET=[same-secret-as-nextjs]
RESEND_API_KEY=re_[your-resend-api-key]
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

---

## Service 4: llm-service-flower

Go to: **llm-service-flower** → **Environment** tab

**Flower only needs Redis (auto-configured):**

No manual environment variables needed! ✅

---

## Service 5: llm-service-redis

**Managed Database - No configuration needed!** ✅

---

## Deployment Order

After setting environment variables:

1. **Next.js** will redeploy automatically
2. **LLM API** will redeploy automatically
3. **LLM Worker** will redeploy automatically
4. **Flower** will redeploy automatically
5. **Redis** is already running

Wait for all services to show **Live** status.

---

## Post-Configuration: Run Database Migrations

Once **llm-service-api** is running:

### Option A: Via Render Shell
```bash
# Go to llm-service-api → Shell tab
cd /app/migrations
psql $DATABASE_URL < 001_create_llm_tables.sql
psql $DATABASE_URL < 002_create_external_api_cache.sql
psql $DATABASE_URL < 003_add_webhook_fields.sql
```

### Option B: From Local Machine
```bash
cd /home/tiran/emergency-planner-v2/LLM_service/migrations
psql "postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:6543/postgres" < 001_create_llm_tables.sql
psql "postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:6543/postgres" < 002_create_external_api_cache.sql
psql "postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:6543/postgres" < 003_add_webhook_fields.sql
```

---

## Verification

### Test Next.js App
```bash
curl https://beprepared.ai/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test LLM API
```bash
curl https://llm-service-api.onrender.com/health
# Expected: {"status":"healthy","services":{...}}
```

### Check Flower Dashboard
Visit: https://llm-service-flower.onrender.com

---

## Quick Copy-Paste Checklist

- [ ] Generate webhook secret: `openssl rand -hex 32`
- [ ] Copy actual values from your `.env.local` file
- [ ] Set Next.js environment variables (18 variables)
- [ ] Set LLM API environment variables (7 variables)
- [ ] Set LLM Worker environment variables (7 variables - same as API)
- [ ] Wait for all services to deploy
- [ ] Run database migrations
- [ ] Test Next.js health endpoint
- [ ] Test LLM API health endpoint
- [ ] Verify Flower dashboard accessible
- [ ] Test end-to-end workflow

---

## Where to Find Your Values

**From `.env.local` in your project root:**
- Database credentials
- Supabase keys
- API keys (OpenRouter, Google, Weather, etc.)
- Stripe keys
- Email configuration

**From Supabase Dashboard:**
- `DATABASE_URL`: Settings → Database → Connection String (Transaction Mode)
- `NEXT_PUBLIC_SUPABASE_URL`: Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings → API → anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Settings → API → service_role secret key

**From Stripe Dashboard:**
- API keys: Developers → API keys
- Webhook secret: Developers → Webhooks → Add endpoint
- Price IDs: Products → Your product → Pricing

---

## Success Indicators

✅ **beprepared-nextjs**: Live
✅ **llm-service-api**: Live
✅ **llm-service-worker**: Live
✅ **llm-service-flower**: Live
✅ **llm-service-redis**: Available

**Total Monthly Cost:** ~$28 ($7 × 4 services)

---

## Troubleshooting

**Service won't start:**
- Check Logs tab for specific errors
- Verify all environment variables are set
- Check DATABASE_URL format

**Database connection fails:**
- Ensure using port 6543 (Transaction Mode pooler)
- Check Supabase is accessible
- Try IPv4 resolution if needed

**Build fails:**
- Check build logs for dependency errors
- Verify Dockerfile exists for Docker services
- Ensure package.json is valid for Next.js

---

**Next Steps:** See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed verification steps.
