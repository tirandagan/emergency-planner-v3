import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send 6-digit email verification code
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify Your Email - Emergency Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Verify Your Email</h2>
          <p>Thank you for signing up! Please use the following code to verify your email address:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1e40af; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send password reset email with magic link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your Password - Emergency Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetLink}</p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send welcome email after successful verification (optional)
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string
): Promise<SendEmailResult> {
  try {
    const greeting = name ? `Hi ${name}` : 'Welcome';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Emergency Planner!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">${greeting}!</h2>
          <p>Your email has been verified and your account is ready to go.</p>
          <p>With Emergency Planner, you can:</p>
          <ul style="color: #374151; line-height: 1.8;">
            <li>Build complete disaster readiness plans in minutes</li>
            <li>Get AI-powered survival strategies for your location</li>
            <li>Track your preparedness progress over time</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://emergency-planner.com'}/dashboard" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://emergency-planner.com'}/help" style="color: #1e40af;">help center</a>.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Notify admins of manual verification requests
 */
export async function sendManualVerificationNotification(
  adminEmail: string,
  requestDetails: {
    userId: string;
    userEmail: string;
    reason: string;
    details?: string;
    alternateContact?: string;
  }
): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: 'Manual Verification Request - Emergency Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Manual Verification Request</h2>
          <p>A user has requested manual email verification:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">User ID:</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${requestDetails.userId}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${requestDetails.userEmail}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Reason:</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${requestDetails.reason}</td>
            </tr>
            ${
              requestDetails.details
                ? `
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Details:</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${requestDetails.details}</td>
            </tr>
            `
                : ''
            }
            ${
              requestDetails.alternateContact
                ? `
            <tr style="background-color: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Alt Contact:</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${requestDetails.alternateContact}</td>
            </tr>
            `
                : ''
            }
          </table>
          <p style="color: #6b7280; font-size: 14px;">Please review this request in the admin dashboard.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send admin notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send password change confirmation email
 * Notifies user that their password was recently changed
 */
export async function sendPasswordChangeConfirmationEmail(
  email: string,
  name?: string
): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Changed - Emergency Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Password Changed Successfully</h2>

          ${name ? `<p>Hi ${name},</p>` : '<p>Hello,</p>'}

          <p style="margin: 16px 0;">
            Your password was recently changed for your Emergency Planner account.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 500;">
              ⚠️ If you didn't make this change, please contact support immediately.
            </p>
          </div>

          <p style="margin: 16px 0;">
            For security reasons, if this wasn't you, please:
          </p>
          <ol style="margin: 16px 0;">
            <li>Contact our support team right away</li>
            <li>Reset your password immediately</li>
            <li>Review your account activity</li>
          </ol>

          <p style="margin: 16px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/forgot-password"
               style="color: #2563eb; text-decoration: none;">
              Reset your password
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">
            This is an automated security notification from Emergency Planner.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send password change email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send plan share invitation email
 */
export async function sendPlanShareEmail(
  recipientEmail: string,
  shareData: {
    shareToken: string;
    planTitle: string;
    senderName: string;
    customMessage?: string;
    permissions: 'view' | 'edit';
  }
): Promise<SendEmailResult> {
  try {
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shared/${shareData.shareToken}`;
    const permissionText = shareData.permissions === 'edit' ? 'view and edit' : 'view';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `${shareData.senderName} shared an emergency plan with you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af; margin-bottom: 20px;">Plan Shared With You</h2>

          <p style="margin: 16px 0;">
            <strong>${shareData.senderName}</strong> has shared an emergency preparedness plan with you:
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${shareData.planTitle}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              You have ${permissionText} access to this plan
            </p>
          </div>

          ${
            shareData.customMessage
              ? `
          <div style="background: #eff6ff; border-left: 4px solid #1e40af; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-weight: 500;">Message from ${shareData.senderName}:</p>
            <p style="margin: 8px 0 0 0; color: #1f2937;">${shareData.customMessage}</p>
          </div>
          `
              : ''
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="${shareUrl}" style="background-color: #1e40af; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              View Plan
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 4px;">
            ${shareUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              📋 <strong>What's an emergency plan?</strong>
            </p>
            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
              This is a personalized disaster preparedness plan with survival strategies, evacuation routes, and essential supplies checklist.
            </p>
          </div>

          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              🆓 <strong>Create your own free plan</strong>
            </p>
            <p style="margin: 8px 0 0 0; color: #065f46; font-size: 14px;">
              Sign up for a free account to create your own personalized emergency plans powered by AI.
            </p>
            <p style="margin: 12px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/signup" style="color: #10b981; text-decoration: none; font-weight: 500;">
                Create Free Account →
              </a>
            </p>
          </div>

          <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
            This share link will expire after 30 days of inactivity.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send plan share email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send notification to plan owner when someone accesses their shared plan
 */
export async function sendShareAccessNotification(
  ownerEmail: string,
  accessData: {
    planTitle: string;
    accessedByEmail: string;
    accessedAt: Date;
    permissions: 'view' | 'edit';
  }
): Promise<SendEmailResult> {
  try {
    const accessTime = accessData.accessedAt.toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    const permissionText = accessData.permissions === 'edit' ? 'view and edit' : 'view';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: `Your plan "${accessData.planTitle}" was accessed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af; margin-bottom: 20px;">Plan Access Notification</h2>

          <p style="margin: 16px 0;">
            Someone has accessed your shared emergency plan:
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">${accessData.planTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Accessed by:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">${accessData.accessedByEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Permission:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">
                  ${permissionText.charAt(0).toUpperCase() + permissionText.slice(1)}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">When:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">${accessTime}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" style="background-color: #1e40af; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Manage Shares
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
            You can revoke access or manage all your shared plans from your dashboard.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
            This is an automated notification. You're receiving this because you shared a plan.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send share access notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
