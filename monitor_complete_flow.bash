#!/bin/bash

# Complete monitoring script for LLM job and webhook delivery

JOB_ID="${1:-0ca73051-0684-445d-b42a-99bd1e7899ab}"

echo "═══════════════════════════════════════════════════════════════"
echo "  LLM Webhook Callback System - Complete Flow Monitor"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Job ID: $JOB_ID"
echo "Webhook URL: https://beprepared.ai/api/webhooks/llm-callback"
echo ""
echo "✅ Step 1: Monitoring job status on LLM service..."
echo "✅ Step 2: Watching for webhook delivery"
echo "✅ Step 3: Checking database for callback storage"
echo ""
echo "───────────────────────────────────────────────────────────────"

# Load environment
cd "$(dirname "$0")/LLM_service"
set -a
source .env.local
set +a

echo ""

# Monitor loop
ITERATION=0
while true; do
  ITERATION=$((ITERATION + 1))

  # Get job status
  RESPONSE=$(curl -s -X GET \
    "https://llm-service-api-6vrk.onrender.com/api/v1/status/$JOB_ID" \
    -H "X-API-Secret: $LLM_WEBHOOK_SECRET")

  STATUS=$(echo "$RESPONSE" | jq -r '.status // "unknown"')
  TIMESTAMP=$(date '+%H:%M:%S')

  echo "[$TIMESTAMP] Iteration $ITERATION - Job Status: $STATUS"

  # Show progress if available
  if [ "$STATUS" = "processing" ]; then
    STEP=$(echo "$RESPONSE" | jq -r '.current_step // "N/A"')
    STEPS_DONE=$(echo "$RESPONSE" | jq -r '.steps_completed // 0')
    TOTAL_STEPS=$(echo "$RESPONSE" | jq -r '.total_steps // 0')

    if [ "$TOTAL_STEPS" != "0" ] && [ "$TOTAL_STEPS" != "null" ]; then
      echo "           Progress: $STEPS_DONE/$TOTAL_STEPS - $STEP"
    fi
  fi

  # Check if job is terminal state
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "cancelled" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Job Finished! Status: $STATUS"
    echo "═══════════════════════════════════════════════════════════════"

    # Show job details
    echo "$RESPONSE" | jq '.'

    echo ""
    echo "───────────────────────────────────────────────────────────────"
    echo "  Waiting for webhook delivery (5 seconds)..."
    echo "───────────────────────────────────────────────────────────────"

    sleep 5

    # Check database for webhook
    echo ""
    echo "Checking database for webhook callback..."

    cd /home/tiran/emergency-planner-v2
    CALLBACK_COUNT=$(PGPASSWORD=Y53KI3KyAXVE1WfQ psql -h db.mtvpyrqixtwwndwdvfxp.supabase.co -p 6543 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM llm_callbacks WHERE external_job_id = '$JOB_ID';" 2>/dev/null | xargs)

    if [ "$CALLBACK_COUNT" -gt 0 ]; then
      echo ""
      echo "✅ ✅ ✅  WEBHOOK RECEIVED! ✅ ✅ ✅"
      echo ""

      # Show callback details
      PGPASSWORD=Y53KI3KyAXVE1WfQ psql -h db.mtvpyrqixtwwndwdvfxp.supabase.co -p 6543 -U postgres -d postgres -c "
        SELECT
          callback_id,
          signature_valid,
          event_type,
          workflow_name,
          created_at
        FROM llm_callbacks
        WHERE external_job_id = '$JOB_ID'
        ORDER BY created_at DESC
        LIMIT 1;
      " 2>/dev/null

      echo ""
      echo "═══════════════════════════════════════════════════════════════"
      echo "  🎉 SUCCESS! Complete Flow Verified!"
      echo "═══════════════════════════════════════════════════════════════"
      echo ""
      echo "✅ Job completed on LLM service"
      echo "✅ Webhook delivered to production app"
      echo "✅ Callback stored in database"
      echo ""
      echo "Next steps:"
      echo "1. Open https://beprepared.ai/admin/debug?tab=callbacks"
      echo "2. You should see the callback in the table"
      echo "3. If you were logged in, you should have received a toast notification"
      echo ""

    else
      echo ""
      echo "⚠️  WARNING: Job completed but webhook not found in database"
      echo ""
      echo "Possible reasons:"
      echo "1. Webhook is still in transit (wait a few more seconds)"
      echo "2. Signature verification failed"
      echo "3. Network error during webhook delivery"
      echo ""
      echo "Check LLM service logs for webhook delivery status:"
      echo "curl https://llm-service-api-6vrk.onrender.com/api/v1/logs (if available)"
      echo ""
      echo "Or check your production app logs on your hosting platform"
      echo ""
    fi

    break
  fi

  # Wait before next check
  sleep 3
done
