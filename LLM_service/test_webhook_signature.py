#!/usr/bin/env python3
"""
Test webhook signature generation and delivery

This script sends a test webhook to both the debug endpoint and the real endpoint
to compare signature validation.
"""

import json
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.webhook_sender import WebhookSender
from app.config import settings

def test_webhook_signature():
    """Send test webhooks to debug and verify signature validation"""

    print("=" * 80)
    print("WEBHOOK SIGNATURE TEST")
    print("=" * 80)

    # Test payload (simple)
    test_payload = {
        "event": "workflow.completed",
        "job_id": "test-signature-debug-001",
        "workflow_name": "test_workflow",
        "result": {
            "output": {
                "test": "data"
            }
        }
    }

    # Display configuration
    print(f"\nConfiguration:")
    print(f"  Secret length: {len(settings.LLM_WEBHOOK_SECRET)}")
    print(f"  Secret preview: {settings.LLM_WEBHOOK_SECRET[:10]}...")

    # Manually serialize to show what will be sent
    payload_json = json.dumps(test_payload, separators=(',', ':'), sort_keys=True)
    print(f"\nPayload (serialized):")
    print(f"  Length: {len(payload_json)}")
    print(f"  First 200 chars: {payload_json[:200]}")
    print(f"  Has spaces after colons: {': ' in payload_json}")
    print(f"  Has spaces after commas: {', ' in payload_json}")

    # Send to debug endpoint first
    debug_url = "http://localhost:3000/api/debug/webhook-test"
    print(f"\n{'=' * 80}")
    print(f"TEST 1: Sending to DEBUG endpoint: {debug_url}")
    print(f"{'=' * 80}")

    with WebhookSender() as sender:
        try:
            success, status_code, response_text, duration_ms = sender.send_webhook(
                url=debug_url,
                event_type="test",
                payload=test_payload
            )

            print(f"\nResult:")
            print(f"  Success: {success}")
            print(f"  Status: {status_code}")
            print(f"  Duration: {duration_ms}ms")

            if response_text:
                try:
                    response_json = json.loads(response_text)
                    print(f"\nDebug Response:")
                    print(json.dumps(response_json, indent=2))
                except:
                    print(f"  Response: {response_text[:200]}")

        except Exception as e:
            print(f"  ERROR: {e}")

    # Send to real endpoint
    real_url = "http://localhost:3000/api/webhooks/llm-callback"
    print(f"\n{'=' * 80}")
    print(f"TEST 2: Sending to REAL endpoint: {real_url}")
    print(f"{'=' * 80}")

    with WebhookSender() as sender:
        try:
            success, status_code, response_text, duration_ms = sender.send_webhook(
                url=real_url,
                event_type="test",
                payload=test_payload
            )

            print(f"\nResult:")
            print(f"  Success: {success}")
            print(f"  Status: {status_code}")
            print(f"  Duration: {duration_ms}ms")

            if response_text:
                try:
                    response_json = json.loads(response_text)
                    print(f"\nReal Webhook Response:")
                    print(json.dumps(response_json, indent=2))
                except:
                    print(f"  Response: {response_text[:200]}")

        except Exception as e:
            print(f"  ERROR: {e}")

    print(f"\n{'=' * 80}")
    print("NEXT STEPS:")
    print("=" * 80)
    print("1. Check the Next.js dev server logs for detailed signature comparison")
    print("2. Look for '[LLM Webhook]' and '[Webhook Test]' log messages")
    print("3. Compare the signatures shown in both endpoints")
    print("=" * 80)


if __name__ == "__main__":
    test_webhook_signature()
