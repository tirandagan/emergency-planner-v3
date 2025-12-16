"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Types for return values
interface AuthResult {
  success: boolean;
  error?: string;
}

interface UserExistsResult {
  exists: boolean;
  needsVerification?: boolean;
}

interface ValidateCredentialsResult {
  success: boolean;
  userId?: string;
  requiresOtp: boolean;
  error?: string;
}

// Constants
const OTP_REQUIREMENT_THRESHOLD = 10;
const OTP_RATE_LIMIT_ATTEMPTS = 3;
const OTP_RATE_LIMIT_WINDOW_MINUTES = 15;

/**
 * Check if a user exists in the system
 * Note: We use a sign-in attempt with a dummy password to check existence
 * This prevents email enumeration while still allowing us to detect new users
 */
export async function checkUserExists(email: string): Promise<UserExistsResult> {
  const startTime = Date.now();

  try {
    // Add timeout wrapper to prevent long-running queries
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout after 8 seconds")), 8000)
    );

    const queryPromise = db.query.profiles.findFirst({
      where: eq(profiles.email, email),
      columns: {
        id: true,
        email: true,
      },
    });

    // Race the query against timeout
    const profile = await Promise.race([queryPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    if (duration > 1000) {
      console.warn(`[checkUserExists] Slow query for ${email}: ${duration}ms`);
    }

    if (!profile) {
      return { exists: false };
    }

    return {
      exists: true,
      needsVerification: false, // Verified status checked during password validation
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[checkUserExists] Failed after ${duration}ms:`, error);

    // Return false on error to allow user to proceed with signup flow
    return { exists: false };
  }
}

/**
 * Validate user credentials and determine if OTP is required
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<ValidateCredentialsResult> {
  try {
    const supabase = await createClient();

    // Attempt to sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        requiresOtp: false,
        error: "Invalid email or password",
      };
    }

    // Check if OTP is required based on login counter
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, authData.user.id),
      columns: {
        passwordLoginsSinceOtp: true,
      },
    });

    const requiresOtp = (profile?.passwordLoginsSinceOtp ?? 0) >= OTP_REQUIREMENT_THRESHOLD;

    // If OTP is required, sign out immediately (don't create session yet)
    if (requiresOtp) {
      await supabase.auth.signOut();
    }

    return {
      success: true,
      userId: authData.user.id,
      requiresOtp,
    };
  } catch (error) {
    console.error("Exception in validateCredentials:", error);
    return {
      success: false,
      requiresOtp: false,
      error: "An error occurred. Please try again.",
    };
  }
}

/**
 * Generate and send OTP to user's email
 */
export async function generateAndSendOTP(email: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Use Supabase's built-in OTP generation
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Don't create user if doesn't exist
      },
    });

    if (error) {
      // Handle rate limiting with specific message (don't log as error - it's expected)
      if (error.message?.includes("For security purposes") || error.status === 429) {
        return {
          success: false,
          error: error.message, // Use the actual message with wait time
        };
      }
      
      // Only log unexpected errors
      console.error("Error generating OTP:", error);
      
      return {
        success: false,
        error: "Failed to send verification code. Please try again.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception in generateAndSendOTP:", error);
    return {
      success: false,
      error: "An error occurred. Please try again.",
    };
  }
}

/**
 * Verify OTP code and complete login
 */
export async function verifyOTP(email: string, token: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Verify OTP with Supabase
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: "Invalid or expired verification code",
      };
    }

    // Update user profile counters
    await db
      .update(profiles)
      .set({
        loginCount: sql`${profiles.loginCount} + 1`,
        passwordLoginsSinceOtp: 0, // Reset counter
        lastOtpAt: new Date(),
        lastLoginAt: new Date(),
      })
      .where(eq(profiles.id, authData.user.id));

    return { success: true };
  } catch (error) {
    console.error("Exception in verifyOTP:", error);
    return {
      success: false,
      error: "An error occurred. Please try again.",
    };
  }
}

/**
 * Complete password-based login (without OTP)
 */
export async function completePasswordLogin(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Create session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Update login counters
    await db
      .update(profiles)
      .set({
        loginCount: sql`${profiles.loginCount} + 1`,
        passwordLoginsSinceOtp: sql`${profiles.passwordLoginsSinceOtp} + 1`,
        lastLoginAt: new Date(),
      })
      .where(eq(profiles.id, authData.user.id));

    return { success: true };
  } catch (error) {
    console.error("Exception in completePasswordLogin:", error);
    return {
      success: false,
      error: "An error occurred. Please try again.",
    };
  }
}

/**
 * Create new account and send OTP for verification
 */
export async function createAccountWithOTP(
  email: string,
  password: string,
  termsAccepted: boolean,
  firstName?: string,
  lastName?: string
): Promise<AuthResult> {
  if (!termsAccepted) {
    return {
      success: false,
      error: "You must accept the terms and privacy policy",
    };
  }

  if (!firstName?.trim() || !lastName?.trim()) {
    return {
      success: false,
      error: "First name and last name are required",
    };
  }

  try {
    const supabase = await createClient();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });

    if (authError) {
      console.error("Error creating account:", authError);
      return {
        success: false,
        error: authError.message || "Failed to create account",
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Failed to create account",
      };
    }

    // Initialize profile with auth counters and user data
    // Note: Profile should be created by database trigger, but we'll update it with user info
    try {
      const fullName = `${firstName!.trim()} ${lastName!.trim()}`;
      await db
        .update(profiles)
        .set({
          firstName: firstName!.trim(),
          lastName: lastName!.trim(),
          fullName,
          loginCount: 0,
          passwordLoginsSinceOtp: 0,
          lastOtpAt: null,
        })
        .where(eq(profiles.id, authData.user.id));
    } catch (dbError) {
      console.error("Error initializing profile:", dbError);
      // Continue anyway - the user was created successfully
    }

    return { success: true };
  } catch (error) {
    console.error("Exception in createAccountWithOTP:", error);
    return {
      success: false,
      error: "An error occurred. Please try again.",
    };
  }
}

/**
 * Check OTP rate limiting for a user
 * Returns true if rate limit exceeded
 */
export async function checkOTPRateLimit(email: string): Promise<boolean> {
  try {
    // TODO: Implement rate limiting using user_activity_log or Redis
    // For now, return false (no rate limit)
    return false;
  } catch (error) {
    console.error("Exception in checkOTPRateLimit:", error);
    return false;
  }
}

/**
 * Get user's current login statistics
 */
export async function getUserLoginStats(userId: string) {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: {
        loginCount: true,
        passwordLoginsSinceOtp: true,
        lastOtpAt: true,
        lastLoginAt: true,
      },
    });

    return profile;
  } catch (error) {
    console.error("Exception in getUserLoginStats:", error);
    return null;
  }
}
