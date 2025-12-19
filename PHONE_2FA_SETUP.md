# Phone Number & 2FA Setup Guide

## What's New

### 📱 Phone Number Collection
- Phone number now required during registration
- Basic format validation (international formats supported)
- Stored securely in user profile

### 🔐 Two-Factor Authentication (2FA)
- Industry-standard TOTP (Time-based One-Time Password)
- Works with Google Authenticator, Authy, Microsoft Authenticator, etc.
- Optional but highly recommended for account security
- Easy setup with QR code scanning

## Database Setup Required

### 1. Update Profiles Table
Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;
```

Or use the pre-made file:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `/backend/add-phone-2fa.sql`
3. Run the query

## Install Required Package

You need to install the QR code library:

```bash
cd mobile
npm install react-native-qrcode-svg react-native-svg
```

## How It Works

### Registration Flow (with Phone)
1. User fills out registration form including phone number
2. Phone number is validated (basic format check)
3. Phone stored in user metadata and profile
4. Standard email verification still required

### 2FA Setup Flow
1. User navigates to Profile → Two-Factor Authentication
2. Clicks "Enable 2FA"
3. System generates QR code using Supabase MFA
4. User scans QR code with authenticator app
5. User enters 6-digit verification code
6. 2FA is enabled (shown with ✓ badge in Profile)

### Login with 2FA
When 2FA is enabled, Supabase automatically:
1. Prompts for verification code after password
2. Validates the code from authenticator app
3. Grants access only if code is correct

### Disable 2FA
1. Go to Profile → Two-Factor Authentication
2. Click "Disable 2FA"
3. Confirm action
4. 2FA is removed from account

## Security Features

### Phone Number Validation
- Format: `+1 234 567 8900` or `1234567890` or `+44 20 1234 5678`
- Validates international formats
- Stored in both user_metadata and profiles table

### 2FA Security
- **TOTP Algorithm**: Industry standard (RFC 6238)
- **6-Digit Codes**: Rotated every 30 seconds
- **QR Code**: Secure enrollment
- **Factor Storage**: Managed by Supabase
- **Recovery**: Can be disabled from profile settings

### Best Practices Implemented
✅ Phone stored securely in Supabase
✅ 2FA uses TOTP standard (compatible with all major apps)
✅ QR code generated server-side
✅ Verification required before enabling
✅ Easy disable process with confirmation
✅ Badge shows 2FA status in profile
✅ Profile updated when 2FA toggled

## User Experience

### Registration
- Added phone field between email and password
- Clear placeholder: "+1 234 567 8900"
- Validates format before submission
- Required field (can't be skipped)

### Profile Screen
- New menu item: "Two-Factor Authentication"
- Shows "✓ Enabled" badge when active
- Tapping opens 2FA setup screen

### 2FA Setup Screen
Three states:
1. **Setup** - Explains benefits, "Enable 2FA" button
2. **Verify** - Shows QR code, code input field
3. **Enabled** - Shows status, "Disable 2FA" button

## Testing

### Test Phone Numbers
- US: `+1 555 123 4567`
- UK: `+44 20 1234 5678`
- International: Any valid format

### Test 2FA Flow
1. Register new account with phone
2. Verify email and login
3. Go to Profile → Two-Factor Authentication
4. Enable 2FA and scan QR code
5. Enter code from authenticator app
6. Logout and login again (should prompt for 2FA)
7. Test disable 2FA

## Supported Authenticator Apps
- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- 1Password (with TOTP support)
- LastPass Authenticator
- Any RFC 6238 compatible TOTP app

## Troubleshooting

### "Invalid phone number"
- Check format: must include country code or area code
- Remove spaces/dashes or keep them (both work)
- Examples: `+12345678900`, `234-567-8900`, `+44 20 1234 5678`

### QR Code Not Scanning
- Ensure good lighting
- Try zooming camera closer/farther
- Or manually enter the secret key shown below QR
- Check authenticator app has camera permission

### Wrong 2FA Code
- Codes expire every 30 seconds
- Wait for new code and try again
- Check phone clock is accurate
- Ensure you're using correct account in authenticator app

### Can't Login After Enabling 2FA
- Enter password first, then 2FA code when prompted
- Codes are time-based, must be current
- If locked out, contact admin to disable 2FA

## Security Recommendations

### For Users
1. ✅ Always enable 2FA for maximum security
2. ✅ Use a trusted authenticator app
3. ✅ Keep backup codes if your app supports them
4. ✅ Protect your phone with PIN/biometrics
5. ⚠️ Don't share QR codes or secret keys

### For Development
1. ✅ Never log QR codes or secret keys
2. ✅ 2FA factors managed by Supabase (secure)
3. ✅ Phone numbers stored encrypted in Supabase
4. ✅ Use HTTPS in production (required)
5. ✅ Test 2FA flow thoroughly before production

## Production Checklist
- [ ] Database columns added (phone_number, two_factor_enabled)
- [ ] QR code package installed (react-native-qrcode-svg)
- [ ] Test registration with phone validation
- [ ] Test 2FA enable/disable flow
- [ ] Test login with 2FA enabled
- [ ] Verify phone numbers stored correctly
- [ ] Check 2FA badge shows in profile
- [ ] Test on both iOS and Android
- [ ] Ensure HTTPS in production
- [ ] Add phone number to privacy policy

## Files Modified
- ✅ `/mobile/src/screens/auth/RegisterScreen.js` - Added phone field
- ✅ `/mobile/src/screens/ProfileScreen.js` - Added 2FA menu item
- ✅ `/mobile/src/screens/TwoFactorSetupScreen.js` - New 2FA screen
- ✅ `/mobile/src/services/supabase.js` - Added 2FA API methods
- ✅ `/mobile/src/context/AuthContext.supabase.js` - Added 2FA functions
- ✅ `/mobile/src/navigation/AppNavigator.js` - Added 2FA route
- ✅ `/backend/supabase-schema-optimized.sql` - Added phone/2FA columns
- ✅ `/backend/add-phone-2fa.sql` - Migration script
