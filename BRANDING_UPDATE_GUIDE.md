# BePrepared Branding Update Guide

## Overview
This guide documents the branding update to display "BePrepared" with "Be" in hot red (#ef4444) across the application.

## Component Created
**File**: `src/components/ui/brand-text.tsx`

### BrandText Component
Inline component for rendering the brand name with consistent styling.

```tsx
import { BrandText } from '@/components/ui/brand-text';

// With domain suffix (.ai)
<BrandText className="text-xl font-bold" withDomain />
// Output: BePrepared.ai (with "Be" in red)

// Without domain suffix
<BrandText className="text-2xl" />
// Output: BePrepared (with "Be" in red)
```

### BrandTextBlock Component
Block-level component (div instead of span).

```tsx
import { BrandTextBlock } from '@/components/ui/brand-text';

<BrandTextBlock className="text-3xl text-center" withDomain />
```

## Completed Updates

### Navigation Components
- [x] `src/components/Navbar.tsx` - Logo and brand text
- [x] `src/components/Footer.tsx` - Logo (line 33) and copyright (line 84)
- [x] `src/components/protected/Sidebar.tsx` - Line 191
- [x] `src/components/protected/SidebarNew.tsx` - Line 204

## Remaining Files to Update

### Authentication Components
**File**: `src/components/auth/UnifiedAuthForm.tsx`
- Line 329: "Taking you to BePrepared Dashboard"
- Line 342: VaporizeTextCycle texts array

**File**: `src/components/Login.tsx`
- Line 250: "Sign in or create your beprepared.ai account"

### Email Templates
**File**: `src/components/plans/share/EmailPreview.tsx`
- Line 44: Email sender name
- Line 109: "Don't have a BePrepared.ai account?"
- Line 122: "BePrepared.ai"
- Line 125: Footer copyright

### Backend Services
**File**: `src/lib/admin-notifications.ts`
- Line 8: Email from address constant

**File**: `src/app/api/webhooks/llm-callback/route.ts`
- Line 8: Email from address constant

### Landing Page Components
**File**: `src/components/landing/FAQSection.tsx`
- Multiple instances in FAQ questions and answers

**File**: `src/components/landing/ProblemSection.tsx`
- Line 17, 100: References to "be prepared"

**File**: `src/components/landing/TrustSignalsSection.tsx`
- Line 95: Testimonial quote

### Page Metadata
Multiple `page.tsx` files with metadata titles:
- `src/app/page.tsx` (lines 12, 24, 27, 31)
- `src/app/about/page.tsx` (line 231)
- `src/app/terms/page.tsx` (multiple instances)
- `src/app/privacy/page.tsx` (multiple instances)
- `src/app/cookies/page.tsx` (multiple instances)
- `src/app/pricing/page.tsx` (lines 222, 248)
- `src/app/(public)/layout.tsx` (line 4)
- `src/app/(protected)/profile/page.tsx` (line 17)

## Brand Style Guide

### Colors
- **"Be"**: `text-red-500` (#ef4444) - Hot Red
- **"Prepared"**: Inherits parent text color (usually `text-foreground`)
- **".ai"**: Inherits parent text color

### Typography
- Always use `font-semibold` or `font-bold` for brand text
- Recommended sizes: `text-xl`, `text-2xl`, `text-3xl`
- Always capitalize as "BePrepared" (never "beprepared", "Be Prepared", or "BEPREPARED")

### Usage Guidelines
1. **Logo with Text**: Use `<BrandText withDomain />` next to logo images
2. **Standalone Branding**: Use `<BrandText />` without domain in body copy
3. **Email/Print**: Use "BePrepared.ai" as plain text (component is for web only)
4. **Metadata**: Use "BePrepared.ai" or "BePrepared" in page titles

## Quick Search Pattern
To find remaining instances to update:

```bash
# Case-insensitive search for all variants
grep -r -i "beprepared\|be prepared" src/ --include="*.tsx" --include="*.ts"

# Exclude node_modules and build artifacts
grep -r -i "beprepared" src/ --include="*.tsx" --exclude-dir=node_modules
```

## Update Checklist
- [ ] Auth components (UnifiedAuthForm, Login)
- [ ] Email preview and templates
- [ ] Backend email sender constants
- [ ] Landing page components (FAQ, Problem, Trust sections)
- [ ] All page metadata (titles and descriptions)
- [ ] Documentation files (update references in ai_docs/)

## Testing
After updates, verify:
1. Light mode: "Be" appears in hot red, "Prepared" in dark text
2. Dark mode: "Be" appears in hot red, "Prepared" in light text
3. Logo and brand text alignment is consistent
4. No console errors or missing component imports
5. Responsive layout (mobile, tablet, desktop)

## Notes
- The `BrandText` component is designed to work with Tailwind CSS
- Color is hardcoded in component (text-red-500) for consistency
- Component uses semantic HTML (`<span>` for inline, `<div>` for block)
- No special configuration needed - import and use
