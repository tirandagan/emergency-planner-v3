# Authentication System Documentation

**Last Updated:** December 10, 2025  
**Status:** Production Ready  
**Architecture:** Unified Auth with OTP Security

---

## Overview

beprepared.ai implements a **unified authentication system** that combines the simplicity of a single entry point with enhanced security through periodic OTP (One-Time Password) verification. This approach provides:

1. **Simplified UX**: Single form for both new and existing users
2. **Enhanced Security**: OTP verification required every 10 password logins
3. **Legal Compliance**: Scroll-to-accept policy modals with enforcement
4. **Flexible Fallback**: Password authentication always available if OTP email fails
5. **Anti-Enumeration**: Generic error messages prevent email discovery attacks

---

## Architecture

### Technology Stack

- **Authentication Provider**: Supabase Auth (email/password + OTP)
- **Frontend Framework**: Next.js 14+ App Router with React Server Components
- **Database**: PostgreSQL (Drizzle ORM)
- **UI Components**: shadcn/ui with Trust Blue theme
- **Session Management**: Supabase session cookies with middleware

### Database Schema

**Profiles Table Extensions:**
```typescript
{
  loginCount: integer,                    // Total successful logins
  lastOtpAt: timestamp,                   // Last OTP verification time
  passwordLoginsSinceOtp: integer,        // Counter for OTP enforcement
  lastLoginAt: timestamp,                 // Last successful login
  // ... other profile fields
}
```

**Purpose:**
- `loginCount`: Track total authentication events for analytics
- `lastOtpAt`: Record when user last verified via OTP
- `passwordLoginsSinceOtp`: Enforce OTP requirement every 10 logins
- `lastLoginAt`: Session management and user activity tracking

---

## User Flows

### 1. Unified Entry Point (`/auth`)

**Initial State:**
```
┌─────────────────────────────────┐
│ Welcome to beprepared.ai        │
│                                 │
│ Email:    [___________________] │
│ Password: [___________________] │
│                                 │
│ [Continue Button]               │
│                                 │
│ Forgot password?                │
│ ───── or ─────                  │
│ [Google] [Facebook] (Phase 2)   │
└─────────────────────────────────┘
```

**Logic Flow:**
1. User enters email + password
2. Click "Continue" button
3. System checks if email exists in Supabase Auth
   - **Email NOT found** → Show signup form (Flow 2)
   - **Email found** → Validate password (Flow 3)

---

### 2. New User Signup Flow

**Signup Form Display:**
```
┌─────────────────────────────────┐
│ Create Your Account             │
│                                 │
│ Email: user@example.com ✓       │
│ Confirm Password: [___________] │
│                                 │
│ Password Strength: ████░ Good   │
│                                 │
│ □ I agree to [Terms] & [Privacy]│
│                                 │
│ [Create Account]                │
└─────────────────────────────────┘
```

**Sequence:**
1. Email pre-filled from initial entry
2. User enters password confirmation
3. Real-time password strength indicator
4. User clicks Terms/Privacy links:
   - Opens scroll-to-accept modal (see section below)
   - Must scroll to bottom to enable "Accept" button
   - Both policies must be accepted
   - Checkbox becomes enabled only after both accepted
5. On form submission:
   - Create Supabase Auth user
   - Create profile record with:
     - `subscriptionTier = 'FREE'`
     - `loginCount = 0`
     - `passwordLoginsSinceOtp = 0`
     - `lastOtpAt = NULL`
   - Generate OTP via Supabase
   - Send OTP email
   - Show OTP verification modal (Flow 4)

---

### 3. Existing User Login Flow

**Password Validation:**
1. Supabase verifies password credentials
2. On success, check `passwordLoginsSinceOtp` value:

**Case A: Counter < 10 (Normal Login)**
```sql
UPDATE profiles 
SET 
  passwordLoginsSinceOtp = passwordLoginsSinceOtp + 1,
  loginCount = loginCount + 1,
  lastLoginAt = NOW()
WHERE id = user_id;
```
- Create session
- Redirect to `/dashboard`

**Case B: Counter >= 10 (OTP Required)**
```sql
-- Generate OTP via Supabase
-- Send OTP email
-- Show OTP verification modal
```
- User must enter 6-digit code OR use password fallback
- See Flow 4 for OTP verification details

---

### 4. OTP Verification Flow

**OTP Modal UI:**
```
┌─────────────────────────────────────┐
│ 🔐 Verify Your Identity             │
│                                     │
│ Check your email for a 6-digit code │
│                                     │
│ [_] [_] [_] [_] [_] [_]             │
│                                     │
│ Expires in: 58:42                   │
│                                     │
│ [Verify Code]                       │
│                                     │
│ Didn't receive the code?            │
│ [Resend OTP] (3 remaining)          │
│                                     │
│ [Use password instead] ←── Fallback │
└─────────────────────────────────────┘
```

**Verification Logic:**

**Option 1: OTP Code Entry**
- User enters 6-digit code
- Supabase validates OTP
- On success:
  ```sql
  UPDATE profiles 
  SET 
    passwordLoginsSinceOtp = 0,       -- Reset counter
    lastOtpAt = NOW(),                -- Record OTP time
    loginCount = loginCount + 1,
    lastLoginAt = NOW()
  WHERE id = user_id;
  ```
- Create session → Redirect to `/dashboard`

**Option 2: Password Fallback**
- User clicks "Use password instead"
- Re-validate password credentials
- On success:
  ```sql
  UPDATE profiles 
  SET 
    passwordLoginsSinceOtp = passwordLoginsSinceOtp + 1,  -- Still increment!
    loginCount = loginCount + 1,
    lastLoginAt = NOW()
  WHERE id = user_id;
  ```
- Create session → Redirect to `/dashboard`
- **Note**: Counter NOT reset, so OTP will be required sooner

**Rate Limiting:**
- Max 3 OTP resend requests per 15 minutes
- Prevents spam and abuse
- Countdown timer shown after each resend

---

## Policy Acceptance System

### Scroll-to-Accept Modals

**Requirements:**
1. User must read Terms of Service in full
2. User must read Privacy Policy in full
3. "Accept" button disabled until scrolled to bottom
4. Both policies must be accepted before "I agree" checkbox can be checked

**Modal Component (`PolicyModal.tsx`):**
```
┌───────────────────────────────────────────────┐
│ Terms of Service           ✅ Accepted       │ 
│                                        [X]     │
├───────────────────────────────────────────────┤
│ Please scroll to read our complete terms      │
├───────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ │
│ │ 1. Acceptance of Terms                    │ │
│ │ By accessing this service...              │ │
│ │                                           │ │
│ │ [Scrollable content area - 80vh height]  │ │
│ │                                           │ │
│ │ ... (user scrolls down) ...              │ │
│ │                                           │ │
│ │ Last updated: December 10, 2025           │ │
│ └───────────────────────────────────────────┘ │
│                ↓ Scroll to read             ⬇ │
│   [Gradient overlay + animated arrow]          │
├───────────────────────────────────────────────┤
│ ⚠️ Please scroll to the bottom to continue   │
│                       [Cancel]  [Accept] 🔒   │
└───────────────────────────────────────────────┘
```

**Scroll Detection Logic:**
```typescript
function handleScroll() {
  const element = contentRef.current;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;
  
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
  
  if (isAtBottom) {
    setHasScrolledToBottom(true);  // Enable Accept button
    setShowScrollIndicator(false); // Hide arrow
  }
}
```

**Visual Indicators:**
- Animated bouncing arrow with "Scroll to read" text
- Gradient overlay at bottom (fades as you scroll)
- Green checkmark when accepted
- Accept button disabled (gray) until scrolled

**State Management:**
```typescript
const [termsAccepted, setTermsAccepted] = useState(false);
const [privacyAccepted, setPrivacyAccepted] = useState(false);
const [termsCheckboxChecked, setTermsCheckboxChecked] = useState(false);

function handleTermsCheckboxClick(e) {
  e.preventDefault();
  if (!termsAccepted || !privacyAccepted) {
    // Show warning modal
    setShowWarningDialog(true);
    return;
  }
  setTermsCheckboxChecked(!termsCheckboxChecked);
}
```

**Warning Modal (if clicked without reading):**
```
┌─────────────────────────────────────┐
│ ⚠️ Terms Not Accepted               │
│                                     │
│ Please read and accept the Terms    │
│ of Service and Privacy Policy       │
│ before continuing.                  │
│                                     │
│                       [Got it]      │
└─────────────────────────────────────┘
```

---

## Security Features

### 1. Email Enumeration Prevention

**Problem:** Attackers can discover valid email addresses by observing different error messages.

**Solution:** Generic error messages for all failures
```typescript
// ❌ BAD - Reveals email existence
if (!userExists) {
  return { error: "No account found with this email" };
}
if (!passwordValid) {
  return { error: "Incorrect password" };
}

// ✅ GOOD - Generic message
if (!userExists || !passwordValid) {
  return { error: "Invalid email or password" };
}
```

### 2. OTP Rate Limiting

**Prevents:**
- Brute force OTP guessing
- Email spam abuse
- Resource exhaustion

**Implementation:**
```typescript
const OTP_RATE_LIMIT = {
  maxAttempts: 3,
  windowMinutes: 15,
};

// Track in session or database
if (otpRequestCount >= OTP_RATE_LIMIT.maxAttempts) {
  return { 
    error: "Too many requests. Please try again in 15 minutes." 
  };
}
```

### 3. Session Security

**Cookie Settings:**
```typescript
{
  httpOnly: true,        // Prevent XSS access
  secure: true,          // HTTPS only
  sameSite: 'lax',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60  // 7 days
}
```

**Session Validation:**
- Every protected route checks session validity
- Middleware runs on all `(protected)/*` routes
- Auto-redirect to `/auth` if session expired

### 4. Password Requirements

**Enforced via Supabase Auth:**
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Password strength meter shown in real-time
- Confirm password must match exactly

### 5. Activity Logging

**All login attempts logged:**
```typescript
{
  user_id: string,
  activity_type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'OTP_VERIFIED',
  metadata: {
    method: 'password' | 'otp',
    ip_address: string,
    user_agent: string,
  },
  created_at: timestamp,
}
```

**Stored in:** `user_activity_log` table for audit trail

---

## Error Handling

### Common Error Scenarios

**1. Invalid Credentials**
```typescript
{
  error: "Invalid email or password",
  type: "validation",
}
```

**2. OTP Expired**
```typescript
{
  error: "Verification code expired. Please request a new one.",
  type: "otp_expired",
  action: "resend_otp",
}
```

**3. OTP Invalid**
```typescript
{
  error: "Invalid verification code. Please try again.",
  type: "otp_invalid",
  remaining_attempts: 2,
}
```

**4. Rate Limit Exceeded**
```typescript
{
  error: "Too many attempts. Please try again in 15 minutes.",
  type: "rate_limit",
  retry_after: timestamp,
}
```

**5. Network/Server Error**
```typescript
{
  error: "Something went wrong. Please try again.",
  type: "server_error",
}
```

### Error Display Strategy

**UI Patterns:**
- Inline field errors (red border + message below)
- Toast notifications for system errors
- Modal alerts for critical issues
- Form-level error summary at top

**Accessibility:**
- ARIA labels on error messages
- Screen reader announcements
- Keyboard navigation support
- Error focus management

---

## Migration Strategy

### From Legacy System

**Phase 1: Add Database Fields** ✅ COMPLETE
```sql
ALTER TABLE profiles 
ADD COLUMN login_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN last_otp_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN password_logins_since_otp INTEGER DEFAULT 0 NOT NULL;
```

**Phase 2: Deploy Unified Auth UI** (NEXT)
- Deploy new `/auth` route
- Keep legacy routes active with redirects
- Monitor error rates and user feedback

**Phase 3: Update Email Templates** (NEXT)
- OTP verification email
- Welcome email referencing new flow
- Password reset email

**Phase 4: Monitoring & Optimization**
- Track OTP usage rates
- Monitor password fallback usage
- Adjust counter threshold if needed (currently 10)

### Backward Compatibility

**Legacy Routes:**
- `/auth/login` → 301 redirect to `/auth`
- `/auth/sign-up` → 301 redirect to `/auth`
- Bookmarked links continue to work
- Search engine URLs automatically update

**Session Migration:**
- Existing sessions remain valid
- No forced re-authentication
- OTP counter starts on next login

---

## Testing Checklist

### Unit Tests
- [ ] OTP counter increment logic
- [ ] Policy acceptance state management
- [ ] Error message formatting
- [ ] Rate limiting calculations
- [ ] Password validation rules

### Integration Tests
- [ ] Full signup flow (new user)
- [ ] Full login flow (existing user, < 10 logins)
- [ ] OTP verification flow (existing user, >= 10 logins)
- [ ] Password fallback flow
- [ ] Policy modal scroll detection
- [ ] Error handling for all scenarios

### E2E Tests
- [ ] Complete signup → OTP → dashboard
- [ ] 10 password logins → OTP required
- [ ] Policy acceptance enforcement
- [ ] Rate limit triggers correctly
- [ ] Forgot password flow
- [ ] Legacy URL redirects

### Security Tests
- [ ] Email enumeration prevented
- [ ] OTP brute force blocked
- [ ] Session hijacking protected
- [ ] CSRF tokens validated
- [ ] XSS injection blocked

---

## Configuration

### Environment Variables

```bash
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OTP Settings (in code)
OTP_EXPIRY_MINUTES=60
OTP_RATE_LIMIT_ATTEMPTS=3
OTP_RATE_LIMIT_WINDOW_MINUTES=15
PASSWORD_LOGINS_BEFORE_OTP=10

# Session Settings
SESSION_MAX_AGE_DAYS=7
```

### Feature Flags

```typescript
export const AUTH_FEATURES = {
  otpEnabled: true,              // Toggle OTP requirement
  otpCounterThreshold: 10,       // Logins before OTP required
  policyScrollRequired: true,    // Enforce scroll-to-accept
  passwordFallbackEnabled: true, // Allow password instead of OTP
  oAuthEnabled: false,           // Google/Facebook (Phase 2)
};
```

---

## Monitoring & Analytics

### Key Metrics

**User Authentication:**
- Total login attempts (successful vs failed)
- OTP verification rate (% who complete OTP vs password fallback)
- Average time to complete signup
- Policy acceptance time (how long users spend reading)

**Security:**
- Failed login attempts per IP
- OTP rate limit triggers
- Password reset requests
- Suspicious activity patterns

**UX Performance:**
- Signup completion rate
- OTP email delivery time
- Modal interaction patterns
- Error frequency by type

### Dashboard Queries

```sql
-- OTP usage rate
SELECT 
  COUNT(CASE WHEN method = 'otp' THEN 1 END) as otp_logins,
  COUNT(CASE WHEN method = 'password' THEN 1 END) as password_logins,
  ROUND(100.0 * COUNT(CASE WHEN method = 'otp' THEN 1 END) / COUNT(*), 2) as otp_percentage
FROM user_activity_log
WHERE activity_type = 'LOGIN_SUCCESS'
  AND created_at >= NOW() - INTERVAL '30 days';

-- Average logins between OTP
SELECT AVG(password_logins_since_otp) as avg_counter
FROM profiles
WHERE last_otp_at IS NOT NULL;

-- Signup completion rate
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as completed,
  COUNT(*) as total_signups,
  ROUND(100.0 * COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) / COUNT(*), 2) as completion_rate
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## Future Enhancements

### Phase 2 Improvements
- [ ] **Biometric Authentication**: WebAuthn/passkeys for mobile
- [ ] **Social OAuth**: Google, Facebook, Apple sign-in
- [ ] **Remember Device**: Skip OTP on trusted devices
- [ ] **SMS OTP**: Alternative to email OTP
- [ ] **Authenticator Apps**: TOTP via Google/Authy

### Phase 3 Advanced Features
- [ ] **Risk-Based OTP**: Require OTP based on IP, device, location changes
- [ ] **Account Recovery**: Multiple recovery options (security questions, backup codes)
- [ ] **Session Management**: View/revoke active sessions
- [ ] **Login Notifications**: Alert users of new login attempts

---

## Support & Troubleshooting

### Common User Issues

**Issue:** "I didn't receive the OTP email"
- **Solution**: Check spam folder, use "Resend OTP" button, or use "Password instead" fallback

**Issue:** "My OTP code expired"
- **Solution**: Request new OTP (counter resets to 60 minutes)

**Issue:** "I can't check the 'I agree' checkbox"
- **Solution**: Must scroll to bottom of both Terms and Privacy Policy and click "Accept" on each

**Issue:** "The Accept button is disabled"
- **Solution**: Scroll all the way to the bottom of the document (look for animated arrow)

### Admin Tools

**Reset OTP Counter:**
```sql
UPDATE profiles 
SET password_logins_since_otp = 0
WHERE email = 'user@example.com';
```

**Force OTP on Next Login:**
```sql
UPDATE profiles 
SET password_logins_since_otp = 10
WHERE email = 'user@example.com';
```

**View User Login History:**
```sql
SELECT 
  activity_type,
  metadata->>'method' as method,
  created_at
FROM user_activity_log
WHERE user_id = 'uuid-here'
  AND activity_type LIKE 'LOGIN%'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Conclusion

This unified authentication system balances **user experience**, **security**, and **legal compliance**:

✅ **Simple**: One entry point for all users  
✅ **Secure**: OTP verification without friction  
✅ **Compliant**: Enforced policy acceptance  
✅ **Flexible**: Password fallback always available  
✅ **Scalable**: Ready for social OAuth and advanced auth

**Documentation Version:** 1.0  
**Last Reviewed:** December 10, 2025  
**Next Review:** Q1 2026 or after OAuth implementation















