# Render.com Deployment Checklist

**Quick reference for deploying BePreparedd.ai monorepo**

---

## Pre-Deployment

### 1. Generate Webhook Secret
```bash
openssl rand -hex 32
# Save this - you'll need it in TWO places!
```

### 2. Gather API Keys
- [ ] OpenRouter API key
- [ ] Google Services API key
- [ ] WeatherAPI key
- [ ] Stripe keys (publishable, secret, webhook secret)
- [ ] Resend API key
- [ ] Supabase credentials

### 3. Prepare Database
- [ ] Get Supabase connection string
- [ ] Use Transaction Mode pooler URL
- [ ] Test connection locally

### 4. Push Code to GitHub
```bash
git add render.yaml DEPLOYMENT.md
git commit -m "Add Render deployment configuration"
git push origin main
```

---

## Deployment Steps

### Step 1: Create Blueprint
- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Click **New** → **Blueprint**
- [ ] Connect GitHub repository
- [ ] Click **Apply**

### Step 2: Configure Next.js App (`beprepared-nextjs`)

**Database & Auth:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**AI & External Services:**
```
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=AIza...
NEXT_PUBLIC_WEATHERAPI_API_KEY=...
GEMINI_API_KEY=AIza...  # Optional
GOOGLE_CUSTOM_SEARCH_CX=...  # Optional
```

**Stripe:**
```
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/...
```

**Email:**
```
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

**LLM Integration:**
```
LLM_SERVICE_URL=https://llm-service-api.onrender.com
LLM_WEBHOOK_SECRET=[your-generated-secret]
```

**Site:**
```
NEXT_PUBLIC_SITE_URL=https://beprepared.ai
```

### Step 3: Configure LLM Services

**Both `llm-service-api` and `llm-service-worker` need:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:6543/postgres
OPENROUTER_API_KEY=sk-or-v1-...
WEATHERAPI_API_KEY=...
GOOGLE_SERVICES_API_KEY=AIza...
LLM_WEBHOOK_SECRET=[same-secret-as-nextjs]
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

**Note:** `REDIS_URL` is auto-configured by Render

---

## Database Migration

### Step 4: Run Migrations

**Option A: Via Render Shell**
```bash
# In llm-service-api → Shell
cd /app/migrations
psql $DATABASE_URL < 001_create_llm_tables.sql
psql $DATABASE_URL < 002_create_external_api_cache.sql
psql $DATABASE_URL < 003_add_webhook_fields.sql
```

**Option B: From Local Machine**
```bash
cd LLM_service/migrations
psql "your-supabase-url" < 001_create_llm_tables.sql
psql "your-supabase-url" < 002_create_external_api_cache.sql
psql "your-supabase-url" < 003_add_webhook_fields.sql
```

---

## Verification

### Step 5: Check Services

All services should show **Live** or **Available**:
- [ ] `beprepared-nextjs` [Live]
- [ ] `llm-service-api` [Live]
- [ ] `llm-service-worker` [Live]
- [ ] `llm-service-flower` [Live]
- [ ] `llm-service-redis` [Available]

### Step 6: Test Endpoints

**Next.js:**
```bash
curl https://beprepared.ai/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

**LLM API:**
```bash
curl https://llm-service-api.onrender.com/health
# Expected: {"status":"healthy","services":{...}}
```

**Flower Dashboard:**
- Visit: `https://llm-service-flower.onrender.com`
- Check: Active workers visible

### Step 7: Test End-to-End

```bash
# Submit test job
curl -X POST https://llm-service-api.onrender.com/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "input_data": {
      "city": "San Francisco",
      "state": "CA",
      "lat": 37.7749,
      "lng": -122.4194,
      "scenarios": ["earthquake"],
      "family_size": 4,
      "duration": "72_hours",
      "user_tier": "BASIC"
    },
    "webhook_url": "https://beprepared.ai/api/webhooks/llm"
  }'

# Expected: {"job_id":"...","status":"queued"}
```

---

## Post-Deployment

### Final Steps
- [ ] Configure custom domain (Render Dashboard)
- [ ] Update Stripe webhook URL to production
- [ ] Test complete user flow
- [ ] Enable Supabase backups
- [ ] Set up monitoring alerts
- [ ] Document production URLs for team

---

## Quick Troubleshooting

**Service won't start:**
- Check logs in Render Dashboard
- Verify all environment variables set
- Check DATABASE_URL format

**Database connection fails:**
- Use Transaction Mode pooler
- Run IPv4 resolution script if needed
- Check Supabase IP allowlist

**Webhook not working:**
- Verify LLM_WEBHOOK_SECRET matches in both services
- Check webhook endpoint exists
- Review llm_webhook_attempts table

**Build fails:**
- Check build logs for errors
- Verify dependencies install correctly
- Check Docker build for LLM service

---

## Cost Summary

**Monthly Total: ~$28**
- Next.js: $7
- LLM API: $7
- LLM Worker: $7
- Flower: $0 (free)
- Redis: $7
- Supabase: $0 (free tier)

**To reduce costs:**
- Use free tier for testing (no workers)
- Share Redis with Next.js app
- Optimize Celery concurrency

---

## Resources

- **Full Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **LLM Service Guide**: [LLM_service/DEPLOYMENT_GUIDE.md](LLM_service/DEPLOYMENT_GUIDE.md)
- **API Reference**: [LLM_service/API_GUIDE.md](LLM_service/API_GUIDE.md)
- **Render Docs**: [render.com/docs](https://render.com/docs)

---

## Success Indicators

✅ All 5 services running
✅ Health endpoints respond
✅ Database connected
✅ Migrations completed
✅ Test job processes successfully
✅ Webhooks deliver
✅ Flower dashboard accessible

**You're ready for production! 🚀**
