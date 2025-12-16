# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Phase 3.1d - Account Management Part 1: Password Change & GDPR Data Export

### Goal Statement
**Goal:** Add a new "Account" tab to the `/profile` page that enables users to securely change their password and export all their personal data in compliance with GDPR regulations. This provides essential account security management and data portability rights to users.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
**❌ SKIP STRATEGIC ANALYSIS WHEN:**
- Password change pattern is well-established (Supabase Auth standard workflow)
- Data export requirements are clearly defined by GDPR
- Only one obvious technical solution exists for both features
- Patterns exist in codebase (server actions, client forms)

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth with password-based authentication
- **Email Service:** Resend (configured, API key in .env.local)
- **Key Architectural Patterns:** Next.js App Router, Server Components, Server Actions
- **Relevant Existing Components:**
  - [ProfileTabs.tsx](src/components/profile/ProfileTabs.tsx) - Tab navigation
  - [email.ts](src/lib/email.ts:1) - Resend email functions
  - Supabase Auth client in protected routes

### Current State
- **Profile Page**: `/profile` exists with tabs (profile, subscription, usage, billing, notifications)
- **Password Management**: No UI exists for changing password
- **Data Export**: No GDPR data export functionality
- **Email Infrastructure**: Resend configured with functions for verification, password reset, welcome emails
- **Authentication**: Supabase Auth manages user passwords and sessions
- **Database Schema**: All user data tables exist (profiles, mission_reports, inventory_items, billing_transactions)

### Existing Context Providers Analysis
- **UserContext (`useUser()`)**: Available in protected routes
  - Provides: user.id, user.email, user.role
- **Supabase Client**: Available via `createClient()` from server utilities
- **No additional context needed** - profile data fetched server-side

---

## 4. Context & Problem Definition

### Problem Statement
Users lack essential account security and data management capabilities:

**Password Management Gap:**
- Users cannot change their password from within the application
- Must rely on "Forgot Password" flow even when logged in
- No self-service password update functionality
- Poor user experience for routine password updates

**GDPR Compliance Gap:**
- Users have no way to export their personal data
- Legal requirement under GDPR Article 15 (Right of Access)
- Compliance risk if users request data and we cannot provide it
- No data portability mechanism exists

**User Impact:**
- Security-conscious users frustrated by lack of password change
- Unable to comply with GDPR data access requests
- Poor trust signal - no data transparency
- Potential legal liability

### Success Criteria
- [ ] New "Account" tab visible in profile page navigation
- [ ] **Password Change Feature:**
  - [ ] "Change Password" button opens modal with form
  - [ ] Form fields: current password, new password, confirm password
  - [ ] Password strength indicator shows strength in real-time
  - [ ] Form validates all fields before submission
  - [ ] Password change triggers via Supabase Auth API
  - [ ] Email verification sent after successful password change
  - [ ] Success toast notification appears
  - [ ] User session maintained after password change
- [ ] **Data Export Feature:**
  - [ ] "Export My Data" button triggers synchronous data export
  - [ ] Export includes: profile, mission reports, inventory, billing history, email preferences
  - [ ] Export format: JSON file (machine-readable)
  - [ ] File downloads immediately (no email link)
  - [ ] Sensitive data sanitized (no auth tokens, password hashes, internal IDs)
  - [ ] Export action logged to user_activity_log
- [ ] Mobile-responsive design (320px+)
- [ ] Dark mode support
- [ ] Accessibility: WCAG AA compliance

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - breaking changes acceptable
- **Data loss acceptable** - aggressive data operations allowed
- **Users are developers/testers** - not production users
- **Priority: Speed and simplicity** over production robustness

---

## 6. Technical Requirements

### Functional Requirements

**Password Change:**
- User clicks "Change Password" button in Account tab
- Modal opens with three password fields:
  1. Current password (required, masked input)
  2. New password (required, masked input with strength indicator)
  3. Confirm password (required, must match new password)
- Password strength indicator shows: Weak (red), Fair (yellow), Good (green), Strong (blue)
- Validation rules:
  - Current password must be correct
  - New password ≥ 8 characters
  - New password must differ from current password
  - New password and confirm password must match
- Submit triggers Supabase Auth `updateUser({ password: newPassword })`
- After successful update:
  - Send email confirmation via Resend (reuse password reset email pattern)
  - Show success toast: "Password updated successfully"
  - Close modal
  - User session remains active (no forced logout)
- On error:
  - Show error toast with specific message (incorrect current password, weak password, etc.)
  - Keep modal open for retry

**Data Export:**
- User clicks "Export My Data" button in Account tab
- Server action synchronously generates JSON export file
- Export includes:
  - **Profile data**: id, email, fullName, firstName, lastName, location, phone, timezone, subscriptionTier, createdAt, lastLoginAt, email preferences (all 5 fields)
  - **Mission reports**: All reports with title, scenarios, location, readinessScore, fullReportData, createdAt
  - **Inventory items**: All owned and needed items with product details, purchase history
  - **Billing transactions**: All billing records with date, description, amount, status, invoice URL
- **Data sanitization:**
  - **Exclude**: password hash, session tokens, internal system IDs (Stripe internal IDs)
  - **Exclude**: Supabase auth.users data (handled by Supabase separately)
  - **Include**: Transaction amounts, dates, statuses (required for GDPR)
  - **Timestamps**: Keep full precision (ISO 8601 format)
- File downloads immediately as `${userFirstName}_${userLastName}_data_export_${YYYYMMDD}.json`
- Export action logged to `user_activity_log` with timestamp
- Success toast: "Your data has been exported successfully"
- Error toast if export fails: "Failed to export data. Please try again or contact support."

### Non-Functional Requirements
- **Performance:**
  - Password change completes within 2 seconds
  - Data export generates and downloads within 5 seconds for typical user data (<100 reports)
- **Security:**
  - Current password required for password change (prevents session hijacking attacks)
  - New password encrypted by Supabase Auth (bcrypt)
  - Server action validates user authentication before export
  - Only authenticated user's own data included in export
  - No sensitive tokens or credentials in export file
- **Usability:**
  - Password strength indicator provides clear visual feedback
  - Error messages are specific and actionable
  - Modal can be closed without saving (Escape key or Cancel button)
- **Responsive Design:** Works on mobile (320px+), tablet, desktop
- **Theme Support:** Light and dark mode
- **Accessibility:** WCAG 2.1 AA compliance
  - Keyboard navigation (Tab, Enter, Escape)
  - Screen reader support (ARIA labels)
  - Focus indicators
  - Error messages announced to screen readers

### Technical Constraints
- Must use Supabase Auth `updateUser()` API for password changes
- Must use existing Server Action pattern from [profile.ts](src/app/actions/profile.ts:1)
- Cannot access Supabase `auth.users` table directly (use Supabase admin SDK if needed)
- Must use Resend for email notifications (configured in [email.ts](src/lib/email.ts:1))
- Data export must be synchronous (no async queue processing)
- Export format must be JSON (machine-readable)

---

## 7. Data & Database Changes

### Database Schema Changes
**No database schema changes required** - all user data tables exist.

Relevant tables for data export:
- `profiles` - User profile data
- `mission_reports` - Emergency plans
- `inventory_items` - Owned and needed items
- `billing_transactions` - Payment history
- `user_activity_log` - Activity tracking (will log export action)

### Data Model Updates
**TypeScript types to add:**

```typescript
// src/types/data-export.ts
export interface UserDataExport {
  exportDate: string; // ISO 8601
  userId: string;
  profile: {
    email: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    location: string | null;
    phone: string | null;
    timezone: string | null;
    subscriptionTier: string;
    createdAt: string;
    lastLoginAt: string | null;
    emailPreferences: {
      newsletter: boolean;
      marketing: boolean;
      drip: boolean;
      callReminders: boolean;
      systemEmails: boolean;
    };
  };
  missionReports: Array<{
    id: string;
    title: string;
    scenarios: string[];
    location: string;
    readinessScore: number;
    reportData: any; // Full report JSON
    createdAt: string;
  }>;
  inventory: Array<{
    id: string;
    productName: string;
    category: string;
    owned: boolean;
    needed: boolean;
    quantity: number;
    estimatedCost: number | null;
    purchaseDate: string | null;
    purchaseUrl: string | null;
  }>;
  billingHistory: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    status: string;
    invoiceUrl: string | null;
  }>;
}
```

### Data Migration Plan
- [ ] No migration needed - reading existing data only
- [ ] Export functionality is read-only, no data modifications

---

## 8. API & Backend Changes

### Server Actions

**1. Change Password (Client-Side via Supabase Auth)**
- **NOT a Server Action** - uses Supabase client directly from client component
- Supabase Auth handles password encryption and validation
- Client-side component calls `supabase.auth.updateUser({ password })`
- Email notification sent via new server action `sendPasswordChangeConfirmationEmail()`

**2. Export User Data (Server Action)**
- [ ] **`exportUserData(userId)`** - New Server Action in [src/app/actions/profile.ts](src/app/actions/profile.ts:1)
  - Validates user authentication
  - Queries all user data tables via Drizzle
  - Constructs UserDataExport object with sanitized data
  - Excludes sensitive fields (auth tokens, password hashes, Stripe internal IDs)
  - Returns JSON string for immediate download
  - Logs export action to `user_activity_log`
  - Returns `{ success: boolean; data?: string; error?: string }`

**3. Send Password Change Email (Server Action)**
- [ ] **`sendPasswordChangeConfirmationEmail(email, name)`** - New function in [src/lib/email.ts](src/lib/email.ts:1)
  - Uses Resend to send confirmation email
  - Email content: "Your password was recently changed. If you didn't make this change, contact support immediately."
  - Returns `{ success: boolean; error?: string }`

### Database Queries
- [ ] **Server Action - `exportUserData()`**:
  - Query profiles table for user profile data
  - Query mission_reports for all user reports
  - Query inventory_items for all user inventory
  - Query billing_transactions for all user transactions
  - All queries use Drizzle ORM with proper WHERE clauses on userId

### API Routes
**❌ DO NOT create API routes** - Server Actions handle all operations

---

## 9. Frontend Changes

### New Components

**1. AccountTab Component**
- [ ] **`components/profile/AccountTab.tsx`** - Main account management tab component
  - Props: `userId: string, userEmail: string`
  - Renders two main sections:
    1. Password Management section with "Change Password" button
    2. Data Export section with "Export My Data" button
  - Manages state for password change modal (open/closed)
  - Handles data export action with loading state
  - Shows success/error toasts

**2. ChangePasswordModal Component**
- [ ] **`components/profile/ChangePasswordModal.tsx`** - Modal for password change form
  - Props: `isOpen: boolean, onClose: () => void, userEmail: string`
  - Form fields: current password, new password, confirm password
  - Password strength indicator component (reuse from signup if exists)
  - Client-side validation before submission
  - Calls Supabase Auth updateUser() on submit
  - Shows loading state during password change
  - Success/error toasts
  - Email confirmation after successful change

**Component Requirements:**
- **Responsive Design:** Mobile-first with Tailwind breakpoints
- **Theme Support:** CSS variables, dark mode classes
- **Accessibility:** WCAG AA compliance, keyboard navigation, screen reader support
- **Text Sizing:** `text-base` for content, `text-sm` for descriptions

### Page Updates
- [ ] **`/profile`** - [src/app/(protected)/profile/page.tsx](src/app/(protected)/profile/page.tsx:1)
  - Add "account" to tab type union
  - Add conditional render for account tab
  - Pass userId and userEmail to AccountTab component

- [ ] **ProfileTabs component** - [src/components/profile/ProfileTabs.tsx](src/components/profile/ProfileTabs.tsx)
  - Add "Account" tab to navigation
  - Update activeTab type to include "account"

### State Management
- **Client-side state**:
  - AccountTab: modal open/closed state, export loading state
  - ChangePasswordModal: form field values, password strength, validation errors
- **Supabase client**: Manages password update and email notification trigger
- **Server state sync**: No caching needed - actions are one-time operations
- **Toast notifications**: Use shadcn/ui toast for all user feedback

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Profile Page** ([src/app/(protected)/profile/page.tsx](src/app/(protected)/profile/page.tsx:95)):
```typescript
// Current tabs: profile, subscription, usage, billing, notifications
<ProfileTabs activeTab={tab as 'profile' | 'subscription' | 'usage' | 'billing' | 'notifications'} />

// No account tab content rendering
```

**ProfileTabs Component** (assumed structure):
```typescript
// Current tabs: profile, subscription, usage, billing, notifications
// Missing: account tab
```

**Email Functions** ([src/lib/email.ts](src/lib/email.ts:1)):
```typescript
// Existing: sendVerificationEmail(), sendPasswordResetEmail(), sendWelcomeEmail()
// Missing: sendPasswordChangeConfirmationEmail()
```

**Server Actions** ([src/app/actions/profile.ts](src/app/actions/profile.ts:20)):
```typescript
// Existing: updateUserProfile(), getPaymentMethod()
// Missing: exportUserData()
```

### 📂 **After Implementation**

**Profile Page** (updated):
```typescript
// Updated tab type to include account
<ProfileTabs activeTab={tab as 'profile' | 'subscription' | 'usage' | 'billing' | 'notifications' | 'account'} />

// Added account tab content rendering
{tab === 'account' && (
  <AccountTab userId={authUser.id} userEmail={profile.email} />
)}
```

**New AccountTab Component** ([src/components/profile/AccountTab.tsx](src/components/profile/AccountTab.tsx)):
```typescript
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChangePasswordModal } from './ChangePasswordModal';
import { exportUserData } from '@/app/actions/profile';

export function AccountTab({ userId, userEmail }: Props) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    // Export logic with file download
  };

  return (
    <div>
      <Card>
        <h3>Password Management</h3>
        <Button onClick={() => setIsPasswordModalOpen(true)}>
          Change Password
        </Button>
      </Card>

      <Card>
        <h3>Export My Data (GDPR)</h3>
        <p>Download all your personal data in JSON format</p>
        <Button onClick={handleExportData} disabled={isExporting}>
          {isExporting ? 'Exporting...' : 'Export My Data'}
        </Button>
      </Card>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
}
```

**New ChangePasswordModal Component** ([src/components/profile/ChangePasswordModal.tsx](src/components/profile/ChangePasswordModal.tsx)):
```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { sendPasswordChangeConfirmationEmail } from '@/app/actions/profile';

export function ChangePasswordModal({ isOpen, onClose, userEmail }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate fields
    // Call supabase.auth.updateUser({ password: newPassword })
    // Send confirmation email
    // Show success toast
    // Close modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit}>
          {/* Password fields with validation */}
          {/* Password strength indicator */}
          {/* Submit button */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**New Email Function** ([src/lib/email.ts](src/lib/email.ts:195)):
```typescript
export async function sendPasswordChangeConfirmationEmail(
  email: string,
  name?: string
): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Changed - Emergency Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Changed Successfully</h2>
          <p>Your password was recently changed.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to send email' };
  }
}
```

**New Server Action** ([src/app/actions/profile.ts](src/app/actions/profile.ts)):
```typescript
export async function exportUserData(
  userId: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // Validate authentication
    // Query all user data tables
    // Construct UserDataExport object
    // Sanitize sensitive data
    // Log export to user_activity_log
    // Return JSON string
    return { success: true, data: jsonString };
  } catch (error) {
    return { success: false, error: 'Failed to export data' };
  }
}
```

### 🎯 **Key Changes Summary**
- [ ] **ProfileTabs component**: Add "Account" tab to navigation
- [ ] **Profile page**: Add account tab conditional render with userId and userEmail
- [ ] **New AccountTab component**: Password management and data export sections
- [ ] **New ChangePasswordModal component**: Password change form with validation
- [ ] **New email function**: sendPasswordChangeConfirmationEmail() for post-change notification
- [ ] **New Server Action**: exportUserData() for GDPR data export
- [ ] **Files Modified**:
  - [src/app/(protected)/profile/page.tsx](src/app/(protected)/profile/page.tsx:1)
  - [src/components/profile/ProfileTabs.tsx](src/components/profile/ProfileTabs.tsx)
  - [src/lib/email.ts](src/lib/email.ts:195)
  - [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
- [ ] **Files Created**:
  - [src/components/profile/AccountTab.tsx](src/components/profile/AccountTab.tsx)
  - [src/components/profile/ChangePasswordModal.tsx](src/components/profile/ChangePasswordModal.tsx)
  - [src/types/data-export.ts](src/types/data-export.ts) (optional)
- [ ] **Impact**: Users can now manage password security and exercise GDPR data portability rights

---

## 11. Implementation Plan

### Phase 1: Update Tab Navigation & Create Account Tab Shell
**Goal:** Add "Account" tab to profile page and create empty AccountTab component

- [ ] **Task 1.1:** Update ProfileTabs Component
  - Files: [src/components/profile/ProfileTabs.tsx](src/components/profile/ProfileTabs.tsx)
  - Details:
    - Add "account" to tab navigation array
    - Update activeTab prop type to include "account"
    - Add icon for account tab (User or Shield icon)
    - Ensure tab link uses search params: `?tab=account`

- [ ] **Task 1.2:** Update Profile Page Tab Type
  - Files: [src/app/(protected)/profile/page.tsx](src/app/(protected)/profile/page.tsx:95)
  - Details:
    - Update tab type union to include "account"
    - Add conditional render for account tab
    - Pass userId and userEmail to AccountTab component

- [ ] **Task 1.3:** Create AccountTab Component Shell
  - Files: [src/components/profile/AccountTab.tsx](src/components/profile/AccountTab.tsx)
  - Details:
    - Create client component with 'use client' directive
    - Define props: `userId: string, userEmail: string`
    - Create two Card sections: Password Management, Data Export
    - Add placeholder buttons: "Change Password", "Export My Data"
    - Import necessary shadcn/ui components (Card, Button)

### Phase 2: Implement Password Change Feature
**Goal:** Build password change modal with Supabase Auth integration

- [ ] **Task 2.1:** Create ChangePasswordModal Component
  - Files: [src/components/profile/ChangePasswordModal.tsx](src/components/profile/ChangePasswordModal.tsx)
  - Details:
    - Create client component with 'use client' directive
    - Use shadcn/ui Dialog component for modal
    - Define props: `isOpen: boolean, onClose: () => void, userEmail: string`
    - Create form with three password Input fields:
      1. Current Password (type="password")
      2. New Password (type="password")
      3. Confirm Password (type="password")
    - Add form validation state with useState
    - Add isSubmitting loading state

- [ ] **Task 2.2:** Implement Password Strength Indicator
  - Files: [src/components/profile/ChangePasswordModal.tsx](src/components/profile/ChangePasswordModal.tsx)
  - Details:
    - Create password strength calculation function:
      - Length ≥ 8: +1 point
      - Contains uppercase: +1 point
      - Contains lowercase: +1 point
      - Contains number: +1 point
      - Contains special char: +1 point
    - Display strength indicator below new password field:
      - Weak (1-2): Red background
      - Fair (3): Yellow background
      - Good (4): Green background
      - Strong (5): Blue background
    - Show strength label and colored progress bar

- [ ] **Task 2.3:** Implement Client-Side Password Validation
  - Files: [src/components/profile/ChangePasswordModal.tsx](src/components/profile/ChangePasswordModal.tsx)
  - Details:
    - Validate all fields are filled
    - Validate new password ≥ 8 characters
    - Validate new password ≠ current password
    - Validate new password === confirm password
    - Show validation errors below each field
    - Disable submit button if validation fails

- [ ] **Task 2.4:** Implement Password Change Submission
  - Files: [src/components/profile/ChangePasswordModal.tsx](src/components/profile/ChangePasswordModal.tsx)
  - Details:
    - Import `createClient` from '@/lib/supabase/client'
    - Create handleSubmit async function
    - Set isSubmitting to true
    - Call `supabase.auth.updateUser({ password: newPassword })`
    - Handle success:
      - Call server action to send confirmation email
      - Show success toast: "Password updated successfully"
      - Reset form fields
      - Close modal
    - Handle errors:
      - Parse error message (incorrect current password, weak password, etc.)
      - Show error toast with specific message
      - Keep modal open for retry
    - Set isSubmitting to false in finally block

- [ ] **Task 2.5:** Wire ChangePasswordModal to AccountTab
  - Files: [src/components/profile/AccountTab.tsx](src/components/profile/AccountTab.tsx)
  - Details:
    - Add state: `const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)`
    - Update "Change Password" button onClick: `setIsPasswordModalOpen(true)`
    - Render ChangePasswordModal at bottom of component
    - Pass props: `isOpen`, `onClose`, `userEmail`

- [ ] **Task 2.6:** Create Password Change Confirmation Email Function
  - Files: [src/lib/email.ts](src/lib/email.ts:195)
  - Details:
    - Create `sendPasswordChangeConfirmationEmail(email, name)` function
    - Use Resend to send email notification
    - Email subject: "Password Changed - Emergency Planner"
    - Email content:
      - Heading: "Password Changed Successfully"
      - Body: "Your password was recently changed. If you didn't make this change, please contact support immediately."
      - Include support contact link
    - Return `{ success: boolean; error?: string }`

- [ ] **Task 2.7:** Create Server Action for Email Notification
  - Files: [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
  - Details:
    - Create `sendPasswordChangeEmail(email, name)` server action
    - Call `sendPasswordChangeConfirmationEmail()` from email.ts
    - Return result to client
    - No revalidation needed (one-time action)

### Phase 3: Implement Data Export Feature
**Goal:** Build GDPR-compliant data export with sanitization

- [ ] **Task 3.1:** Define UserDataExport Type
  - Files: [src/types/data-export.ts](src/types/data-export.ts) or inline in server action
  - Details:
    - Define complete TypeScript interface for export structure
    - Include all sections: profile, missionReports, inventory, billingHistory
    - Document which fields are included/excluded
    - Use strict typing for all nested objects

- [ ] **Task 3.2:** Create exportUserData Server Action - Profile Data
  - Files: [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
  - Details:
    - Create 'use server' function `exportUserData(userId: string)`
    - Validate userId is provided
    - Query profiles table using Drizzle:
      ```typescript
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      });
      ```
    - Extract profile data (exclude password hash, internal IDs):
      - email, fullName, firstName, lastName
      - location, phone, timezone
      - subscriptionTier, createdAt, lastLoginAt
      - All 5 email preference fields
    - Build profile section of export object

- [ ] **Task 3.3:** Query Mission Reports Data
  - Files: [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
  - Details:
    - Query mission_reports table:
      ```typescript
      const reports = await db.query.missionReports.findMany({
        where: eq(missionReports.userId, userId),
      });
      ```
    - Map to export format:
      - id, title, scenarios, location
      - readinessScore, reportData (full JSON)
      - createdAt
    - Add to missionReports section of export

- [ ] **Task 3.4:** Query Inventory Data
  - Files: [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
  - Details:
    - Query inventory_items table with product joins:
      ```typescript
      const inventory = await db.query.inventoryItems.findMany({
        where: eq(inventoryItems.userId, userId),
        with: { product: true },
      });
      ```
    - Map to export format:
      - id, productName, category
      - owned, needed, quantity
      - estimatedCost, purchaseDate, purchaseUrl
    - Add to inventory section of export

- [ ] **Task 3.5:** Query Billing History Data
  - Files: [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
  - Details:
    - Query billing_transactions table:
      ```typescript
      const billing = await db.query.billingTransactions.findMany({
        where: eq(billingTransactions.userId, userId),
      });
      ```
    - Map to export format (sanitize Stripe internal IDs):
      - id (our internal ID only)
      - date, description, amount, status
      - invoiceUrl (if available)
      - **Exclude**: stripePaymentIntentId, stripeChargeId (internal Stripe IDs)
    - Add to billingHistory section of export

- [ ] **Task 3.6:** Construct Final Export Object & Sanitize
  - Files: [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
  - Details:
    - Build complete UserDataExport object:
      ```typescript
      const exportData: UserDataExport = {
        exportDate: new Date().toISOString(),
        userId,
        profile: { /* ... */ },
        missionReports: [ /* ... */ ],
        inventory: [ /* ... */ ],
        billingHistory: [ /* ... */ ],
      };
      ```
    - Double-check sanitization:
      - No password hashes
      - No auth tokens or session IDs
      - No Stripe internal IDs
      - No internal system metadata
    - Convert to JSON string: `JSON.stringify(exportData, null, 2)`
    - Return `{ success: true, data: jsonString }`

- [ ] **Task 3.7:** Log Export Action to Activity Log
  - Files: [src/app/actions/profile.ts](src/app/actions/profile.ts:121)
  - Details:
    - After successful export, insert log entry:
      ```typescript
      await db.insert(userActivityLog).values({
        userId,
        action: 'data_export',
        details: { timestamp: new Date().toISOString() },
        createdAt: new Date(),
      });
      ```
    - Catch and log errors if activity log fails (don't block export)

- [ ] **Task 3.8:** Implement Data Export UI in AccountTab
  - Files: [src/components/profile/AccountTab.tsx](src/components/profile/AccountTab.tsx)
  - Details:
    - Add state: `const [isExporting, setIsExporting] = useState(false)`
    - Create handleExportData async function:
      1. Set isExporting to true
      2. Call exportUserData server action
      3. If success:
         - Convert data string to Blob: `new Blob([data], { type: 'application/json' })`
         - Create download link: `URL.createObjectURL(blob)`
         - Trigger download with filename: `${firstName}_${lastName}_data_export_${YYYYMMDD}.json`
         - Show success toast: "Your data has been exported successfully"
      4. If error:
         - Show error toast with message
      5. Set isExporting to false
    - Update "Export My Data" button:
      - Disable while isExporting
      - Show loading text: "Exporting..." when isExporting
      - Add loading spinner icon

### Phase 4: Testing & Validation
**Goal:** Validate all functionality works correctly

- [ ] **Task 4.1:** Test Password Change Flow
  - Details:
    - Open password change modal
    - Test validation errors (empty fields, short password, mismatch)
    - Test password strength indicator updates in real-time
    - Submit with correct current password and valid new password
    - Verify success toast appears
    - Verify confirmation email received
    - Verify user can log in with new password
    - Verify old password no longer works

- [ ] **Task 4.2:** Test Password Change Error Handling
  - Details:
    - Test incorrect current password → error toast
    - Test weak new password → validation error
    - Test new password = current password → validation error
    - Test password mismatch → validation error
    - Test email send failure → log error but don't block password change

- [ ] **Task 4.3:** Test Data Export Flow
  - Details:
    - Click "Export My Data" button
    - Verify loading state appears
    - Verify JSON file downloads automatically
    - Open JSON file and verify structure:
      - exportDate, userId present
      - profile section has all expected fields
      - missionReports, inventory, billingHistory populated
    - Verify no sensitive data in export (auth tokens, password hashes)
    - Verify export action logged to user_activity_log

- [ ] **Task 4.4:** Test Edge Cases
  - Details:
    - Test export for user with no mission reports
    - Test export for user with no inventory items
    - Test export for user with no billing transactions
    - Test password change modal close without saving (Escape key, Cancel button)
    - Test password change during slow network (loading states)
    - Test mobile responsiveness (320px width)
    - Test dark mode styling

- [ ] **Task 4.5:** Accessibility Testing
  - Details:
    - Tab through all interactive elements (keyboard navigation)
    - Verify focus indicators visible
    - Test with screen reader (NVDA or VoiceOver)
    - Verify ARIA labels present and descriptive
    - Verify error messages announced to screen readers
    - Test color contrast (4.5:1 for text)
    - Test modal focus trap (focus stays in modal until closed)

### Phase 5: Code Quality & Validation
**Goal:** Ensure code meets quality standards

- [ ] **Task 5.1:** Run Linting
  - Command: `npm run lint`
  - Details: Fix any linting errors in modified files

- [ ] **Task 5.2:** Run Type Checking
  - Command: `npm run type-check` or `npx tsc --noEmit`
  - Details: Resolve any TypeScript type errors

- [ ] **Task 5.3:** Security Review
  - Details:
    - Verify current password required for password change
    - Verify data export validates user authentication
    - Verify no sensitive data in export file
    - Verify export only includes current user's data
    - Verify email confirmation sent after password change

- [ ] **Task 5.4:** Code Review Checklist
  - Details:
    - [ ] Password change modal functional with validation
    - [ ] Password strength indicator works correctly
    - [ ] Confirmation email sent after password change
    - [ ] Data export includes all required sections
    - [ ] Sensitive data sanitized from export
    - [ ] Export action logged to activity log
    - [ ] Success/error toasts appear appropriately
    - [ ] Mobile responsive design works
    - [ ] Dark mode styling correct
    - [ ] Accessibility requirements met

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

**🚨 CRITICAL: Real-time task completion tracking is mandatory**
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp
- [ ] **Add brief completion notes** (file paths, key changes)

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── src/
│   ├── components/
│   │   └── profile/
│   │       ├── AccountTab.tsx                 # New account management tab
│   │       └── ChangePasswordModal.tsx        # New password change modal
│   ├── types/
│   │   └── data-export.ts                     # Optional: UserDataExport type definition
│   └── app/
│       └── actions/
│           └── profile.ts                     # Updated with new server actions
```

### Files to Modify
- [ ] **[src/app/(protected)/profile/page.tsx](src/app/(protected)/profile/page.tsx:1)** - Add account tab
- [ ] **[src/components/profile/ProfileTabs.tsx](src/components/profile/ProfileTabs.tsx)** - Add account tab to navigation
- [ ] **[src/app/actions/profile.ts](src/app/actions/profile.ts:121)** - Add exportUserData server action
- [ ] **[src/lib/email.ts](src/lib/email.ts:195)** - Add sendPasswordChangeConfirmationEmail function

### Dependencies to Add
**No new dependencies required** - all components exist in shadcn/ui

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Supabase Auth updateUser() fails (network error, invalid password)
  - **Code Review Focus:** ChangePasswordModal error handling
  - **Potential Fix:** Catch error, parse error message, show specific error toast, keep modal open

- [ ] **Error Scenario 2:** Email confirmation send fails after successful password change
  - **Code Review Focus:** Email sending logic in password change flow
  - **Potential Fix:** Log error but don't block password change, show warning toast

- [ ] **Error Scenario 3:** Data export query fails (database connection error)
  - **Code Review Focus:** exportUserData server action error handling
  - **Potential Fix:** Return error object, show error toast, suggest retry or contact support

- [ ] **Error Scenario 4:** Large data export (>10MB) causes timeout or memory issues
  - **Code Review Focus:** Export query performance and size limits
  - **Potential Fix:** Add pagination for large datasets, stream response, or implement async export with email link (future enhancement)

### Edge Cases to Consider
- [ ] **Edge Case 1:** User changes password while logged in on multiple devices
  - **Analysis Approach:** Supabase Auth handles session invalidation automatically
  - **Recommendation:** No action needed - Supabase will force re-authentication on other devices

- [ ] **Edge Case 2:** User exports data multiple times in quick succession
  - **Analysis Approach:** Check if rate limiting is needed
  - **Recommendation:** Disable export button while export is in progress (isExporting state)

- [ ] **Edge Case 3:** User has no data to export (new user, no reports)
  - **Analysis Approach:** Verify export handles empty arrays gracefully
  - **Recommendation:** Return empty arrays for sections with no data, still allow export

- [ ] **Edge Case 4:** User closes modal/page during password change or export
  - **Analysis Approach:** Check cleanup and pending request handling
  - **Recommendation:** Add cleanup in useEffect return, operations complete server-side even if client closes

### Security & Access Control Review
- [ ] **Password Security:** Current password required to change password (prevents session hijacking)
  - **Check:** Supabase Auth requires current password for updateUser({ password })
- [ ] **Authorization:** Users can only export their own data
  - **Check:** exportUserData server action validates userId matches authenticated user
- [ ] **Data Sanitization:** No sensitive tokens or credentials in export
  - **Check:** Manually verify export excludes auth tokens, password hashes, Stripe internal IDs
- [ ] **Email Verification:** Password change confirmation email sent
  - **Check:** sendPasswordChangeConfirmationEmail called after successful password change
- [ ] **Activity Logging:** Data export action logged for audit trail
  - **Check:** user_activity_log insert after successful export

---

## 15. Deployment & Configuration

### Environment Variables
**Existing variables used:**
- `RESEND_API_KEY` - Already configured for email sending
- `RESEND_FROM_EMAIL` - Already configured for sender address
- `SUPABASE_URL` - Already configured for Supabase Auth
- `SUPABASE_ANON_KEY` - Already configured for client-side Supabase

**No new environment variables required**

---

## 16. AI Agent Instructions

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **✅ SKIP STRATEGIC ANALYSIS** (straightforward implementation)

2. **CREATE TASK DOCUMENT** - ✅ Already completed

3. **PRESENT IMPLEMENTATION OPTIONS**

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Show detailed code snippets for AccountTab, ChangePasswordModal, exportUserData server action, and email function.

   **B) Proceed with Implementation**
   Start implementing phase by phase after approval.

   **C) Provide More Feedback**
   Answer questions or adjust plan based on requirements.

4. **IMPLEMENT PHASE-BY-PHASE** (Only after Option B approval)
   - Execute each phase completely
   - Update task document with timestamps
   - Provide specific phase recap
   - Wait for "proceed" before next phase
   - Run linting during each phase

5. **FINAL CODE REVIEW** (Mandatory after all phases)
   - Present "Implementation Complete!" message
   - Wait for user code review approval
   - Execute comprehensive code review if approved

### Code Quality Standards
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling with try-catch
- [ ] Professional comments explaining business logic
- [ ] Early returns for better readability
- [ ] async/await instead of .then() chains
- [ ] No fallback behavior - throw errors for unexpected states
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support
- [ ] WCAG AA accessibility compliance

### Architecture Compliance
- [ ] Server Actions for mutations (data export)
- [ ] Supabase Auth for password management
- [ ] Client components for interactivity (modal, form)
- [ ] No API routes needed
- [ ] Proper error handling and user feedback
- [ ] Revalidate after mutations (if needed)

---

## 17. Notes & Additional Context

### Research Links
- [Supabase Auth - Update User](https://supabase.com/docs/reference/javascript/auth-updateuser) - Password change API
- [GDPR Article 15 - Right of Access](https://gdpr.eu/article-15-right-of-access/) - Data export requirements
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) - Modal component
- [Resend Email API](https://resend.com/docs/send-with-nodejs) - Email sending

### Data Export Best Practices
- **Machine-readable format**: JSON preferred over CSV for complex nested data
- **Complete data set**: Include all user-generated content and metadata
- **Exclude sensitive system data**: No auth tokens, password hashes, internal IDs
- **Timestamp precision**: Full ISO 8601 timestamps for accuracy
- **Structured format**: Clear hierarchy and labeled sections

### Password Security Best Practices
- **Minimum length**: 8 characters (industry standard)
- **Strength indicator**: Visual feedback encourages stronger passwords
- **Current password required**: Prevents session hijacking attacks
- **Email notification**: Alerts user of unauthorized password changes
- **No forced logout**: Better UX - user stays signed in after password change

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking changes - adding new functionality only
- [ ] **Database Dependencies:** No schema changes required
- [ ] **Component Dependencies:** ProfileTabs and profile page updated, backwards compatible
- [ ] **Authentication/Authorization:** No changes to auth flow, using existing Supabase Auth

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Users can now export all their data (positive for transparency)
- [ ] **UI/UX Cascading Effects:** New tab added, no impact on existing tabs
- [ ] **State Management:** Local state only, no global state changes
- [ ] **Routing Dependencies:** No route changes, uses existing `/profile` with search params

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** Data export performs multiple queries, but infrequent operation
- [ ] **Bundle Size:** +~15KB for new components (AccountTab, ChangePasswordModal)
- [ ] **Server Load:** Minimal - occasional password changes and exports
- [ ] **Caching Strategy:** No caching needed - one-time operations

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Password change requires current password (mitigates session hijacking)
- [ ] **Data Exposure:** Data export only includes user's own data, properly sanitized
- [ ] **Permission Escalation:** Server action validates userId, no escalation risk
- [ ] **Input Validation:** Password validation on client and server, data export has no user input

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Positive - users gain essential account management capabilities
- [ ] **Data Migration:** No migration - new features only
- [ ] **Feature Deprecation:** No features removed
- [ ] **Learning Curve:** Minimal - standard password change and export patterns

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Moderate - password change modal and data export queries
- [ ] **Dependencies:** No new dependencies
- [ ] **Testing Overhead:** Standard component and server action testing
- [ ] **Documentation:** This task document serves as implementation docs

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
**None identified** - Both features follow established patterns with clear requirements.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Large Data Export Performance:** Users with >100 reports may experience slow exports
  - **Impact:** Export could take 10-15 seconds for users with extensive data
  - **Mitigation:** Implement loading indicator, consider pagination or async export for future
  - **Recommendation:** Monitor export performance, implement optimizations if needed

- [ ] **Email Delivery Failures:** Password change confirmation email may fail to send
  - **Impact:** User changed password but didn't receive notification
  - **Mitigation:** Log email failures, don't block password change, show warning toast
  - **Recommendation:** Monitor Resend delivery rates, implement retry logic if needed

### Mitigation Strategies

#### Large Data Export Mitigation
- [ ] **Immediate**: Show loading indicator, disable button during export
- [ ] **Short-term**: Add estimated time message: "This may take up to 30 seconds for large accounts"
- [ ] **Long-term**: Implement async export with email link for users with >100 reports

#### Email Delivery Failure Mitigation
- [ ] **Error Handling**: Catch email send errors, log to console, don't block password change
- [ ] **User Notification**: Show warning toast if email fails: "Password changed successfully, but confirmation email failed. Check your security settings."
- [ ] **Monitoring**: Track email delivery failures in logs for investigation

---

*Template Version: 1.3*
*Last Updated: 1/10/2025*
*Created By: AI Agent*
