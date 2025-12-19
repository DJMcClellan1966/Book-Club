# Multi-Factor Authentication (MFA) Implementation Guide

## Overview

This Book Club app now supports **4 different MFA methods**:

1. **🔐 Authenticator App** (TOTP - Time-based One-Time Password)
2. **📱 SMS Verification** (Text message codes)
3. **📧 Email Verification** (Email codes)
4. **👤 Biometric Authentication** (Face ID, Fingerprint, Iris)

## Setup Instructions

### 1. Database Setup

Run the SQL migration to create the MFA tables:

```bash
# Connect to your Supabase project and run:
psql $DATABASE_URL -f backend/mfa-codes-table.sql
```

This creates:
- `mfa_codes` table for SMS/Email verification codes
- RLS policies for secure access
- Cleanup function for expired codes
- `mfa_method` and `mfa_enabled` columns in `profiles` table

### 2. Mobile Package Installation

Install the biometric authentication package:

```bash
cd mobile
npx expo install expo-local-authentication
```

This is already added to `mobile/package.json`:
```json
"expo-local-authentication": "~15.0.6"
```

### 3. Backend Configuration

The backend now includes these MFA endpoints in `backend/routes/auth.supabase.js`:

- `POST /api/auth/send-sms-mfa` - Send SMS verification code
- `POST /api/auth/send-email-mfa` - Send email verification code
- `POST /api/auth/verify-mfa-code` - Verify SMS or email codes

**Note:** SMS sending is currently logged to console. To enable actual SMS:

1. Sign up for Twilio, AWS SNS, or similar service
2. Add credentials to environment variables
3. Update the SMS sending code in `send-sms-mfa` endpoint

## User Flow

### Registration with MFA

1. User signs up with email, username, password
2. Optional: Check "Enable 2FA" during registration
3. Email verification required before login
4. Navigate to Profile → Two-Factor Authentication to set up MFA

### MFA Setup Flow

1. **Choose Method Screen**
   - Shows 4 method cards: Biometric, SMS, Email, Authenticator
   - Biometric only shown if device has Face ID/Fingerprint
   - User taps preferred method

2. **Biometric Setup** (if available)
   - Prompts for Face ID or Fingerprint
   - Stores preference locally in AsyncStorage
   - No backend storage needed (device-level)
   - Most secure and convenient option

3. **SMS Setup**
   - User enters phone number
   - Backend sends 6-digit code via SMS
   - User enters code to verify
   - Phone marked as verified in profile

4. **Email Setup**
   - User's email pre-filled
   - Backend sends 6-digit code via email
   - User enters code to verify
   - Email marked as verified in profile

5. **Authenticator App Setup**
   - QR code displayed on screen
   - User scans with Google Authenticator, Authy, etc.
   - Enters 6-digit TOTP code to verify
   - Secret key stored in backend

### Login with MFA

#### Standard Login:
1. Enter email/username and password
2. If MFA enabled, prompted for second factor
3. Enter code from chosen method
4. Access granted

#### Biometric Login:
1. Tap "👤 Login with Biometrics" button
2. Face ID or Fingerprint prompt appears
3. Authenticate with biometric
4. Automatically logged in (uses saved credentials)

## Code Structure

### Mobile Components

**TwoFactorSetupScreen.js**
- Method selection UI with 4 cards
- Biometric detection and setup
- SMS/Email phone/email input
- QR code generation for authenticator
- Code verification UI

**LoginScreen.js**
- Standard login form
- Biometric login button (conditional)
- Email verification error handling
- Password reset and username recovery

**RegisterScreen.js**
- MFA opt-in checkbox
- Password strength validation
- Username generation
- Display name support

### Backend Routes

**auth.supabase.js**
```javascript
POST /register          // User registration
POST /login             // User login
POST /send-sms-mfa      // Send SMS code
POST /send-email-mfa    // Send email code
POST /verify-mfa-code   // Verify SMS/email code
```

### Database Schema

**profiles table:**
```sql
- mfa_method: VARCHAR(20)      -- 'authenticator', 'sms', 'email', 'biometric'
- mfa_enabled: BOOLEAN          -- Is MFA active
- phone_verified: BOOLEAN       -- Phone verified for SMS MFA
- email_verified: BOOLEAN       -- Email verified
```

**mfa_codes table:**
```sql
- id: UUID
- user_id: UUID
- code: VARCHAR(6)
- method: VARCHAR(20)          -- 'sms' or 'email'
- phone_number: VARCHAR(20)
- email: VARCHAR(255)
- used: BOOLEAN
- expires_at: TIMESTAMP
- created_at: TIMESTAMP
```

## Security Features

### Code Expiration
- SMS/Email codes expire after 10 minutes
- Codes marked as "used" after verification
- Automatic cleanup of old codes

### Biometric Security
- Biometric data never leaves the device
- Uses device secure enclave/keystore
- Fallback to device passcode
- Credentials encrypted in AsyncStorage

### Rate Limiting (Recommended)
Add rate limiting to prevent abuse:
```javascript
// Example with express-rate-limit
const rateLimit = require('express-rate-limit');

const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many MFA attempts, try again later'
});

router.post('/send-sms-mfa', mfaLimiter, async (req, res) => {
  // ...
});
```

## Testing

### Test Biometric Authentication
1. Enable biometric in device settings:
   - iOS Simulator: Features → Face ID → Enrolled
   - Android Emulator: Settings → Security → Fingerprint
2. Register account and enable MFA
3. Choose biometric method
4. Test login with biometric button

### Test SMS/Email MFA
1. Enable MFA during registration
2. Navigate to Profile → Two-Factor Authentication
3. Choose SMS or Email method
4. Enter phone/email
5. Check console logs for verification code
6. Enter code to verify
7. Test login with MFA prompt

### Test Authenticator App
1. Install Google Authenticator on your phone
2. Enable MFA and choose Authenticator method
3. Scan QR code with app
4. Enter 6-digit code from app
5. Test login with authenticator code

## Production Checklist

### SMS Configuration
- [ ] Sign up for Twilio/AWS SNS
- [ ] Add API credentials to environment
- [ ] Update `send-sms-mfa` endpoint with actual SMS sending
- [ ] Add rate limiting
- [ ] Remove console.log of codes

### Email Configuration
- [ ] Configure Supabase email templates
- [ ] Or integrate with SendGrid/Mailgun
- [ ] Add rate limiting
- [ ] Remove console.log of codes

### Biometric Configuration
- [ ] Test on real devices (not just simulators)
- [ ] Handle biometric enrollment changes
- [ ] Add re-authentication for sensitive actions
- [ ] Clear saved credentials on logout

### Security Hardening
- [ ] Add rate limiting to all MFA endpoints
- [ ] Implement CAPTCHA for repeated failures
- [ ] Add device fingerprinting
- [ ] Monitor for suspicious activity
- [ ] Add audit logs for MFA events
- [ ] Implement account lockout after failures

## Troubleshooting

### Biometric Not Available
**Issue:** Biometric button doesn't appear

**Solutions:**
- Check device has biometric hardware
- Ensure biometric is enrolled in device settings
- Verify `expo-local-authentication` is installed
- Check AsyncStorage for `mfa_biometric_enabled` flag

### SMS Not Sending
**Issue:** SMS codes not received

**Solutions:**
- Check console logs for generated code
- Verify phone number format (+1234567890)
- Ensure SMS provider is configured
- Check rate limits and quotas
- Verify backend endpoint is reachable

### Email Codes Not Received
**Issue:** Email verification codes not arriving

**Solutions:**
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email settings
- Ensure email service is configured
- Check console logs for code

### Authenticator QR Code Issues
**Issue:** QR code won't scan

**Solutions:**
- Ensure screen brightness is high
- Try different authenticator apps
- Use manual entry with secret key
- Check QR code library is installed
- Verify TOTP secret generation

## Future Enhancements

### Planned Features
- [ ] Multiple MFA methods per user
- [ ] Backup codes for recovery
- [ ] WebAuthn/FIDO2 support
- [ ] Hardware security key support
- [ ] MFA method switching
- [ ] Trusted devices
- [ ] Device management (revoke access)
- [ ] MFA usage statistics

### Mobile Improvements
- [ ] Remember device option
- [ ] Quick biometric unlock
- [ ] Offline MFA support
- [ ] Sync MFA settings across devices

### Backend Improvements
- [ ] MFA audit trail
- [ ] Admin MFA enforcement
- [ ] Per-role MFA requirements
- [ ] MFA analytics dashboard
- [ ] Geographic MFA rules

## Support & Resources

### Documentation
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)

### SMS Providers
- [Twilio](https://www.twilio.com/sms)
- [AWS SNS](https://aws.amazon.com/sns/)
- [MessageBird](https://www.messagebird.com/)

### Authenticator Apps
- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- 1Password (iOS/Android/Desktop)

## License & Credits

Built with ❤️ for the Book Club community.
Uses industry-standard security practices and open-source libraries.
