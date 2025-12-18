# Book Club Mobile App

React Native mobile application for iOS and Android built with Expo.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS development: macOS with Xcode
- For Android development: Android Studio

## Installation

```bash
cd mobile
npm install
```

## Development

### Run on iOS Simulator

```bash
npm run ios
```

### Run on Android Emulator

```bash
npm run android
```

### Run with Expo Go

1. Install Expo Go app on your phone
2. Start the dev server:
```bash
npm start
```
3. Scan the QR code with your phone

## Environment Configuration

Update the API URLs in `src/constants/index.js`:

```javascript
export const API_URL = 'https://your-api-url.com/api';
export const SOCKET_URL = 'https://your-api-url.com';
```

## Building for Production

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Configure EAS

```bash
eas login
eas build:configure
```

### Build for iOS

```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
```

### Build for Android

```bash
# Development APK
eas build --profile preview --platform android

# Production AAB (for Play Store)
eas build --profile production --platform android
```

## App Store Submission

### iOS App Store

1. **Prerequisites:**
   - Apple Developer Account ($99/year)
   - App Store Connect app created
   - Valid provisioning profiles and certificates

2. **Build and Submit:**
```bash
# Build production version
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

3. **App Store Connect:**
   - Fill in app metadata (name, description, screenshots)
   - Set pricing and availability
   - Add privacy policy URL
   - Configure in-app purchases if needed
   - Submit for review

4. **Review Process:**
   - Typically takes 24-48 hours
   - Be prepared to answer questions
   - Fix any rejection issues quickly

### Google Play Store

1. **Prerequisites:**
   - Google Play Console account ($25 one-time fee)
   - Google Play Developer account
   - Service account for API access

2. **Build and Submit:**
```bash
# Build production AAB
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android
```

3. **Play Console Setup:**
   - Create app in Play Console
   - Fill in store listing (title, description, screenshots)
   - Set content rating
   - Add privacy policy
   - Configure pricing & distribution
   - Upload AAB file
   - Submit for review

4. **Review Process:**
   - Usually faster than iOS (few hours to days)
   - May require additional information
   - Internal testing track available for beta testing

## Required Assets

### iOS
- App Icon: 1024x1024 px (no transparency)
- Screenshots: Various sizes for different devices
- Splash Screen: 2048x2048 px

### Android
- App Icon: 512x512 px
- Feature Graphic: 1024x500 px
- Screenshots: At least 2, max 8 per device type

## App Permissions

### iOS Info.plist
Already configured in `app.json`:
- Camera access (for profile pictures)
- Microphone access (for voice chat)
- Photo library access (for sharing images)

### Android
Already configured in `app.json`:
- CAMERA
- RECORD_AUDIO
- READ/WRITE_EXTERNAL_STORAGE
- INTERNET

## Testing

### Manual Testing Checklist
- [ ] Login/Registration
- [ ] Browse books
- [ ] View book details
- [ ] Navigate forums
- [ ] Access AI chats
- [ ] Profile management
- [ ] Subscription/pricing
- [ ] Deep linking
- [ ] Push notifications
- [ ] Offline functionality

### Beta Testing

**iOS TestFlight:**
```bash
eas build --profile production --platform ios
# Then add testers in App Store Connect
```

**Android Internal Testing:**
```bash
eas submit --platform android
# Then add testers in Play Console
```

## Deployment Checklist

### Pre-Launch
- [ ] Update API URLs to production
- [ ] Test all features on real devices
- [ ] Verify payment processing
- [ ] Check analytics integration
- [ ] Review app permissions
- [ ] Prepare marketing materials
- [ ] Set up customer support
- [ ] Create privacy policy & terms

### iOS Specific
- [ ] Configure App Store Connect
- [ ] Create app screenshots (all device sizes)
- [ ] Write app description & keywords
- [ ] Set up in-app purchases (if needed)
- [ ] Configure Game Center (if needed)
- [ ] Add promo artwork

### Android Specific
- [ ] Create Play Console listing
- [ ] Generate signed APK/AAB
- [ ] Upload screenshots (phone & tablet)
- [ ] Write store description
- [ ] Set content rating
- [ ] Configure merchant account (for payments)

## Common Issues

### iOS Build Fails
- Verify Apple Developer account is active
- Check provisioning profiles
- Ensure bundle identifier is unique
- Review Xcode version compatibility

### Android Build Fails
- Check Java/Android SDK versions
- Verify keystore configuration
- Review build.gradle settings
- Clear Gradle cache

### App Rejected
- Review rejection reason carefully
- Common issues:
  - Missing privacy policy
  - Incomplete app metadata
  - Crashes or bugs
  - Guideline violations
  - Inappropriate content

## Post-Launch

### Monitoring
- Track crash reports
- Monitor user reviews
- Analyze usage metrics
- Check performance data

### Updates
```bash
# Increment version in app.json
# Build new version
eas build --profile production --platform all

# Submit updates
eas submit --platform ios
eas submit --platform android
```

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Android Material Design](https://material.io/design)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines)
- [Google Play Policy](https://play.google.com/about/developer-content-policy)

## Support

For technical issues, contact the development team or create an issue in the repository.
