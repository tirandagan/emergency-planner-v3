#!/bin/bash

# Check webhook secrets in the LLM service database
# This helps identify if jobs have per-job secrets that don't match the global secret

echo "=================================================="
echo "LLM SERVICE JOB WEBHOOK SECRET CHECKER"
echo "=================================================="
echo ""

# Load database URL from .env.local
if [ -f "LLM_service/.env.local" ]; then
    export $(grep -v '^#' LLM_service/.env.local | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in LLM_service/.env.local"
    exit 1
fi

echo "Checking for jobs with webhook_secret set..."
echo ""

# Query jobs with webhook secrets
psql "$DATABASE_URL" <<SQL
SELECT
    id,
    webhook_url,
    webhook_secret IS NOT NULL as has_secret,
    LENGTH(webhook_secret) as secret_length,
    LEFT(webhook_secret, 10) as secret_preview,
    status,
    created_at
FROM workflow_jobs
WHERE webhook_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;
SQL

echo ""
echo "Expected global secret preview: xAZd/X36nt..."
echo ""
echo "If any jobs have a different secret_preview, they will fail signature verification!"
