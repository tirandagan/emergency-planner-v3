"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, manualVerificationRequests, userActivityLog } from "@/db/schema";
import {
  sendWelcomeEmail,
  sendManualVerificationNotification,
} from "@/lib/email";
import { eq } from "drizzle-orm";
import { logSystemError } from "@/lib/system-logger";

// --- Type Definitions ---

export type AuthResult =
  | { success: true; message?: string }
  | { success: false; error: string; field?: string };

export type OAuthProvider = "google" | "facebook";

// --- Validation Schemas ---

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

const verifyCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const manualVerificationSchema = z.object({
  reason: z.enum(["LOST_ACCESS", "EMAIL_NOT_ARRIVING", "OTHER"], {
    errorMap: () => ({ message: "Please select a reason" }),
  }),
  details: z.string().optional(),
  alternateContact: z.string().optional(),
});

// --- Server Actions ---

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(formData: FormData): Promise<AuthResult> {
  try {
    // Parse and validate form data
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      termsAccepted: formData.get("termsAccepted") === "true",
    };

    const validation = signUpSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
        field: firstError.path[0]?.toString(),
      };
    }

    const { email, password } = validation.data;
    const supabase = await createClient();

    // Create Supabase auth user
    // Supabase will automatically send a 6-digit verification code
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          email,
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message === "User already registered"
          ? "An account with this email already exists"
          : authError.message,
        field: "email",
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Failed to create user account",
      };
    }

    // Create profile in database
    try {
      await db.insert(profiles).values({
        id: authData.user.id,
        email,
        subscriptionTier: "FREE",
        role: "USER",
      });
    } catch (dbError) {
      // If profile creation fails, the user will be in Supabase but not in our DB
      // The auth trigger should handle this, but log it just in case
      console.error("[Auth] Failed to create profile:", dbError);
    }

    // Supabase sends the verification email automatically
    // No need to send via Resend

    // Store email for verification (since session might not persist)
    return {
      success: true,
      message: "Account created! Please check your email for verification.",
    };
  } catch (error) {
    console.error("[Auth] Sign up error:", error);

    await logSystemError(error, {
      category: 'auth_error',
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: 'Creating new user account with email/password',
      metadata: {
        operation: 'signUpWithEmail',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues creating your account. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmailPassword(formData: FormData): Promise<AuthResult> {
  let userId: string | undefined;

  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "true",
    };

    const validation = signInSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
        field: firstError.path[0]?.toString(),
      };
    }

    const { email, password } = validation.data;
    const supabase = await createClient();

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.user) {
      userId = data.user.id;
    }

    if (error) {
      // Don't reveal if email exists or not (security best practice)
      return {
        success: false,
        error: "Invalid email or password",
        field: "email",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Authentication failed",
      };
    }

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      return {
        success: false,
        error: "Please verify your email before logging in",
        field: "email",
      };
    }

    // Log user activity
    try {
      // Update last_login_at timestamp
      await db
        .update(profiles)
        .set({
          lastLoginAt: new Date(),
        })
        .where(eq(profiles.id, data.user.id));

      // Log activity to userActivityLog table
      await db.insert(userActivityLog).values({
        userId: data.user.id,
        activityType: 'login',
        metadata: {
          timestamp: new Date().toISOString(),
          loginMethod: 'email_password',
        },
        createdAt: new Date(),
      });
      console.log(`[Activity] Logged login activity for user ${data.user.id}`);
    } catch (activityError) {
      console.error('[Activity] Failed to log user activity:', activityError);

      await logSystemError(activityError, {
        category: 'database_error',
        userId: data.user.id,
        component: 'AuthActions',
        route: '/app/actions/auth',
        userAction: 'Logging user login activity',
        metadata: {
          operation: 'logUserActivity',
        },
      });
      // Don't fail the login if activity logging fails
    }

    return {
      success: true,
      message: "Logged in successfully",
    };
  } catch (error) {
    console.error("[Auth] Sign in error:", error);

    await logSystemError(error, {
      category: 'auth_error',
      userId,
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: 'Signing in with email/password',
      metadata: {
        operation: 'signInWithEmailPassword',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues signing you in. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Verify email with 6-digit code
 */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<AuthResult> {
  let userId: string | undefined;

  try {
    const validation = verifyCodeSchema.safeParse({ code });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
        field: "code",
      };
    }

    const supabase = await createClient();

    // Verify OTP with Supabase using email (no session required)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (data?.user) {
      userId = data.user.id;
    }

    if (error) {
      return {
        success: false,
        error: error.message === "Token has expired or is invalid"
          ? "Invalid or expired code. Please request a new one."
          : error.message,
        field: "code",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Verification failed. Please try again.",
      };
    }

    // Send welcome email (optional, non-blocking)
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.user.id),
    });

    if (profile) {
      await sendWelcomeEmail(profile.email, profile.fullName || undefined);
    }

    return {
      success: true,
      message: "Email verified successfully!",
    };
  } catch (error) {
    console.error("[Auth] Verify code error:", error);

    await logSystemError(error, {
      category: 'auth_error',
      userId,
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: 'Verifying email with 6-digit code',
      metadata: {
        operation: 'verifyEmailCode',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues verifying your email. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(email: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Trigger Supabase to send a new verification email
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Verification code sent! Please check your email.",
    };
  } catch (error) {
    console.error("[Auth] Resend code error:", error);

    await logSystemError(error, {
      category: 'external_service',
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: 'Resending email verification code',
      metadata: {
        operation: 'resendVerificationCode',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues sending the verification code. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  try {
    const rawData = {
      email: formData.get("email"),
    };

    const validation = passwordResetSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
        field: "email",
      };
    }

    const { email } = validation.data;
    const supabase = await createClient();

    // Trigger password reset - Supabase will send the email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    });

    if (error) {
      console.error("[Auth] Password reset error:", error);
    }

    // Always return success to avoid email enumeration
    return {
      success: true,
      message: "If an account exists with this email, you will receive password reset instructions.",
    };
  } catch (error) {
    console.error("[Auth] Password reset error:", error);

    await logSystemError(error, {
      category: 'external_service',
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: 'Requesting password reset',
      metadata: {
        operation: 'requestPasswordReset',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues sending the password reset email. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Update password after reset
 */
export async function updatePassword(formData: FormData): Promise<AuthResult> {
  let userId: string | undefined;

  try {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
      return {
        success: false,
        error: "Please fill in all fields",
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: "Passwords don't match",
        field: "confirmPassword",
      };
    }

    // Validate password strength
    const passwordSchema = z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number");

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
        field: "password",
      };
    }

    const supabase = await createClient();

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;

    // Update password (user must have valid reset token from email link)
    const { error } = await supabase.auth.updateUser({
      password: validation.data,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password updated successfully!",
    };
  } catch (error) {
    console.error("[Auth] Update password error:", error);

    await logSystemError(error, {
      category: 'auth_error',
      userId,
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: 'Updating password after reset',
      metadata: {
        operation: 'updatePassword',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues updating your password. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Submit manual verification request
 */
export async function submitManualVerificationRequest(
  formData: FormData
): Promise<AuthResult> {
  let userId: string | undefined;

  try {
    const rawData = {
      reason: formData.get("reason"),
      details: formData.get("details") || undefined,
      alternateContact: formData.get("alternateContact") || undefined,
    };

    const validation = manualVerificationSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
        field: validation.error.errors[0].path[0]?.toString(),
      };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return {
        success: false,
        error: "No active session. Please sign in again.",
      };
    }

    const { reason, details, alternateContact } = validation.data;

    // Check if user already has a pending request
    const existingRequest = await db.query.manualVerificationRequests.findFirst({
      where: eq(manualVerificationRequests.userId, user.id),
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      return {
        success: false,
        error: "You already have a pending verification request",
      };
    }

    // Create manual verification request
    await db.insert(manualVerificationRequests).values({
      userId: user.id,
      reason,
      details,
      alternateContact,
      status: "PENDING",
    });

    // Notify admin (optional, non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@emergency-planner.com";
    await sendManualVerificationNotification(adminEmail, {
      userId: user.id,
      userEmail: user.email!,
      reason,
      details,
      alternateContact,
    });

    return {
      success: true,
      message: "Request submitted! We'll review it within 24-48 hours.",
    };
  } catch (error) {
    console.error("[Auth] Manual verification request error:", error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: 'Submitting manual verification request',
      metadata: {
        operation: 'submitManualVerificationRequest',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues submitting your request. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[Auth] Sign out error:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  // redirect() throws NEXT_REDIRECT which is expected behavior
  // Don't wrap it in try-catch as it needs to propagate to trigger the redirect
  redirect("/");
}

/**
 * Sign in with OAuth provider (Google, Facebook)
 */
export async function signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      console.error(`[Auth] OAuth ${provider} sign in error:`, error);
      return {
        success: false,
        error: `Failed to sign in with ${provider}. Please try again.`,
      };
    }

    if (data.url) {
      redirect(data.url);
    }

    return {
      success: false,
      error: "OAuth flow did not return a redirect URL",
    };
  } catch (error) {
    console.error(`[Auth] OAuth ${provider} error:`, error);

    await logSystemError(error, {
      category: 'external_service',
      component: 'AuthActions',
      route: '/app/actions/auth',
      userAction: `Signing in with ${provider} OAuth`,
      metadata: {
        operation: 'signInWithOAuth',
        provider,
      },
    });

    return {
      success: false,
      error: `We're experiencing issues signing in with ${provider}. Our team has been notified and will resolve this shortly.`,
    };
  }
}

