"""
Flask Test Webhook Server - Phase 7 Testing Tool

This is a standalone Flask application for testing webhook delivery
from the LLM microservice. It provides a simple web UI to view received
webhooks and validate HMAC signatures.

⚠️  THIS IS A TESTING TOOL ONLY - NOT PART OF PRODUCTION SERVICE

Usage:
    python tests/webhook_test_server/app.py

Features:
    - Receives webhooks on POST /webhook
    - Validates HMAC signatures
    - Stores webhooks in memory for UI display
    - Web UI at http://localhost:5001/
"""

import hmac
import hashlib
import json
from datetime import datetime
from flask import Flask, request, render_template_string, jsonify
from collections import deque

app = Flask(__name__)

# In-memory storage for received webhooks (last 50)
webhook_history = deque(maxlen=50)

# Default webhook secret (should match LLM_WEBHOOK_SECRET in .env.local)
DEFAULT_SECRET = "default-webhook-secret-change-in-production"


def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify HMAC SHA-256 signature.

    Args:
        payload: Raw request body bytes
        signature: Signature header value (format: sha256=<hex_digest>)
        secret: Secret key for HMAC verification

    Returns:
        True if signature is valid, False otherwise
    """
    if not signature.startswith("sha256="):
        return False

    expected_digest = signature[7:]  # Remove "sha256=" prefix

    actual_digest = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(expected_digest, actual_digest)


@app.route('/')
def index():
    """Display webhook history with Bootstrap UI."""
    return render_template_string(HTML_TEMPLATE, webhooks=list(webhook_history))


@app.route('/webhook', methods=['POST'])
def receive_webhook():
    """
    Receive webhook from LLM microservice.

    Validates signature and stores webhook in history.

    Returns:
        200 OK: Webhook received and validated
        400 Bad Request: Invalid signature or missing headers
    """
    # Get headers
    signature = request.headers.get('X-Webhook-Signature', '')
    event_type = request.headers.get('X-Webhook-Event', 'unknown')
    content_type = request.headers.get('Content-Type', '')

    # Get raw body for signature verification
    raw_body = request.get_data()

    # Parse JSON payload
    try:
        payload = request.get_json()
    except Exception as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400

    # Verify signature
    signature_valid = verify_signature(raw_body, signature, DEFAULT_SECRET)

    # Store webhook in history
    webhook_record = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_type": event_type,
        "signature": signature,
        "signature_valid": signature_valid,
        "payload": payload,
        "headers": {
            "Content-Type": content_type,
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event_type,
        }
    }

    webhook_history.appendleft(webhook_record)  # Add to front

    print(f"\n{'='*80}")
    print(f"📥 Webhook Received: {event_type}")
    print(f"   Timestamp: {webhook_record['timestamp']}")
    print(f"   Signature Valid: {'✅ YES' if signature_valid else '❌ NO'}")
    print(f"   Job ID: {payload.get('job_id', 'N/A')}")
    print(f"   Status: {payload.get('status', 'N/A')}")
    print(f"{'='*80}\n")

    # Return appropriate status
    if signature_valid:
        return jsonify({
            "status": "success",
            "message": "Webhook received and validated",
            "event_type": event_type,
            "timestamp": webhook_record["timestamp"]
        }), 200
    else:
        return jsonify({
            "status": "error",
            "message": "Invalid webhook signature",
            "event_type": event_type
        }), 400


@app.route('/clear', methods=['POST'])
def clear_history():
    """Clear webhook history."""
    webhook_history.clear()
    return jsonify({"status": "success", "message": "History cleared"}), 200


# HTML Template with Bootstrap
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webhook Test Server</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding: 20px; background: #f8f9fa; }
        .webhook-card { margin-bottom: 15px; border-left: 4px solid #0d6efd; }
        .webhook-card.valid { border-left-color: #198754; }
        .webhook-card.invalid { border-left-color: #dc3545; }
        .json-payload { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto; }
        .badge-valid { background-color: #198754; }
        .badge-invalid { background-color: #dc3545; }
        .header-container { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: flex; gap: 20px; margin-top: 15px; }
        .stat-card { flex: 1; text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px; }
        .empty-state { text-align: center; padding: 60px 20px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-container">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1>🧪 Webhook Test Server</h1>
                    <p class="text-muted mb-0">Testing tool for LLM Microservice webhooks (Phase 7)</p>
                </div>
                <button class="btn btn-danger" onclick="clearHistory()">Clear History</button>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <h3 class="mb-1">{{ webhooks|length }}</h3>
                    <small class="text-muted">Total Webhooks</small>
                </div>
                <div class="stat-card">
                    <h3 class="mb-1 text-success">{{ webhooks|selectattr('signature_valid')|list|length }}</h3>
                    <small class="text-muted">Valid Signatures</small>
                </div>
                <div class="stat-card">
                    <h3 class="mb-1 text-danger">{{ webhooks|rejectattr('signature_valid')|list|length }}</h3>
                    <small class="text-muted">Invalid Signatures</small>
                </div>
            </div>

            <div class="alert alert-info mt-3 mb-0">
                <strong>Webhook Endpoint:</strong> <code>http://localhost:5001/webhook</code><br>
                <strong>Secret:</strong> <code>default-webhook-secret-change-in-production</code>
            </div>
        </div>

        {% if webhooks %}
            {% for webhook in webhooks %}
            <div class="card webhook-card {{ 'valid' if webhook.signature_valid else 'invalid' }}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <strong>{{ webhook.event_type }}</strong>
                        <span class="badge {{ 'badge-valid' if webhook.signature_valid else 'badge-invalid' }} ms-2">
                            {{ 'Valid Signature ✓' if webhook.signature_valid else 'Invalid Signature ✗' }}
                        </span>
                    </div>
                    <small class="text-muted">{{ webhook.timestamp }}</small>
                </div>
                <div class="card-body">
                    <h6>Headers:</h6>
                    <pre class="json-payload">{{ webhook.headers | tojson(indent=2) }}</pre>

                    <h6 class="mt-3">Payload:</h6>
                    <pre class="json-payload">{{ webhook.payload | tojson(indent=2) }}</pre>
                </div>
            </div>
            {% endfor %}
        {% else %}
            <div class="empty-state">
                <h3>📭 No webhooks received yet</h3>
                <p>Webhooks will appear here when they are sent to <code>http://localhost:5001/webhook</code></p>
            </div>
        {% endif %}
    </div>

    <script>
        function clearHistory() {
            if (confirm('Clear all webhook history?')) {
                fetch('/clear', { method: 'POST' })
                    .then(() => location.reload())
                    .catch(err => alert('Error clearing history: ' + err));
            }
        }

        // Auto-refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
    </script>
</body>
</html>
"""


if __name__ == '__main__':
    print("\n" + "="*80)
    print("🧪 Webhook Test Server Starting...")
    print("="*80)
    print(f"\n✅ Web UI:         http://localhost:5001/")
    print(f"✅ Webhook URL:    http://localhost:5001/webhook")
    print(f"✅ Secret:         {DEFAULT_SECRET}")
    print(f"\nℹ️  This is a TESTING TOOL ONLY - Not part of production service")
    print(f"ℹ️  Press Ctrl+C to stop\n")
    print("="*80 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=True)
