#!/bin/bash

# Test webhook by triggering a Stripe test event

echo "🧪 Testing Stripe webhook..."
echo ""
echo "This will send a test checkout.session.completed event to your webhook"
echo ""

# Replace these with your actual IDs from the last checkout session
USER_ID="${1:-test-user-id}"
TIER="${2:-BASIC}"

echo "User ID: $USER_ID"
echo "Tier: $TIER"
echo ""

stripe trigger checkout.session.completed \
  --add checkout_session:metadata.userId=$USER_ID \
  --add checkout_session:metadata.tier=$TIER \
  --forward-to localhost:3000/api/webhooks/stripe

echo ""
echo "✅ Test event sent! Check your terminal logs for the webhook processing output."

