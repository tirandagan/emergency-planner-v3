#!/bin/bash

# Configuration
CONCURRENCY=5 #or up to 5
SERVICE_URL="https://llm-service-api-6vrk.onrender.com"
# Load secret from .env.local if available, else use provided value
if [ -f ".env.local" ]; then
    source .env.local
fi
API_SECRET=${LLM_WEBHOOK_SECRET:-"xAZd/X36nt1+U813leiiboWFgbm7+CsWxQYl8RON6r0="}

echo "🚀 Starting concurrency test: Submitting $CONCURRENCY jobs..."

job_ids=()

# 1. Submit jobs in parallel
for i in $(seq 1 $CONCURRENCY); do
    echo "Submitting job $i..."
    response=$(curl -s -X POST "$SERVICE_URL/api/v1/workflow" \
      -H "Content-Type: application/json" \
      -H "X-API-Secret: $API_SECRET" \
      -d "{
        \"workflow_name\": \"emergency_contacts\",
        \"user_id\": \"5b7c7916-2ebc-44d4-a8d1-4c958657a150\",
        \"username\": \"tiran@tirandagan.com\",
        \"action\": \"concurrency test $i\",
        \"webhook_url\": \"https://beprepared.ai/api/webhooks/llm-callback\",
        \"input_data\": {
          \"lat\": 47.6062,
          \"lng\": -122.3321,
          \"city\": \"Seattle\",
          \"state\": \"WA\",
          \"country\": \"USA\",
          \"location\": \"Seattle, WA\",
          \"family_size\": 4,
          \"scenarios\": [\"earthquake\"],
          \"duration\": \"72 hours\",
          \"user_tier\": \"PRO\",
          \"static_contacts\": \"911, poison control\"
        }
      }")
    
    job_id=$(echo $response | jq -r '.job_id')
    if [ "$job_id" != "null" ]; then
        echo "✅ Job $i submitted: $job_id"
        job_ids+=($job_id)
    else
        echo "❌ Job $i failed to submit: $response"
    fi
done

echo ""
echo "⏳ Waiting for jobs to complete (checking every 5 seconds)..."
echo "------------------------------------------------------------"

# 2. Monitor jobs until all are finished
while true; do
    all_finished=true
    completed=0
    failed=0
    running=0
    
    for job_id in "${job_ids[@]}"; do
        status_resp=$(curl -s -H "X-API-Secret: $API_SECRET" "$SERVICE_URL/api/v1/status/$job_id")
        status=$(echo $status_resp | jq -r '.status')
        
        case $status in
            "completed")
                ((completed++))
                ;;
            "failed")
                ((failed++))
                error=$(echo $status_resp | jq -r '.error_message')
                echo "🚨 Job $job_id FAILED: $error"
                ;;
            *)
                ((running++))
                all_finished=false
                ;;
        esac
    done
    
    echo "Status: $completed Completed, $failed Failed, $running Running"
    
    if [ "$all_finished" = true ]; then
        break
    fi
    
    sleep 5
done

echo "------------------------------------------------------------"
echo "🏁 Test complete!"
if [ $failed -eq 0 ]; then
    echo "✨ SUCCESS: All $CONCURRENCY jobs finished without errors."
else
    echo "⚠️  WARNING: $failed jobs failed. Check the logs above."
fi

