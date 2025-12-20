#!/bin/bash

# Clear React Native and Expo caches for iPhone

echo "🧹 Clearing React Native & Expo caches..."

# Clear Metro bundler cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Clear Expo cache
rm -rf ~/.expo/
rm -rf .expo/

# Clear node modules cache
rm -rf node_modules/.cache/

# Clear watchman cache
watchman watch-del-all 2>/dev/null || echo "Watchman not running"

# Clear iOS build cache (if running on iOS)
rm -rf ios/build/ 2>/dev/null || echo "No iOS build folder"

echo "✅ Cache cleared!"
echo ""
echo "📱 Next steps:"
echo "1. Close the Expo app on your iPhone"
echo "2. Run: npm start -- --clear"
echo "3. Scan QR code again on your iPhone"
echo ""
