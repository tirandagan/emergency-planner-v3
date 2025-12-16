# Task 043: Phase 4.6 Plan Management Modals

**Date Created**: 2025-12-15
**Status**: In Progress
**Priority**: High
**Phase**: 4.6 (Mission Plan Generator)

## Overview

Implement complete CRUD functionality for mission reports including edit plan flow, enhanced share modal with email integration, trash & restoration UI, plan versioning, and admin tools.

## User Requirements

1. **Versioning**: Preserve original plan when editing, create new version
2. **Email Integration**: Use Resend API (already configured) for share invitations
3. **Share Limits**: Enforce at share time, disable shares on tier downgrade, show disabled status
4. **Restoration**: Tier-specific windows (FREE=7 days, BASIC=30, PRO=90)
5. **Collaboration**: Track edits (deferred to future phase)
6. **Admin Settings**: Global system_settings table for configurable link expiration
7. **Recipient Features**: Non-intrusive upgrade prompts for free account recipients

## Database Schema Changes

### New Tables Created

#### 1. system_settings
**Purpose**: Global admin-configurable settings

**Fields**:
- `id` UUID PRIMARY KEY
- `key` TEXT UNIQUE NOT NULL
- `value` TEXT NOT NULL (stored as string, parsed by type)
- `value_type` ENUM('number', 'string', 'boolean', 'object', 'array')
- `description` TEXT
- `category` TEXT DEFAULT 'general'
- `is_editable` BOOLEAN DEFAULT true
- `environment` TEXT DEFAULT 'all'
- `last_modified_by` UUID REFERENCES profiles(id)
- `created_at`, `updated_at` TIMESTAMPTZ

**Default Settings**:
- `share_link_expiration_days`: 30 days
- `deleted_plans_retention_days`: 30 days
- `send_share_notification_emails`: true
- `max_plan_versions_per_report`: 10

#### 2. plan_versions
**Purpose**: Full version history for rollback

**Fields**:
- `id` UUID PRIMARY KEY
- `mission_report_id` UUID REFERENCES mission_reports(id) CASCADE
- `parent_version_id` UUID REFERENCES plan_versions(id)
- `version_number` INTEGER NOT NULL
- Full snapshot: `title`, `location`, `scenarios`, `family_size`, `duration_days`, `mobility_type`, `budget_amount`, `report_data`, `evacuation_routes`, `readiness_score`, `scenario_scores`, `component_scores`
- Metadata: `changes_summary`, `changed_fields[]`, `edited_by_user_id`, `edit_reason`
- `created_at` TIMESTAMPTZ

**Unique Constraint**: (mission_report_id, version_number)

#### 3. plan_edit_history
**Purpose**: Granular change tracking for collaboration (future phase)

**Fields**:
- `id` UUID PRIMARY KEY
- `mission_report_id` UUID REFERENCES mission_reports(id) CASCADE
- `version_id` UUID REFERENCES plan_versions(id)
- `edited_by_user_id` UUID REFERENCES profiles(id) CASCADE
- `field_path` TEXT NOT NULL (e.g., 'title', 'reportData.emergencyContacts[0].name')
- `field_name` TEXT NOT NULL (human-readable)
- `old_value` JSONB
- `new_value` JSONB NOT NULL
- `change_type` ENUM('create', 'update', 'delete', 'restore')
- Conflict resolution: `is_conflict`, `conflict_resolved_by`, `conflict_resolution_strategy`
- Metadata: `user_agent`, `ip_address`, `edit_source`
- `created_at` TIMESTAMPTZ

### Enhanced Existing Tables

#### plan_shares (4 new fields)
**Purpose**: Track disabled shares from tier downgrades

**New Fields**:
- `is_disabled` BOOLEAN NOT NULL DEFAULT false
- `disabled_at` TIMESTAMPTZ
- `disabled_reason` ENUM('tier_downgrade', 'manual', 'expired', 'owner_request', 'admin_action')
- `reactivated_at` TIMESTAMPTZ

**New Index**: `idx_plan_shares_disabled` on (is_disabled, mission_report_id)

## Implementation Progress

### ✅ Phase 1: Database Foundation (COMPLETED - 2025-12-15)

- [x] Create `src/db/schema/system-settings.ts`
- [x] Create `src/db/schema/plan-versions.ts`
- [x] Create `src/db/schema/plan-edit-history.ts`
- [x] Enhanced `src/db/schema/plan-shares.ts` with disabled status
- [x] Export new schemas from `src/db/schema/index.ts`
- [x] Generate database migrations (manual creation)
- [x] Run migrations via `scripts/migrate-new.ts`

### ✅ Phase 2: Query Functions & Server Actions (COMPLETED - 2025-12-15)

#### New Query Files
- [x] `src/db/queries/system-settings.ts`
  - `getSystemSetting<T>(key): Promise<T | null>`
  - `getSystemSettingsByCategory(category): Promise<Record<string, unknown>>`
  - `updateSystemSetting(key, value, modifiedBy): Promise<{ success, error? }>`
  - `getShareLinkExpirationDays(): Promise<number>`
  - `getDeletedPlansRetentionDays(): Promise<number>`

- [x] `src/db/queries/plan-versions.ts`
  - `createPlanVersion(reportId, userId, summary?, reason?): Promise<{ versionId, versionNumber }>`
  - `getPlanVersionHistory(reportId): Promise<Array<Version>>`
  - `rollbackToVersion(reportId, versionId, userId): Promise<{ success, error? }>`

#### Enhanced Existing Files
- [x] `src/lib/mission-reports.ts` - Added 6 functions:
  - `getDeletedPlans(userId): Promise<Array<DeletedPlan>>`
  - `restorePlan(reportId, userId): Promise<{ success, error? }>`
  - `cleanupOldDeletedPlans(): Promise<{ deletedCount, error? }>`
  - `disableExcessShares(userId, newTierLimit): Promise<{ disabledCount }>`
  - `getDisabledShares(userId): Promise<Array<DisabledShare>>`
  - `reactivateShare(shareId, userId): Promise<{ success, error? }>`

- [x] `src/app/actions/plans.ts` - Added 4 functions:
  - `restoreMissionReport(reportId): Promise<{ success, error? }>`
  - `createMissionReportVersion(reportId, summary?, reason?)`
  - `updateMissionReportWithVersioning(reportId, data, summary?)`
  - `shareMissionReportWithEmail(reportId, emails[], permissions, customMessage?)`

- [x] `src/app/actions/admin.ts` - Added 3 admin functions:
  - `updateSystemSetting(key, value): Promise<{ success, error? }>`
  - `cleanupOldDeletedPlans(daysOld): Promise<{ deletedCount, error? }>`
  - `getSystemStatistics(): Promise<{ success, stats?, error? }>`

### ✅ Phase 3: Email Integration (COMPLETED - 2025-12-15)

- [x] `src/lib/email.ts` - Added 2 email templates:
  - `sendPlanShareEmail(recipientEmail, shareData)` - Share invitation with custom message, CTA, and signup prompt
  - `sendShareAccessNotification(ownerEmail, accessData)` - Notify owner when plan is accessed

**Email Template Features Implemented**:
- Share invitation: Personalized greeting, plan details, custom message, "View Plan" CTA, link expiration notice, free account signup CTA
- Access notification: Plan accessed details (who, when, permission level), manage shares CTA

---

## ✅ Backend Implementation Complete (Phases 1-3)

**Summary of Completed Work (2025-12-15)**:
- ✅ 3 new database tables created with migrations
- ✅ Enhanced plan_shares table with disabled status tracking
- ✅ 8 new query functions for settings and versioning
- ✅ 10 new trash/share management functions
- ✅ 7 new server actions (4 in plans.ts, 3 in admin.ts)
- ✅ 2 email templates for share notifications
- ✅ All migrations applied successfully

**Next Steps**: Frontend UI implementation (Phases 4-10)

---

### Phase 4: Edit Plan Flow (PENDING)

**Files to Modify**:
- [ ] `src/app/(protected)/plans/new/page.tsx`
  - Check for `?edit={reportId}` query param
  - Fetch existing plan data server-side
  - Pass to PlanWizard as `initialData` and `mode="edit"`

- [ ] `src/lib/wizard/transform-plan-data.ts` (NEW)
  - `transformReportToWizardData(report): Partial<WizardFormData>`

- [ ] `src/components/plans/wizard/PlanWizard.tsx`
  - Add props: `mode?: 'create' | 'edit'`, `existingPlanId?`, `initialData?`
  - Detect edit mode, pre-fill form
  - Different localStorage key for edit mode
  - Update submit handler to update existing plan
  - Show "Editing Plan" badge

- [ ] `src/components/plans/modals/EditPlanModal.tsx`
  - Navigate to `/plans/new?edit={reportId}` on confirm

### Phase 5: Enhanced Share Modal (PENDING)

**Files to Modify**:
- [ ] `src/components/plans/modals/SharePlanModal.tsx` (MAJOR ENHANCEMENT)
  - Add 3rd tab: "Manage Shares"
  - Email tab: Replace input with `EmailChipInput`
  - Add personal message textarea
  - Email preview collapsible
  - Link tab: Add expiration dropdown, QR code
  - Manage tab: List active shares with actions
  - Integration with `shareMissionReportWithEmail()`

**New Components**:
- [ ] `src/components/plans/share/EmailChipInput.tsx` - Multi-email input with chip visualization
- [ ] `src/components/plans/share/ShareStatusBanner.tsx` - Show remaining shares, upgrade CTA
- [ ] `src/components/plans/share/ShareListItem.tsx` - Single share with actions
- [ ] `src/components/plans/share/EmailPreview.tsx` - Preview share invitation email

### Phase 6: Enhanced Delete Modal (PENDING)

**Files to Modify**:
- [ ] `src/components/plans/modals/DeletePlanModal.tsx`
  - Change warning: "This plan will be moved to Trash"
  - Show tier-based restoration period
  - Require typing plan title to confirm
  - Show active share warning
  - Success toast: "Plan deleted. Restore within X days from Trash."

### Phase 7: Trash & Restoration UI (PENDING)

**New Routes**:
- [ ] `src/app/(protected)/dashboard/trash/page.tsx` - Trash page with server-side data fetch

**New Components**:
- [ ] `src/components/plans/trash/TrashView.tsx` - List deleted plans with countdown
- [ ] `src/components/plans/trash/TrashPlanCard.tsx` - Single deleted plan card with restore

**Dashboard Enhancement**:
- [ ] `src/app/(protected)/dashboard/page.tsx` - Add "Trash" tab with count badge

### Phase 8: Collaborative Editing (DEFERRED)

**Deferred to future implementation** (requires real-time sync):
- [ ] Edit history modal
- [ ] Conflict detection
- [ ] Conflict resolution modal
- [ ] Side-by-side diff viewer

### Phase 9: Shared Plan Recipient View (PENDING)

**New Route**:
- [ ] `src/app/(public)/shared/[token]/page.tsx` - Public share link with guest upgrade CTAs

**New Components**:
- [ ] `src/components/shared/GuestUpgradeBanner.tsx` - Top banner upgrade prompt
- [ ] `src/components/shared/FeatureLockDialog.tsx` - Feature lock modal for free accounts

### Phase 10: Admin Tools (PENDING)

**New Routes**:
- [ ] `src/app/(protected)/admin/trash/page.tsx` - Admin trash management
- [ ] `src/app/(protected)/admin/settings/page.tsx` - System settings editor

**New Components**:
- [ ] `src/components/admin/trash/AdminTrashView.tsx` - Admin trash interface
- [ ] `src/components/admin/settings/SystemSettingsTable.tsx` - Edit system config

## Implementation Sequence

1. ✅ **Phase 1: Database** (migrations, schemas) - **COMPLETED 2025-12-15**
2. ✅ **Phase 2: Queries** (backend logic) - **COMPLETED 2025-12-15**
3. ✅ **Phase 3: Emails** (Resend integration) - **COMPLETED 2025-12-15**
4. **Phase 7: Trash UI** (restoration) - Most user-visible - **NEXT**
5. **Phase 6: Delete Modal** (update messaging) - Quick win
6. **Phase 5: Share Modal** (enhancements) - Complex but high value
7. **Phase 4: Edit Flow** (wizard pre-population) - Complex integration
8. **Phase 9: Shared View** (public route) - Recipient experience
9. **Phase 10: Admin Tools** (optional) - Administrative features
10. **Phase 8: Collaboration** (deferred) - Future enhancement

## Critical Files

### Must Modify (Existing)
1. `src/app/actions/plans.ts` - Add restoration, versioning, enhanced share
2. `src/lib/mission-reports.ts` - Add trash management queries
3. `src/lib/email.ts` - Add share invitation email template
4. `src/components/plans/modals/SharePlanModal.tsx` - Major enhancements
5. `src/components/plans/modals/DeletePlanModal.tsx` - Update messaging
6. `src/components/plans/wizard/PlanWizard.tsx` - Add edit mode
7. `src/app/(protected)/plans/new/page.tsx` - Edit mode detection
8. `src/app/(protected)/dashboard/page.tsx` - Add trash tab

### Must Create (New)
1. `src/db/schema/system-settings.ts` ✅
2. `src/db/schema/plan-versions.ts` ✅
3. `src/db/schema/plan-edit-history.ts` ✅
4. `src/db/queries/system-settings.ts`
5. `src/db/queries/plan-versions.ts`
6. `src/lib/wizard/transform-plan-data.ts`
7. `src/components/plans/share/EmailChipInput.tsx`
8. `src/components/plans/share/ShareStatusBanner.tsx`
9. `src/components/plans/share/ShareListItem.tsx`
10. `src/components/plans/trash/TrashView.tsx`
11. `src/components/plans/trash/TrashPlanCard.tsx`
12. `src/app/(protected)/dashboard/trash/page.tsx`
13. `src/app/(public)/shared/[token]/page.tsx`
14. `src/components/shared/GuestUpgradeBanner.tsx`
15. `src/app/(protected)/admin/trash/page.tsx`
16. `src/app/actions/admin.ts`

## User Testing Checklist

After implementation, user should verify:
- [ ] Edit plan: Wizard pre-fills with existing data
- [ ] Edit plan: Updates existing record instead of creating new
- [ ] Share via email: Receives email with share link
- [ ] Share via link: Generates unique token, copies to clipboard
- [ ] Share management: View active shares, revoke access
- [ ] Delete plan: Shows "moved to trash" with restoration info
- [ ] Trash page: Lists deleted plans with countdown
- [ ] Restore plan: Successfully brings back deleted plan
- [ ] Tier downgrade: Shares get disabled, status shown
- [ ] Tier upgrade: Disabled shares can be reactivated
- [ ] Guest recipient: Can view shared plan, sees upgrade prompts
- [ ] Admin trash: Can view all deleted plans, bulk cleanup

## Notes

- **Resend API**: Already configured at line 3 of `src/lib/email.ts`
- **Soft delete**: Already implemented in database, just need UI updates
- **Share limits**: Already enforced server-side, need client UI for disabled status
- **Versioning**: New feature requiring careful implementation
- **Collaborative editing**: Intentionally deferred (requires real-time sync)

## Risks & Considerations

1. **Database Migrations**: Create down migrations before applying
2. **Email Deliverability**: Test Resend in production environment
3. **Version Storage**: Monitor database size (full snapshots can grow large)
4. **Share Token Security**: Ensure UUID uniqueness and expiration enforcement
5. **Tier Enforcement**: Validate on both client and server sides
6. **Wizard State**: Handle edit mode localStorage conflicts carefully
7. **Restoration Period**: Clearly communicate tier-based limits to users

## References

- Implementation Plan: `/home/tiran/.claude/plans/eager-painting-sparrow.md`
- Roadmap: `ai_docs/prep/roadmap.md` - Phase 4.6
- Database Schemas: `src/db/schema/`
- Server Actions: `src/app/actions/`
