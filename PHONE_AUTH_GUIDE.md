# Phone Authentication Guide

## Overview
The Community Hub now supports phone number authentication as an alternative to email authentication, with SMS verification for added security.

## Features Implemented

### 1. **Phone Registration**
- Users can register using either email OR phone number (or both)
- Country code automatically detected based on:
  - Frontend: Browser timezone
  - Mobile: Device locale settings
- Default country code: +1 (US/Canada)

### 2. **Password Strength Requirements**
All passwords must contain:
- At least 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*...)

### 3. **Phone Verification**
- After registration with phone number, a 6-digit verification code is sent via SMS
- In development mode, the code is logged to the console
- For production, integrate Twilio or similar SMS service

### 4. **Multi-Method Login**
Users can log in using:
- Email address
- Username
- Phone number

## Backend API Endpoints

### POST /api/auth/register
Register a new user with phone support.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",  // optional if phone provided
  "phone": "5551234567",         // optional if email provided
  "countryCode": "+1",           // defaults to +1
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "username": "johndoe"
  },
  "needsPhoneVerification": true  // if phone was provided
}
```

### POST /api/auth/login
Login with email, username, or phone number.

**Request Body:**
```json
{
  "email": "john@example.com",  // or username or phone number
  "password": "SecurePass123!"
}
```

### POST /api/auth/send-phone-verification
Send a verification code to a phone number.

**Request Body:**
```json
{
  "phone": "+15551234567"
}
```

**Response:**
```json
{
  "message": "Verification code sent",
  "code": "123456"  // only in development mode
}
```

### POST /api/auth/verify-phone
Verify a phone number with the code.

**Request Body:**
```json
{
  "userId": "user_id",
  "phone": "+15551234567",
  "code": "123456"
}
```

## Frontend Implementation

### Registration Form
- Country code selector with common countries
- Phone input field (optional if email provided)
- Password strength indicator showing real-time feedback
- Visual progress bar for password strength

### Login Form
- Single input field accepts email, username, or phone
- Backend automatically detects input type

## Mobile Implementation

### Registration Screen
- Auto-detected country code based on device locale
- Country code picker with flag emojis
- Password strength indicator
- Phone verification alert after successful registration

### Login Screen
- Single input field for email, username, or phone
- Handles all three authentication methods seamlessly

## Database Schema Updates

The `profiles` table includes:
```sql
ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
```

## Production Setup

### SMS Service Integration (Twilio)

1. **Install Twilio SDK:**
```bash
cd backend
npm install twilio
```

2. **Update Environment Variables:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

3. **Update /api/auth/send-phone-verification:**
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);

// Replace console.log with actual SMS
await client.messages.create({
  body: `Your Community Hub verification code is: ${code}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phone
});
```

## Security Features

1. **Password Validation:** Enforced strong password requirements
2. **Phone Verification:** Prevents fake phone number registrations
3. **Rate Limiting:** Should be added to verification endpoints (recommended)
4. **Code Expiry:** Verification codes should expire after 10 minutes (to be implemented)

## Mobile Dependencies

The mobile app requires the React Native Picker package:

```bash
cd mobile
npx expo install @react-native-picker/picker
```

## Testing

### Development Mode
1. Register with a phone number
2. Check the backend console for the 6-digit code
3. Use the code to verify your phone number

### Testing Different Login Methods
- Email: `user@example.com`
- Username: `johndoe`
- Phone: `+15551234567` or `15551234567` or `5551234567`

## Future Enhancements

1. **2FA via SMS:** Use phone as a second factor for authentication
2. **Code Expiry:** Implement 10-minute expiration for verification codes
3. **Rate Limiting:** Limit verification code requests per phone/IP
4. **International Support:** Expand country code list
5. **Phone Recovery:** Allow password reset via SMS
6. **Unified Verification Screen:** Create dedicated verification UI instead of alerts
