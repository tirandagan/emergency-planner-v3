#!/bin/bash

echo "=========================================="
echo "POST-DEPLOYMENT WEBHOOK TEST"
echo "=========================================="
echo ""

# Load environment
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

API_SECRET="${LLM_WEBHOOK_SECRET}"
SERVICE_URL="https://llm-service-api-6vrk.onrender.com"

echo "1. Checking diagnostic endpoints..."
echo "-----------------------------------"

echo "Next.js diagnostic:"
NEXTJS_SIG=$(curl -s https://beprepared.ai/api/debug/check-webhook-secret | jq -r '.testSignature')
echo "  Test signature: $NEXTJS_SIG"

echo ""
echo "LLM Service diagnostic:"
LLM_SIG=$(curl -s "$SERVICE_URL/api/v1/debug/webhook-config" | jq -r '.test_signature')
echo "  Test signature: $LLM_SIG"

echo ""
if [ "$NEXTJS_SIG" = "$LLM_SIG" ]; then
    echo "✅ Signatures match - configuration is correct"
else
    echo "❌ Signatures DON'T match - there's still a problem"
    exit 1
fi

echo ""
echo "2. Submitting test workflow job..."
echo "-----------------------------------"

RESPONSE=$(curl -s -X POST "$SERVICE_URL/api/v1/workflow" \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: $API_SECRET" \
  -d "{
    \"workflow_name\": \"emergency_contacts\",
    \"user_id\": \"5b7c7916-2ebc-44d4-a8d1-4c958657a150\",
    \"username\": \"tiran@tirandagan.com\",
    \"action\": \"webhook signature test\",
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

JOB_ID=$(echo $RESPONSE | jq -r '.job_id')

if [ "$JOB_ID" = "null" ] || [ -z "$JOB_ID" ]; then
    echo "❌ Failed to submit job"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Job submitted: $JOB_ID"
echo ""
echo "3. Monitoring job completion..."
echo "-----------------------------------"

for i in {1..60}; do
    sleep 2
    STATUS=$(curl -s -H "X-API-Secret: $API_SECRET" "$SERVICE_URL/api/v1/status/$JOB_ID" | jq -r '.status')

    if [ "$STATUS" = "completed" ]; then
        echo "✅ Job completed!"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ Job failed"
        break
    else
        echo "  Status: $STATUS (${i}0s elapsed)"
    fi
done

echo ""
echo "4. Checking webhook delivery..."
echo "-----------------------------------"

# Wait a bit for webhook to be delivered
sleep 3

# Check last webhook in database
LAST_WEBHOOK=$(curl -s "https://beprepared.ai/api/admin/llm-callbacks/history?limit=1" | jq -r '.webhooks[0]')

WEBHOOK_JOB_ID=$(echo "$LAST_WEBHOOK" | jq -r '.callbackId')
SIGNATURE_VALID=$(echo "$LAST_WEBHOOK" | jq -r '.signatureValid')

echo "Latest webhook:"
echo "  Job ID: $WEBHOOK_JOB_ID"
echo "  Signature valid: $SIGNATURE_VALID"

echo ""
if [ "$SIGNATURE_VALID" = "true" ]; then
    echo "🎉 SUCCESS! Webhook signature verification PASSED!"
    echo ""
    echo "The deployment fixed the issue. Webhooks are now working correctly."
else
    echo "❌ FAILED! Webhook signature verification still failing"
    echo ""
    echo "Next steps:"
    echo "1. Check Render logs for both services"
    echo "2. Verify environment variables are set correctly"
    echo "3. Try manual redeploy of both services"
fi

echo ""
echo "=========================================="
