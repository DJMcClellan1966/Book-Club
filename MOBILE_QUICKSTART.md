# 📱 Mobile Apps - Quick Start Guide

## Overview

The Book Club application is now available on **iOS** and **Android** devices! This guide will help you get the mobile apps up and running.

## ✨ What's New

Your Book Club application now includes:
- **Native iOS App** - Available on iPhone and iPad
- **Native Android App** - Available on phones and tablets  
- **Cross-Platform Codebase** - Single React Native codebase for both platforms
- **Native Performance** - Fast, smooth experience on mobile devices
- **Full Feature Parity** - All web features available on mobile

## 🚀 Quick Start (Development)

### 1. Navigate to Mobile Directory

```bash
cd mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Show a QR code in your terminal
- Open Expo Developer Tools in your browser

### 4. Run on Your Device

**Option A: Use Expo Go (Easiest)**
1. Install "Expo Go" app from App Store or Play Store
2. Scan the QR code shown in terminal
3. App will load on your device

**Option B: Use Simulator/Emulator**
```bash
# iOS (macOS only)
npm run ios

# Android
npm run android
```

## 📋 Prerequisites

### For Development
- Node.js v14+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### For iOS Development
- macOS computer
- Xcode (latest version)
- iOS Simulator or physical iPhone/iPad
- Apple Developer Account (for device testing)

### For Android Development
- Android Studio
- Android SDK and emulator
- Physical Android device (optional)

### For Production Builds
- Apple Developer Account ($99/year) for App Store
- Google Play Console Account ($25 one-time) for Play Store
- EAS CLI: `npm install -g eas-cli`

## 🎯 Key Features

All features from the web app are available on mobile:

✅ **Authentication**
- Login / Register
- Secure token storage
- Automatic session management

✅ **Books**
- Browse book catalog
- Search functionality
- View detailed book information
- Add to reading lists

✅ **Reviews**
- Read community reviews
- Write and edit reviews
- Rate books

✅ **Forums**
- Browse discussion forums
- Join conversations
- Create posts

✅ **Spaces**
- Join book discussion spaces
- Real-time chat messaging
- Create temporary or permanent spaces

✅ **AI Chats**
- Chat with book characters
- Converse with authors
- AI-powered conversations

✅ **Profile**
- View and edit profile
- Manage reading lists
- Subscription management
- Settings and preferences

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── screens/           # All app screens
│   ├── navigation/        # Navigation setup
│   ├── components/        # Reusable components
│   ├── context/           # Auth context
│   ├── services/          # API & Socket services
│   ├── constants/         # Colors, spacing, config
│   └── utils/             # Helper functions
├── assets/                # Images and icons
├── App.js                 # Entry point
├── app.json              # Expo configuration
├── eas.json              # Build configuration
└── package.json          # Dependencies
```

## 🔧 Configuration

### Update API URLs

Edit `src/constants/index.js`:

```javascript
export const API_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:5000/api'  // Development
  : 'https://your-api.com/api';       // Production

export const SOCKET_URL = __DEV__
  ? 'http://YOUR_LOCAL_IP:5000'
  : 'https://your-api.com';
```

**Important**: Use your computer's IP address (not localhost) for testing on physical devices.

### Find Your Local IP

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

## 📦 Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --profile production --platform ios
```

Build takes 10-30 minutes. Download IPA from Expo dashboard.

### Android

```bash
# Build APK (for testing)
eas build --profile preview --platform android

# Build AAB (for Play Store)
eas build --profile production --platform android
```

Build takes 10-20 minutes. Download APK/AAB from Expo dashboard.

## 🚢 App Store Submission

### iOS App Store

1. **Create App in App Store Connect**
   - Go to appstoreconnect.apple.com
   - Create new app
   - Fill in app information

2. **Prepare Assets**
   - App icon: 1024x1024px
   - Screenshots for all device sizes
   - App description and keywords

3. **Submit Build**
```bash
eas submit --platform ios
```

4. **Wait for Review** (typically 24-48 hours)

### Google Play Store

1. **Create App in Play Console**
   - Go to play.google.com/console
   - Create new app
   - Complete store listing

2. **Prepare Assets**
   - App icon: 512x512px
   - Feature graphic: 1024x500px
   - Screenshots (minimum 2)

3. **Submit Build**
```bash
eas submit --platform android
```

4. **Wait for Review** (typically few hours to 1 day)

## 🧪 Testing

### On Physical Device

**iOS:**
- Build with development profile
- Install via TestFlight
- Or use Expo Go app

**Android:**
- Build APK with preview profile
- Install APK directly on device
- Or use Expo Go app

### Beta Testing

**iOS TestFlight:**
- Upload build to App Store Connect
- Add testers via email
- Share TestFlight link

**Android Internal Testing:**
- Upload to Play Console
- Create internal testing track
- Add testers and share link

## 📚 Documentation

- **[mobile/README.md](mobile/README.md)** - Detailed mobile setup and deployment
- **[MOBILE_DEV_GUIDE.md](MOBILE_DEV_GUIDE.md)** - Comprehensive development guide
- **[Expo Documentation](https://docs.expo.dev)** - Official Expo docs
- **[React Native Docs](https://reactnative.dev)** - React Native reference

## 🆘 Troubleshooting

### Development Server Won't Start
```bash
# Clear cache and restart
npx expo start --clear
```

### Can't Connect from Phone
- Check firewall settings
- Verify phone and computer on same network
- Use computer's IP address (not localhost)
- Ensure backend server is running

### Build Fails
- Verify Expo account is set up
- Check app.json configuration
- Review error messages in EAS dashboard
- Ensure all required credentials are configured

### App Crashes
- Check console for errors
- Verify API endpoints are correct
- Test on multiple devices
- Review device logs

## 🎯 Next Steps

1. **Test Locally**
   - Run app on your device
   - Test all features
   - Verify API connections

2. **Customize**
   - Update app icons and splash screen
   - Adjust colors and branding
   - Add platform-specific features

3. **Build Beta**
   - Create beta builds
   - Test with real users
   - Gather feedback

4. **Production Launch**
   - Prepare app store assets
   - Submit to stores
   - Monitor and update

## 💡 Tips

- **Development**: Use Expo Go for fastest iteration
- **Testing**: Test on both iOS and Android devices
- **Debugging**: Use React Native Debugger
- **Performance**: Test on older devices
- **Updates**: Use OTA updates for quick fixes

## 🔗 Useful Commands

```bash
# Development
npm start                          # Start dev server
npm run ios                        # Run on iOS
npm run android                    # Run on Android

# Building
eas build --profile development   # Dev build
eas build --profile preview       # Beta build
eas build --profile production    # Production build

# Submission
eas submit --platform ios         # Submit to App Store
eas submit --platform android     # Submit to Play Store

# Utilities
npx expo start --clear            # Clear cache
npx expo install                  # Install compatible packages
eas build:list                    # List builds
```

## 📧 Support

Need help?
- Check documentation in `mobile/README.md`
- Review `MOBILE_DEV_GUIDE.md` for detailed info
- Search Expo forums
- Create an issue in the repository

---

**Ready to go mobile!** 📱✨

Your Book Club app is now ready for iOS and Android. Happy developing!
