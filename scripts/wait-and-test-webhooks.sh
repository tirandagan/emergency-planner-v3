#!/bin/bash

echo "=========================================="
echo "WEBHOOK DEPLOYMENT VERIFICATION"
echo "=========================================="
echo ""

SERVICE_URL="https://llm-service-api-6vrk.onrender.com"

echo "Waiting for deployment to complete..."
echo "Checking Celery diagnostic endpoint every 10 seconds..."
echo ""

# Wait for Celery task to be registered (max 5 minutes)
for i in {1..30}; do
    RESPONSE=$(curl -s "$SERVICE_URL/api/v1/debug/celery-secret")

    if echo "$RESPONSE" | jq -e '.celery_worker' > /dev/null 2>&1; then
        echo "✅ Celery worker is responding!"
        break
    else
        echo "  Attempt $i/30: Worker not ready yet..."
        sleep 10
    fi
done

echo ""
echo "=========================================="
echo "DIAGNOSTIC COMPARISON"
echo "=========================================="
echo ""

# Test all diagnostic endpoints
echo "1. Next.js diagnostic:"
NEXTJS_RESPONSE=$(curl -s https://beprepared.ai/api/debug/check-webhook-secret)
echo "$NEXTJS_RESPONSE" | jq .
NEXTJS_SIG=$(echo "$NEXTJS_RESPONSE" | jq -r '.testSignature')
echo ""

echo "2. LLM Service FastAPI diagnostic:"
LLM_RESPONSE=$(curl -s "$SERVICE_URL/api/v1/debug/webhook-config")
echo "$LLM_RESPONSE" | jq .
LLM_SIG=$(echo "$LLM_RESPONSE" | jq -r '.test_signature')
echo ""

echo "3. LLM Service Celery Worker diagnostic:"
CELERY_RESPONSE=$(curl -s "$SERVICE_URL/api/v1/debug/celery-secret")
echo "$CELERY_RESPONSE" | jq .

if echo "$CELERY_RESPONSE" | jq -e '.celery_worker' > /dev/null 2>&1; then
    CELERY_SIG=$(echo "$CELERY_RESPONSE" | jq -r '.celery_worker.test_signature')
    CELERY_MATCH=$(echo "$CELERY_RESPONSE" | jq -r '.match')

    echo ""
    echo "=========================================="
    echo "COMPARISON RESULTS"
    echo "=========================================="
    echo ""
    echo "Next.js test signature:    $NEXTJS_SIG"
    echo "FastAPI test signature:    $LLM_SIG"
    echo "Celery worker signature:   $CELERY_SIG"
    echo ""

    if [ "$NEXTJS_SIG" = "$LLM_SIG" ] && [ "$LLM_SIG" = "$CELERY_SIG" ]; then
        echo "✅ ALL THREE MATCH! Webhooks should work now."
        echo ""
        echo "Proceeding to live webhook test..."
        echo ""
        bash scripts/test-webhook-post-deploy.sh
    else
        echo "❌ MISMATCH DETECTED!"
        echo ""
        if [ "$NEXTJS_SIG" != "$LLM_SIG" ]; then
            echo "  - Next.js and FastAPI don't match"
        fi
        if [ "$CELERY_MATCH" != "true" ]; then
            echo "  - FastAPI and Celery worker don't match"
        fi
        echo ""
        echo "ACTION REQUIRED:"
        echo "1. Check Render environment variables"
        echo "2. Ensure LLM_WEBHOOK_SECRET is set correctly"
        echo "3. Try manual redeploy with cache clear"
    fi
else
    echo ""
    echo "❌ Celery worker diagnostic failed"
    echo "Worker may not have the new task registered yet."
    echo "Try running this script again in a few minutes."
fi

echo ""
echo "=========================================="
