-- Database Diagnostics for user_activity_log Performance Issue
-- Run this in Supabase SQL Editor or via psql

-- 1. Check table size and row count
SELECT
  schemaname,
  relname AS tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||relname)) AS indexes_size,
  n_live_tup AS estimated_rows
FROM pg_stat_user_tables
WHERE relname = 'user_activity_log';

-- 2. Check if indexes exist
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_activity_log';

-- 3. Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'user_activity_log';

-- 4. Check for table bloat
SELECT
  schemaname,
  tablename,
  n_dead_tup AS dead_tuples,
  n_live_tup AS live_tuples,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_percent,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'user_activity_log';

-- 5. Run ANALYZE to update statistics (DO THIS!)
ANALYZE user_activity_log;

-- 6. Check query plan for the slow query
EXPLAIN ANALYZE
SELECT "id", "user_id", "activity_type", "created_at"
FROM "user_activity_log"
ORDER BY "created_at" DESC
LIMIT 20;

-- 7. Optional: Archive old logs (if table is huge)
-- Uncomment and adjust date as needed
-- DELETE FROM user_activity_log
-- WHERE created_at < NOW() - INTERVAL '90 days';

-- 8. Optional: Run VACUUM FULL (reclaims disk space, but locks table)
-- Only run during maintenance window
-- VACUUM FULL user_activity_log;
