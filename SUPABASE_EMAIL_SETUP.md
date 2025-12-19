# Supabase Email Verification Setup

## Quick Setup Steps

### 1. Enable Email Confirmation
1. Go to your Supabase dashboard: https://app.supabase.com/project/hjgxujrxyilaeiemivcz
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth**
4. Toggle **Enable email confirmations** to ON
5. Click **Save**

### 2. Configure Email Templates (Optional but Recommended)
1. In Authentication → Email Templates
2. Customize the "Confirm signup" email template
3. You can change the subject, message, and button text

### 3. Test the Flow
1. Register a new account in the app
2. Check your email for the verification link
3. Click the link to verify
4. Return to the app and log in

## What Changed in the Code

### Password Requirements (Industry Best Practices)
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*...)

### Registration Flow
1. User fills out the form with strong password
2. System validates password complexity
3. Creates Supabase auth account
4. Sends verification email automatically
5. User must click email link before logging in

### Login Flow
1. User enters credentials
2. System checks email verification status
3. If not verified, login fails with message: "Please verify your email..."
4. If verified, creates profile (if first login) and allows access

## Email Verification Link
The verification link redirects to: `bookclub://verify-email`

You can customize this deep link in the Supabase dashboard under:
**Authentication** → **URL Configuration** → **Redirect URLs**

Add your app's deep link:
- `bookclub://verify-email` (for production)
- `exp://localhost:8081/--/verify-email` (for Expo development)

## Troubleshooting

### Emails Not Sending
- Check Supabase dashboard → Authentication → Email Templates
- Verify email confirmation is enabled
- Check spam folder
- For production, consider setting up a custom SMTP server

### User Can't Login After Verification
- Check Supabase dashboard → Authentication → Users
- Verify the user's email_confirmed_at field is set
- Try clicking the verification link again

### Development Testing
For faster testing during development, you can:
1. Disable email confirmation temporarily in Supabase settings
2. Or manually confirm users in Supabase dashboard → Authentication → Users → Click user → Set email_confirmed_at

## Security Benefits
✅ Prevents spam accounts
✅ Ensures valid email addresses
✅ Reduces bot registrations
✅ Strong password requirements (OWASP compliant)
✅ Prevents dictionary attacks
