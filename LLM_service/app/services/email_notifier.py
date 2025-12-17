"""
Email notification service for webhook delivery failures.

Sends admin notifications via Resend API when webhooks fail permanently
after all retry attempts are exhausted.
"""

import logging
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class EmailNotificationError(Exception):
    """Raised when email notification fails."""
    pass


class EmailNotifier:
    """
    Email notification service using Resend API.

    Features:
    - HTML email templates with color-coded severity
    - Webhook failure notifications to admin
    - Error tracking and retry capability
    """

    def __init__(self):
        """Initialize email notifier with Resend API."""
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.FROM_EMAIL
        self.admin_email = settings.ADMIN_EMAIL
        self.base_url = "https://api.resend.com"

    def send_webhook_failure_notification(
        self,
        job_id: str,
        workflow_name: str,
        webhook_url: str,
        error_message: str,
        attempt_count: int
    ) -> bool:
        """
        Send email notification for permanent webhook delivery failure.

        Args:
            job_id: Workflow job UUID
            workflow_name: Name of workflow that completed
            webhook_url: Webhook URL that failed
            error_message: Error message from last delivery attempt
            attempt_count: Number of delivery attempts made

        Returns:
            True if email sent successfully, False otherwise

        Raises:
            EmailNotificationError: If email sending fails critically
        """
        subject = f"🚨 Webhook Delivery Failed: {workflow_name}"

        html_body = self._build_failure_email_html(
            job_id=job_id,
            workflow_name=workflow_name,
            webhook_url=webhook_url,
            error_message=error_message,
            attempt_count=attempt_count
        )

        return self._send_email(
            to=self.admin_email,
            subject=subject,
            html=html_body
        )

    def _build_failure_email_html(
        self,
        job_id: str,
        workflow_name: str,
        webhook_url: str,
        error_message: str,
        attempt_count: int
    ) -> str:
        """
        Build HTML email body for webhook failure notification.

        Args:
            job_id: Workflow job UUID
            workflow_name: Name of workflow
            webhook_url: Failed webhook URL
            error_message: Error message
            attempt_count: Number of attempts

        Returns:
            HTML email body
        """
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webhook Delivery Failed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 Webhook Delivery Failed</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Permanent failure after {attempt_count} attempts</p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">Job Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; width: 140px; color: #6b7280;">Job ID:</td>
                    <td style="padding: 8px 0; font-family: monospace; color: #111827;">{job_id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Workflow:</td>
                    <td style="padding: 8px 0; color: #111827;">{workflow_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Webhook URL:</td>
                    <td style="padding: 8px 0; word-break: break-all; color: #111827;">{webhook_url}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Attempts:</td>
                    <td style="padding: 8px 0; color: #dc2626;">{attempt_count} (max retries exhausted)</td>
                </tr>
            </table>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">Error Message</h2>
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; border-radius: 4px;">
                <code style="color: #991b1b; font-size: 14px; word-break: break-word;">{error_message}</code>
            </div>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">Next Steps</h2>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">Check webhook endpoint availability and logs</li>
                <li style="margin-bottom: 8px;">Verify webhook URL configuration is correct</li>
                <li style="margin-bottom: 8px;">Review firewall/network settings for outbound connections</li>
                <li style="margin-bottom: 8px;">Check webhook signature validation on receiver</li>
                <li>Monitor LLM service logs for additional context</li>
            </ul>
        </div>

        <div style="margin-top: 16px; padding: 12px; background: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>Note:</strong> The workflow job completed successfully, but the result webhook could not be delivered.
                The job result is stored in the database and can be retrieved via the API.
            </p>
        </div>
    </div>

    <div style="margin-top: 20px; padding: 16px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">LLM Workflow Microservice</p>
        <p style="margin: 4px 0 0 0;">Automated notification from beprepared.ai</p>
    </div>
</body>
</html>
"""

    def _send_email(self, to: str, subject: str, html: str) -> bool:
        """
        Send email via Resend API.

        Args:
            to: Recipient email address
            subject: Email subject line
            html: HTML email body

        Returns:
            True if sent successfully, False otherwise

        Raises:
            EmailNotificationError: If sending fails critically
        """
        url = f"{self.base_url}/emails"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "from": self.from_email,
            "to": [to],
            "subject": subject,
            "html": html
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(url, json=payload, headers=headers)

                if response.status_code == 200:
                    logger.info(f"Email notification sent successfully to {to}")
                    return True
                else:
                    logger.error(
                        f"Failed to send email notification: "
                        f"status={response.status_code}, body={response.text}"
                    )
                    return False

        except httpx.RequestError as e:
            error_msg = f"Email notification request failed: {str(e)}"
            logger.error(error_msg)
            raise EmailNotificationError(error_msg)

        except Exception as e:
            error_msg = f"Unexpected error sending email: {str(e)}"
            logger.error(error_msg)
            raise EmailNotificationError(error_msg)
