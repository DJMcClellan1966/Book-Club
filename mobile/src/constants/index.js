import { Platform } from 'react-native';

// API Configuration
export const API_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Development
  : 'https://your-production-api.com/api'; // Production

export const SOCKET_URL = __DEV__
  ? 'http://localhost:5000'
  : 'https://your-production-api.com';

// App Colors
export const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  dark: '#1f2937',
  light: '#f3f4f6',
  white: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
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
