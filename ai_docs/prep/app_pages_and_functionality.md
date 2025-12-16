# App Pages & Functionality Blueprint

## App Summary

**End Goal:** Build complete disaster readiness plans (from 72-hour survival to multi-year sustainability) within minutes using AI that generates location-specific survival strategies with calculated supply quantities, barter-economy trade goods, critical skill gaps, and budget-optimized product recommendations.

**Core Value Proposition:** Transform 40-60 hours of fragmented research into actionable survival plans within minutes, eliminating decision paralysis through AI-powered preparedness guidance.

**Target Users:**

- **Tier 1:** Novice preppers (overwhelmed, seeking guidance) - Annual spend $200-1,500
- **Tier 2:** Serious preppers (validating strategy, filling gaps) - Annual spend $1,500-10,000
- **Tier 3:** High-value preppers (major investments, premium features) - Potential spend $10,000-50,000+
- **Store Administrators:** Platform owners managing bundles, vendors, users, and marketplace

**Template Type:** RAG-SaaS (AI generation with semantic search/matching)

**Business Model:** Freemium subscription (Free, Basic $9.99/mo, Pro $49.99/mo) + Amazon affiliate revenue (Phase 1) → Dropship marketplace (Phase 2)

---

## 🌐 Universal SaaS Foundation

### Public Marketing Pages

**Landing Page** — `/`

**Hero Section** (Frontend)

- Display headline: "Build Complete Disaster Readiness Plans in Minutes, Not Months"
- Show subheadline: "AI-powered survival plans with curated bundles for your location, family size, and budget"
- Render hero CTA button: "Start Your Free Plan" → `/auth/sign-up` (Frontend)
- Display trust signals: User count, plans generated, readiness score improvements (Backend → fetch platform stats)
- Show hero image: Family with emergency supplies (`collaboration-planning.png`)

**Problem Statement Section** (Frontend)

- Highlight pain points: 40-60 hours research, $200-500 wasted, 72% lack complete kits
- Show visual comparison: "Before" (overwhelmed by fragmented info) vs "After" (clear actionable plan)

**How It Works Section** (Frontend)

- Display 4-step process with icons:
  1. Answer simple questions (scenarios, family, location)
  2. AI generates personalized survival plan
  3. Get curated bundle recommendations
  4. Track readiness and improve over time
- Show screenshot/mockup of plan generator interface

**Features by Tier Section** (Frontend)

- Render 3-column comparison table: Free vs Basic vs Pro
- Highlight key differentiators: Free (1 saved plan), Basic (unlimited + sharing), Pro (expert access + networks)
- Show upgrade value props: "Save unlimited plans for $9.99/mo" (Basic), "Monthly expert calls included" (Pro)

**Pricing Section** (Frontend)

- Display pricing cards: Free ($0), Basic ($9.99/mo or $99/yr), Pro ($49.99/mo or $499/yr)
- Show annual savings badge: "Save 17% with annual billing"
- Render feature bullets per tier
- Include CTA buttons: "Start Free" → `/auth/sign-up`

**Trust Signals Section** (Frontend)

- Display testimonials (placeholder for Phase 2 real testimonials)
- Show security badges: Secure checkout, data privacy, GDPR compliant
- Render press mentions (when available)

**FAQ Section** (Frontend)

- Display accordion-style Q&A:
  - "How does AI plan generation work?"
  - "What scenarios are covered?"
  - "Can I share plans with family?"
  - "What if I'm already partially prepared?"
  - "How do bundle recommendations work?"
- Expand/collapse functionality (Frontend state management)

**Final CTA Section** (Frontend)

- Show headline: "Start Your Family's Preparedness Journey Today"
- Render prominent CTA: "Create Your Free Plan" → `/auth/sign-up`

---

**Legal Pages** — `/privacy`, `/terms`, `/cookies`

- Privacy policy (GDPR compliance, data handling, cookies)
- Terms of service (legal requirements, liability limitations, subscription terms)
- Cookie policy (GDPR compliance, tracking disclosure)
- Standard legal content with Trust Blue theme styling
- Footer links on all public pages

---

### Authentication Flow (Unified System with OTP Security)

**Unified Authentication** (`/auth`) — (Frontend + Backend)

**Step 1: Initial Entry**
- Single entry point for both new and existing users (Frontend)
- Render email/password input fields (Frontend)
- Single "Continue" button that intelligently routes users (Frontend)
- Show OAuth options: Google, Facebook (Phase 2) (Frontend + Backend OAuth flow)
- Display "Forgot password?" link → `/auth/forgot-password` (Frontend)
- Apply Trust Blue theme to buttons and focus states (Frontend)

**Step 2: User Detection & Routing** (Backend)
- Check if user exists in Supabase Auth (Backend)
- If **user doesn't exist** → Show signup form (Frontend)
- If **user exists** → Validate password → Check OTP requirement (Backend)

**Step 3a: New User Signup Flow** (Frontend + Backend)
- Display simplified signup form with email pre-filled (Frontend)
- Confirm password field (Frontend)
- Terms & Privacy Policy acceptance with scroll-to-accept modals (Frontend)
  - User must scroll to bottom of each policy before "Accept" button enables
  - User must accept both policies before checkbox can be checked
  - Attempting to check without reading shows warning modal
- Handle submission → create Supabase user account → send OTP verification email (Backend)
- Set default profile fields: `subscriptionTier = 'FREE'`, `loginCount = 0`, `passwordLoginsSinceOtp = 0` (Backend)
- Redirect to OTP verification modal (Frontend)

**Step 3b: Existing User Login with OTP Security** (Backend)
- Validate password credentials via Supabase Auth (Backend)
- Check `passwordLoginsSinceOtp` counter in user profile (Backend)
- If `passwordLoginsSinceOtp >= 10`:
  - Generate and send OTP via Supabase (Backend)
  - Show OTP verification modal (Frontend)
  - User must enter 6-digit code OR use password fallback option (Frontend)
- If `passwordLoginsSinceOtp < 10`:
  - Increment `passwordLoginsSinceOtp` counter (Backend)
  - Increment `loginCount` (Backend)
  - Update `lastLoginAt` timestamp (Backend)
  - Create session and redirect to `/dashboard` (Backend)

**OTP Verification Modal** (Frontend + Backend)
- Display 6-digit code entry with auto-focus and formatting (Frontend)
- Show countdown timer for OTP expiration (60 minutes) (Frontend)
- "Resend OTP" button with rate limiting (3 per 15 minutes) (Frontend + Backend)
- "Use password instead" fallback option (Frontend)
  - Allows password login without resetting OTP counter
  - Increments `passwordLoginsSinceOtp` normally (Backend)
- On successful OTP verification:
  - Reset `passwordLoginsSinceOtp = 0` (Backend)
  - Update `lastOtpAt = NOW()` (Backend)
  - Increment `loginCount` (Backend)
  - Create session and redirect to `/dashboard` (Backend)

**Security Features:**
- OTP required every 10 password logins for enhanced account security
- Password fallback available if OTP email not received
- Rate limiting on OTP generation (3 attempts per 15 minutes)
- Generic error messages prevent email enumeration
- All login attempts logged in `user_activity_log`

**Forgot Password** (`/auth/forgot-password`) — (Frontend + Backend)

- Render email input field (Frontend)
- Handle submission → generate password reset token → send reset email (Backend)
- Show success message: "Check your email for reset link" (Frontend)
- Queue password reset email (Background Job)

**Legacy Routes** (Backward Compatibility)
- `/auth/login` and `/auth/sign-up` redirect to unified `/auth` page
- Existing bookmarks and links continue to work

---

## ⚡ Core Application Pages (User-Facing)

### Mission Dashboard (`/dashboard` - Homepage for authenticated users)

**Header Section** (Frontend + Backend)

- Display welcome message: "Welcome back, [User Name]" (Backend → fetch user data)
- Show overall readiness score badge: Large circular progress (0-100) with Trust Blue fill (Frontend + Backend)
- Render "Create New Plan" hero CTA button (Frontend)

**Saved Plans Grid** (Frontend + Backend)

- Fetch all mission reports for current user (Backend query)
- Display plan cards in responsive grid (1 col mobile, 2 col tablet, 3 col desktop, 4 col wide)
- Show per card:
  - Plan name/title (editable inline)
  - Scenario badges (colored pills for Natural Disaster, EMP, etc.)
  - Readiness score (small circular progress)
  - Last updated timestamp
  - Quick actions: View, Edit, Delete, Share (tier-gated)
- Render empty state for new users: "Create your first plan to get started" (Frontend)

**Free Tier Save Limit** (Frontend + Backend)

- Show plan count badge: "1/1 Plans Saved" when at limit (Frontend)
- Display upgrade prompt modal when attempting to save 2nd plan: "Upgrade to Basic to save unlimited plans" (Frontend)
- Track save attempts and enforce limit (Backend)

**Plan Card Actions** (Frontend + Backend)

- **View:** Navigate to `/plans/[planId]` (Frontend routing)
- **Edit:** Navigate to `/plans/[planId]/edit` (Frontend routing)
- **Delete:** Show confirmation modal → delete plan from database → refresh grid (Frontend + Backend)
- **Share (Basic+):** Open share modal with email/link options → generate shareable link → send invites (Frontend + Backend)
- **Share (Free):** Show upgrade prompt: "Upgrade to Basic to share with 5 people" (Frontend)

**Readiness Summary Widget** (Frontend + Backend)

- Fetch aggregated readiness data across all plans (Backend)
- Display scenario breakdown: Visual bars showing readiness per scenario (Frontend)
- Show top gaps: "3 critical items missing from water supply" (Frontend + Backend analysis)
- Render "Improve Readiness" CTA → `/readiness` (Frontend)

---

### Plan Generator (`/plans/new` - Multi-step wizard)

**Step 1: Scenario Selection** (Frontend)

- Display all 6 scenarios as selectable cards with icons:
  - Natural Disaster (hurricane, earthquake, flood)
  - EMP/Grid Down
  - Pandemic
  - Nuclear Event
  - Civil Unrest
  - Multi-Year Sustainability
- Allow multiple scenario selection (checkboxes, Trust Blue when selected) (Frontend)
- Show scenario descriptions on hover/tap (Frontend)
- Validate at least 1 scenario selected (Frontend)
- Render "Next Step" button → Step 2 (Frontend)

**Step 2: Personnel Configuration** (Frontend)

- Display "Add Family Member" button (Frontend)
- Show form fields per person:
  - Name (optional, defaults to "Person 1")
  - Age (dropdown or number input)
  - Gender (dropdown: Male, Female, Prefer not to say)
  - Medical conditions (multi-select: Diabetes, Heart condition, Mobility issues, Allergies, None)
  - Special needs (text area for details)
- Allow add/remove family members dynamically (Frontend)
- Show visual count: "Planning for 4 people" (Frontend)
- Validate at least 1 person configured (Frontend)
- Render "Next Step" button → Step 3 (Frontend)

**Step 3: Location & Context** (Frontend + Backend)

- Render location input with autocomplete (Google Places API) (Frontend + Backend)
- Show detected location button: "Use Current Location" (Frontend geolocation API)
- Display location-specific context questions:
  - Home type (House, Apartment, Rural property)
  - Climate zone (auto-detected from location, editable)
  - Existing preparedness level (None, Basic 72-hr kit, Intermediate, Advanced)
  - Budget tier (Tight budget, Moderate, Premium - no shame)
- Validate location entered (Frontend)
- Render "Generate Plan" button → Step 4 (Frontend)

**Step 4: AI Generation Progress** (Frontend + Backend + Background Job)

- Show loading animation with Trust Blue accent (Frontend)
- Display progress messages:
  - "Analyzing your scenarios..."
  - "Calculating supply quantities for 4 people..."
  - "Generating location-specific strategies..."
  - "Matching bundles to your needs..."
- Trigger AI generation job (Backend → Gemini API)
  - Generate survival plan narrative
  - Calculate supply items with quantities
  - Perform semantic matching for bundles (Backend → vector search)
  - Calculate readiness score
  - Generate evacuation routes
  - Create simulation logs
  - Fetch skills training resources
- Poll for completion status (Frontend → Backend API)
- On completion: Save mission report to database → redirect to `/plans/[newPlanId]` (Backend + Frontend)

---

### Plan Details (`/plans/[planId]`)

**Plan Overview Section** (Frontend + Backend)

- Fetch mission report data (Backend query)
- Display plan name (editable inline) (Frontend + Backend update)
- Show scenario badges (colored pills) (Frontend)
- Render readiness score: Large circular progress with Trust Blue (Frontend)
- Display last updated timestamp (Frontend)
- Show action buttons: Edit, Share, Delete, Download PDF (Phase 2) (Frontend)

**Quick Stats Cards** (Frontend + Backend)

- Display metric cards (4 cards responsive grid):
  - Total items needed (count)
  - Total estimated cost (sum)
  - Items owned (count from inventory)
  - Days of supplies (calculated based on items)
- Use Trust Blue accents for icons (Frontend)

**Recommended Bundles Section** (Frontend + Backend)

- Fetch AI-recommended bundles for this plan's scenarios (Backend → bundle matching algorithm)
- Display "Top Bundles for Your Plan" heading (Frontend)
- Render bundle cards in grid (3-5 bundles):
  - Bundle image
  - Bundle name
  - Price
  - Item count
  - Scenario match badges
  - Star rating (future: user ratings)
  - "View Details" button → `/bundles/[bundleId]` (Frontend)
- Show "See All Bundles" link → `/bundles?planId=[planId]` (Frontend)

**Tabs Navigation** (Frontend)

- Render tab bar: Overview (active) | Map & Routes | Simulation | Skills | Contacts (Frontend)
- Switch active tab on click (Frontend state)

**Tab: Overview (Active by Default)** (Frontend)

- Display AI-generated survival plan narrative (formatted text with headings) (Frontend)
- Show critical priorities list (bullet points with Trust Blue checkmarks) (Frontend)
- Render "Next Steps" action items (Frontend)

**Tab: Map & Routes** (Frontend + Backend)

- Render interactive map (Google Maps or Mapbox) (Frontend)
- Display recommended evacuation routes (Backend → generated waypoints)
- Show waypoints with descriptions (Frontend markers)
- Allow custom waypoint editing (Pro tier): Add/edit/delete waypoints (Frontend + Backend)
- Show custom waypoint upgrade prompt for Free/Basic tiers (Frontend)

**Tab: Simulation** (Frontend + Backend)

- Fetch day-by-day simulation logs (Backend query)
- Display timeline view with expandable days (Frontend)
- Show per day:
  - Day number and title (e.g., "Day 1: Immediate Response")
  - Narrative description
  - Key actions required
  - Supplies used
  - Skills needed (highlighted)
- Render as scrollable timeline with Trust Blue accents (Frontend)

**Tab: Skills** (Frontend + Backend)

- Fetch skills training resources (Backend query → YouTube API, curated articles)
- Display skills organized by category:
  - First Aid & Medical
  - Water Purification
  - Shelter Building
  - Food Preparation
  - Communication
  - Self-Defense
  - Fire Starting
- Show per resource:
  - Title
  - Type icon (Video, Article, PDF)
  - Duration/length
  - Difficulty level
  - "View Resource" button (opens in modal or new tab)
- Render as filterable grid (Frontend)

**Tab: Contacts (Phase 1 Enhancement)** (Frontend + Backend)

- Display "Emergency Contact Protocol" form (Frontend)
- Show input fields:
  - Primary contacts (name, phone, relationship)
  - Out-of-state coordinator (FEMA recommendation)
  - Meeting locations (primary, secondary)
  - Communication schedule
- Save contacts to mission report (Backend update)
- Render saved contacts as editable list (Frontend + Backend)

---

### Bundle Browse & Recommendations (`/bundles`)

**Filter Sidebar** (Frontend + Backend)

- Display filter options (collapsed on mobile, persistent on desktop):
  - Scenarios (checkboxes for 6 scenarios)
  - Budget Tier (Tight, Moderate, Premium)
  - Duration (72-hour, 1-week, 1-month, Multi-year)
  - Family Size (1-2, 3-4, 5+)
  - Use Case (Bug-out, Shelter-in-place, Vehicle kit)
- Apply filters → re-fetch bundles (Backend query with filters)
- Show active filter count badge (Frontend)
- Render "Clear All Filters" button (Frontend)

**Bundle Grid** (Frontend + Backend)

- Fetch bundles based on active filters or plan context (Backend → AI matching algorithm)
- Display bundle cards in responsive grid (1 col mobile, 2 col tablet, 3 col desktop, 4 col wide):
  - Bundle image
  - Bundle name
  - Price (large, prominent)
  - Original price (if discounted, strikethrough)
  - Item count
  - Scenario badges
  - Use case tags
  - Star rating (Phase 2: user reviews)
  - "View Details" button → `/bundles/[bundleId]` (Frontend)
- Show sort options dropdown: Relevance, Price (low-high), Price (high-low), Most Items (Frontend + Backend)
- Render pagination controls (Frontend + Backend)

**Empty State** (Frontend)

- Display when no bundles match filters: "No bundles found. Try adjusting your filters." (Frontend)
- Show "View All Bundles" button to reset filters (Frontend)

---

### Bundle Details (`/bundles/[bundleId]`)

**Bundle Hero Section** (Frontend + Backend)

- Fetch bundle data with master items and default products (Backend query)
- Display bundle image gallery (main image + thumbnails) (Frontend)
- Show bundle name (large heading) (Frontend)
- Render price (prominent, Trust Blue accent) (Frontend)
- Display scenario badges and use case tags (Frontend)
- Show item count: "Contains 24 essential items" (Frontend)
- Render action buttons:
  - "Customize This Bundle" → customization mode (Frontend)
  - "Mark as Purchased" → update inventory (Frontend + Backend)
  - "Add to Wishlist" → save for later (Frontend + Backend)

**Bundle Description** (Frontend)

- Display admin-curated description (formatted text) (Frontend)
- Show "Why This Bundle" section explaining rationale (Frontend)
- Render "Best For" scenarios/use cases (Frontend)

**Master Items List** (Frontend + Backend)

- Display all master items in bundle as expandable cards:
  - Master item name (e.g., "Water Filter")
  - Quantity needed (e.g., "2 filters")
  - Category (e.g., "Water Supply")
  - Default product:
    - Product image
    - Product name
    - Price
    - Amazon affiliate link (Phase 1)
  - Customization indicator: Locked, Swappable, Removable (based on admin rules)
- Show total price calculation at bottom (Frontend → sum of all items)
- Render sticky total bar on scroll (Frontend)

**Customization Mode** (Frontend + Backend)

- Enter customization interface (toggle state) (Frontend)
- Show editable items with actions:
  - **Locked items:** Display lock icon, no actions available (Frontend)
  - **Swappable items:** Show "Swap" button → modal with alternative products (Frontend)
    - Fetch alternative products for master item (Backend query)
    - Display alternatives with prices, images, ratings
    - Select alternative → update bundle selection → recalculate price (Frontend + Backend)
  - **Removable items:** Show "Remove" button → remove from bundle → recalculate price (Frontend)
- Display real-time price updates as user customizes (Frontend)
- Show savings/increase badge: "You saved $45 with your customizations" (Frontend)
- Render "Save Customizations" button → update mission report with bundle selections (Backend)

**Purchase Tracking** (Frontend + Backend)

- Show purchase status options: Not Purchased, In Cart, Purchased, Wishlist (Frontend)
- Allow status change via dropdown or buttons (Frontend + Backend update)
- Update inventory when marked "Purchased" (Backend → create inventory entries)
- Recalculate readiness score when items purchased (Backend)
- Show purchase date when marked "Purchased" (Frontend + Backend)

---

### Inventory Tracker (`/inventory`)

**Inventory Summary Cards** (Frontend + Backend)

- Fetch user inventory data across all plans (Backend query)
- Display metric cards (responsive grid):
  - Total items needed (count)
  - Items owned (count + percentage)
  - Estimated remaining cost (sum of unpurchased items)
  - Readiness improvement: "+15 points from last month" (Basic+ only) (Frontend + Backend)
- Use Trust Blue accents and progress rings (Frontend)

**Inventory by Category** (Frontend + Backend)

- Display categories as expandable sections (accordion):
  - Water Supply
  - Food Storage
  - Shelter & Warmth
  - First Aid & Medical
  - Tools & Equipment
  - Communication
  - Sanitation
  - Security & Defense
  - Barter & Trade Goods (Phase 1 feature)
- Show per category:
  - Item count: "8 of 12 items owned"
  - Visual progress bar (Trust Blue fill)
  - Percentage complete
- Expand category → show items list (Frontend)

**Item List (Per Category)** (Frontend + Backend)

- Display items as cards or table rows:
  - Master item name
  - Quantity needed
  - Quantity owned (editable inline)
  - Status: Owned, Needed, Ordered, Partial
  - Purchase date (if owned)
  - Estimated price
  - Product link (to Amazon or bundle detail)
  - Actions: Mark as Owned, Remove, Edit Quantity
- Allow bulk actions: Mark multiple as owned, export to shopping list (Frontend + Backend)
- Show filter/search: Filter by status, search by item name (Frontend + Backend)

**Spending Tracker (Basic+ Only)** (Frontend + Backend)

- Fetch historical inventory changes (Backend query)
- Display spending over time chart (line graph with Trust Blue) (Frontend)
- Show spending by category (pie chart) (Frontend)
- Render total spent badge: "$1,245 invested in preparedness" (Frontend)
- Show upgrade prompt for Free tier: "Track spending history with Basic ($9.99/mo)" (Frontend)

**Expiration Tracking (Phase 2 - Pro Only)** (Frontend + Backend)

- Display items with expiration dates: MREs, batteries, medications (Frontend)
- Show expiration warnings: "2 items expiring in next 30 days" (Frontend + Backend)
- Render calendar view of expirations (Frontend)
- Send expiration reminder emails (Background Job)

---

### Readiness Dashboard (`/readiness`)

**Overall Readiness Score** (Frontend + Backend)

- Fetch current readiness score (Backend calculation)
- Display large circular progress (0-100) with Trust Blue fill (Frontend)
- Show trend: "+8 points since last month" with up arrow (Frontend + Backend)
- Render score interpretation: "You're moderately prepared" (Frontend)

**Granular Readiness by Scenario** (Frontend + Backend)

- Fetch readiness breakdown per scenario (Backend calculation)
- Display scenario cards in grid (2 col mobile, 3 col tablet/desktop):
  - Scenario name
  - Circular progress (0-100)
  - Status badge: Critical, Moderate, Good, Excellent (colored)
  - Top gaps: "Missing water purification" (bullet list)
  - "Improve" button → recommendations modal (Frontend)
- Use color coding: Red (<50), Yellow (50-74), Green (75-89), Trust Blue (90-100) (Frontend)

**Readiness Components Breakdown** (Frontend + Backend)

- Display component categories with scores:
  - Supplies & Equipment (weighted by scenario priorities)
  - Skills & Knowledge (based on training resources accessed)
  - Planning & Documentation (mission reports saved, contacts added)
  - Network & Support (sharing enabled, contacts added)
- Show per component:
  - Score out of 100
  - Progress bar (Trust Blue)
  - Missing items count
  - "Take Action" button → specific page (supplies → inventory, skills → training)
- Render as expandable cards (Frontend)

**Actionable Next Steps** (Frontend + Backend)

- Fetch AI-generated recommendations to improve readiness (Backend analysis)
- Display prioritized action items (max 5-7):
  - Action description: "Add 2 water filters to reach 2-week supply"
  - Impact: "+12 points to readiness score"
  - Effort: Low, Medium, High
  - Recommended bundles or items to purchase
  - "Complete" button (Frontend + Backend)
- Order by impact vs effort (quick wins first) (Frontend)
- Show Trust Blue checkmarks for completed actions (Frontend)

**Readiness Analytics (Basic+ Only)** (Frontend + Backend)

- Fetch historical readiness data (Backend query)
- Display readiness over time chart (line graph with Trust Blue) (Frontend)
- Show milestone timeline: "First plan created", "50% readiness achieved" (Frontend)
- Render category trends: Which categories improved most (Frontend)
- Show upgrade prompt for Free tier: "Track progress over time with Basic" (Frontend)

---

### Maps & Routes (`/maps` or within `/plans/[planId]` tab)

**Interactive Map** (Frontend + Backend)

- Render map centered on user's location (Frontend → Google Maps / Mapbox)
- Display recommended evacuation routes (Backend → generated from AI plan)
- Show waypoints with markers:
  - Start point (home)
  - Safe destinations
  - Resource locations (water sources, hospitals, supply stores)
  - Hazard zones (flood plains, high-crime areas)
- Allow zoom, pan, satellite view toggle (Frontend)

**Route Details Panel** (Frontend + Backend)

- Display route information:
  - Route name: "Primary Evacuation Route"
  - Distance and estimated travel time
  - Mode: Driving, Walking, Biking
  - Waypoint list (ordered)
  - Special instructions per waypoint
- Show "Print Route" button → printable PDF (Phase 2) (Frontend + Backend)

**Custom Waypoints (Pro Tier)** (Frontend + Backend)

- Allow adding custom waypoints: Click map → add marker → enter details (Frontend + Backend)
- Enable editing existing waypoints: Drag to reposition, edit details (Frontend + Backend)
- Allow deleting waypoints (Frontend + Backend)
- Save custom routes to mission report (Backend)
- Show upgrade prompt for Free/Basic tiers: "Customize routes with Pro" (Frontend)

**Offline Map Download (Phase 2 - Pro Tier)** (Frontend + Background Job)

- Show "Download for Offline Use" button (Frontend)
- Generate map tiles and route data (Background Job)
- Save to PWA cache for offline access (Frontend service worker)

---

### Survival Simulation (`/simulation` or within `/plans/[planId]` tab)

**Timeline View** (Frontend + Backend)

- Fetch simulation logs (Backend query → AI-generated)
- Display day-by-day timeline (vertical scrollable):
  - Day number (large, Trust Blue)
  - Day title: "Day 1: Immediate Response"
  - Narrative description (formatted text)
  - Key actions required (bullet list)
  - Supplies used (item list with quantities)
  - Skills needed (highlighted with badges)
  - Challenges faced (potential problems)
  - Success conditions (what good looks like)
- Expand/collapse days (accordion style) (Frontend)
- Use Trust Blue progress line connecting days (Frontend)

**Simulation Controls** (Frontend)

- Show "Restart Simulation" button (reload data) (Frontend)
- Render "Take Notes" text area per day (Frontend + Backend save)
- Display "Share Simulation" button (Basic+ only) (Frontend)

**Interactive Simulation (Phase 3)** (Frontend + Backend + AI)

- Display decision points: "Day 3: Do you evacuate or shelter in place?"
- Show choices as buttons (Frontend)
- Process choice → generate branching outcomes (Backend → Gemini API)
- Update simulation narrative based on choices (Frontend + Backend)
- Track simulation history per user (Backend)

---

### Skills Training (`/skills`)

**Skills Overview** (Frontend + Backend)

- Display skill assessment summary:
  - Total skills in library (count)
  - Skills you've started (count from user progress)
  - Completion percentage
  - Recommended priority skills (AI-suggested based on plan)
- Use Trust Blue accents for progress indicators (Frontend)

**Skills by Category** (Frontend + Backend)

- Fetch skills training resources (Backend query)
- Display category sections (expandable):
  - First Aid & Medical
  - Water Purification & Storage
  - Shelter Building
  - Food Preparation & Preservation
  - Communication (HAM radio, signals)
  - Fire Starting & Maintenance
  - Navigation & Wayfinding
  - Self-Defense & Security
  - Bartering & Trade
  - Psychological Resilience
- Show per category:
  - Skill count
  - Your progress (percentage)
  - Priority badge (Critical, Recommended, Optional)

**Resource Cards** (Frontend + Backend)

- Display resources as cards in grid (1 col mobile, 2 col tablet, 3 col desktop):
  - Resource type icon (Video, Article, PDF)
  - Title
  - Description (truncated)
  - Duration/length
  - Difficulty level (Beginner, Intermediate, Advanced)
  - Source (YouTube, blog, official guide)
  - "View Resource" button (Frontend)
  - Bookmark icon to save favorites (Frontend + Backend)
- Show progress indicator for videos: "Watched 45%" (Frontend + Backend tracking)

**Resource Detail Modal/Page** (Frontend + Backend)

- Display resource content:
  - **Video:** Embedded YouTube player (Frontend)
  - **Article:** External link with preview (Frontend)
  - **PDF:** Embedded PDF viewer or download link (Frontend)
- Show related resources: "You might also like..." (Frontend + Backend)
- Allow marking complete (Frontend + Backend → update user progress)
- Enable note-taking: "My notes on this skill" (Frontend + Backend save)

**Search & Filter** (Frontend + Backend)

- Provide search bar: Search by skill name or keyword (Frontend + Backend query)
- Show filters: Category, Type, Difficulty, Priority (Frontend + Backend)
- Display search results with relevance sorting (Frontend + Backend)

---

### Expert Calls (`/expert-calls`)

**Upcoming Calls Section** (Frontend + Backend)

- Fetch scheduled calls for user's tier (Backend query)
- Display call cards (upcoming calls first):
  - Call type: Founder Group Call, Expert Call (Pro), 1-on-1 Call (Pro)
  - Date and time (with timezone)
  - Expert name and photo (if applicable)
  - Topic/agenda
  - Zoom link (visible 30 min before call)
  - "Add to Calendar" button (Frontend → generate .ics file)
  - Attendee count (for group calls)
- Show empty state for Free tier: "Upgrade to Basic for monthly founder calls" (Frontend)

**Call History** (Frontend + Backend)

- Fetch past calls user attended (Backend query)
- Display past call cards:
  - Call details (type, date, expert)
  - Recording link (if available) (Frontend)
  - Notes section: "My takeaways" (Frontend + Backend save)
  - Related resources shared during call (Frontend)
- Show "Recorded Webinar Library" section (Pro only) (Frontend + Backend)

**Schedule 1-on-1 (Pro Tier)** (Frontend + Backend)

- Display available 1-on-1 slots (Pro tier quarterly quota) (Frontend + Backend)
- Show quota usage: "1 of 4 quarterly calls used" (Frontend)
- Render calendar picker for available time slots (Frontend + Backend → founder availability)
- Allow scheduling call → send confirmation email → add to calendars (Backend + Background Job)
- Show upgrade prompt for Basic tier: "Get quarterly 1-on-1 calls with Pro" (Frontend)

**Pay-Per-Call (Free Tier)** (Frontend + Backend)

- Display pay-per-call option: "$150 for 60-minute founder call" (Frontend)
- Show "Book Paid Call" button → Stripe checkout (Frontend + Backend)
- Process payment → schedule call → send confirmation (Backend + Background Job)

**Call Reminders** (Background Job)

- Send email reminder 24 hours before call (Background Job)
- Send email reminder 30 minutes before call with Zoom link (Background Job)

---

### Profile & Settings (`/profile`)

**Profile Tab** (Frontend + Backend)

- Fetch user data (Backend query)
- Display editable profile fields:
  - Full name
  - Email (with verification status)
  - Location (city/region)
  - Phone number (optional)
  - Timezone (auto-detected, editable)
  - Profile photo upload (Phase 2) (Frontend + Backend)
- Show "Save Changes" button (Frontend + Backend update)
- Display validation errors inline (Frontend)

**Subscription Tab** (Frontend + Backend)

- Fetch subscription data (Backend query → Stripe API)
- Display current plan card:
  - Tier name (Free, Basic, Pro)
  - Price and billing cycle
  - Next billing date (if paid tier)
  - Payment method (last 4 digits of card)
  - "Manage Payment Method" link → Stripe customer portal (Frontend + Backend)
- Show plan comparison table (Frontend)
- Render upgrade/downgrade buttons:
  - Free → "Upgrade to Basic" or "Upgrade to Pro" (Frontend + Backend → Stripe checkout)
  - Basic → "Upgrade to Pro" or "Downgrade to Free" (Frontend + Backend → Stripe API)
  - Pro → "Downgrade to Basic" or "Cancel Subscription" (Frontend + Backend → Stripe API)
- Display cancellation policy and prorated refunds info (Frontend)

**Usage Tab** (Frontend + Backend)

- Fetch usage data (Backend query)
- Display usage metrics:
  - Plans created (count, tier limit)
  - Plans shared (count, tier limit)
  - Storage used (MB, Phase 2 when relevant)
  - Calls attended (count)
  - Expert calls quota (Pro tier: 4/year)
- Show usage charts over time (Basic+ only) (Frontend)
- Render tier-specific limits with upgrade prompts (Frontend)

**Billing History Tab** (Frontend + Backend)

- Fetch invoices (Backend query → Stripe API)
- Display invoice table:
  - Date
  - Description (subscription renewal, upgrade, etc.)
  - Amount
  - Status (Paid, Failed, Pending)
  - Download PDF link → Stripe-hosted invoice (Frontend)
- Show upcoming invoice preview (if available) (Frontend)

**Notification Preferences Tab** (Frontend + Backend)

- Display notification toggles:
  - **Email Notifications:**
    - Weekly newsletter (on by default)
    - Scenario-specific email series (Basic+)
    - Bundle highlight emails
    - Call reminders
    - Expiration alerts (Pro, Phase 2)
    - Platform updates and new features
  - **Push Notifications (Phase 2 - PWA):**
    - Threat alerts (Pro)
    - Readiness milestones
    - Shared plan updates
- Save preferences (Frontend + Backend update)

**Account Settings Tab** (Frontend + Backend)

- Show "Change Password" button → password change modal (Frontend + Backend)
- Display "Delete Account" button → confirmation modal with warnings (Frontend + Backend)
  - Warn about data loss (all plans, inventory, history)
  - Require password confirmation
  - Cancel active subscription (if any)
  - Queue account deletion job (Background Job → delete after 30-day grace period)
- Show "Export My Data" button (GDPR compliance) → download JSON (Frontend + Backend)

---

## 👑 Admin Section Pages

### Admin Dashboard (`/admin`)

**Platform Overview** (Frontend + Backend)

- Display metric cards (responsive grid):
  - Total users (count)
  - Active users (last 30 days)
  - MRR (Monthly Recurring Revenue)
  - New signups this month
  - Plans created this month
  - Bundles purchased this month
  - Conversion rate (Free → Paid)
- Show charts (Trust Blue accents):
  - User growth over time (line chart)
  - Revenue trend (line chart)
  - Tier distribution (pie chart)
  - Top scenarios selected (bar chart)

**Quick Actions** (Frontend)

- Large buttons for common tasks:
  - "Create New Bundle" → `/admin/bundles`
  - "Add Product" → `/admin/products`
  - "Send Email Campaign" → `/admin/email/new`
  - "Schedule Call" → `/admin/calls`
  - "View User Analytics" → `/admin/users`

**Recent Activity Feed** (Frontend + Backend)

- Show last 20 platform activities:
  - New user signups
  - Plan subscriptions upgraded
  - Bundles purchased
  - Plans created
  - Admin actions (bundle created, email sent)
- Real-time updates (optional: WebSocket or polling)

---

### Bundle Manager (`/admin/bundles`)

**Bundle List View** (Frontend + Backend)

- Fetch all bundles (Backend query)
- Display bundles table (Desktop) or cards (Mobile):
  - Bundle name
  - Image thumbnail
  - Price
  - Item count
  - Scenarios (badges)
  - Status: Active, Draft, Archived
  - Last updated date
  - Quick actions: Edit, Preview, Duplicate, Archive
- Show "Create New Bundle" button → bundle editor (Frontend)
- Enable search and filters: By scenario, status, price range (Frontend + Backend)
- Use Trust Blue accents for active bundles (Frontend)

**Bundle Editor** (Frontend + Backend)

- Display bundle form in sections:

**Section 1: Basic Information**

- Bundle name (text input)
- Description (rich text editor)
- Price (number input with $ prefix)
- Hero image upload (Frontend + Backend storage)
- Status: Draft or Active (dropdown)

**Section 2: Tagging for AI Matching**

- Scenario tags (multi-select checkboxes: Natural Disaster, EMP, etc.)
- Use case tags (multi-select: Bug-out, Shelter-in-place, Vehicle kit, etc.)
- Budget tier (select: Tight, Moderate, Premium)
- Duration tags (multi-select: 72-hour, 1-week, 1-month, Multi-year)
- Family size tags (multi-select: 1-2, 3-4, 5+)

**Section 3: Master Items** (Frontend + Backend)

- Display "Add Master Item" button → item selector modal (Frontend)
- Show added items list (sortable, drag-to-reorder):
  - Master item name
  - Category
  - Quantity (editable)
  - Default product selection (dropdown, fetch from product catalog)
  - Customization rules per item:
    - **Locked:** User cannot modify (checkbox)
    - **Swappable:** User can choose alternatives (checkbox + define alternative products)
    - **Removable:** User can remove from bundle (checkbox)
  - Actions: Edit, Remove
- Calculate and display total price (sum of default products) (Frontend)

**Section 4: Alternative Products** (Frontend + Backend)

- Show section for items marked "Swappable"
- Per swappable item, display "Add Alternative" button (Frontend)
- Allow selecting alternative products from catalog (Frontend + Backend query)
- Display alternatives list with:
  - Product name
  - Price
  - Price difference from default (± $X)
  - Remove button

**Section 5: Preview** (Frontend)

- Render bundle preview as users would see it:
  - Default view (all items with defaults)
  - Customization view (with swap/remove options visible)
- Toggle between preview modes (Frontend)

**Save & Publish** (Frontend + Backend)

- Show "Save as Draft" button → save without activating (Backend)
- Show "Publish Bundle" button → save and set status to Active (Backend)
- Display success message with link to preview (Frontend)
- Validate required fields before save (Frontend)

---

### Product Catalog (`/admin/products`)

**Tab 1: Master Items** (Frontend + Backend)

**Items Table/Grid** (Responsive)

- Fetch all master items (Backend query)
- Display items table (Desktop wide: split view, Desktop: table, Mobile: cards):
  - Item name
  - Category
  - Default product
  - Vendor
  - Avg price
  - Used in bundles (count)
  - Actions: Edit, Delete
- Show "Add Master Item" button → item editor (Frontend)
- Enable search: By item name, category (Frontend + Backend)
- Enable bulk actions: Delete selected, Change category (Frontend + Backend)
- Use Trust Blue for active selection states (Frontend)

**Item Editor (Modal or Split Panel on Wide)** (Frontend + Backend)

- Display item form:
  - Master item name (text input)
  - Category (dropdown, fetch from categories)
  - Description (text area)
  - Default product (dropdown, fetch from products)
  - Vendor (dropdown, fetch from vendors)
  - Tags (multi-select: Essential, Optional, Specialized)
  - Image upload (Frontend + Backend storage)
- Show "Save" and "Cancel" buttons (Frontend + Backend)
- Validate required fields (Frontend)

---

**Tab 2: Categories** (Frontend + Backend)

**Category Tree View** (Frontend + Backend)

- Fetch categories with hierarchy (Backend query)
- Display category tree (expandable):
  - Category name
  - Parent category (if nested)
  - Item count
  - Icon/emoji
  - Actions: Edit, Delete, Add Subcategory
- Enable drag-and-drop reordering (Frontend + Backend)
- Show "Add Category" button → category editor (Frontend)
- Use Trust Blue for active category (Frontend)

**Category Editor (Inline or Modal)** (Frontend + Backend)

- Display category form:
  - Category name (text input)
  - Parent category (dropdown for nesting, optional)
  - Description (text area)
  - Icon/emoji picker (Frontend)
  - Sort order (number input)
- Show "Save" and "Cancel" buttons (Frontend + Backend)
- Prevent deletion if category has items (validate) (Frontend + Backend)

---

**Tab 3: Analytics** (Frontend + Backend)

**Product Performance Dashboard** (Frontend + Backend)

- Fetch product analytics (Backend query)
- Display metrics (responsive grid):
  - Total products in catalog (count)
  - Total master items (count)
  - Avg price per category
  - Most used items in bundles (top 10 list)
  - Least used items (candidates for removal)
- Show top-selling products table:
  - Product name
  - Category
  - Times recommended
  - Times purchased (when tracking available)
  - Revenue generated (Phase 2)
- Render charts (Trust Blue accents):
  - Products by category (pie chart)
  - Price distribution (histogram)
  - Bundle usage over time (line chart)

---

### Vendor Management (`/admin/suppliers`)

**Vendor List** (Frontend + Backend)

- Fetch all vendors (Backend query)
- Display vendors table (Desktop) or cards (Mobile):
  - Vendor name
  - Contact person
  - Email
  - Phone
  - Products supplied (count)
  - Payment terms (Net 30, Net 60, etc.)
  - Status: Active, Inactive
  - Actions: Edit, View Products, Archive
- Show "Add Vendor" button → vendor editor (Frontend)
- Enable search: By vendor name, contact (Frontend + Backend)
- Use Trust Blue for active vendors (Frontend)

**Vendor Editor** (Frontend + Backend)

- Display vendor form:
  - Vendor name (text input)
  - Contact person name (text input)
  - Email (email input)
  - Phone (phone input with formatting)
  - Address (text area)
  - Website (URL input)
  - Payment terms (dropdown: Net 30, Net 60, COD, etc.)
  - Commission structure (percentage input, Phase 2)
  - Notes (text area)
  - Status: Active or Inactive (toggle)
- Show "Save" and "Cancel" buttons (Frontend + Backend)
- Validate required fields (Frontend)

**Vendor Products View** (Frontend + Backend)

- Fetch products associated with vendor (Backend query)
- Display products list:
  - Product name
  - Category
  - Price
  - Used in bundles (count)
  - Link to product in catalog
- Show "Associate Product" button → product selector (Frontend + Backend)
- Enable removing product associations (Frontend + Backend)

**Vendor Performance (Phase 2)** (Frontend + Backend)

- Display vendor analytics:
  - Total products supplied
  - Total revenue generated
  - Average product rating
  - Fulfillment rate
  - Payment history
- Render performance charts (Frontend)

---

### User Analytics (`/admin/users`)

**User Overview Dashboard** (Frontend + Backend)

- Fetch user statistics (Backend query)
- Display metric cards (responsive grid):
  - Total users (count)
  - Free tier (count + percentage)
  - Basic tier (count + percentage)
  - Pro tier (count + percentage)
  - MRR (Monthly Recurring Revenue) (calculated sum)
  - Churn rate (percentage, Phase 2)
  - New signups this month (count)
- Use Trust Blue for progress bars and highlights (Frontend)

**User List** (Frontend + Backend)

- Fetch users with pagination (Backend query)
- Display users table (Desktop) or cards (Mobile):
  - Name
  - Email
  - Tier (badge with color coding: gray=Free, blue=Basic, purple=Pro)
  - Subscription status (Active, Canceled, Past Due)
  - Signup date
  - Last active date
  - Total plans created (count)
  - Total spent (sum, Phase 2)
  - Actions: View Details, Flag, Send Email
- Enable search: By name, email (Frontend + Backend)
- Enable filters: By tier, status, signup date range (Frontend + Backend)
- Show bulk action: "Send Email to Selected" (Frontend)

**User Detail View** (`/admin/users/[userId]`) (Frontend + Backend)

- Fetch user details (Backend query)
- Display user profile:
  - Personal info (name, email, location, signup date)
  - Subscription details (tier, billing cycle, next payment)
  - Usage stats (plans created, bundles purchased, calls attended)
  - Activity timeline (recent actions)
  - Notes (admin-only notes, text area) (Frontend + Backend save)
- Show action buttons:
  - "Flag as High-Value" (Pro tier users for outreach) (Frontend + Backend)
  - "Send Email" → email composer (Frontend)
  - "View Plans" → user's mission reports (Frontend)
  - "Upgrade/Downgrade Tier" (admin override, Phase 2) (Frontend + Backend)

**Tier Conversion Funnel** (Frontend + Backend)

- Fetch conversion data (Backend query)
- Display funnel visualization:
  - Signups → Free tier active users → Basic upgrades → Pro upgrades
  - Conversion rates per stage
  - Drop-off points highlighted
- Use Trust Blue for funnel stages (Frontend)

---

### Email Tools (`/admin/email`)

**Email Campaigns List** (Frontend + Backend)

- Fetch past email campaigns (Backend query)
- Display campaigns table:
  - Campaign name
  - Sent date
  - Recipients (count)
  - Open rate (percentage)
  - Click rate (percentage)
  - Status: Sent, Scheduled, Draft
  - Actions: View, Duplicate, Archive
- Show "Create Email Campaign" button → email composer (Frontend)

**Email Composer - AI-Driven Customization** (`/admin/email/new`) (Frontend + Backend + AI)

**Section 1: Recipients**

- Select target segment (dropdown):
  - All users
  - Free tier only
  - Basic tier only
  - Pro tier only
  - High-value flagged users
  - Custom segment (filter builder)
- Show recipient count preview (Frontend + Backend query)

**Section 2: Email Content**

- Subject line (text input)
- Preview text (text input)
- Email body (rich text editor with drag-and-drop fields):
  - **User Data Fields (Draggable Tokens):**
    - {{user_name}}
    - {{user_tier}}
    - {{readiness_score}}
    - {{plans_created}}
    - {{top_scenario}} (most selected scenario)
    - {{missing_items_count}}
    - {{days_since_signup}}
  - Drag tokens into email body → will be replaced per user (Frontend)

**Section 3: AI Customization Prompt** ⭐ UNIQUE FEATURE

- Display AI prompt text area (Frontend)
- Admin writes prompt: "For each user, recommend 2 bundles that match their top scenarios and budget tier. Explain why each bundle fits their specific needs." (Frontend)
- Show "Preview AI Output" button → generate sample for 3 random users (Frontend + Backend → Gemini API)
- Display sample outputs in preview panel (Frontend)
- Adjust prompt based on preview results (Frontend)

**Section 4: Send Options**

- Schedule: Send now or schedule for later (datetime picker) (Frontend)
- Test send: Enter test email addresses (Frontend + Backend)
- Show "Send Test" button (Frontend + Backend)
- Show "Send Campaign" button (Frontend + Backend → queue bulk email job)

**Email Sending (Background Job)**

- Process recipients in batches (Background Job)
- For each user:
  - Replace {{tokens}} with user data (Backend)
  - If AI customization enabled: Call Gemini API with prompt + user context → generate personalized content section (Backend)
  - Send email via email service (SendGrid, AWS SES, etc.) (Backend)
  - Track send status (Backend)
- Update campaign status and metrics (Backend)

**Campaign Analytics** (Frontend + Backend)

- Display campaign performance:
  - Total sent (count)
  - Delivered (count)
  - Bounced (count)
  - Opened (count + rate)
  - Clicked (count + rate)
  - Unsubscribed (count)
  - Conversions (upgrades attributed to campaign, Phase 2)
- Show email client breakdown (Gmail, Outlook, Apple Mail, etc.)
- Render charts (Trust Blue accents) (Frontend)

---

### Call Scheduling (`/admin/calls`)

**Call Types Overview** (Frontend + Backend)

- Display call type cards:
  - **Founder Group Calls (Basic Tier)**
    - Monthly frequency
    - Avg attendees per call
    - Next scheduled date
    - "Schedule New Call" button
  - **Expert Group Calls (Pro Tier)**
    - Monthly frequency
    - Rotating experts
    - Next scheduled date + expert name
    - "Schedule New Call" button
  - **1-on-1 Calls (Pro Tier)**
    - Quarterly quota per user
    - Upcoming 1-on-1s count
    - "View Schedule" button

**Schedule Founder Group Call** (Frontend + Backend)

- Display call form:
  - Call date and time (datetime picker with timezone)
  - Topic/agenda (text input)
  - Duration (dropdown: 30, 60, 90 minutes)
  - Zoom link (auto-generated or manual input)
  - Max attendees (number input, optional)
  - Description (text area)
- Show "Save & Send Invites" button (Frontend + Backend)
- Queue email invitations to all Basic+ users (Background Job)
- Add call to calendar (Backend → generate .ics file)

**Schedule Expert Group Call** (Frontend + Backend)

- Display call form (similar to founder call)
- Additional fields:
  - Expert name (text input)
  - Expert photo upload (Frontend + Backend)
  - Expert bio (text area)
  - Topic specialty (dropdown: Medical, HAM Radio, Tactics, Psychology, etc.)
- Show "Save & Send Invites" button (Frontend + Backend)
- Queue email invitations to all Pro users (Background Job)

**1-on-1 Call Management** (Frontend + Backend)

- Fetch upcoming 1-on-1 calls (Backend query)
- Display calendar view:
  - User name
  - Call date and time
  - Zoom link
  - User's tier (should be Pro)
  - User's question/topic (if provided)
  - Actions: Reschedule, Cancel
- Show "Set Availability" button → availability calendar editor (Frontend + Backend)
- Admin blocks out available time slots (recurring or one-time) (Frontend + Backend)
- Pro users see available slots when scheduling (Frontend)

**Call History** (Frontend + Backend)

- Fetch past calls (Backend query)
- Display calls list:
  - Call type
  - Date
  - Attendee count
  - Recording link (if available)
  - Notes (admin notes, text area)
  - Feedback summary (Phase 2: from attendee surveys)
- Enable filtering by type, date range (Frontend + Backend)

**Call Reminders (Background Job)**

- Send reminder emails 24 hours before call (Background Job)
- Send reminder emails 30 minutes before call with Zoom link (Background Job)
- Update call status after completion (Background Job)

---

### Admin Debug Tools (`/admin/debug`) ✅ Enhanced 2025-12-11 17:29 EST

**Debug Dashboard** (Frontend + Backend)

- Display tabbed interface with 5 tabs: Health, Logs, Activity, Cache, Email
- Trust Blue theme with responsive design

**Tab: Health** (Frontend + Backend)

- Fetch system health status for all services (Backend → health check functions)
- Display service status cards:
  - Database (PostgreSQL) - connection test
  - Supabase Auth - authentication check
  - Stripe - API key validation
  - Resend (Email) - API connectivity
  - OpenRouter (AI) - model availability
  - Environment Config - required variables check
- Show status badges: healthy (green), degraded (yellow), unhealthy (red), unknown (gray)
- Display latency metrics per service
- Render expandable details for each service

**Tab: System Logs** (Frontend + Backend) ✅ NEW

- Fetch system error logs from `system_logs` table (Backend query)
- Display stats cards:
  - Total logs count
  - Unresolved count (errors needing attention)
  - Last 24 hours count
  - Severity breakdown (critical, error, warning, info, debug)
- Render filter controls:
  - Severity dropdown filter
  - Category dropdown filter
  - "Unresolved Only" toggle
  - Refresh button
- Display logs table with:
  - Timestamp
  - Severity badge (color-coded: red=critical/error, yellow=warning, blue=info, gray=debug)
  - Category badge
  - Error message (truncated with expand)
  - User affected (email or "System")
  - Component/Route where error occurred
  - Admin notified indicator
  - Resolution status
  - Actions: View Details, Mark Resolved
- **View Details Modal**:
  - Full error message and stack trace
  - User context (who, what action, where)
  - Request/Response data (if logged)
  - Metadata with resolution suggestions
  - Admin notification timestamp
- **Mark Resolved Modal**:
  - Resolution notes input
  - Save resolution to database with admin ID
- **Test Admin Notification Button**:
  - Send test error notification to admin email
  - Verify email delivery configuration

**Tab: Activity** (Frontend + Backend)

- Fetch recent activity logs from `user_activity_log` table (Backend query)
- Display activity table with:
  - Timestamp
  - User (email or ID)
  - Activity type badge
  - Metadata details (expandable)
- Refresh button for latest activity

**Tab: Cache** (Frontend + Backend)

- Display cache management controls
- "Clear All Admin Caches" button → revalidate all admin page paths
- Show success/failure message after cache operation

**Tab: Email** (Frontend + Backend)

- Test email sending functionality
- Email recipient input field
- "Send Test" button → send test email via Resend
- Display success/failure message with error details

---

### System Error Logging Infrastructure ✅ NEW 2025-12-11 17:29 EST

**Purpose**: Centralized error logging with automatic admin notifications, user-friendly error messages, and resolution tracking for production debugging.

**Database Schema** (`system_logs` table)

- `id` (UUID, primary key)
- `severity` (enum: debug, info, warning, error, critical)
- `category` (enum: api_error, auth_error, database_error, external_service, payment_error, ai_error, validation_error, permission_error, system_error, user_action)
- `error_code` (text) - machine-readable error identifier
- `error_name` (text) - error class name
- `message` (text, required) - error description
- `user_id` (UUID, FK to profiles) - affected user
- `user_action` (text) - what user was doing when error occurred
- `component` (text) - frontend/backend component that logged error
- `route` (text) - URL route where error occurred
- `stack_trace` (text) - full stack trace for debugging
- `request_data` (JSONB) - sanitized request payload
- `response_data` (JSONB) - response details
- `metadata` (JSONB) - additional context and resolution suggestions
- `user_agent` (text) - browser/client info
- `ip_address` (text) - client IP (for security analysis)
- `resolved` (timestamp) - when issue was resolved
- `resolved_by` (UUID, FK to profiles) - admin who resolved
- `resolution` (text) - resolution notes
- `admin_notified` (timestamp) - when admin was emailed
- `created_at` (timestamp) - when error occurred

**Error Pattern Recognition**

Known error patterns with user-friendly messages and resolution hints:
- `RefererNotAllowedMapError` → Google Maps domain restriction issue
- `ApiNotActivatedMapError` → Google API not enabled
- `InvalidKeyMapError` → Invalid API key
- `OverQueryLimitMapError` → API quota exceeded
- `RequestDeniedMapError` → API request denied
- `OPENROUTER_RATE_LIMIT` → AI service rate limited
- `OPENROUTER_INVALID_KEY` → Invalid AI API key
- `stripe_card_declined` → Payment card declined
- `Profile_fetch_timeout` → Auth profile loading timeout

**Admin Email Notifications**

- HTML email template with:
  - Color-coded severity header (red=critical/error, yellow=warning, blue=info)
  - Error summary section (code, name, message)
  - User details section (ID, email, action, route)
  - Stack trace section (collapsible)
  - Resolution suggestions section
  - Quick action buttons (View in Admin, User Profile)
- Triggered automatically for error and critical severity
- Configurable via `ADMIN_EMAIL` environment variable

**Graceful Error Handling Pattern** (LocationAutocomplete Example)

- Detect API errors via window error events
- Show user-friendly error message (not technical jargon)
- Display manual fallback UI (enter location manually)
- Log error to server for admin review (once per session)
- Console error with resolution hints for developers
- Notify user that admin has been informed

---

## 🔧 Backend Architecture & System Functions

### API Endpoints (External Communication Only)

**`/api/webhooks/stripe/route.ts`** (Backend)

- Handle Stripe webhook events:
  - `checkout.session.completed` → Upgrade user tier, send welcome email
  - `invoice.payment_succeeded` → Renew subscription, update next billing date
  - `invoice.payment_failed` → Send dunning email, flag subscription at risk
  - `customer.subscription.deleted` → Downgrade user to Free tier, send cancellation confirmation
- Verify webhook signature (Backend)
- Process event → update database → queue follow-up jobs (Backend + Background Job)

**`/api/webhooks/email/route.ts`** (Backend - Phase 2)

- Handle email service webhooks (SendGrid, AWS SES):
  - Email delivered, opened, clicked, bounced, unsubscribed
- Update campaign metrics in database (Backend)

**`/api/amazon/product/route.ts`** (Backend - Existing)

- Amazon Product API lookup (existing functionality)
- Preserve existing implementation

**`/api/search/route.ts`** (Backend - Existing)

- Search API endpoint (existing functionality)
- Consider migrating to Server Action for internal use

**`/api/system-log/route.ts`** (Backend) ✅ NEW 2025-12-11

- Client-side error logging endpoint for frontend components
- POST endpoint accepts:
  - `error` (string) - error message
  - `errorName` (string) - error class name
  - `errorCode` (string) - machine-readable code
  - `severity` (string) - debug/info/warning/error/critical
  - `category` (string) - error category
  - `component` (string) - component that logged error
  - `route` (string) - page route
  - `userAction` (string) - what user was doing
  - `metadata` (object) - additional context
- Automatically extracts:
  - User ID from auth session (if logged in)
  - User agent from request headers
  - IP address from request
- Calls `logSystemError()` to save to database
- Returns `{ success: boolean, logId?: string }`

---

### Server Actions (Internal App Functionality)

**`app/actions/mission-reports.ts`** (Backend)

- `createMissionReport()` → Validate user tier limit → Save to database → Return report ID
- `updateMissionReport()` → Validate ownership → Update database
- `deleteMissionReport()` → Validate ownership → Soft delete from database
- `shareMissionReport()` → Validate tier (Basic+) → Generate share token → Send email invites

**`app/actions/bundles.ts`** (Backend)

- `getBundleRecommendations()` → Fetch user's scenarios → Query AI matching algorithm → Return top bundles
- `customizeBundle()` → Validate customization rules → Calculate new price → Save to report
- `markBundlePurchased()` → Update inventory → Recalculate readiness score

**`app/actions/inventory.ts`** (Backend)

- `updateInventoryItem()` → Validate ownership → Update quantity/status → Recalculate readiness
- `getInventorySummary()` → Aggregate all items → Calculate totals and percentages

**`app/actions/readiness.ts`** (Backend)

- `calculateReadinessScore()` → Fetch mission report + inventory → Apply scoring algorithm → Return score
- `getReadinessRecommendations()` → Analyze gaps → Generate AI suggestions → Return action items

**`app/actions/subscription.ts`** (Backend)

- `createCheckoutSession()` → Call Stripe API → Return checkout URL
- `createCustomerPortalSession()` → Call Stripe API → Return portal URL
- `cancelSubscription()` → Call Stripe API → Schedule downgrade

**`app/actions/admin.ts`** (Backend)

- `flagUserAsHighValue()` → Update user record → Add admin note
- `sendBulkEmail()` → Validate segment → Queue background job with user IDs and content

**`app/actions/auth.ts`** (Backend - Existing, may refactor)

- Authentication operations (preserve existing Supabase Auth)

**`app/actions/dev.ts`** (Backend - Existing)

- Dev/testing utilities (preserve if needed)

---

### Lib Queries (Database & Business Logic - Drizzle ORM)

**`lib/queries/users.ts`** (Backend)

- `getUserById()` → Fetch user by ID
- `getUserByEmail()` → Fetch user by email
- `updateUserTier()` → Update subscription tier
- `getUsersByTier()` → Fetch users filtered by tier

**`lib/queries/mission-reports.ts`** (Backend)

- `getMissionReportsByUserId()` → Fetch all reports for user
- `getMissionReportById()` → Fetch single report with relations (bundles, scenarios)
- `countMissionReportsByUserId()` → Count for tier limit enforcement

**`lib/queries/bundles.ts`** (Backend)

- `getBundleById()` → Fetch bundle with master items and products
- `getBundlesByScenarios()` → Filter bundles by scenario tags
- `getBundleRecommendations()` → AI matching algorithm using semantic search

**`lib/queries/products.ts`** (Backend)

- `getAllMasterItems()` → Fetch master item catalog
- `getProductsByCategory()` → Filter products by category
- `getAlternativeProducts()` → Fetch alternatives for master item

**`lib/queries/analytics.ts`** (Backend)

- `getPlatformMetrics()` → Calculate MRR, user counts, churn
- `getBundleAnalytics()` → Aggregate bundle impressions, selections, revenue
- `getUserAnalytics()` → Fetch user activity, conversion funnel data

---

### Lib Services (Business Logic & Integrations)

**`lib/system-logger.ts`** (Backend) ✅ NEW 2025-12-11

System error logging service with admin notifications:

- `logSystemError(error, options)` → Parse error → Save to database → Send admin notification (if error/critical)
- `logExternalServiceError(serviceName, error, context)` → Helper for external service errors (Google, OpenRouter, etc.)
- `logApiError(error, context)` → Helper for API endpoint errors
- `logAiError(error, context)` → Helper for AI/OpenRouter errors
- `logPaymentError(error, context)` → Helper for Stripe/payment errors
- `getErrorContext(error)` → Get user-friendly message and resolution suggestion for known error patterns

Error parsing features:
- Extracts error name, code, message, stack trace
- Pattern matching for known errors (Google Maps, OpenRouter, Stripe)
- Maps technical errors to user-friendly messages
- Includes resolution suggestions for developers

**`lib/admin-notifications.ts`** (Backend) ✅ NEW 2025-12-11

Admin email notification service:

- `sendAdminErrorNotification(details)` → Send HTML email to admin for error/critical logs
- `sendTestAdminNotification()` → Test email delivery configuration

HTML email template features:
- Color-coded severity header (red, yellow, blue, gray)
- Error summary section (code, name, message, timestamp)
- User context section (ID, email, action, route, component)
- Stack trace section with code formatting
- Resolution suggestions section
- Quick action buttons (View in Admin, View User)
- Professional styling with fallback fonts

Configuration:
- `ADMIN_EMAIL` environment variable for recipient
- `FROM_EMAIL` for sender address
- Uses Resend email service

---

### Background Jobs

**`jobs/email.ts`** (Background Job)

- `sendWelcomeEmail()` → Queue after signup
- `sendWeeklyNewsletter()` → Cron job (weekly) → Send to all opted-in users
- `sendScenarioEmailSeries()` → Drip campaign after plan generation
- `sendCallReminders()` → Cron job (check upcoming calls) → Send reminders
- `sendBulkAICustomizedEmail()` → Process batch → For each user: generate AI content → send email

**`jobs/subscriptions.ts`** (Background Job)

- `processDunningEmails()` → Cron job (daily) → Find failed payments → Send reminder emails
- `downgradeExpiredSubscriptions()` → Cron job (daily) → Find expired subscriptions → Downgrade tier

**`jobs/readiness.ts`** (Background Job)

- `recalculateReadinessScores()` → Triggered after inventory update or bundle purchase
- `sendReadinessMilestones()` → Trigger when user reaches 50%, 75%, 90% readiness

**`jobs/ai.ts`** (Background Job)

- `generateMissionReport()` → Call Gemini API → Save to database → Notify user
- `generateBundleRecommendations()` → Semantic matching → Cache results

---

## 🗄️ Database Architecture (Drizzle ORM)

### Schema Structure

**Drizzle Schema Organization:**

```
src/db/
├── index.ts                     # Drizzle client initialization
├── schema/
│   ├── index.ts                 # Export all schemas
│   ├── users.ts                 # profiles, user_settings tables
│   ├── products.ts              # products, master_items tables
│   ├── bundles.ts               # bundles, bundle_items, bundle_tags tables
│   ├── categories.ts            # categories, category_hierarchy tables
│   ├── suppliers.ts             # suppliers, supplier_products tables
│   ├── mission-reports.ts       # mission_reports, report_scenarios tables
│   ├── inventory.ts             # inventory_items, inventory_history tables
│   ├── subscriptions.ts         # subscriptions, invoices tables
│   ├── skills.ts                # skills_training, user_progress tables
│   ├── calls.ts                 # scheduled_calls, call_history tables
│   └── system-logs.ts           # system_logs table ✅ NEW (2025-12-11)
└── queries/
    ├── users.ts                 # User CRUD operations
    ├── products.ts              # Product queries
    ├── bundles.ts               # Bundle matching and filtering
    ├── categories.ts            # Category tree operations
    ├── suppliers.ts             # Supplier management
    ├── mission-reports.ts       # Mission report CRUD
    ├── inventory.ts             # Inventory aggregation
    ├── subscriptions.ts         # Subscription status queries
    ├── skills.ts                # Skills tracking queries
    └── analytics.ts             # Platform metrics
```

### Authentication Strategy

**Hybrid Approach:**

- **Supabase Auth** - Authentication, sessions, OAuth (preserve existing)
- **Drizzle ORM** - All data queries (profiles, products, bundles, etc.)

**Rationale:**

- Supabase Auth is battle-tested and handles complex auth flows
- No need to rewrite auth logic
- Drizzle excellent for type-safe data queries
- Clean separation of concerns

---

## 🎯 MVP Functionality Summary

This blueprint delivers your core value proposition: **"Build complete disaster readiness plans in minutes with AI-powered survival strategies and curated bundles"**

### Phase 1 (Launch Ready):

- Universal SaaS foundation (auth, legal, responsive design)
- AI plan generation with multi-scenario support (Frontend + Backend + Background Jobs)
- Curated bundle recommendations with customization (Frontend + Backend)
- Purchase tracking and inventory management (Frontend + Backend)
- Readiness score calculation and tracking (Frontend + Backend)
- Evacuation maps and survival simulations (Frontend + Backend)
- Skills training resource library (Frontend + Backend)
- Expert call scheduling (Frontend + Backend + Background Jobs)
- Freemium subscription system (Free/Basic/Pro) (Frontend + Backend)
- Stripe integration with tier-based gates (Frontend + Backend)
- Admin backend (bundles, products, vendors) - Preserved with Trust Blue restyling
- User analytics and email campaigns (Frontend + Backend)
- Payment provider as single source of truth with minimal webhooks
- Admin functions split into individual routes and navigation items
- Drizzle ORM for type-safe database queries

### Phase 2 (Growth Features):

- Multi-location planning (Pro tier expansion)
- Offline PWA access (Pro tier expansion)
- Bundle expiration tracking
- Vendor portal and dropship model
- Influencer marketplace
- Annual physical archive
- Habit tracker & gamification
- Family coordination dashboard

### Phase 3 (Advanced Features):

- Service provider marketplace
- Real-time threat intelligence feed
- AI scenario simulation engine
- Advanced communication planning (HAM radio features)
- Vendor certification & trust badges

---

> **Next Step:** Ready for wireframe design with this concrete blueprint

**End of App Pages & Functionality Blueprint**
