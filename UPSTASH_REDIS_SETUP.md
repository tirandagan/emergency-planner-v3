# Upstash Redis Setup Guide

**Quick guide to set up free Redis for your LLM microservice**

---

## Why External Redis?

Your monorepo deployment uses:
- **Supabase** for PostgreSQL database (external)
- **Upstash Redis** for Celery message broker (external, free tier available)

This saves ~$7/month compared to using Render's managed Redis.

---

## Step 1: Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com)
2. Sign up with GitHub (easiest) or email
3. Free forever - No credit card required! ✅

---

## Step 2: Create Redis Database

1. Click **Create Database** button
2. Configure:
   - **Name**: `llm-service-redis` (or any name you prefer)
   - **Type**: **Regional** (free tier)
   - **Region**: Choose closest to Oregon (e.g., **US-West-1** or **US-East-1**)
   - **Primary Region**: Leave default
   - **Read Regions**: None (not needed for free tier)
   - **Eviction**: No eviction (default)
   - **TLS**: Enabled (default, recommended)

3. Click **Create**

---

## Step 3: Get Connection String

After creating the database, you'll see the **Connection Details**:

### Copy the Redis URL

Look for the connection string that starts with `redis://` or `rediss://`:

```
rediss://default:[PASSWORD]@[ENDPOINT].upstash.io:6379
```

**Example:**
```
rediss://default:AYxvAAIjcDE5YjJkMDQyMWYwMjQ0Y2E5YjI3NTk3MjBmYmQ3Y2U5MXAxMA@usw1-modern-cicada-12345.upstash.io:6379
```

**Note:**
- `rediss://` (with double 's') means TLS is enabled (secure)
- `redis://` (single 's') means no TLS (less secure but still works)

---

## Step 4: Set REDIS_URL in Render

Now set this URL in **all 3 LLM services** in Render Dashboard:

### Service 1: llm-service-api
1. Go to **llm-service-api** → **Environment**
2. Find or add: `REDIS_URL`
3. Paste your Upstash Redis URL
4. Click **Save Changes**

### Service 2: llm-service-worker
1. Go to **llm-service-worker** → **Environment**
2. Find or add: `REDIS_URL`
3. Paste the **same** Upstash Redis URL
4. Click **Save Changes**

### Service 3: llm-service-flower
1. Go to **llm-service-flower** → **Environment**
2. Find or add: `REDIS_URL`
3. Paste the **same** Upstash Redis URL
4. Click **Save Changes**

**IMPORTANT:** All three services must use the **exact same Redis URL**.

---

## Step 5: Verify Connection

After services redeploy:

### Test LLM API Health
```bash
curl https://llm-service-api.onrender.com/health
```

Expected response with Redis connected:
```json
{
  "status": "healthy",
  "services": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"},  // ✅ Should show healthy
    "celery": {"status": "healthy"}
  }
}
```

### Check Flower Dashboard
Visit: `https://llm-service-flower.onrender.com`

You should see:
- ✅ Active workers
- ✅ Task queue status
- ✅ No connection errors

---

## Upstash Free Tier Limits

**What's Included FREE:**
- **10,000 commands per day**
- **256 MB storage**
- **TLS encryption**
- **Daily backups**
- **No credit card required**

**Sufficient for:**
- Development and testing
- Low-traffic production apps
- Small-scale background job processing

**If you exceed limits:**
- Upgrade to paid plan (starting at $10/month for 100K commands/day)
- Or optimize your Redis usage

---

## Alternative: Redis Labs (Redis Enterprise Cloud)

If you prefer Redis Labs:

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create free account
3. Create database (**30MB free tier**)
4. Copy connection string
5. Use same steps as Upstash above

**Free Tier:**
- 30 MB storage
- 30 connections
- TLS encryption

---

## Troubleshooting

### Issue 1: Connection Refused
**Symptom:** `Error connecting to Redis: Connection refused`

**Solutions:**
- Check REDIS_URL is set in all 3 services
- Verify URL format is correct (starts with `redis://` or `rediss://`)
- Check Upstash database is active (not suspended)

### Issue 2: Authentication Failed
**Symptom:** `Error: invalid password`

**Solutions:**
- Regenerate password in Upstash console
- Copy the new connection string
- Update REDIS_URL in all 3 Render services

### Issue 3: TLS Error
**Symptom:** `SSL/TLS handshake failed`

**Solutions:**
- Make sure you're using `rediss://` (with double 's') for TLS
- Or switch to `redis://` (single 's') if TLS is causing issues
- Check your Redis client supports TLS

### Issue 4: Slow Performance
**Symptom:** Tasks are slow or timing out

**Solutions:**
- Choose Upstash region closer to your Render services (Oregon)
- Check you haven't exceeded free tier limits (10K commands/day)
- Monitor Upstash dashboard for throttling
- Consider upgrading to paid tier

---

## Monitoring Redis Usage

### Upstash Dashboard

View in Upstash Console:
- **Daily Commands**: Track usage against 10K limit
- **Storage Used**: Track against 256 MB limit
- **Request Latency**: Monitor performance
- **Active Connections**: See connected clients

### Flower Dashboard

Visit `https://llm-service-flower.onrender.com`:
- **Active Tasks**: See tasks in queue
- **Task History**: View completed tasks
- **Worker Status**: Monitor worker health

---

## Cost Comparison

| Service | Render Managed | External (Upstash) |
|---------|----------------|-------------------|
| **Redis** | $7/month | **$0/month** (free tier) |
| **Features** | Basic | TLS, backups, monitoring |
| **Limits** | Unlimited | 10K commands/day |

**Savings:** $7/month using Upstash free tier

---

## Security Best Practices

### 1. Use TLS
- Always use `rediss://` (double 's') for encrypted connections
- Protects your data in transit

### 2. Rotate Passwords
- Regenerate Redis password every 90 days
- Update in all Render services

### 3. Monitor Access
- Check Upstash logs for unauthorized access attempts
- Enable IP allowlist if Upstash supports it

### 4. Backup Data
- Upstash provides daily backups (free tier)
- Download backups periodically for critical data

---

## Next Steps

After setting up Redis:

1. ✅ Set REDIS_URL in all 3 Render services
2. ✅ Wait for services to redeploy
3. ✅ Test health endpoint
4. ✅ Check Flower dashboard
5. ✅ Submit a test job to verify end-to-end flow

**You're ready to deploy! 🚀**

---

## Support

- **Upstash Docs**: [upstash.com/docs](https://upstash.com/docs)
- **Upstash Discord**: [upstash.com/discord](https://upstash.com/discord)
- **Issue Tracking**: Check service logs in Render Dashboard
