import { Platform } from 'react-native';

// API Configuration
// IMPORTANT FOR CODESPACES/REMOTE DEVELOPMENT:
// When running on a physical device (iPhone), 'localhost' won't work.
// You need to use your Codespaces forwarded URL or your computer's IP address.
// 
// For GitHub Codespaces:
// 1. Check the "Ports" tab in VS Code
// 2. Find port 5000 and copy the forwarded address
// 3. Replace the URL below (it should look like: https://your-codespace-5000.app.github.dev/api)
//
// For local development on same network:
// Use your computer's IP address like: http://192.168.1.100:5000/api

export const API_URL = __DEV__ 
  ? 'https://friendly-system-45rwgqxq57h5g7q-5000.app.github.dev/api'
  : 'https://your-production-api.com/api';

export const SOCKET_URL = __DEV__
  ? 'https://friendly-system-45rwgqxq57h5g7q-5000.app.github.dev'
  : 'https://your-production-api.com';

// App Colors - Modern Gradient Palette
export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  lightPrimary: '#e0e7ff',
  secondary: '#8b5cf6',
  secondaryDark: '#7c3aed',
  accent: '#ec4899',
  accentLight: '#f472b6',
  success: '#10b981',
  danger: '#ef4444',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  dark: '#1f2937',
  light: '#f3f4f6',
  white: '#ffffff',
  black: '#000000',
  text: '#111827',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  mediumGray: '#6b7280',
  lightGray: '#d1d5db',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  background: '#f9fafb',
  backgroundDark: '#f3f4f6',
  lightBackground: '#f3f4f6',
  card: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.5)',
  gradient: {
    primary: ['#6366f1', '#8b5cf6'],
    secondary: ['#ec4899', '#f59e0b'],
    success: ['#10b981', '#34d399'],
    dark: ['#1f2937', '#374151'],
  },
};

// Shadow Styles
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  small: {
    fontSize: 14,
  },
  caption: {
    fontSize: 12,
  },
};

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  PRO: 'pro',
};

// Platform specific values
export const PLATFORM_IS_IOS = Platform.OS === 'ios';
export const PLATFORM_IS_ANDROID = Platform.OS === 'android';
