# Unified Authentication with OTP Implementation Plan

## Overview
Redesign the authentication flow to provide a seamless, simplified experience where users enter their email/password once, and the system intelligently routes them to either:
- **Existing users**: OTP verification (required every 10 logins) or password-based login
- **New users**: Signup form with policy acceptance

## Core Requirements

1. **Single Entry Point**: One page for email/password entry
2. **Smart Routing**: System detects if user exists and routes accordingly
3. **OTP Every 10 Logins**: Enforce OTP verification every 10th password login
4. **Password Fallback**: Allow password login with OTP as option
5. **Seamless Signup**: New users smoothly transition to signup flow

---

## Database Changes ✅ COMPLETED

### Profiles Table - New Fields
```sql
ALTER TABLE "profiles" ADD COLUMN "login_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "profiles" ADD COLUMN "last_otp_at" timestamp with time zone;
ALTER TABLE "profiles" ADD COLUMN "password_logins_since_otp" integer DEFAULT 0 NOT NULL;
```

**Purpose:**
- `login_count`: Total number of successful logins
- `last_otp_at`: Timestamp of last OTP authentication
- `password_logins_since_otp`: Counter to track when to require OTP (resets after OTP login)

**Migration Status:** ✅ Generated and applied (0006_long_tiger_shark.sql)

---

## File Structure

### New Files to Create

```
src/
├── app/
│   └── auth/
│       └── page.tsx                          # NEW: Unified auth entry point
├── components/
│   └── auth/
│       ├── UnifiedAuthForm.tsx               # NEW: Main auth component
│       ├── OTPVerification.tsx               # NEW: OTP entry modal
│       ├── SignupFormSimplified.tsx          # NEW: Simplified signup for new users
│       └── AuthFlowManager.tsx               # NEW: Manages auth state machine
└── app/
    └── actions/
        └── auth-unified.ts                   # NEW: Unified auth actions with OTP logic
```

### Files to Modify

```
src/
├── app/
│   └── auth/
│       ├── login/page.tsx                    # MODIFY: Redirect to /auth
│       └── sign-up/page.tsx                  # MODIFY: Redirect to /auth
├── app/actions/
│   └── auth.ts                              # MODIFY: Add OTP tracking to existing functions
└── components/auth/
    ├── LoginForm.tsx                         # DEPRECATE: Keep for backward compat initially
    └── SignupForm.tsx                        # DEPRECATE: Keep for backward compat initially
```

### Files to Eventually Remove (After Testing)
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/app/auth/login/` directory
- `src/app/auth/sign-up/` directory

---

## Authentication Flow State Machine

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User visits /auth                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           Enter Email & Password (UnifiedAuthForm)              │
│  • Email input                                                   │
│  • Password input                                                │
│  • Single "Continue" button                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                  [Check if user exists]
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
    [User Exists]                     [User Doesn't Exist]
          │                                   │
          ▼                                   ▼
┌──────────────────────┐          ┌────────────────────────┐
│  Verify Password     │          │  Show Signup Form      │
│  (Supabase Auth)     │          │  • Confirm password    │
└──────┬───────────────┘          │  • Accept T&C          │
       │                          │  • Create account      │
       │                          │  • Send OTP            │
       │                          └────────────────────────┘
       │                                   │
       ▼                                   ▼
[Check OTP Requirement]              [Redirect to OTP
  password_logins_since_otp >= 10?     Verification]
       │                                   
   ┌───┴───┐
   │       │
[Yes]    [No]
   │       │
   │       └────────────────────┐
   ▼                            ▼
┌──────────────────┐   ┌────────────────────┐
│  Generate OTP    │   │  Allow Login       │
│  Send Email      │   │  Increment counter │
│  Show Modal      │   │  Redirect /dash    │
└──────┬───────────┘   └────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  OTP Verification Modal              │
│  • Enter 6-digit code                │
│  • Option: "Use password instead"   │
│  • Resend OTP link                  │
└──────┬───────────────────────────────┘
       │
   ┌───┴──────────────────┐
   │                      │
[OTP Valid]      [Use Password Instead]
   │                      │
   ▼                      ▼
[Reset counter]    [Verify password again]
[Update last_otp_at]     │
   │                      │
   └──────────┬───────────┘
              ▼
    ┌─────────────────────┐
    │  Successful Login   │
    │  Redirect /dashboard│
    └─────────────────────┘
```

---

## Component Architecture

### 1. UnifiedAuthForm.tsx
**Purpose:** Main entry point for authentication

**State Management:**
```typescript
type AuthState = 
  | { step: 'email_password'; error?: string }
  | { step: 'signup'; email: string; password: string }
  | { step: 'otp_verification'; email: string; requiresOtp: boolean }
  | { step: 'loading' }
  | { step: 'success' };
```

**Key Functions:**
- `handleInitialSubmit()`: Checks if user exists, validates password
- `determineNextStep()`: Routes to signup, OTP, or direct login
- `handleSignupComplete()`: Processes new user registration
- `handleOTPComplete()`: Processes OTP verification

**Props:**
```typescript
interface UnifiedAuthFormProps {
  redirectUrl?: string;
  onSuccess?: () => void;
}
```

### 2. OTPVerification.tsx
**Purpose:** Modal for OTP entry with password fallback

**Features:**
- 6-digit OTP input (styled, auto-focus)
- Countdown timer for OTP expiration
- "Resend OTP" button
- "Use password instead" option
- Error handling and validation

**Props:**
```typescript
interface OTPVerificationProps {
  open: boolean;
  email: string;
  onVerified: () => void;
  onPasswordFallback: () => void;
  onClose: () => void;
}
```

### 3. SignupFormSimplified.tsx
**Purpose:** Lightweight signup for new users (already have email/password)

**Fields:**
- Email (pre-filled, read-only)
- Password (pre-filled, hidden)
- Confirm Password
- Terms & Privacy acceptance (with modals)

**Differences from current SignupForm:**
- Email and password already validated
- No password strength indicator (already checked)
- Focus on T&C acceptance only

### 4. AuthFlowManager.tsx
**Purpose:** Manages authentication state and orchestrates flow

**Responsibilities:**
- State machine implementation
- Error handling
- Loading states
- Success/failure routing

---

## Server Actions (`auth-unified.ts`)

### 1. checkUserExists()
```typescript
export async function checkUserExists(email: string): Promise<{
  exists: boolean;
  needsVerification?: boolean;
}>;
```

**Logic:**
- Query Supabase Auth for user by email
- Check if email is verified
- Return existence status

### 2. validateCredentials()
```typescript
export async function validateCredentials(
  email: string,
  password: string
): Promise<{
  success: boolean;
  userId?: string;
  requiresOtp: boolean;
  error?: string;
}>;
```

**Logic:**
- Attempt Supabase signin
- If successful, check `password_logins_since_otp >= 10`
- Return whether OTP is required
- Don't create session yet if OTP required

### 3. generateAndSendOTP()
```typescript
export async function generateAndSendOTP(
  email: string
): Promise<{ success: boolean; error?: string }>;
```

**Logic:**
- Use Supabase OTP generation
- Send via Supabase email (configured in dashboard)
- Return success status

### 4. verifyOTP()
```typescript
export async function verifyOTP(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }>;
```

**Logic:**
- Verify OTP with Supabase
- If valid:
  - Update `password_logins_since_otp = 0`
  - Update `last_otp_at = NOW()`
  - Update `login_count += 1`
  - Create session
- Return result

### 5. completePasswordLogin()
```typescript
export async function completePasswordLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }>;
```

**Logic:**
- Create Supabase session
- Update `password_logins_since_otp += 1`
- Update `login_count += 1`
- Update `last_login_at = NOW()`
- Return result

### 6. createAccountWithOTP()
```typescript
export async function createAccountWithOTP(
  email: string,
  password: string,
  termsAccepted: boolean
): Promise<{ success: boolean; error?: string }>;
```

**Logic:**
- Create Supabase auth user
- Initialize profile with:
  - `login_count = 0`
  - `password_logins_since_otp = 0`
  - `last_otp_at = NULL`
- Send OTP for verification
- Return result

---

## Security Considerations

### 1. Rate Limiting
**Issue:** OTP generation could be abused
**Solution:** 
- Implement rate limiting on OTP generation (3 attempts per 15 minutes)
- Track failed OTP attempts in user_activity_log

### 2. OTP Expiration
**Issue:** Old OTPs should not work indefinitely
**Solution:**
- Supabase OTPs expire after 60 minutes (default)
- Show countdown timer in UI
- Provide "resend" functionality

### 3. Password Bypass Prevention
**Issue:** Users might try to avoid OTP by resetting count
**Solution:**
- OTP requirement is based on server-side counter
- Counter only resets on successful OTP verification
- Cannot be manipulated client-side

### 4. Email Enumeration Protection
**Issue:** Attackers could discover valid emails
**Solution:**
- Generic error messages for failed logins
- Same timing for existing/non-existing users
- Don't reveal if account exists during initial check

### 5. Session Management
**Issue:** Multiple active sessions
**Solution:**
- Use Supabase's built-in session management
- Proper logout functionality
- Session expiration after inactivity

---

## Email Templates

### OTP Email Template
**Subject:** "Your Emergency Planner Sign-In Code"

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Sign-In Code</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Your Sign-In Code</h1>
        
        <p>You requested a sign-in code for Emergency Planner.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="font-size: 32px; letter-spacing: 8px; margin: 0;">{{ .Token }}</h2>
        </div>
        
        <p><strong>This code expires in 60 minutes.</strong></p>
        
        <p>If you didn't request this code, you can safely ignore this email.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 14px;">
            Emergency Planner<br>
            <a href="{{ .SiteURL }}" style="color: #2563eb;">emergencyplanner.com</a>
        </p>
    </div>
</body>
</html>
```

**Configure in:** Supabase Dashboard → Authentication → Email Templates → Magic Link

---

## UI/UX Specifications

### Unified Auth Page Design

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│          Emergency Planner Logo         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │     Sign In or Create Account     │ │
│  │                                   │ │
│  │  Email: [___________________]    │ │
│  │                                   │ │
│  │  Password: [___________________] │ │
│  │            [👁 show]              │ │
│  │                                   │ │
│  │  [     Continue     ]             │ │
│  │                                   │ │
│  │  ────────── or ──────────        │ │
│  │                                   │ │
│  │  [Sign in with Google]            │ │
│  │                                   │ │
│  │  Forgot password?                 │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│    Privacy Policy  •  Terms of Service │
└─────────────────────────────────────────┘
```

### OTP Modal Design

```
┌─────────────────────────────────────────┐
│  ✕                                       │
│                                         │
│     Enter Your Verification Code       │
│                                         │
│  We sent a 6-digit code to:            │
│  user@example.com                       │
│                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │   │ │   │ │   │ │   │ │   │ │   │ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│                                         │
│  Code expires in: 09:45                │
│                                         │
│  Didn't receive it? Resend code        │
│                                         │
│  [ Verify Code ]                        │
│                                         │
│  Or use your password instead          │
│                                         │
└─────────────────────────────────────────┘
```

### Signup Transition

```
┌─────────────────────────────────────────┐
│                                         │
│     Welcome! Let's Create Your Account  │
│                                         │
│  Email: user@example.com (✓ verified)  │
│                                         │
│  Confirm Password: [___________________]│
│                                         │
│  □ I agree to the Terms of Service     │
│    and Privacy Policy                   │
│                                         │
│  [ Create Account ]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Plan

### Unit Tests

**Component Tests:**
- [ ] UnifiedAuthForm renders correctly
- [ ] State transitions work properly
- [ ] Error states display correctly
- [ ] OTPVerification validates input correctly
- [ ] SignupFormSimplified handles submission

**Server Action Tests:**
- [ ] checkUserExists returns correct status
- [ ] validateCredentials checks OTP requirement
- [ ] generateAndSendOTP creates valid OTP
- [ ] verifyOTP updates counters correctly
- [ ] completePasswordLogin updates database
- [ ] createAccountWithOTP initializes profile

### Integration Tests

**Full Flow Tests:**
- [ ] New user signup → OTP → dashboard
- [ ] Existing user login (no OTP required)
- [ ] Existing user login (OTP required on 10th)
- [ ] OTP verification success
- [ ] OTP verification failure
- [ ] Password fallback from OTP
- [ ] OAuth flow integration
- [ ] Forgot password flow

### Manual Testing Checklist

**New User Flow:**
- [ ] Enter non-existent email and password
- [ ] System recognizes new user
- [ ] Signup form appears with email pre-filled
- [ ] Accept terms and create account
- [ ] Receive OTP email
- [ ] Enter OTP and verify
- [ ] Redirect to dashboard

**Existing User - Normal Login:**
- [ ] Enter existing email and password
- [ ] Password is correct
- [ ] Login count < 10 since last OTP
- [ ] Direct login to dashboard
- [ ] Counter increments

**Existing User - OTP Required:**
- [ ] Enter existing email and password
- [ ] Password is correct
- [ ] Password logins since OTP = 10
- [ ] OTP modal appears
- [ ] Receive OTP email
- [ ] Enter OTP correctly
- [ ] Counter resets to 0
- [ ] Redirect to dashboard

**OTP Fallback:**
- [ ] OTP modal appears
- [ ] Click "use password instead"
- [ ] Re-enter password
- [ ] Counter increments (not reset)
- [ ] Successful login

**Error Scenarios:**
- [ ] Wrong password shows error
- [ ] Invalid OTP shows error
- [ ] Expired OTP handled gracefully
- [ ] Network errors handled
- [ ] Rate limiting works

---

## Migration Strategy

### Phase 1: Add New System (No Breaking Changes)
1. Create new `/auth` page alongside existing `/auth/login` and `/auth/sign-up`
2. Deploy with both systems active
3. Test thoroughly in production
4. Monitor for issues

### Phase 2: Soft Redirect
1. Add redirects from old pages to new unified page
2. Keep old pages as fallback
3. Monitor user behavior
4. Collect feedback

### Phase 3: Full Migration
1. Remove old auth pages
2. Update all links to point to `/auth`
3. Remove deprecated components
4. Clean up unused code

### Rollback Plan
- Keep old auth system code for 2 weeks
- Database changes are additive (no breaking changes)
- Easy to revert by re-enabling old pages

---

## Performance Considerations

### Database Queries
- Add index on `password_logins_since_otp` for faster OTP checks
- Use connection pooling for auth queries
- Cache user existence checks (with short TTL)

### Email Delivery
- Supabase handles email delivery
- Monitor delivery rates
- Set up email delivery monitoring

### User Experience
- Show loading states clearly
- Provide instant feedback on errors
- Auto-focus next input field in OTP entry
- Remember email (optional, with security consideration)

---

## Configuration

### Environment Variables
```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# New (if needed)
OTP_REQUIREMENT_THRESHOLD=10  # Require OTP every N logins
OTP_EXPIRATION_MINUTES=60
OTP_RATE_LIMIT_ATTEMPTS=3
OTP_RATE_LIMIT_WINDOW_MINUTES=15
```

### Supabase Configuration
1. **Email Templates**: Configure OTP template in dashboard
2. **Rate Limiting**: Enable built-in rate limiting
3. **Auth Settings**: 
   - OTP expiration: 60 minutes
   - Email confirmation required: Yes
   - Minimum password length: 8

---

## Success Metrics

### Key Performance Indicators
- **Authentication Success Rate**: > 95%
- **OTP Delivery Rate**: > 98%
- **Average Login Time**: < 5 seconds
- **User Satisfaction**: Measured via feedback
- **Support Tickets**: < 5% increase

### Monitoring
- Track OTP generation/verification rates
- Monitor failed login attempts
- Track user flow completion rates
- Monitor email delivery status

---

## Timeline Estimate

**Total Estimated Time: 2-3 days**

### Day 1: Core Implementation (8 hours)
- Server actions and OTP logic (3 hours)
- UnifiedAuthForm component (2 hours)
- OTPVerification component (2 hours)
- Basic testing (1 hour)

### Day 2: Signup Flow & UI Polish (8 hours)
- SignupFormSimplified component (2 hours)
- AuthFlowManager state machine (2 hours)
- UI/UX refinements (2 hours)
- Integration testing (2 hours)

### Day 3: Email Templates & Testing (6 hours)
- Email template configuration (1 hour)
- Comprehensive testing (3 hours)
- Bug fixes and edge cases (2 hours)

---

## Risks and Mitigations

### Risk 1: OTP Email Delivery Failures
**Impact:** Users cannot login
**Mitigation:** 
- Implement password fallback option
- Monitor email delivery rates
- Provide clear error messages

### Risk 2: User Confusion
**Impact:** Increased support tickets
**Mitigation:**
- Clear UI instructions
- Helpful error messages
- In-app tooltips/help

### Risk 3: OTP Counter Sync Issues
**Impact:** Users asked for OTP too frequently or not frequently enough
**Mitigation:**
- Atomic database updates
- Transaction handling
- Regular data integrity checks

### Risk 4: Breaking Existing OAuth Flow
**Impact:** OAuth users cannot login
**Mitigation:**
- Keep OAuth flow separate
- Test OAuth thoroughly
- Maintain backward compatibility

---

## Questions to Resolve

1. **OTP Requirement Frequency**: Confirm 10 logins is the right threshold
2. **Password Fallback**: Should there be a limit to how many times users can avoid OTP?
3. **Remember Device**: Should we add "remember this device" to skip OTP?
4. **Email Template**: Use Supabase default or custom HTML?
5. **OAuth Integration**: Should OAuth logins also count toward the 10-login threshold?
6. **Forgot Password**: How does this interact with the OTP system?

---

## Next Steps

Once this plan is approved:

1. **Review and Feedback**: Address any concerns or modifications
2. **Create Task Breakdown**: Break into smaller, reviewable PRs
3. **Set Up Monitoring**: Prepare analytics and logging
4. **Begin Implementation**: Start with Phase 1 (server actions)
5. **Iterative Testing**: Test each component as it's built

---

## Appendix: Code Snippets

### Example: OTP Requirement Check
```typescript
async function checkOTPRequired(userId: string): Promise<boolean> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: {
      passwordLoginsSinceOtp: true,
    },
  });

  const threshold = parseInt(process.env.OTP_REQUIREMENT_THRESHOLD || "10");
  return (profile?.passwordLoginsSinceOtp ?? 0) >= threshold;
}
```

### Example: Update Login Counters
```typescript
async function updateLoginCounters(
  userId: string,
  isOtpLogin: boolean
): Promise<void> {
  if (isOtpLogin) {
    await db
      .update(profiles)
      .set({
        loginCount: sql`${profiles.loginCount} + 1`,
        passwordLoginsSinceOtp: 0,
        lastOtpAt: new Date(),
        lastLoginAt: new Date(),
      })
      .where(eq(profiles.id, userId));
  } else {
    await db
      .update(profiles)
      .set({
        loginCount: sql`${profiles.loginCount} + 1`,
        passwordLoginsSinceOtp: sql`${profiles.passwordLoginsSinceOtp} + 1`,
        lastLoginAt: new Date(),
      })
      .where(eq(profiles.id, userId));
  }
}
```

---

## Conclusion

This unified authentication system with OTP provides:
- ✅ Simplified user experience
- ✅ Enhanced security through periodic OTP requirements
- ✅ Flexibility with password fallback
- ✅ Seamless signup flow for new users
- ✅ Backward compatibility during migration

The implementation is structured, testable, and maintainable. Ready to proceed with your approval!














