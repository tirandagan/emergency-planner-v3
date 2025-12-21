#!/bin/bash

# Usage: ./monitor_job.bash <job_id>

if [ -z "$1" ]; then
  echo "Usage: $0 <job_id>"
  exit 1
fi

JOB_ID=$1

# Load environment variables
set -a
source "$(dirname "$0")/.env.local"
set +a

echo "=== Monitoring Job: $JOB_ID ==="
echo ""

# Monitor job status until complete
while true; do
  RESPONSE=$(curl -s -X GET \
    "https://llm-service-api-6vrk.onrender.com/api/v1/status/$JOB_ID" \
    -H "X-API-Secret: $LLM_WEBHOOK_SECRET")

  STATUS=$(echo "$RESPONSE" | jq -r '.status')

  echo "[$(date '+%H:%M:%S')] Status: $STATUS"

  # Check if job is complete
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "cancelled" ]; then
    echo ""
    echo "=== Job Complete! ==="
    echo "$RESPONSE" | jq '.'
    echo ""
    echo "✅ Webhook should have been sent to: http://localhost:3000/api/webhooks/llm-callback"
    echo "✅ Check your browser for toast notification (within 10 seconds)"
    echo "✅ Or check: http://localhost:3000/admin/debug?tab=callbacks"
    break
  fi

  # Show progress if available
  STEP=$(echo "$RESPONSE" | jq -r '.current_step // "N/A"')
  STEPS_DONE=$(echo "$RESPONSE" | jq -r '.steps_completed // 0')
  TOTAL_STEPS=$(echo "$RESPONSE" | jq -r '.total_steps // 0')

  if [ "$TOTAL_STEPS" != "0" ] && [ "$TOTAL_STEPS" != "null" ]; then
    echo "         Progress: $STEPS_DONE/$TOTAL_STEPS - $STEP"
  fi

  # Wait 2 seconds before next check
  sleep 2
done
