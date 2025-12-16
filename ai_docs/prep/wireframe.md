## Wireframe Reference Doc

### ASCII / Markdown Mock-ups

```text
=================================================================
PUBLIC MARKETING PAGES
=================================================================

(1) Landing Page  `/`
+-------------------------------------------------------------+
|  [Logo]  Features  Pricing  Sign In              [Sign Up] |
+-------------------------------------------------------------+
|  Hero: "Build Complete Disaster Readiness Plans            |
|         in Minutes, Not Months"                             |
|  [Start Your Free Plan CTA]                                 |
|  [Trust signals: users, plans generated]                    |
|  [Hero Image: family-planning.png]                          |
+-------------------------------------------------------------+
|  Problem Statement Section                                  |
|  [Before vs After visual comparison]                        |
+-------------------------------------------------------------+
|  How It Works (4 steps with icons)                          |
|  [Screenshot of plan generator]                             |
+-------------------------------------------------------------+
|  Features by Tier (3-column comparison)                     |
|  Free | Basic | Pro                                         |
+-------------------------------------------------------------+
|  Pricing Cards                                              |
|  $0 | $9.99/mo | $49.99/mo                                  |
+-------------------------------------------------------------+
|  Testimonials & Trust Signals                               |
+-------------------------------------------------------------+
|  FAQ (Accordion style)                                      |
+-------------------------------------------------------------+
|  Final CTA: "Start Your Family's Preparedness Journey"     |
|  [Footer: Privacy | Terms | Cookies]                        |
+-------------------------------------------------------------+

(2) Unified Authentication  `/auth` (New!)
+-------------------------------------------------------------+
|  [Logo]                                                     |
+-------------------------------------------------------------+
|                                                             |
|         +-----------------------------------+               |
|         |  Welcome to beprepared.ai         |               |
|         |  [Email input]                    |               |
|         |  [Password input]                 |               |
|         |  [Continue Button] ← Smart Route  |               |
|         |  Forgot password?                 |               |
|         |  ─── or ───                       |               |
|         |  [Google OAuth] [Facebook OAuth]  |               |
|         +-----------------------------------+               |
|                                                             |
+-------------------------------------------------------------+
         ↓ EXISTING USER (after password validation)
+-------------------------------------------------------------+
|  If passwordLoginsSinceOtp >= 10:                           |
|         +-----------------------------------+               |
|         |  🔐 OTP Verification Required     |               |
|         |  Check your email for 6-digit code|               |
|         |  [_] [_] [_] [_] [_] [_]          |               |
|         |  Expires in: 58:42                |               |
|         |  [Verify Code]                    |               |
|         |  Didn't receive? [Resend OTP]     |               |
|         |  [Use password instead]           |               |
|         +-----------------------------------+               |
|                                                             |
+-------------------------------------------------------------+
         ↓ NEW USER (email doesn't exist)
+-------------------------------------------------------------+
|         +-----------------------------------+               |
|         |  Create Your Account              |               |
|         |  Email: user@example.com (shown)  |               |
|         |  [Confirm Password]               |               |
|         |  [Password strength: ████░ Good]  |               |
|         |  □ I agree to [Terms] & [Privacy] |               |
|         |       ↑ Opens scroll modals       |               |
|         |  [Create Account]                 |               |
|         +-----------------------------------+               |
|                                                             |
+-------------------------------------------------------------+

(3) Policy Modal (Terms/Privacy) - New Component
+-------------------------------------------------------------+
|  ┌───────────────────────────────────────────────────────┐ |
|  │ Terms of Service             ✅ Accepted              │ |
|  │ [X Close]                                             │ |
|  ├───────────────────────────────────────────────────────┤ |
|  │ Please scroll to read our complete terms              │ |
|  ├───────────────────────────────────────────────────────┤ |
|  │ ┌─────────────────────────────────────────────────┐ │ |
|  │ │ 1. Acceptance of Terms                          │ │ |
|  │ │ By accessing this service...                    │ │ |
|  │ │                                                 │ │ |
|  │ │ 2. Subscription Terms                           │ │ |
|  │ │ [Scrollable content area]                       │ │ |
|  │ │                                                 │ │ |
|  │ │ ... (user scrolls down) ...                    │ │ |
|  │ │                                                 │ │ |
|  │ │ Last updated: Dec 10, 2025                      │ │ |
|  │ └─────────────────────────────────────────────────┘ │ |
|  │       ↓ Scroll to read                             ⬇ │ |
|  │   [Gradient overlay with animated arrow]             │ |
|  ├───────────────────────────────────────────────────────┤ |
|  │ ✅ You have read to the end                          │ |
|  │                           [Cancel]  [Accept] ← Now ON│ |
|  └───────────────────────────────────────────────────────┘ |
|                                                             |
+-------------------------------------------------------------+

(4) Legacy Routes (Backward Compatibility)
+-------------------------------------------------------------+
|  `/auth/login` → Redirects to `/auth`                      |
|  `/auth/sign-up` → Redirects to `/auth`                    |
+-------------------------------------------------------------+

(4) Email Verification  `/auth/verify-email`
+-------------------------------------------------------------+
|  [Logo]                                                     |
+-------------------------------------------------------------+
|                                                             |
|         +-----------------------------------+               |
|         |  Verify Your Email                |               |
|         |                                   |               |
|         |  We sent a 6-digit code to:       |               |
|         |  user@example.com                 |               |
|         |                                   |               |
|         |  Enter code:                      |               |
|         |  [___] [___] [___] [___] [___] [___]              |
|         |                                   |               |
|         |  [Verify Code]                    |               |
|         |                                   |               |
|         |  Didn't receive it?               |               |
|         |  [Resend Code] (wait 60s)         |               |
|         |                                   |               |
|         |  Can't access this email?         |               |
|         |  [Request Manual Verification]    |               |
|         |                                   |               |
|         |  [Change Email Address]           |               |
|         +-----------------------------------+               |
|                                                             |
+-------------------------------------------------------------+

(5) Manual Verification Request  `/auth/verify-manual`
+-------------------------------------------------------------+
|  [Logo]                                                     |
+-------------------------------------------------------------+
|                                                             |
|         +-----------------------------------+               |
|         |  Request Manual Verification      |               |
|         |                                   |               |
|         |  Can't access your email?         |               |
|         |  We'll review your request        |               |
|         |                                   |               |
|         |  Reason for override:             |               |
|         |  ○ Lost access to email           |               |
|         |  ○ Email not arriving             |               |
|         |  ○ Other (explain below)          |               |
|         |                                   |               |
|         |  Additional details:              |               |
|         |  [text area]                      |               |
|         |                                   |               |
|         |  Alternative contact:             |               |
|         |  [phone/email input]              |               |
|         |                                   |               |
|         |  [Submit Request]                 |               |
|         |  [Back to Verification]           |               |
|         +-----------------------------------+               |
|                                                             |
+-------------------------------------------------------------+

(6) Forgot Password  `/auth/forgot-password`
+-------------------------------------------------------------+
|  [Logo]                                                     |
+-------------------------------------------------------------+
|                                                             |
|         +-----------------------------------+               |
|         |  Reset Your Password              |               |
|         |                                   |               |
|         |  Enter your email address and     |               |
|         |  we'll send you a reset link      |               |
|         |                                   |               |
|         |  [Email input]                    |               |
|         |                                   |               |
|         |  [Send Reset Link]                |               |
|         |                                   |               |
|         |  [Back to Login]                  |               |
|         +-----------------------------------+               |
|                                                             |
+-------------------------------------------------------------+

(7) Forgot Password Success
+-------------------------------------------------------------+
|  [Logo]                                                     |
+-------------------------------------------------------------+
|                                                             |
|         +-----------------------------------+               |
|         |  Check Your Email                 |               |
|         |                                   |               |
|         |  We've sent password reset        |               |
|         |  instructions to:                 |               |
|         |  user@example.com                 |               |
|         |                                   |               |
|         |  Didn't receive it?               |               |
|         |  [Resend Email]                   |               |
|         |                                   |               |
|         |  [Back to Login]                  |               |
|         +-----------------------------------+               |
|                                                             |
+-------------------------------------------------------------+

=================================================================
USER-FACING PAGES (Authenticated)
=================================================================

(8) Dashboard  `/dashboard`
+------------------+------------------------------------------+
| Sidebar          | Main Content                             |
|------------------|------------------------------------------|
| [User Avatar]    | Welcome back, [Name]                     |
| [User Name]      | [Readiness Score: 75/100 circular]      |
|                  |                                          |
| • Dashboard      | [Create New Plan CTA Button]            |
| • My Plans       |                                          |
| • Bundles        | Saved Plans (Grid 1/2/3/4 cols)         |
| • Inventory      | +---------------+ +---------------+      |
| • Readiness      | | Plan Card 1   | | Plan Card 2   |      |
| • Skills         | | [Scenario]    | | [Scenario]    |      |
| • Expert Calls   | | Score: 80     | | Score: 65     |      |
| • Profile        | | Updated: 2d   | | Updated: 5d   |      |
|                  | | [View][Share] | | [View][Edit]  |      |
|------------------|  +---------------+ +---------------+      |
| Usage: 1/1 Plans |                                          |
| [Upgrade]        | Readiness Summary Widget                 |
+------------------+ [Scenario breakdown bars]                |
                   | [Top gaps: 3 critical items missing]    |
                   +------------------------------------------+

(9) Plan Generator  `/plans/new`
+------------------+------------------------------------------+
| Sidebar          | Step 1: Scenario Selection               |
| (same as above)  |                                          |
|                  | Select scenarios (multiple):             |
|                  | +------------+ +------------+             |
|                  | | Natural    | | EMP/Grid   |             |
|                  | | Disaster   | | Down       |             |
|                  | | [icon] ☑   | | [icon] ☑   |             |
|                  | +------------+ +------------+             |
|                  | +------------+ +------------+             |
|                  | | Pandemic   | | Nuclear    |             |
|                  | | [icon]     | | [icon]     |             |
|                  | +------------+ +------------+             |
|                  | +------------+ +------------+             |
|                  | | Civil      | | Multi-Year |             |
|                  | | Unrest     | | Sustain.   |             |
|                  | +------------+ +------------+             |
|                  |                                          |
|                  | [Progress: ●○○○]  [Next Step Button]    |
+------------------+------------------------------------------+

(10) Plan Generator Step 2
+------------------+------------------------------------------+
| Sidebar          | Step 2: Personnel Configuration          |
|                  |                                          |
|                  | Planning for: 4 people                   |
|                  | [Add Family Member Button]               |
|                  |                                          |
|                  | Person 1                                 |
|                  | Name: [input]  Age: [25]  Gender: [M]   |
|                  | Medical: [Diabetes ☑] [Allergies]       |
|                  | Special needs: [text area]               |
|                  | ─────────────────────────────────        |
|                  | Person 2                                 |
|                  | Name: [input]  Age: [23]  Gender: [F]   |
|                  | Medical: [None]                          |
|                  | ─────────────────────────────────        |
|                  | [+ Add another person]                   |
|                  |                                          |
|                  | [Progress: ○●○○]  [Next Step Button]    |
+------------------+------------------------------------------+

(11) Plan Generator Step 3
+------------------+------------------------------------------+
| Sidebar          | Step 3: Location & Context               |
|                  |                                          |
|                  | Location                                 |
|                  | [Autocomplete input: Seattle, WA]       |
|                  | [Use Current Location Button]            |
|                  |                                          |
|                  | Planning Duration                        |
|                  | ○ 1 Week   ○ 1 Month                    |
|                  | ○ 1 Year   ○ Multi-Year (1+ years)      |
|                  |                                          |
|                  | Home Type: [House ▼]                     |
|                  | Climate: Temperate (auto-detected)      |
|                  | Existing Prep: [Basic 72-hr kit ▼]     |
|                  |                                          |
|                  | Budget Tier                              |
|                  | ○ Tight ($200-500)                       |
|                  | ○ Moderate ($500-2,000)                  |
|                  | ○ Premium ($2,000-10,000+)               |
|                  |                                          |
|                  | [Progress: ○○●○]  [Generate Plan]       |
+------------------+------------------------------------------+

(12) Plan Generator Step 4
+------------------+------------------------------------------+
| Sidebar          | Step 4: Generating Your Plan             |
|                  |                                          |
|                  | [Loading animation - Trust Blue]         |
|                  |                                          |
|                  | ✓ Analyzing your scenarios...            |
|                  | ⟳ Calculating supply quantities...       |
|                  | ○ Generating location strategies...      |
|                  | ○ Matching bundles to your needs...      |
|                  |                                          |
|                  | [Progress bar: 45%]                      |
|                  |                                          |
|                  | This usually takes 30-60 seconds         |
+------------------+------------------------------------------+

(13) Plan Details  `/plans/[planId]`
+------------------+------------------------------------------+
| Sidebar          | [Plan Name - editable]                   |
|                  | [Scenario badges: Natural | EMP]         |
|                  | Readiness: [Calculate Score →]           |
|                  | (Click to complete baseline assessment)  |
|                  | Updated: 2 days ago                      |
|                  | [Edit] [Share] [Delete] [Download PDF]   |
|                  |                                          |
|                  | Quick Stats (4 cards in grid)           |
|                  | [24 items] [Est: $1,250] [? owned]...   |
|                  |                                          |
|                  | Recommended Bundles                      |
|                  | Core EMP Protection (Choose 1)           |
|                  | +--------+ +--------+ +--------+         |
|                  | |EMP Pkg1| |EMP Pkg2| |EMP Pkg3|         |
|                  | |$299 OR | |$450 OR | |$799 OR |         |
|                  | +--------+ +--------+ +--------+         |
|                  |                                          |
|                  | Vehicle EMP Kit (Choose 1)               |
|                  | +--------+ +--------+                    |
|                  | |Vehicle | |Vehicle |                    |
|                  | |EMP 1   | |EMP 2   |                    |
|                  | |$150 OR | |$275 OR |                    |
|                  | +--------+ +--------+                    |
|                  | [See All Bundles Link]                   |
|                  |                                          |
|                  | Tabs: [Overview] Map Routes  Simulation  |
|                  |       Skills  Contacts                   |
|                  | ─────────────────────────────────        |
|                  | AI-Generated Plan Narrative              |
|                  | [Formatted text with headings]           |
|                  | Critical Priorities:                     |
|                  | ✓ Water supply (2 weeks)                 |
|                  | ✓ First aid essentials                   |
|                  | ...                                      |
+------------------+------------------------------------------+

(14) Readiness Score Baseline Modal
+----------------------------------------------------------+
|  Calculate Your Readiness Score                          |
|----------------------------------------------------------|
|  To calculate your readiness, tell us what you already   |
|  have from the following categories:                     |
|                                                          |
|  Water Supply                                            |
|  ☑ Water filter  ☑ 5-gal containers  ☐ Purification    |
|                                                          |
|  Food Storage                                            |
|  ☑ MREs (12 count)  ☐ Rice/Grains  ☐ Canned goods      |
|                                                          |
|  First Aid & Medical                                     |
|  ☑ Basic first aid kit  ☐ Medications  ☐ Tourniquets   |
|                                                          |
|  Shelter & Warmth                                        |
|  ☐ Emergency blankets  ☐ Tent  ☐ Sleeping bags         |
|                                                          |
|  Tools & Equipment                                       |
|  ☑ Multi-tool  ☐ Flashlights  ☐ Radio                  |
|                                                          |
|  ... (expandable categories)                             |
|                                                          |
|  [Skip - Calculate Later]  [Calculate Score]             |
+----------------------------------------------------------+

(15) Bundle Browse  `/bundles`
+------------------+------------------------------------------+
| Filters (collap  | Bundle Marketplace                       |
| on mobile)       | Sort: [Relevance ▼]  [24 Results]       |
|------------------|                                          |
| Scenarios        | Grid (1/2/3/4 cols responsive)           |
| ☑ Natural        | +----------------+ +----------------+     |
| ☑ EMP            | | Bundle Image   | | Bundle Image   |     |
| □ Pandemic       | | Bundle Name    | | Bundle Name    |     |
|                  | | $299           | | $450           |     |
| Budget Tier      | | 24 items       | | 18 items       |     |
| ☑ Moderate       | | [Natural][EMP] | | [Pandemic]     |     |
|                  | | ★★★★★ (4.5)    | | ★★★★☆ (4.2)    |     |
| Duration         | | [View Details] | | [View Details] |     |
| ☑ 72-hour        | +----------------+ +----------------+     |
| □ 1-week         | +----------------+ +----------------+     |
|                  | | Bundle 3       | | Bundle 4       |     |
| Family Size      | | ...            | | ...            |     |
| ☑ 3-4            | +----------------+ +----------------+     |
|                  |                                          |
| [Clear Filters]  | [Pagination: 1 2 3 ... 8 Next]           |
+------------------+------------------------------------------+

(16) Bundle Details  `/bundles/[bundleId]`
+------------------+------------------------------------------+
| Sidebar          | [Bundle Image Gallery]                   |
|                  | [Main image with thumbnails below]       |
|                  |                                          |
|                  | Bundle Name (Large Heading)              |
|                  | $299 (Trust Blue accent)                 |
|                  | [Natural Disaster][Bug-out][72-hour]    |
|                  | Contains 24 essential items              |
|                  |                                          |
|                  | [Customize This Bundle]                  |
|                  | [Mark as Purchased]                      |
|                  | [Add to Wishlist]                        |
|                  |                                          |
|                  | Description                              |
|                  | [Admin-curated description text...]      |
|                  |                                          |
|                  | Why This Bundle                          |
|                  | [Rationale text...]                      |
|                  |                                          |
|                  | Master Items List (Expandable cards)     |
|                  | +------------------------------------+   |
|                  | | Water Filter (Qty: 2) [LOCKED]     |   |
|                  | | Default: LifeStraw - $45           |   |
|                  | | [Product image]                    |   |
|                  | | [View Product Details →]           |   |
|                  | +------------------------------------+   |
|                  | +------------------------------------+   |
|                  | | First Aid Kit (Qty: 1) [SWAPPABLE] |   |
|                  | | Default: Basic 100pc - $35 [Swap]  |   |
|                  | | [Product image]                    |   |
|                  | | [View Product Details →]           |   |
|                  | +------------------------------------+   |
|                  | ...                                      |
|                  |                                          |
|                  | [Sticky Total Bar: $299]                 |
+------------------+------------------------------------------+

(17) Product Detail Modal (Internal, no external links)
+----------------------------------------------------------+
|  LifeStraw Personal Water Filter               [Close X]  |
|----------------------------------------------------------|
|  [Product Image Gallery - 3-4 images]                    |
|                                                          |
|  Price: $45                                              |
|  Category: Water Supply                                  |
|  Vendor: Acme Supply Co.                                 |
|                                                          |
|  Description:                                            |
|  [Admin-curated product description...]                  |
|                                                          |
|  Specifications:                                         |
|  • Filters up to 1,000 gallons                          |
|  • Removes 99.9999% bacteria                            |
|  • Weight: 2 oz                                          |
|  • Dimensions: 9" x 1"                                   |
|                                                          |
|  Best For:                                               |
|  [Natural Disaster] [Bug-out Bag] [72-hour Kit]         |
|                                                          |
|  [Mark as Purchased] [Add to Wishlist]                   |
+----------------------------------------------------------+

(18) Share Plan Modal (Basic+ Tier)
+----------------------------------------------------------+
|  Share Your Preparedness Plan                 [Close X]  |
|----------------------------------------------------------|
|  Share "Family Emergency Plan - Natural Disaster"        |
|                                                          |
|  Via Email                                               |
|  Email addresses (comma-separated):                      |
|  [input field]                                           |
|  Remaining shares: 3 of 5 used                          |
|                                                          |
|  Via Link                                                |
|  [Copy shareable link]                                   |
|  Link expires in 30 days                                 |
|                                                          |
|  Permissions:                                            |
|  ○ View only                                             |
|  ○ Can edit (collaborators)                              |
|                                                          |
|  [Send Invitations]  [Cancel]                            |
+----------------------------------------------------------+

(19) Inventory Tracker  `/inventory`
+------------------+------------------------------------------+
| Sidebar          | Inventory Summary (4 cards)              |
|                  | [142 Total] [89 Owned: 63%] [$2,450]... |
|                  |                                          |
|                  | [Track Inventory History 🔒]             |
|                  | [View Spending Analytics 🔒]             |
|                  | [Export Shopping List 🔒]                |
|                  |                                          |
|                  | Inventory by Category (Accordion)        |
|                  | ▼ Water Supply  [8/12 items - 67% ████] |
|                  |   • Water Filter (Qty 2) [✓ Owned]      |
|                  |   • 5-gal Water Jug (Qty 1) [NEEDED]    |
|                  |   • Water Purification Tabs [ORDERED]   |
|                  |   ...                                    |
|                  |                                          |
|                  | ▼ Food Storage  [15/20 items - 75% ████]|
|                  |   • MRE Pack (Qty 12) [✓ Owned]         |
|                  |   • Rice 50lb (Qty 1) [PARTIAL]         |
|                  |   ...                                    |
|                  |                                          |
|                  | ▶ Shelter & Warmth  [5/8 items]         |
|                  | ▶ First Aid & Medical  [12/15 items]    |
|                  | ▶ Tools & Equipment  [8/18 items]       |
|                  |                                          |
|                  | Spending Tracker (Basic+ Only)           |
|                  | [Line chart: spending over time]         |
|                  | [Pie chart: spending by category]        |
|                  | Total Invested: $1,245                   |
+------------------+------------------------------------------+

(20) Upgrade Modal (Tier-Gated Features)
+----------------------------------------------------------+
|  🔒 Inventory History - Basic Tier Feature               |
|----------------------------------------------------------|
|  Track your preparedness spending over time and see      |
|  exactly how your inventory changes month-by-month.      |
|                                                          |
|  With Basic tier ($9.99/mo) you get:                     |
|  ✓ Full inventory tracking with history                 |
|  ✓ Spending analytics and charts                        |
|  ✓ Unlimited saved plans                                 |
|  ✓ Share plans with 5 people                            |
|  ✓ Monthly founder group calls                           |
|                                                          |
|  [Upgrade to Basic - $9.99/mo]  [Maybe Later]            |
+----------------------------------------------------------+

(21) Readiness Dashboard  `/readiness`
+------------------+------------------------------------------+
| Sidebar          | Overall Readiness Score                  |
|                  | [Large circular: 75/100 Trust Blue]      |
|                  | +8 points since last month ↑             |
|                  | Status: "Moderately Prepared"            |
|                  |                                          |
|                  | Readiness by Scenario (Grid 2/3 cols)    |
|                  | +----------------+ +----------------+     |
|                  | | Natural        | | EMP/Grid       |     |
|                  | | Disaster       | | Down           |     |
|                  | | [82/100]       | | [68/100]       |     |
|                  | | Good (Green)   | | Moderate (Yel) |     |
|                  | | Gap: water     | | Gap: generator |     |
|                  | | [Improve]      | | [Improve]      |     |
|                  | +----------------+ +----------------+     |
|                  | ...                                      |
|                  |                                          |
|                  | Readiness Components Breakdown           |
|                  | Supplies & Equipment  [78/100 ████████] |
|                  | Skills & Knowledge    [65/100 ██████  ] |
|                  | Planning & Docs       [85/100 ████████] |
|                  | Network & Support     [60/100 ██████  ] |
|                  |                                          |
|                  | Actionable Next Steps                    |
|                  | 1. Add 2 water filters → +12 points     |
|                  |    Effort: Low  [Complete]               |
|                  | 2. Complete first aid training → +8     |
|                  |    Effort: Medium  [Complete]            |
|                  | ...                                      |
|                  |                                          |
|                  | Readiness Analytics (Basic+)             |
|                  | [Line chart: readiness over time]        |
|                  | [Milestone timeline]                     |
+------------------+------------------------------------------+

(22) Skills Training  `/skills`
+------------------+------------------------------------------+
| Sidebar          | Skills Overview                          |
|                  | Total Skills: 87  |  Started: 12        |
|                  | Completion: 14%   |  Priority: 5        |
|                  |                                          |
|                  | Search: [search skills...]               |
|                  | Filters: [Category ▼] [Type ▼] [Diff ▼]|
|                  |                                          |
|                  | Skills by Category                       |
|                  | ▼ First Aid & Medical (15 resources)     |
|                  |   Grid (1/2/3 cols)                      |
|                  |   +---------------+ +---------------+    |
|                  |   | [VIDEO icon]  | | [ARTICLE]     |    |
|                  |   | Trauma Care   | | Wound Mgmt    |    |
|                  |   | 12:45 min     | | 8 min read    |    |
|                  |   | Intermediate  | | Beginner      |    |
|                  |   | Progress: 45% | | [Bookmark ♡]  |    |
|                  |   | [View]        | | [View]        |    |
|                  |   +---------------+ +---------------+    |
|                  |   ...                                    |
|                  |                                          |
|                  | ▼ Water Purification (8 resources)       |
|                  |   [Resource cards grid...]               |
|                  |                                          |
|                  | ▶ Shelter Building (12 resources)        |
|                  | ▶ Food Preparation (14 resources)        |
|                  | ...                                      |
+------------------+------------------------------------------+

(23) Expert Calls  `/expert-calls`
+------------------+------------------------------------------+
| Sidebar          | Upcoming Calls                           |
|                  | +------------------------------------+   |
|                  | | Founder Group Call (Basic Tier)    |   |
|                  | | Date: Jan 15, 2025 | 7:00 PM PST   |   |
|                  | | Topic: Q1 Preparedness Planning     |   |
|                  | | Attendees: 24/50                    |   |
|                  | | [Add to Calendar] [Zoom Link]       |   |
|                  | +------------------------------------+   |
|                  | +------------------------------------+   |
|                  | | Expert Call - HAM Radio (Pro)      |   |
|                  | | Date: Jan 22, 2025 | 6:00 PM PST   |   |
|                  | | Expert: John Smith                  |   |
|                  | | [Add to Calendar]                   |   |
|                  | +------------------------------------+   |
|                  |                                          |
|                  | Call History                             |
|                  | [Past call cards with recordings...]     |
|                  |                                          |
|                  | Schedule 1-on-1 (Pro Tier)               |
|                  | Quota: 1 of 4 quarterly calls used       |
|                  | [Calendar picker for available slots]    |
|                  | [Book Call Button]                       |
|                  |                                          |
|                  | Pay-Per-Call (Free Tier)                 |
|                  | $150 for 60-minute founder call          |
|                  | [Book Paid Call]                         |
+------------------+------------------------------------------+

(24) Profile & Settings  `/profile`
+------------------+------------------------------------------+
| Sidebar          | Tabs: [Profile] Subscription Usage       |
|                  |       Billing  Notifications  Account    |
|                  | ─────────────────────────────────        |
|                  | Profile Information                      |
|                  | Full Name: [input]                       |
|                  | Email: [input] ✓ Verified               |
|                  | Location: [Seattle, WA]                  |
|                  | Phone: [optional input]                  |
|                  | Timezone: [America/Los_Angeles ▼]       |
|                  | Profile Photo: [Upload]                  |
|                  | [Save Changes]                           |
+------------------+------------------------------------------+

(25) Profile - Subscription Tab
+------------------+------------------------------------------+
| Sidebar          | Current Plan                             |
|                  | +------------------------------------+   |
|                  | | Basic Plan                         |   |
|                  | | $9.99/month                        |   |
|                  | | Next billing: Jan 15, 2025         |   |
|                  | | Payment: •••• 4242                 |   |
|                  | | [Manage Payment Method]            |   |
|                  | +------------------------------------+   |
|                  |                                          |
|                  | Plan Comparison                          |
|                  | [3-column table: Free | Basic | Pro]    |
|                  |                                          |
|                  | [Upgrade to Pro] [Downgrade to Free]     |
+------------------+------------------------------------------+

(26) Profile - Notification Preferences Tab
+------------------+------------------------------------------+
| Sidebar          | Notification Preferences                 |
|                  |                                          |
|                  | Email Notifications                      |
|                  | ☑ Weekly newsletter                      |
|                  | ☑ System notifications (account, billing)|
|                  | ☑ New features announcements             |
|                  | ☑ Bundle highlight emails (marketing)    |
|                  | ☑ Scenario-specific series (Basic+)      |
|                  | ☑ Call reminders                         |
|                  | ☐ Third-party offers                     |
|                  | ☑ Expiration alerts (Pro, Phase 2)       |
|                  |                                          |
|                  | Privacy Settings                         |
|                  | [Unsubscribe from all marketing emails]  |
|                  | [Unsubscribe from all emails]            |
|                  | (You'll still receive critical account   |
|                  | and security notifications)              |
|                  |                                          |
|                  | Push Notifications (Phase 2 - PWA)       |
|                  | ☑ Threat alerts (Pro)                    |
|                  | ☑ Readiness milestones                   |
|                  | ☑ Shared plan updates                    |
|                  |                                          |
|                  | [Save Preferences]                       |
+------------------+------------------------------------------+

=================================================================
ADMIN SECTION PAGES
=================================================================

(27) Admin Dashboard  `/admin`
+------------------+------------------------------------------+
| Admin Sidebar    | Platform Overview (4 cards)              |
|------------------|                                          |
| • Dashboard      | [2,145 Users] [1,234 Active] [$12.5K MRR]|
| • Bundles        | [89 New Signups] [156 Plans] [24 Bundles]|
| • Products       |                                          |
|   ∟ Master Items | Charts (Trust Blue accents)              |
|   ∟ Categories   | [User growth line chart]                 |
| • Suppliers      | [Revenue trend line chart]               |
| • Users          | [Tier distribution pie chart]            |
| • Email Tools    | [Top scenarios bar chart]                |
| • Calls          |                                          |
|------------------|  Quick Actions (Large buttons)            |
| [Usage metrics]  | [Create Bundle] [Add Product]            |
+------------------+ [Send Email] [Schedule Call]             |
                   |                                          |
                   | Recent Activity Feed                     |
                   | • User signup: john@example.com          |
                   | • Plan created: Natural Disaster         |
                   | • Upgrade: user@email → Pro              |
                   | • Bundle purchased: 72-Hour Kit          |
                   | ...                                      |
                   +------------------------------------------+

(28) Bundle Manager  `/admin/bundles`
+------------------+------------------------------------------+
| Admin Sidebar    | Bundle Manager                           |
| (same as above)  | [Create New Bundle Button]               |
|                  | Search: [...]  Filters: [Scenario ▼]    |
|                  |                                          |
|                  | Bundles Table (Desktop) / Cards (Mobile) |
|                  | +------------------------------------+   |
|                  | | [Thumb] 72-Hour Survival Kit       |   |
|                  | | $299 | 24 items | Natural,EMP     |   |
|                  | | Status: Active | Updated: 2d ago   |   |
|                  | | [Edit] [Preview] [Duplicate] [Arc] |   |
|                  | +------------------------------------+   |
|                  | +------------------------------------+   |
|                  | | [Thumb] Family Bug-Out Bundle      |   |
|                  | | $450 | 18 items | Natural,Civil   |   |
|                  | | Status: Draft | Updated: 5d ago    |   |
|                  | | [Edit] [Preview] [Duplicate] [Arc] |   |
|                  | +------------------------------------+   |
|                  | ...                                      |
+------------------+------------------------------------------+

(29) Bundle Editor  `/admin/bundles/[id]/edit`
+------------------+------------------------------------------+
| Admin Sidebar    | Bundle Editor                            |
|                  | Tabs: [Basic Info] Tags  Items  Alts     |
|                  |       Preview                            |
|                  | ─────────────────────────────────        |
|                  | Bundle Name: [input]                     |
|                  | Description: [rich text editor]          |
|                  | Price: [$299]                            |
|                  | Hero Image: [Upload]                     |
|                  | Status: [Active ▼]                       |
|                  |                                          |
|                  | [Save as Draft] [Publish Bundle]         |
+------------------+------------------------------------------+

(30) Product Catalog  `/admin/products`
+------------------+------------------------------------------+
| Admin Sidebar    | Product Catalog                          |
|                  | Tabs: [Master Items] Categories Analytics|
|                  | ─────────────────────────────────        |
|                  | [Add Master Item Button]                 |
|                  | Search: [...]  Category: [All ▼]        |
|                  |                                          |
|                  | Items Table (Desktop) / Cards (Mobile)   |
|                  | +------------------------------------+   |
|                  | | Water Filter | Water Supply        |   |
|                  | | Default: LifeStraw | Vendor: ABC   |   |
|                  | | Avg: $45 | Used in: 12 bundles    |   |
|                  | | [Edit] [Delete]                    |   |
|                  | +------------------------------------+   |
|                  | +------------------------------------+   |
|                  | | First Aid Kit | Medical            |   |
|                  | | Default: 100pc Kit | Vendor: XYZ   |   |
|                  | | Avg: $35 | Used in: 18 bundles    |   |
|                  | | [Edit] [Delete]                    |   |
|                  | +------------------------------------+   |
|                  | ...                                      |
|                  |                                          |
|                  | [Bulk Actions: Delete Selected]          |
+------------------+------------------------------------------+

(31) Supplier Management  `/admin/suppliers`
+------------------+------------------------------------------+
| Admin Sidebar    | Vendor Management                        |
|                  | [Add Vendor Button]                      |
|                  | Search: [...]                            |
|                  |                                          |
|                  | Vendors Table (Desktop) / Cards (Mobile) |
|                  | +------------------------------------+   |
|                  | | Acme Supply Co.                    |   |
|                  | | Contact: Jane Doe                  |   |
|                  | | jane@acme.com | (555) 123-4567     |   |
|                  | | Products: 24 | Terms: Net 30       |   |
|                  | | Status: Active                      |   |
|                  | | [Edit] [View Products] [Archive]    |   |
|                  | +------------------------------------+   |
|                  | +------------------------------------+   |
|                  | | Best Gear Inc.                     |   |
|                  | | Contact: John Smith                |   |
|                  | | john@bestgear.com | (555) 987-6543|   |
|                  | | Products: 15 | Terms: Net 60       |   |
|                  | | Status: Active                      |   |
|                  | | [Edit] [View Products] [Archive]    |   |
|                  | +------------------------------------+   |
|                  | ...                                      |
+------------------+------------------------------------------+

(32) User Analytics  `/admin/users`
+------------------+------------------------------------------+
| Admin Sidebar    | User Analytics                           |
|                  | Overview (4 cards)                       |
|                  | [2,145 Total] [512 Free] [1,400 Basic]  |
|                  | [233 Pro] [$12.5K MRR] [89 New/month]   |
|                  |                                          |
|                  | User List                                |
|                  | Search: [...]  Filters: [Tier ▼][Date ▼]|
|                  |                                          |
|                  | Users Table (Desktop) / Cards (Mobile)   |
|                  | +------------------------------------+   |
|                  | | John Doe | john@email.com          |   |
|                  | | Tier: Pro | Status: Active         |   |
|                  | | Signup: Dec 1 | Last: 2h ago       |   |
|                  | | Plans: 5 | Spent: $499            |   |
|                  | | [View] [Flag] [Send Email]         |   |
|                  | +------------------------------------+   |
|                  | ...                                      |
|                  |                                          |
|                  | Tier Conversion Funnel                   |
|                  | [Funnel visualization with rates]        |
+------------------+------------------------------------------+

(33) Email Tools  `/admin/email`
+------------------+------------------------------------------+
| Admin Sidebar    | Email Campaigns                          |
|                  | [Create Email Campaign Button]           |
|                  |                                          |
|                  | Campaigns Table                          |
|                  | +------------------------------------+   |
|                  | | December Newsletter                |   |
|                  | | Sent: Dec 5 | Recipients: 2,145   |   |
|                  | | Open: 42% | Click: 8%            |   |
|                  | | Status: Sent                        |   |
|                  | | [View] [Duplicate] [Archive]        |   |
|                  | +------------------------------------+   |
|                  | ...                                      |
+------------------+------------------------------------------+

(34) Email Composer  `/admin/email/new`
+------------------+------------------------------------------+
| Admin Sidebar    | Email Composer                           |
|                  |                                          |
|                  | Section 1: Recipients                    |
|                  | Target: [All users ▼]                    |
|                  | Preview: 2,145 recipients                |
|                  |                                          |
|                  | Section 2: Content                       |
|                  | Subject: [input]                         |
|                  | Preview Text: [input]                    |
|                  | Body: [Rich text editor]                 |
|                  |                                          |
|                  | User Data Tokens (Draggable):            |
|                  | {{user_name}} {{user_tier}}              |
|                  | {{readiness_score}} {{plans_created}}    |
|                  | {{top_scenario}} {{missing_items_count}} |
|                  |                                          |
|                  | Section 3: AI Customization Prompt ⭐    |
|                  | [Text area for AI prompt]                |
|                  | "For each user, recommend 2 bundles..."  |
|                  | [Preview AI Output Button]               |
|                  |                                          |
|                  | Section 4: Send Options                  |
|                  | Schedule: [Send now ▼] [Date picker]    |
|                  | Test: [test@email.com] [Send Test]      |
|                  | [Send Campaign]                          |
+------------------+------------------------------------------+

(35) Call Scheduling  `/admin/calls`
+------------------+------------------------------------------+
| Admin Sidebar    | Call Scheduling                          |
|                  |                                          |
|                  | Call Types (3 cards)                     |
|                  | +----------------+ +----------------+    |
|                  | | Founder Group  | | Expert Group   |    |
|                  | | Monthly        | | Monthly        |    |
|                  | | Next: Jan 15   | | Next: Jan 22   |    |
|                  | | [Schedule New] | | [Schedule New] |    |
|                  | +----------------+ +----------------+    |
|                  | +----------------+                       |
|                  | | 1-on-1 Calls   |                       |
|                  | | Quarterly      |                       |
|                  | | Next: 3 calls  |                       |
|                  | | [View Schedule]|                       |
|                  | +----------------+                       |
|                  |                                          |
|                  | Upcoming Calls Calendar                  |
|                  | [Calendar view with scheduled calls]     |
|                  |                                          |
|                  | Call History                             |
|                  | [Past calls table with recordings]       |
|                  |                                          |
|                  | [Set Availability Button]                |
+------------------+------------------------------------------+

```

### Navigation Flow Map

```
=================================================================
PUBLIC MARKETING
=================================================================

Landing `/` → Unified Auth `/auth` 
                    ↓
         ┌──────────┴──────────┐
         ↓ (email check)       ↓
    NEW USER               EXISTING USER
         ↓                     ↓
    Signup Form         Password Validation
         ↓                     ↓
    Accept Terms/      passwordLoginsSinceOtp?
    Privacy (scroll)          ↓
         ↓              ┌──────┴──────┐
    Create Account     ↓ >= 10       ↓ < 10
         ↓             OTP Modal   Direct Login
    OTP Modal          ↓              ↓
         ↓             Verify OR   Dashboard
    Verify Code       Password      `/dashboard`
         ↓             Fallback
    Dashboard              ↓
    `/dashboard`      Dashboard
                     `/dashboard`

Unified Auth `/auth` → Forgot Password `/auth/forgot-password` 
                                      → Reset Password Success

Legacy Routes: `/auth/login` → `/auth` (redirect)
              `/auth/sign-up` → `/auth` (redirect)

Footer Links: Privacy `/privacy` | Terms `/terms` | Cookies `/cookies`

=================================================================
USER DASHBOARD & PLAN GENERATION
=================================================================

Dashboard `/dashboard` → Create New Plan → Plan Generator Step 1 `/plans/new`

Plan Generator Flow:
Step 1: Scenarios `/plans/new` (6 scenarios, multi-select)
  → Step 2: Personnel `/plans/new?step=2` (family members config)
    → Step 3: Location & Context `/plans/new?step=3` (location, duration, budget)
      → Step 4: AI Generation `/plans/new?step=4` (progress screen)
        → Plan Details `/plans/[planId]`

Dashboard `/dashboard` → Existing Plan Card → Plan Details `/plans/[planId]`
                       → Edit Plan → Plan Generator (pre-filled)
                       → Share Plan (Basic+) → Share Modal
                       → Delete Plan → Confirmation Modal

=================================================================
PLAN DETAILS & TABS
=================================================================

Plan Details `/plans/[planId]`
  → Tab: Overview (default view)
  → Tab: Map & Routes (interactive map, evacuation routes)
  → Tab: Simulation (day-by-day timeline)
  → Tab: Skills (training resources by category)
  → Tab: Contacts (emergency contact protocol)
  
Plan Details → Readiness Score → Baseline Assessment Modal (if not calculated)
            → Quick Stats → Inventory Tracker `/inventory`
            → Recommended Bundles → Bundle Details `/bundles/[bundleId]`
                                 → Browse All Bundles `/bundles`

=================================================================
BUNDLES & INVENTORY
=================================================================

Bundles Browse `/bundles`
  → Filter Sidebar (scenarios, budget, duration, family size)
  → Bundle Card → Bundle Details `/bundles/[bundleId]`

Bundle Details `/bundles/[bundleId]`
  → Customize Bundle → Customization Mode (swap/remove items)
  → View Product Details → Product Detail Modal (internal)
  → Mark as Purchased → Updates Inventory
  → Add to Wishlist → Saved for later

Inventory Tracker `/inventory`
  → Inventory Summary Cards
  → Category Accordion → Item List
  → Track History (Basic+) → Upgrade Modal (if Free tier)
  → Spending Analytics (Basic+) → Upgrade Modal (if Free tier)
  → Export Shopping List → Upgrade Modal (if Free tier)
  → Expiration Tracking (Pro, Phase 2) → Upgrade Modal (if not Pro)

=================================================================
READINESS & SKILLS
=================================================================

Readiness Dashboard `/readiness`
  → Overall Score (large circular)
  → Scenario Breakdown (grid of scenarios)
  → Readiness Components (supplies, skills, planning, network)
  → Actionable Next Steps → Recommended bundles or inventory items
  → Analytics (Basic+) → Upgrade Modal (if Free tier)

Skills Training `/skills`
  → Skills Overview
  → Category Sections (expandable)
  → Resource Cards → Resource Detail Modal (video/article/PDF)
  → Search & Filter
  → Bookmark Resources → Saved favorites

=================================================================
EXPERT CALLS & COMMUNITY
=================================================================

Expert Calls `/expert-calls`
  → Upcoming Calls Section
    → Founder Group Calls (Basic+) → Add to Calendar
    → Expert Calls (Pro) → Add to Calendar
  → Schedule 1-on-1 (Pro) → Calendar Picker → Book Call
  → Pay-Per-Call (Free) → Stripe Checkout
  → Call History → Past call cards with recordings

=================================================================
PROFILE & SETTINGS
=================================================================

Profile `/profile`
  → Tab: Profile (personal info)
  → Tab: Subscription (current plan, upgrade/downgrade)
    → Upgrade/Downgrade → Stripe Checkout or Portal
    → Manage Payment → Stripe Customer Portal
  → Tab: Usage (metrics, tier limits)
  → Tab: Billing History (invoices)
  → Tab: Notification Preferences (email toggles, privacy settings)
  → Tab: Account Settings
    → Change Password → Password Change Modal
    → Delete Account → Confirmation Modal
    → Export My Data → Download JSON

=================================================================
ADMIN SECTION
=================================================================

Admin Dashboard `/admin`
  → Platform Overview (metrics, charts)
  → Quick Actions:
    → Create Bundle → `/admin/bundles/new`
    → Add Product → `/admin/products`
    → Send Email → `/admin/email/new`
    → Schedule Call → `/admin/calls`
    → View Users → `/admin/users`
  → Recent Activity Feed

Bundle Manager `/admin/bundles`
  → Bundle List (table/cards)
  → Create New Bundle → Bundle Editor `/admin/bundles/new`
  → Edit Bundle → Bundle Editor `/admin/bundles/[id]/edit`
    → Tabs: Basic Info | Tags | Items | Alts | Preview
  → Preview Bundle → User-facing view
  → Duplicate Bundle → Pre-filled editor
  → Archive Bundle

Product Catalog `/admin/products`
  → Tab: Master Items
    → Items Table/Grid
    → Add Master Item → Item Editor Modal
    → Edit Item → Item Editor Modal
  → Tab: Categories
    → Category Tree View
    → Add Category → Category Editor
    → Edit Category → Category Editor
  → Tab: Analytics (product performance dashboard)

Supplier Management `/admin/suppliers`
  → Vendor List (table/cards)
  → Add Vendor → Vendor Editor
  → Edit Vendor → Vendor Editor
  → View Products → Vendor Products View
  → Vendor Performance (Phase 2)

User Analytics `/admin/users`
  → User Overview Dashboard (metrics)
  → User List (table/cards with filters)
  → User Detail → `/admin/users/[userId]`
    → View user profile, subscription, usage
    → Flag as High-Value
    → Send Email → Email Composer
    → View Plans → User's mission reports
  → Tier Conversion Funnel

Email Tools `/admin/email`
  → Email Campaigns List
  → Create Campaign → Email Composer `/admin/email/new`
    → Section 1: Recipients (segment selection)
    → Section 2: Content (tokens, rich editor)
    → Section 3: AI Customization Prompt ⭐
    → Section 4: Send Options (test, schedule)
  → View Campaign → Campaign Analytics
  → Duplicate Campaign → Pre-filled composer

Call Scheduling `/admin/calls`
  → Call Types Overview (3 cards)
  → Schedule Founder Call → Call Form
  → Schedule Expert Call → Call Form with expert details
  → 1-on-1 Management → Calendar View
    → Set Availability → Availability Editor
  → Call History (past calls with recordings)

=================================================================
SIDEBAR NAVIGATION (Authenticated Users)
=================================================================

Main Sidebar (All Pages):
• Dashboard → `/dashboard`
• My Plans → `/dashboard` (same as dashboard)
• Bundles → `/bundles`
• Inventory → `/inventory`
• Readiness → `/readiness`
• Skills → `/skills`
• Expert Calls → `/expert-calls`
• Profile → `/profile`

Admin Sidebar (Admin Only):
• Dashboard → `/admin`
• Bundles → `/admin/bundles`
• Products → `/admin/products`
  ∟ Master Items (tab)
  ∟ Categories (tab)
• Suppliers → `/admin/suppliers`
• Users → `/admin/users`
• Email Tools → `/admin/email`
• Calls → `/admin/calls`

=================================================================
MODALS & OVERLAYS (Context-Dependent)
=================================================================

• Readiness Baseline Assessment Modal (from Plan Details)
• Product Detail Modal (from Bundle Details)
• Share Plan Modal (Basic+, from Plan Details)
• Upgrade Modal (tier-gated features)
• Confirmation Modals (delete plan, delete account)
• Password Change Modal (from Profile)
• Item Editor Modal (from Admin Products)
• Category Editor Modal (from Admin Products)
• Resource Detail Modal (from Skills Training)

```

