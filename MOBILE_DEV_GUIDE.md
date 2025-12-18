# Mobile App Development Guide

## Overview

This document provides comprehensive information about the Book Club mobile applications for iOS and Android.

## Technology Stack

### Core Technologies
- **React Native**: Cross-platform mobile framework
- **Expo**: Development toolchain and platform
- **React Navigation**: Navigation library for mobile
- **Axios**: HTTP client for API requests
- **Socket.io-client**: Real-time communication
- **AsyncStorage**: Local data persistence

### UI Components
- **React Native Core Components**: View, Text, ScrollView, FlatList
- **Expo Icons**: Ionicons icon set
- **Custom Styling**: StyleSheet with responsive design

## Architecture

### Project Structure

```
mobile/
├── src/
│   ├── screens/         # Screen components
│   │   ├── auth/        # Authentication screens
│   │   ├── HomeScreen.js
│   │   ├── BooksScreen.js
│   │   ├── ForumsScreen.js
│   │   ├── SpacesScreen.js
│   │   ├── ProfileScreen.js
│   │   └── AIChatsScreen.js
│   │
│   ├── components/      # Reusable components
│   │   └── (custom components as needed)
│   │
│   ├── navigation/      # Navigation configuration
│   │   └── AppNavigator.js
│   │
│   ├── context/         # State management
│   │   └── AuthContext.js
│   │
│   ├── services/        # API and services
│   │   ├── api.js       # REST API client
│   │   └── socket.js    # Socket.io client
│   │
│   ├── constants/       # App constants
│   │   └── index.js     # Colors, spacing, API URLs
│   │
│   └── utils/           # Helper functions
│       └── (utilities as needed)
│
├── assets/              # Images, icons, fonts
├── app.json            # Expo configuration
├── eas.json            # Build configuration
├── babel.config.js     # Babel configuration
├── App.js              # Entry point
└── package.json        # Dependencies
```

### Navigation Structure

```
- Auth Stack (Not authenticated)
  - Login Screen
  - Register Screen

- Main Tabs (Authenticated)
  - Home Tab
    - Home Screen
    - Book Detail Screen
  
  - Books Tab
    - Books List Screen
    - Book Detail Screen
  
  - Forums Tab
    - Forums List Screen
    - Forum Detail Screen
  
  - Spaces Tab
    - Spaces List Screen
    - Space Detail Screen
  
  - Profile Tab
    - Profile Screen
    - Pricing Screen
    - AI Chats Screen
```

## Development

### Environment Setup

1. **Install Node.js**: Download from nodejs.org
2. **Install Expo CLI**: `npm install -g expo-cli`
3. **Install EAS CLI** (for builds): `npm install -g eas-cli`

### iOS Development
- **macOS required** for iOS simulator and builds
- Install Xcode from Mac App Store
- Install Xcode Command Line Tools
- Configure iOS Simulator

### Android Development
- Install Android Studio
- Configure Android SDK and AVD
- Set up environment variables (ANDROID_HOME)
- Create virtual device in AVD Manager

### Running the App

```bash
# Install dependencies
cd mobile
npm install

# Start development server
npm start

# Run on specific platform
npm run ios        # iOS simulator (macOS only)
npm run android    # Android emulator
npm run web        # Web browser (for testing)
```

### Development Workflow

1. **Code Changes**: Edit files in `src/` directory
2. **Hot Reload**: Changes appear automatically on device
3. **Debugging**: Use React Native Debugger or Chrome DevTools
4. **Testing**: Test on physical devices and emulators

## API Integration

### Configuration

Update API URLs in `src/constants/index.js`:

```javascript
export const API_URL = __DEV__
  ? 'http://192.168.1.100:5000/api'  // Your local IP
  : 'https://api.yourapp.com/api';   // Production URL
```

**Important**: Use your computer's local IP address (not localhost) for testing on physical devices.

### API Client

The app uses Axios with interceptors:
- Automatically adds JWT token to requests
- Handles 401 errors (expired tokens)
- Provides consistent error handling

### Real-time Features

Socket.io connection:
- Connects on app launch
- Authenticates with JWT token
- Maintains connection for real-time updates
- Reconnects automatically on network changes

## State Management

### AuthContext

Manages authentication state:
- User login/logout
- Token storage (AsyncStorage)
- Current user data
- Authentication status

Usage:
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
```

## Styling

### Design System

Constants defined in `src/constants/index.js`:

**Colors:**
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Purple)
- Success: #10b981 (Green)
- Danger: #ef4444 (Red)
- Warning: #f59e0b (Amber)

**Spacing:**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

**Typography:**
- h1: 32px bold
- h2: 24px bold
- h3: 20px semibold
- body: 16px
- small: 14px
- caption: 12px

### Platform-Specific Styling

```javascript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
});
```

## Building for Production

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Required for iOS App Store distribution
   - Sign up at developer.apple.com

2. **Google Play Console Account** ($25 one-time)
   - Required for Android Play Store distribution
   - Sign up at play.google.com/console

3. **EAS Account**
   - Free Expo account
   - Sign up at expo.dev

### Build Configuration

The `eas.json` file defines build profiles:

**Development**: Internal testing builds
**Preview**: Beta testing builds (APK for Android)
**Production**: Release builds for store submission

### iOS Build Process

```bash
# Login to EAS
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --profile production --platform ios

# Wait for build to complete (10-30 minutes)
# Download IPA file from Expo dashboard
```

### Android Build Process

```bash
# Build APK for testing
eas build --profile preview --platform android

# Build AAB for Play Store
eas build --profile production --platform android

# Wait for build to complete (10-20 minutes)
# Download APK/AAB from Expo dashboard
```

## App Store Submission

### iOS App Store

**Required Assets:**
- App Icon: 1024x1024px PNG
- Screenshots: 5.5", 6.5", 12.9" devices
- Privacy Policy URL
- Support URL

**Submission Steps:**
1. Create app in App Store Connect
2. Fill in app information
3. Upload build via EAS Submit or Transporter
4. Add screenshots and metadata
5. Submit for review
6. Wait for approval (24-48 hours typically)

**Common Rejection Reasons:**
- Missing privacy policy
- Incomplete metadata
- Crashes or bugs
- Guideline violations

### Google Play Store

**Required Assets:**
- App Icon: 512x512px PNG
- Feature Graphic: 1024x500px
- Screenshots: At least 2 per device type
- Privacy Policy URL

**Submission Steps:**
1. Create app in Play Console
2. Complete store listing
3. Set content rating
4. Upload AAB file
5. Configure pricing and distribution
6. Submit for review
7. Wait for approval (few hours to days)

**Release Tracks:**
- Internal Testing: Up to 100 testers
- Closed Testing: Limited audience
- Open Testing: Public beta
- Production: Full release

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Token persists on app restart

**Books:**
- [ ] Browse books list
- [ ] Search books
- [ ] View book details
- [ ] Add to reading list

**Forums:**
- [ ] View forums list
- [ ] Join forum
- [ ] Create post
- [ ] View posts

**Spaces:**
- [ ] View spaces
- [ ] Join space
- [ ] Send messages
- [ ] Leave space

**AI Chats:**
- [ ] Create new chat
- [ ] Send messages
- [ ] View history
- [ ] Delete chat

**Profile:**
- [ ] View profile
- [ ] Update settings
- [ ] View subscription
- [ ] Logout

### Beta Testing

**TestFlight (iOS):**
1. Build production IPA
2. Upload to App Store Connect
3. Add internal testers (up to 100)
4. Add external testers (up to 10,000)
5. Gather feedback

**Play Console (Android):**
1. Build production AAB
2. Upload to Internal Testing track
3. Add testers via email
4. Share testing link
5. Gather feedback

## Performance Optimization

### Best Practices

1. **Image Optimization**
   - Use appropriate image sizes
   - Lazy load images
   - Cache images

2. **List Performance**
   - Use FlatList for long lists
   - Implement pagination
   - Use key extractors

3. **Navigation**
   - Lazy load screens
   - Optimize stack navigators
   - Use memoization

4. **API Calls**
   - Cache responses
   - Implement request debouncing
   - Handle loading states

5. **State Management**
   - Avoid unnecessary re-renders
   - Use React.memo
   - Optimize context usage

## Troubleshooting

### Common Issues

**Metro Bundler Issues:**
```bash
# Clear cache
npx expo start --clear

# Reset bundler
rm -rf node_modules
npm install
npx expo start
```

**iOS Build Fails:**
- Check Apple Developer account status
- Verify provisioning profiles
- Review Xcode version compatibility
- Check bundle identifier uniqueness

**Android Build Fails:**
- Verify Android SDK installation
- Check Java version
- Review Gradle configuration
- Clear Gradle cache

**Network Issues:**
- Use local IP (not localhost)
- Check firewall settings
- Verify backend is running
- Test API endpoints

## Deployment Checklist

### Pre-Launch
- [ ] Test on real devices (iOS and Android)
- [ ] Update API URLs to production
- [ ] Test payment processing
- [ ] Verify all features work
- [ ] Check app permissions
- [ ] Review privacy policy
- [ ] Prepare marketing materials
- [ ] Set up customer support

### Launch
- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Monitor crash reports
- [ ] Track user feedback
- [ ] Respond to reviews
- [ ] Fix critical bugs

### Post-Launch
- [ ] Analyze usage metrics
- [ ] Plan feature updates
- [ ] Address user feedback
- [ ] Optimize performance
- [ ] Regular updates

## Maintenance

### Update Process

1. **Make changes** to codebase
2. **Test thoroughly** on devices
3. **Increment version** in app.json
4. **Build new version** with EAS
5. **Submit to stores**
6. **Monitor rollout**

### Version Management

```json
// app.json
{
  "expo": {
    "version": "1.1.0",  // Increment for updates
    "ios": {
      "buildNumber": "2"  // iOS build number
    },
    "android": {
      "versionCode": 2    // Android version code
    }
  }
}
```

## Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [iOS HIG](https://developer.apple.com/design/human-interface-guidelines)
- [Android Material Design](https://material.io/design)

### Communities
- [Expo Forums](https://forums.expo.dev)
- [React Native Community](https://www.reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Tools
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Expo Snack](https://snack.expo.dev) - Online playground
- [Flipper](https://fbflipper.com) - Debugging platform

## Support

For technical assistance with mobile development:
- Review this documentation
- Check Expo documentation
- Search community forums
- Create GitHub issue
- Contact development team

---

**Happy Mobile Development!** 📱🚀
