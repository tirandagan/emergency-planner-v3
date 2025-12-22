#!/bin/bash

echo "================================="
echo "WEBHOOK CONFIGURATION COMPARISON"
echo "================================="
echo ""

echo "Fetching Next.js configuration..."
NEXTJS_RESPONSE=$(curl -s https://beprepared.ai/api/debug/check-webhook-secret)
NEXTJS_STATUS=$?

if [ $NEXTJS_STATUS -ne 0 ]; then
  echo "❌ Failed to fetch Next.js configuration"
  exit 1
fi

echo "✅ Next.js configuration fetched"
echo ""
echo "Next.js:"
echo "$NEXTJS_RESPONSE" | jq .
echo ""

NEXTJS_CONFIGURED=$(echo "$NEXTJS_RESPONSE" | jq -r '.configured')
NEXTJS_HASH=$(echo "$NEXTJS_RESPONSE" | jq -r '.secretHash')
NEXTJS_SIGNATURE=$(echo "$NEXTJS_RESPONSE" | jq -r '.testSignature')

echo "Fetching LLM Service configuration..."
LLM_RESPONSE=$(curl -s https://llm-service-api.onrender.com/api/v1/debug/webhook-config)
LLM_STATUS=$?

if [ $LLM_STATUS -ne 0 ]; then
  echo "❌ Failed to fetch LLM Service configuration"
  echo "   Service may still be deploying or endpoint not available"
  echo ""
  echo "Expected LLM Service values (should match Next.js):"
  echo "  secret_hash: $NEXTJS_HASH"
  echo "  test_signature: $NEXTJS_SIGNATURE"
  exit 1
fi

# Check if response is JSON
if echo "$LLM_RESPONSE" | jq . >/dev/null 2>&1; then
  echo "✅ LLM Service configuration fetched"
  echo ""
  echo "LLM Service:"
  echo "$LLM_RESPONSE" | jq .
  echo ""

  LLM_CONFIGURED=$(echo "$LLM_RESPONSE" | jq -r '.configured')
  LLM_HASH=$(echo "$LLM_RESPONSE" | jq -r '.secret_hash')
  LLM_SIGNATURE=$(echo "$LLM_RESPONSE" | jq -r '.test_signature')

  echo "================================="
  echo "COMPARISON RESULTS"
  echo "================================="
  echo ""

  if [ "$NEXTJS_CONFIGURED" = "true" ] && [ "$LLM_CONFIGURED" = "true" ]; then
    echo "✅ Both services configured"
  else
    echo "❌ Configuration mismatch:"
    echo "   Next.js: $NEXTJS_CONFIGURED"
    echo "   LLM Service: $LLM_CONFIGURED"
  fi
  echo ""

  if [ "$NEXTJS_HASH" = "$LLM_HASH" ]; then
    echo "✅ Secret hashes match"
    echo "   Hash: $NEXTJS_HASH"
  else
    echo "❌ Secret hashes DO NOT match!"
    echo "   Next.js:     $NEXTJS_HASH"
    echo "   LLM Service: $LLM_HASH"
    echo ""
    echo "   ACTION REQUIRED: Secrets are different!"
  fi
  echo ""

  if [ "$NEXTJS_SIGNATURE" = "$LLM_SIGNATURE" ]; then
    echo "✅ Test signatures match"
    echo "   Signature: $NEXTJS_SIGNATURE"
    echo ""
    echo "🎉 SUCCESS! Webhook signatures should work correctly."
  else
    echo "❌ Test signatures DO NOT match!"
    echo "   Next.js:     $NEXTJS_SIGNATURE"
    echo "   LLM Service: $LLM_SIGNATURE"
    echo ""
    echo "   ACTION REQUIRED:"
    echo "   1. Verify LLM_WEBHOOK_SECRET in Render for both services"
    echo "   2. Ensure no trailing spaces/newlines in the secret"
    echo "   3. Redeploy both services"
  fi
else
  echo "❌ LLM Service returned non-JSON response:"
  echo "$LLM_RESPONSE"
  echo ""
  echo "Service may still be deploying or there's a deployment error."
  echo "Check Render logs for details."
fi
