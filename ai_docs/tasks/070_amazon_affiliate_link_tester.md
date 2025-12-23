# AI Task Template

> **Task for AI Agent:** Add Amazon affiliate link testing button to product catalog with modal for copying/testing affiliate URLs

---

## 1. Task Overview

### Task Title
**Add Amazon Affiliate Link Testing Feature to Product Catalog**

### Goal Statement
**Goal:** Add a small button next to the supplier name for Amazon products in the admin product catalog that opens a modal displaying the generated affiliate link. The modal should allow admins to copy the link to test it in Amazon's Link Checker tool and open it in a new browser window. This provides a quick way to verify affiliate link generation is working correctly without leaving the product catalog.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
**✅ SKIP STRATEGIC ANALYSIS** - This is a straightforward UI feature with a clear implementation path. The user has specified exact requirements and the implementation pattern is well-established in the codebase.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15+, React 19
- **Language:** TypeScript 5+ with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components (Dialog) with Tailwind CSS v4
- **Authentication:** Supabase Auth - admin-only feature
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `ProductRow.tsx` - Displays individual product rows with supplier info
  - `ShareListItem.tsx` - Has copy-to-clipboard functionality (line 61-65)
  - `Dialog` component from shadcn/ui - Used throughout app for modals
  - `buildAmazonAffiliateUrl()` - Already exists in `src/lib/amazon-affiliate.ts`

### Current State
The admin product catalog (`/admin/products`) displays products in a tree structure with ProductRow components showing product details including supplier name. Currently, there is no way to test or preview affiliate links for Amazon products directly from the catalog interface.

**Current ProductRow supplier display** ([src/app/(protected)/admin/products/components/ProductRow.tsx:344-362](src/app/(protected)/admin/products/components/ProductRow.tsx#L344-L362)):
```typescript
<td className="px-2 py-3 w-[180px]">
    <div className="flex flex-col gap-0.5">
        <div className="text-foreground text-xs flex items-center gap-1.5 min-w-0">
            {!product.supplierId && (
                <span title="Missing Supplier">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                </span>
            )}
            <span className="truncate min-w-0">
                {product.supplier?.name || <span className="text-destructive italic">No Supplier</span>}
            </span>
        </div>
        <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[9px]...`}>
            {product.type}
        </span>
    </div>
</td>
```

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Available in protected routes - provides admin user ID for logging/tracking
- **No additional context needed** - All data fetching will be server-side for system settings

---

## 4. Context & Problem Definition

### Problem Statement
Admins need a quick way to test Amazon affiliate links directly from the product catalog without manually constructing URLs. Currently, there's no way to verify that:
1. The Amazon associate ID is configured correctly in system settings
2. Products have valid ASINs
3. The affiliate URL template is properly configured
4. The generated affiliate links work and contain the correct tracking parameters

This testing feature will save admins time by providing one-click access to affiliate link generation and validation.

### Success Criteria
- [ ] Small button appears next to "Amazon" supplier name for Amazon products only
- [ ] Button has "Affiliate Link" tooltip on hover
- [ ] Clicking button opens modal showing product name, ASIN, and generated affiliate link
- [ ] Clicking on the affiliate link field copies it to clipboard with visual feedback
- [ ] Modal has button to open affiliate link in new browser tab
- [ ] Proper error handling for missing system settings (amazon_associate_id, amazon_affiliate_url_template)
- [ ] Error handling for products without valid ASIN
- [ ] Error modals provide "Go to System Settings" link for configuration issues
- [ ] All UI elements are responsive and work on mobile/tablet/desktop

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- Admin can click affiliate link button next to Amazon supplier names
- Modal displays product name, ASIN, and generated affiliate URL
- Clicking affiliate URL field copies link to clipboard
- Visual feedback shown when link is copied (checkmark icon, toast notification)
- "Open Link" button opens affiliate URL in new browser tab
- Error modal shown if `amazon_associate_id` system setting not configured
- Error modal shown if product missing ASIN field
- Error modal shown if `amazon_affiliate_url_template` missing required placeholders
- Error modals provide "Go to System Settings" button linking to `/admin/debug` system settings tab

### Non-Functional Requirements
- **Performance:** Button and modal render instantly (<100ms)
- **Security:** Admin-only feature (already protected by route)
- **Usability:** Button is small and unobtrusive, modal is clear and focused
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Accessibility:** Proper ARIA labels, keyboard navigation support

### Technical Constraints
- Must use existing `buildAmazonAffiliateUrl()` function from `src/lib/amazon-affiliate.ts`
- Must integrate seamlessly with existing ProductRow component
- Must use shadcn/ui Dialog component for modals
- Must follow existing copy-to-clipboard pattern from `ShareListItem.tsx`

---

## 7. Data & Database Changes

### Database Schema Changes
**None required** - All required data (system settings, product ASIN, supplier name) already exists in database.

### Data Model Updates
**None required** - Using existing Product type which includes `asin`, `supplier.name`, and system settings.

---

## 8. API & Backend Changes

### Server Actions
**None required** - All necessary functionality exists:
- `buildAmazonAffiliateUrl()` in `src/lib/amazon-affiliate.ts` handles URL generation
- System settings lookup handled by `getSystemSetting()` in `src/db/queries/system-settings.ts`

### Database Queries
- **Use existing lib function:** `buildAmazonAffiliateUrl(asin)` from `src/lib/amazon-affiliate.ts`
  - Already fetches system settings (`amazon_associate_id`, `amazon_affiliate_url_template`)
  - Returns constructed affiliate URL or throws descriptive error

---

## 9. Frontend Changes

### New Components
- [ ] **`components/admin/products/AffiliateLink Button.tsx`** - Small circular button with link icon
  - Props: `product` (Product type with asin, supplier fields)
  - Renders only when `product.supplier?.name === 'Amazon'`
  - Opens AffiliateL inkModal on click

- [ ] **`components/admin/products/AffiliateLinkModal.tsx`** - Modal displaying affiliate link
  - Props: `isOpen`, `onClose`, `product` (Product type)
  - Displays product name, ASIN, and generated affiliate URL
  - Copy-to-clipboard functionality with visual feedback
  - "Open Link" button to open URL in new tab
  - Error handling with descriptive messages

- [ ] **`components/admin/products/AffiliateErrorModal.tsx`** - Reusable error modal
  - Props: `isOpen`, `onClose`, `errorType` ('no_associate_id' | 'no_asin' | 'invalid_template'), `productName`
  - Displays appropriate error message based on error type
  - "Go to System Settings" button for configuration errors
  - "Close" button for all error types

### Page Updates
- [ ] **`src/app/(protected)/admin/products/components/ProductRow.tsx`**
  - Add AffiliateLinkButton component next to supplier name (line ~352)
  - Only render button when `product.supplier?.name === 'Amazon'`
  - Button should be inline with supplier name display

### State Management
- Component-level state for modal open/close
- Component-level state for copy feedback (copied: boolean)
- No global state needed - all data fetched on-demand

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**ProductRow.tsx supplier cell** (lines 344-362):
```typescript
<td className="px-2 py-3 w-[180px]">
    <div className="flex flex-col gap-0.5">
        <div className="text-foreground text-xs flex items-center gap-1.5 min-w-0">
            {!product.supplierId && (
                <span title="Missing Supplier">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                </span>
            )}
            <span className="truncate min-w-0">
                {product.supplier?.name || <span className="text-destructive italic">No Supplier</span>}
            </span>
        </div>
        <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[9px]...`}>
            {product.type}
        </span>
    </div>
</td>
```

### 📂 **After Changes**

**ProductRow.tsx supplier cell** (lines 344-367):
```typescript
<td className="px-2 py-3 w-[180px]">
    <div className="flex flex-col gap-0.5">
        <div className="text-foreground text-xs flex items-center gap-1.5 min-w-0">
            {!product.supplierId && (
                <span title="Missing Supplier">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                </span>
            )}
            <span className="truncate min-w-0">
                {product.supplier?.name || <span className="text-destructive italic">No Supplier</span>}
            </span>
            {/* NEW: Affiliate link button for Amazon products */}
            {product.supplier?.name === 'Amazon' && (
                <AffiliateLinkButton product={product} />
            )}
        </div>
        <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[9px]...`}>
            {product.type}
        </span>
    </div>
</td>
```

### 🎯 **Key Changes Summary**
- [ ] **New Component: AffiliateLinkButton.tsx** - Small circular button with ExternalLink icon, appears inline with Amazon supplier name
- [ ] **New Component: AffiliateLinkModal.tsx** - Modal displaying product info and affiliate link with copy/open functionality
- [ ] **New Component: AffiliateErrorModal.tsx** - Error handling modal with contextual messages
- [ ] **Modified: ProductRow.tsx** - Add conditional affiliate button rendering (3 new lines)
- [ ] **Impact:** No changes to existing functionality, purely additive feature for Amazon products

---

## 11. Implementation Plan

### Phase 1: Create Affiliate Link Button Component
**Goal:** Create small button component that appears next to Amazon supplier names

- [ ] **Task 1.1:** Create AffiliateLinkButton Component
  - Files: `src/app/(protected)/admin/products/components/AffiliateLinkButton.tsx`
  - Details:
    - Accept `product` prop with Product type
    - Render small circular button (32px) with ExternalLink icon
    - Tooltip on hover: "Affiliate Link"
    - onClick handler to open modal
    - Use shadcn Button component with ghost variant

### Phase 2: Create Affiliate Link Modal
**Goal:** Create modal that displays affiliate link with copy/open functionality

- [ ] **Task 2.1:** Create AffiliateLinkModal Component
  - Files: `src/app/(protected)/admin/products/components/AffiliateLinkModal.tsx`
  - Details:
    - Use shadcn Dialog component
    - Display product name and ASIN in header
    - Generate affiliate URL using `buildAmazonAffiliateUrl(product.asin)`
    - Clickable affiliate URL field that copies to clipboard
    - Show checkmark icon and toast notification on copy
    - "Open Link" button with ExternalLink icon to open in new tab
    - Handle errors from buildAmazonAffiliateUrl and show error modal
    - Responsive design for mobile/tablet/desktop

### Phase 3: Create Error Modal Component
**Goal:** Create reusable error modal for affiliate link issues

- [ ] **Task 3.1:** Create AffiliateErrorModal Component
  - Files: `src/app/(protected)/admin/products/components/AffiliateErrorModal.tsx`
  - Details:
    - Accept errorType prop: 'no_associate_id' | 'no_asin' | 'invalid_template'
    - Display contextual error message based on type
    - For 'no_associate_id': "Amazon Associate ID system setting not configured"
    - For 'no_asin': "This product does not have a valid ASIN. Please edit the product and try again."
    - For 'invalid_template': "Amazon affiliate URL template is missing or invalid"
    - "Go to System Settings" button (only for configuration errors)
    - "Close" button for all error types

### Phase 4: Integrate Button into ProductRow
**Goal:** Add affiliate button to ProductRow supplier cell for Amazon products

- [ ] **Task 4.1:** Update ProductRow Component
  - Files: `src/app/(protected)/admin/products/components/ProductRow.tsx`
  - Details:
    - Import AffiliateLinkButton component
    - Add conditional rendering after supplier name (line ~352)
    - Only render when `product.supplier?.name === 'Amazon'`
    - Ensure button doesn't break responsive layout

### Phase 5: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 5.1:** Code Quality Verification
  - Files: All modified/created files
  - Details: Run `npm run lint` on new files ONLY - NEVER run dev server or build

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 5, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 6: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 6.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 6.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 7: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 7.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 7.2:** Request User UI Testing
  - Browser Testing Checklist:
    - [ ] Navigate to `/admin/products`
    - [ ] Find a product with Amazon supplier
    - [ ] Verify small affiliate link button appears next to "Amazon"
    - [ ] Hover over button to see "Affiliate Link" tooltip
    - [ ] Click button to open modal
    - [ ] Verify modal shows product name, ASIN, and affiliate URL
    - [ ] Click on affiliate URL field to copy
    - [ ] Verify checkmark appears and toast notification shows
    - [ ] Paste into Amazon Link Checker: https://affiliate-program.amazon.com/home/tools/linkchecker
    - [ ] Click "Open Link" button to test in new tab
    - [ ] Test error handling by editing product to remove ASIN
    - [ ] Test error handling by clearing amazon_associate_id system setting
    - [ ] Verify responsive design on mobile/tablet widths
- [ ] **Task 7.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

---

## 13. File Structure & Organization

### New Files to Create
```
src/
└── app/
    └── (protected)/
        └── admin/
            └── products/
                └── components/
                    ├── AffiliateLinkButton.tsx       # Small button component
                    ├── AffiliateLinkModal.tsx        # Main modal with affiliate link
                    └── AffiliateErrorModal.tsx       # Error handling modal
```

### Files to Modify
- [ ] **`src/app/(protected)/admin/products/components/ProductRow.tsx`** - Add affiliate button next to Amazon supplier name (3 lines)

### Dependencies to Add
**None** - All required dependencies already exist in the project (shadcn/ui Dialog, lucide-react icons, existing utility functions)

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1: System setting `amazon_associate_id` not configured**
  - **Code Review Focus:** AffiliateLinkModal.tsx error handling for `buildAmazonAffiliateUrl()` errors
  - **Expected Behavior:** Error modal shows "Amazon Associate ID not configured" with link to system settings

- [ ] **Error Scenario 2: Product missing ASIN field**
  - **Code Review Focus:** AffiliateLinkModal.tsx validation before calling `buildAmazonAffiliateUrl()`
  - **Expected Behavior:** Error modal shows "Product does not have valid ASIN" message

- [ ] **Error Scenario 3: URL template missing placeholders**
  - **Code Review Focus:** AffiliateLinkModal.tsx error handling for invalid template errors
  - **Expected Behavior:** Error modal shows "URL template is invalid" with link to system settings

### Edge Cases to Consider
- [ ] **Edge Case 1: Supplier name is "Amazon" but product has no ASIN**
  - **Analysis Approach:** Check if button shows for Amazon products without ASIN
  - **Recommendation:** Button should still show, but clicking opens error modal explaining ASIN is required

- [ ] **Edge Case 2: Very long product names in modal**
  - **Analysis Approach:** Test modal with product names >100 characters
  - **Recommendation:** Use truncation with ellipsis or multi-line display with max height

- [ ] **Edge Case 3: Copy to clipboard fails (permissions issue)**
  - **Analysis Approach:** Review clipboard API error handling
  - **Recommendation:** Show toast error message if clipboard write fails

### Security & Access Control Review
- [ ] **Admin Access Control:** Feature is in protected `/admin/products` route - already restricted to admins
- [ ] **Authentication State:** Protected by layout - no additional auth checks needed
- [ ] **Data Exposure:** No sensitive data exposed - affiliate links are public URLs
- [ ] **XSS Prevention:** All user data (product names) rendered through React (auto-escaped)

---

## 15. Deployment & Configuration

### Environment Variables
**None required** - Feature uses existing system settings stored in database:
- `amazon_associate_id` - Already configured in system_settings table
- `amazon_affiliate_url_template` - Already configured in system_settings table

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STRATEGIC ANALYSIS:** Already evaluated - this is a straightforward implementation with clear requirements. Proceeding directly to task document creation and implementation.

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates after each phase
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **STRATEGIC ANALYSIS COMPLETE** - Skipped (straightforward implementation)

2. **TASK DOCUMENT CREATED** - This document

3. **PRESENT IMPLEMENTATION OPTIONS (Required)**

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

4. **WAIT FOR USER CHOICE** (A, B, or C) - never assume or default

5. **IMPLEMENT PHASE-BY-PHASE** (Only after Option B approval)

### What Constitutes "Explicit User Approval"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES:** "A", "Option A", "Preview the changes", "Show me the code"
**✅ OPTION B RESPONSES:** "B", "Option B", "Proceed", "Go ahead", "Approved", "Start implementation"
**✅ OPTION C RESPONSES:** "C", "Option C", "I have questions", "Can you modify..."

🛑 **NEVER start coding without explicit A/B/C choice from user!**

### Code Quality Standards
- [ ] Follow TypeScript best practices with explicit return types
- [ ] Add proper error handling with try/catch blocks
- [ ] **🚨 MANDATORY: Write Professional Comments** - Explain business logic, not change history
- [ ] **🚨 MANDATORY: Use early returns** to keep code clean and readable
- [ ] **🚨 MANDATORY: Use async/await** instead of .then() chaining
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR** - Always throw errors instead of masking issues
- [ ] **Ensure responsive design** using mobile-first approach with Tailwind breakpoints
- [ ] **Test components in both light and dark mode**
- [ ] **Follow accessibility guidelines** (WCAG AA) with proper ARIA labels
- [ ] **Use semantic HTML elements** (button, dialog, etc.)
- [ ] **Clean up removal artifacts** - no placeholder comments or dead code

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - Using existing lib function: `buildAmazonAffiliateUrl()` from `src/lib/amazon-affiliate.ts`
  - No new Server Actions or API routes needed
- [ ] **✅ VERIFY: Proper context usage patterns**
  - Component-level state only (modal open/close, copy feedback)
  - No global state or context providers needed
- [ ] **✅ VERIFY: No server/client boundary violations**
  - Client component using existing lib function (server-safe)

---

## 17. Notes & Additional Context

### Research Links
- Amazon Associates Link Checker: https://affiliate-program.amazon.com/home/tools/linkchecker
- Existing affiliate link builder: [src/lib/amazon-affiliate.ts](src/lib/amazon-affiliate.ts)
- Copy-to-clipboard pattern: [src/components/plans/share/ShareListItem.tsx:61-65](src/components/plans/share/ShareListItem.tsx#L61-L65)

### Design Notes
- **Button Size:** Very small (24px height, circular) to be unobtrusive
- **Icon:** ExternalLink from lucide-react for consistency
- **Modal Width:** ~500px max-width for focused display
- **Copy Feedback:** Checkmark icon + toast notification (2 second duration)
- **Error Handling:** Three distinct error types with specific messages

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **No breaking changes** - Purely additive feature for Amazon products only
- [ ] **No API changes** - Using existing lib function
- [ ] **No database changes** - Using existing product/system settings data

#### 2. **Ripple Effects Assessment**
- [ ] **UI Layout Impact:** Button added inline with supplier name - may affect column width
- [ ] **Performance Impact:** Minimal - modal only renders when opened, affiliate URL generated on-demand
- [ ] **No state management changes** - Component-level state only

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** None - reuses existing system settings queries in lib function
- [ ] **Bundle Size:** +2-3KB for three new small components
- [ ] **Server Load:** Negligible - URL generation is simple string replacement

#### 4. **Security Considerations**
- [ ] **No new attack surface** - Read-only feature, no data mutations
- [ ] **No data exposure risk** - Affiliate links are public URLs
- [ ] **Already protected** - Admin-only route with existing auth

#### 5. **User Experience Impacts**
- [ ] **Positive:** Quick access to affiliate link testing
- [ ] **No workflow disruption:** Button only appears for Amazon products
- [ ] **No learning curve:** Simple button + modal interaction pattern

#### 6. **Maintenance Burden**
- [ ] **Low complexity:** Three small, focused components
- [ ] **No new dependencies:** Uses existing shadcn/ui and utility functions
- [ ] **Self-contained:** Minimal integration points (just ProductRow)

### Critical Issues Identification

#### 🚨 **RED FLAGS - None Identified**

#### ⚠️ **YELLOW FLAGS - Minor Considerations**
- [ ] **UI Layout:** Button may cause supplier name cell to be slightly wider
  - **Mitigation:** Use absolute minimum button size (24px) and flex layout
- [ ] **Error Handling:** Three distinct error types need clear user guidance
  - **Mitigation:** Provide specific error messages with actionable next steps

---

*Template Version: 1.3*
*Task Created: 2025-12-22*
*Task Number: 070*
