# Secure Credential Storage

## Overview

The app uses **react-native-keychain** for secure credential storage, providing hardware-backed encryption on both iOS and Android.

## What is Stored Where

### 🔐 Keychain (Secure Storage)
**Used for:** Sensitive credentials that need encryption

- **Email & Password**: For biometric login
- **Service ID**: `com.bookclub.credentials`
- **Security Level**: `SECURE_HARDWARE` (uses device's secure enclave/keystore)
- **Accessibility**: `WHEN_UNLOCKED` (only accessible when device is unlocked)

### 📦 AsyncStorage (Non-Sensitive Data)
**Used for:** User preferences and non-sensitive information

- Username (login identifier, not password)
- Display name (public name)
- Email (already public in profiles)
- MFA preferences (enabled/disabled)
- Pending verification data

## Security Features

### iOS
- **Keychain Services API**: Uses Apple's secure Keychain
- **Secure Enclave**: Hardware-backed encryption on devices with Face ID/Touch ID
- **Biometric Protection**: Optional biometric authentication to access credentials

### Android
- **Android Keystore System**: Hardware-backed cryptographic key storage
- **Security Level**: Requires `SECURE_HARDWARE` when available
- **Biometric Integration**: Works with fingerprint and face unlock

## API Usage

### Save Credentials
```javascript
await Keychain.setGenericPassword(email, password, {
  service: 'com.bookclub.credentials',
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
});
```

### Retrieve Credentials
```javascript
const credentials = await Keychain.getGenericPassword({
  service: 'com.bookclub.credentials'
});
// Returns: { username: email, password: password }
```

### Clear Credentials
```javascript
await Keychain.resetGenericPassword({
  service: 'com.bookclub.credentials'
});
```

## When Credentials are Saved

1. **First successful login** - Email and password saved to Keychain
2. **Every subsequent login** - Credentials updated in Keychain
3. **Biometric authentication enabled** - Credentials remain in Keychain

## When Credentials are Cleared

1. **User logs out** - All credentials cleared
2. **App uninstall** - Keychain data automatically removed
3. **Security breach detected** - Manual clearance available

## Best Practices

✅ **DO:**
- Use Keychain for passwords, tokens, and sensitive data
- Use AsyncStorage for preferences and non-sensitive data
- Clear Keychain on logout
- Handle Keychain errors gracefully

❌ **DON'T:**
- Store passwords in AsyncStorage
- Store API keys in plain text
- Assume Keychain is always available (handle errors)
- Store large amounts of data in Keychain

## Biometric Login Flow

1. User enables biometric authentication
2. Email & password saved to Keychain during first login
3. On subsequent logins:
   - User taps "Login with Biometrics"
   - Device prompts for Face ID/Fingerprint
   - If authenticated, credentials retrieved from Keychain
   - Auto-login with retrieved credentials

## Fallback Mechanism

If Keychain is unavailable (device doesn't support secure hardware):
- App falls back to password-only login
- Biometric login button hidden
- User prompted to use standard login

## Security Levels

### SECURE_HARDWARE (Preferred)
- Hardware-backed encryption
- Keys stored in secure element
- Protected against extraction

### SECURE_SOFTWARE (Fallback)
- Software-based encryption
- Less secure than hardware
- Used when secure hardware unavailable

## Testing

### Check if Keychain is Available
```javascript
const hasSecureHardware = await Keychain.getSupportedBiometryType();
console.log('Biometry support:', hasSecureHardware);
// Returns: 'FaceID', 'TouchID', 'Fingerprint', or null
```

### Verify Credentials Saved
```javascript
const credentials = await Keychain.getGenericPassword({
  service: 'com.bookclub.credentials'
});
console.log('Credentials saved:', !!credentials);
```

## Troubleshooting

### "Unable to access Keychain"
- **iOS**: Check app's Keychain sharing capability
- **Android**: Device may not support secure hardware
- **Solution**: Fall back to password login

### "Credentials not found"
- User hasn't logged in yet
- Credentials were cleared
- App was reinstalled
- **Solution**: Prompt user to login with password

### "Biometric authentication failed"
- User cancelled authentication
- Biometric not recognized
- Too many failed attempts
- **Solution**: Offer password fallback

## Migration Notes

### From AsyncStorage to Keychain
```javascript
// Old (insecure)
await AsyncStorage.setItem('password', password);

// New (secure)
await Keychain.setGenericPassword(email, password, {
  service: 'com.bookclub.credentials'
});
```

## Resources

- [react-native-keychain Documentation](https://github.com/oblador/react-native-keychain)
- [iOS Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Android Keystore System](https://developer.android.com/training/articles/keystore)
