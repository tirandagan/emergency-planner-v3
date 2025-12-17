# LLM Microservice Database Migrations

## Overview

This directory contains SQL migrations for the LLM microservice database schema. Migrations are applied sequentially and support both forward (up) and rollback (down) operations.

## Migration Strategy

### Standalone Mode (Phases 1-9)
The microservice operates **independently** without requiring access to the main application's `profiles` table.

**Applied Migrations:**
- `001_create_llm_tables.sql` - Core workflow tables
- `002_create_external_api_cache.sql` - API response caching
- `003_add_webhook_fields.sql` - Webhook delivery tracking
- `004_make_user_id_nullable.sql` - **Drops foreign key constraint**

### Integrated Mode (Phase 10+)
The microservice integrates with the main Next.js application and requires valid user references.

**Required Migration:**
- `005_restore_user_constraints.sql` - **Restores foreign key constraint**

---

## Migration Files

### 001: Core Tables (Phase 1)
**Purpose**: Create base workflow tracking tables
**Tables Created:**
- `llm_workflow_jobs` - Job tracking with status
- `llm_webhook_attempts` - Webhook delivery log
- `llm_provider_usage` - LLM cost tracking

**Foreign Keys:**
- `user_id` → `profiles(id)` (ON DELETE CASCADE)

---

### 002: External API Cache (Phase 5)
**Purpose**: Cache external API responses for cost reduction
**Tables Created:**
- `external_api_cache` - LRU cache with TTL support

**Features:**
- LRU eviction based on memory limits
- Configurable TTL per service
- Hit count tracking

---

### 003: Webhook Fields (Phase 7)
**Purpose**: Track webhook delivery failures and debug mode
**Columns Added:**
- `webhook_permanently_failed` (boolean)
- `debug_mode` (boolean)

**Features:**
- Tracks failed webhook deliveries
- Enables verbose logging for debugging

---

### 004: Make user_id Nullable (Phase 9)
**Purpose**: Enable standalone microservice testing

**⚠️ CRITICAL CHANGE**:
- **Drops foreign key constraint** `llm_workflow_jobs_user_id_fkey`
- Makes `user_id` nullable

**Why**: Allows testing without access to `profiles` table

**Impact**:
- ✅ Microservice can operate independently
- ✅ No dependency on main app database
- ⚠️ No referential integrity on `user_id`
- ⚠️ Application must validate `user_id` if provided

---

### 005: Restore User Constraints (Phase 10) 🔜
**Purpose**: Restore data integrity for main app integration

**⚠️ MUST APPLY BEFORE PHASE 10**

**Changes**:
- Cleans up invalid `user_id` values
- Restores foreign key constraint
- Enforces referential integrity

**Prerequisites**:
- Main app `profiles` table accessible
- All existing `user_id` values are valid or NULL

**How to Apply**:
```bash
# Verify profiles table is accessible
psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles;"

# Apply migration
psql $DATABASE_URL -f migrations/005_restore_user_constraints.sql

# Verify constraint restored
psql $DATABASE_URL -c "\d llm_workflow_jobs" | grep "Foreign-key"
```

---

## How to Apply Migrations

### Method 1: Direct psql (Recommended)
```bash
# Load DATABASE_URL from .env.local
source .env.local

# Apply forward migration
psql $DATABASE_URL -f migrations/001_create_llm_tables.sql

# Rollback migration
psql $DATABASE_URL -f migrations/001_create_llm_tables_down.sql
```

### Method 2: Using npm script
```bash
# If you add a migration script to package.json
npm run db:migrate
```

### Method 3: Docker exec (if using docker-compose)
```bash
docker exec -i llm-api psql $DATABASE_URL < migrations/001_create_llm_tables.sql
```

---

## Migration Checklist

### Before Phase 10 Integration

- [ ] Verify all Phases 1-9 migrations applied (001-004)
- [ ] Test microservice in standalone mode
- [ ] Confirm `user_id` foreign key constraint is dropped
- [ ] Document any test data with invalid `user_id` values

### During Phase 10 Integration

- [ ] **Apply Migration 005** to restore foreign key constraint
- [ ] Clean up test records with NULL or invalid `user_id`
- [ ] Verify `profiles` table is accessible
- [ ] Test TypeScript client with valid user IDs
- [ ] Update API endpoints to require `user_id`

### Post-Integration Verification

- [ ] Confirm foreign key constraint exists: `llm_workflow_jobs_user_id_fkey`
- [ ] Test cascading deletes (delete user → deletes workflow jobs)
- [ ] Verify all new workflows have valid `user_id`
- [ ] Monitor for foreign key violations in logs

---

## Rollback Strategy

If Phase 10 integration fails, rollback to standalone mode:

```bash
# Rollback Migration 005
psql $DATABASE_URL -f migrations/005_restore_user_constraints_down.sql

# Verify constraint removed
psql $DATABASE_URL -c "\d llm_workflow_jobs" | grep "Foreign-key"
# Should return empty (no foreign keys)
```

---

## Best Practices

1. **Always Review Before Applying**
   - Read migration SQL carefully
   - Understand what will change
   - Test in development first

2. **Backup Before Major Changes**
   ```bash
   pg_dump $DATABASE_URL > backup_before_migration_005.sql
   ```

3. **Sequential Application**
   - Apply migrations in order (001 → 002 → 003 → 004 → 005)
   - Never skip migrations
   - Never apply migrations out of order

4. **Test Rollbacks**
   - Verify rollback migrations work
   - Test in development environment
   - Have recovery plan ready

5. **Document Custom Migrations**
   - Add comments explaining WHY
   - Document prerequisites
   - Include verification queries

---

## Migration History

| # | Name | Phase | Applied | Notes |
|---|------|-------|---------|-------|
| 001 | create_llm_tables | 1 | ✅ | Core tables with foreign keys |
| 002 | external_api_cache | 5 | ✅ | LRU cache for API responses |
| 003 | webhook_fields | 7 | ✅ | Webhook failure tracking |
| 004 | make_user_id_nullable | 9 | ✅ | **Drops FK constraint** for standalone mode |
| 005 | restore_user_constraints | 10 | ⏳ | **Restores FK constraint** for integration |

---

## Troubleshooting

### Migration 005 Fails with Foreign Key Violation

**Error**: `insert or update on table "llm_workflow_jobs" violates foreign key constraint`

**Cause**: Existing `user_id` values don't exist in `profiles` table

**Solution**:
```sql
-- Find invalid user_id values
SELECT DISTINCT user_id FROM llm_workflow_jobs
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = llm_workflow_jobs.user_id
  );

-- Clean up (set to NULL or delete)
UPDATE llm_workflow_jobs SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = llm_workflow_jobs.user_id
  );
```

### Cannot Access profiles Table

**Error**: `relation "profiles" does not exist`

**Cause**: Microservice database doesn't have access to main app schema

**Solution**:
1. Verify both services use same database
2. Check schema search path: `SHOW search_path;`
3. Grant permissions: `GRANT SELECT ON profiles TO llm_service_user;`

---

## References

- **Phase 9 Summary**: `../PHASE_9_COMPLETE.md`
- **Testing Guide**: `../TESTING_GUIDE.md`
- **Schema Documentation**: `../app/db/models.py`
