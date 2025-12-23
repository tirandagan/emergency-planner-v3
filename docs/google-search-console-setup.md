# Google Search Console Setup Guide

## Overview

This guide explains how to submit your sitemap to Google Search Console for optimal SEO indexing of beprepared.ai.

## Sitemap Implementation

The site uses Next.js 15's native sitemap generation:

- **Sitemap URL**: `https://beprepared.ai/sitemap.xml`
- **Robots.txt URL**: `https://beprepared.ai/robots.txt`

### Public URLs Included in Sitemap

| URL | Priority | Change Frequency | Purpose |
|-----|----------|------------------|---------|
| `/` | 1.0 | Weekly | Homepage - highest priority |
| `/pricing` | 0.9 | Weekly | Pricing page - high conversion |
| `/about` | 0.8 | Monthly | About page |
| `/consulting` | 0.8 | Weekly | Consulting services |
| `/store` | 0.7 | Daily | Product catalog |
| `/terms` | 0.3 | Yearly | Legal - terms of service |
| `/privacy` | 0.3 | Yearly | Legal - privacy policy |
| `/cookies` | 0.3 | Yearly | Legal - cookie policy |

### Protected URLs Excluded from Indexing

The following routes are blocked via `robots.txt` to protect user privacy and prevent indexing of app functionality:

- `/api/*` - API endpoints
- `/dashboard/*` - User dashboard
- `/admin/*` - Admin panel
- `/plans/*` - User emergency plans
- `/profile/*` - User profiles
- `/inventory/*` - User inventory
- `/bundles/*` - User kit bundles
- `/skills/*` - User skills
- `/expert-calls/*` - Expert consultation bookings
- `/readiness/*` - Readiness assessment
- `/auth/*` - Authentication pages (except login/signup)
- `/_next/*` - Next.js internal assets
- `/wizard-test` - Development test page

## Google Search Console Setup

### Step 1: Verify Domain Ownership

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Choose "Domain" property type
4. Enter: `beprepared.ai`
5. Verify ownership using one of these methods:
   - **DNS TXT Record** (Recommended for domain-level tracking)
   - **HTML File Upload** (Alternative method)
   - **HTML Tag** (Add meta tag to `src/app/layout.tsx`)

#### DNS TXT Record Method (Recommended)

1. Copy the TXT record value from Google Search Console
2. Add TXT record to your DNS provider (e.g., Cloudflare, Namecheap):
   ```
   Type: TXT
   Name: @
   Value: google-site-verification=XXXXXXXXXXXXX
   TTL: Auto
   ```
3. Wait for DNS propagation (can take up to 48 hours, usually 5-30 minutes)
4. Click "Verify" in Google Search Console

#### HTML Meta Tag Method (Alternative)

1. Copy the verification meta tag from Google Search Console
2. Add to `src/app/layout.tsx` in the `<head>` section:
   ```tsx
   export const metadata: Metadata = {
     // ... existing metadata
     verification: {
       google: 'your-verification-code-here',
     },
   };
   ```
3. Deploy the changes
4. Click "Verify" in Google Search Console

### Step 2: Submit Sitemap

After domain verification:

1. In Google Search Console, navigate to **Sitemaps** (left sidebar)
2. Enter sitemap URL: `sitemap.xml`
3. Click "Submit"
4. Google will begin crawling and indexing your pages

### Step 3: Verify Sitemap Processing

1. Wait 24-48 hours for initial crawl
2. Check **Sitemaps** section for:
   - ✅ Status: "Success"
   - 📊 URLs Discovered: Should show 8 URLs
   - 🔍 Coverage: Check "Page Indexing" report

### Step 4: Monitor Indexing Status

1. Navigate to **Pages** (under "Indexing" in left sidebar)
2. Check indexed vs. non-indexed pages
3. Review any errors or warnings
4. Use **URL Inspection Tool** to test specific pages

## Sitemap Update Frequency

The sitemap automatically updates with current timestamps on each request. Google typically re-crawls sitemaps:

- **High priority pages** (priority 1.0, 0.9): Every 1-7 days
- **Medium priority pages** (priority 0.7, 0.8): Every 7-30 days
- **Low priority pages** (priority 0.3): Every 30-90 days

## Troubleshooting

### Sitemap Not Found (404 Error)

1. Verify production build includes sitemap:
   ```bash
   npm run build
   curl https://beprepared.ai/sitemap.xml
   ```
2. Check `NEXT_PUBLIC_SITE_URL` environment variable is set correctly in production
3. Verify deployment succeeded without errors

### URLs Not Indexed

1. Use **URL Inspection Tool** in Search Console to diagnose specific pages
2. Check for:
   - **Robots.txt blocking**: Verify URL not in disallow list
   - **Canonical issues**: Ensure no duplicate content
   - **Server errors**: Check 404, 500 status codes
   - **Mobile usability**: Test responsive design
3. Request indexing manually via "Request Indexing" button

### Low Priority Pages Not Crawled

- Normal behavior - Google prioritizes based on site authority and page importance
- Takes 1-3 months for new sites to build crawl budget
- Focus on content quality and backlinks to improve crawl rate

## Additional SEO Resources

- **Google Search Console Help**: https://support.google.com/webmasters
- **Sitemap Protocol**: https://www.sitemaps.org/protocol.html
- **Next.js Metadata Docs**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata

## File Locations

- Sitemap generator: [src/app/sitemap.ts](../src/app/sitemap.ts)
- Robots.txt generator: [src/app/robots.ts](../src/app/robots.ts)
- Root layout (for meta tags): [src/app/layout.tsx](../src/app/layout.tsx)

## Production Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_SITE_URL=https://beprepared.ai` in production environment
- [ ] Verify sitemap.xml loads correctly: `https://beprepared.ai/sitemap.xml`
- [ ] Verify robots.txt loads correctly: `https://beprepared.ai/robots.txt`
- [ ] Confirm no 404s on public pages
- [ ] Test mobile responsiveness of all public pages
- [ ] Verify SSL certificate is valid
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor indexing status for 1-2 weeks
