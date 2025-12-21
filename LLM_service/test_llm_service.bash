#!/bin/bash

# Load environment variables from .env.local
set -a
source "$(dirname "$0")/.env.local"
set +a

# Check if LLM_WEBHOOK_SECRET is set
if [ -z "$LLM_WEBHOOK_SECRET" ]; then
  echo "Error: LLM_WEBHOOK_SECRET not found in .env.local"
  exit 1
fi

curl -X POST "https://llm-service-api-6vrk.onrender.com/api/v1/workflow" \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: $LLM_WEBHOOK_SECRET" \
  -d '{
    "workflow_name": "emergency_contacts",
    "user_id": "5b7c7916-2ebc-44d4-a8d1-4c958657a150",
    "username": "tiran@tirandagan.com",
    "action": "generate emergency contacts",
    "input_data": {
      "lat": 47.6062,
      "lng": -122.3321,
      "city": "Seattle",
      "state": "WA",
      "country": "USA",
      "location": "Seattle, WA",
      "family_size": 4,
      "duration": "72 hours",
      "user_tier": "PRO",
      "static_contacts": "911, poison control, FEMA, Washington State Emergency Management",
      "scenarios": ["earthquake", "wildfire"]
    },
    "webhook_url": "http://localhost:3000/api/webhooks/llm-callback",
    "priority": 0,
    "debug_mode": false
  }'
