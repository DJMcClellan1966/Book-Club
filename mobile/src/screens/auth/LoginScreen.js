import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Keychain from 'react-native-keychain';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants';

const LoginScreen = ({ navigation }) => {
  const [emailOrUsernameOrPhone, setEmailOrUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      const hasBiometric = await AsyncStorage.getItem('mfa_biometric_enabled');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      setBiometricAvailable(hasBiometric === 'true' && hasHardware && isEnrolled);
    } catch (error) {
      console.log('Biometric check error:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with biometrics',
        fallbackLabel: 'Use password',
      });

      if (result.success) {
        // Get saved credentials from Keychain
        const credentials = await Keychain.getGenericPassword({
          service: 'com.bookclub.credentials'
        });
        
        if (credentials) {
          await login(credentials.username, credentials.password);
        } else {
          Alert.alert('Error', 'No saved credentials found. Please login with password first.');
        }
      }
    } catch (error) {
      Alert.alert('Authentication Failed', 'Please try again or use password login');
      console.error('Biometric login error:', error);
    }
  };

  const handleLogin = async () => {
    if (!emailOrUsernameOrPhone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(emailOrUsernameOrPhone, password);
      setLoading(false);
      // Navigation will be handled by AuthContext
    } catch (error) {
      setLoading(false);
      
      // Check if error requires email verification
      if (error.needsVerification && error.email) {
        Alert.alert(
          'Email Verification Required',
          error.message,
          [
            {
              text: 'Resend Email',
              onPress: async () => {
                try {
                  const { authAPI } = require('../../services/supabase');
                  await authAPI.resendVerificationEmail(error.email);
                  Alert.alert('Success', 'Verification email sent! Please check your inbox.');
                } catch (resendError) {
                  Alert.alert('Error', 'Failed to resend verification email. Please try again later.');
                }
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid credentials');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={COLORS.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.title}>🎉 Community Hub</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </LinearGradient>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            value={emailOrUsernameOrPhone}
            onChangeText={setEmailOrUsernameOrPhone}
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <Text style={styles.biometricText}>👤 Login with Biometrics</Text>
            </TouchableOpacity>
          )}

          <View style={styles.forgotLinks}>
            <TouchableOpacity onPress={() => Alert.prompt(
              'Reset Password',
              'Enter your email address to receive a password reset link',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send',
                  onPress: async (email) => {
                    try {
                      await fetch('https://hjgxujrxyilaeiemivcz.supabase.co/auth/v1/recover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3h1anJ4eWlsYWVpZW1pdmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODQyMTQsImV4cCI6MjA4MTY2MDIxNH0.ASW2q8jw_rGadyrfrRpsKUX6dI4epbnC5BJb7JC1Z04' },
                        body: JSON.stringify({ email })
                      });
                      Alert.alert('Success', 'Password reset email sent! Check your inbox.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to send reset email');
                    }
                  }
                }
              ],
              'plain-text'
            )}>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>
            <Text style={styles.forgotSeparator}>•</Text>
            <TouchableOpacity onPress={() => Alert.prompt(
              'Recover Username',
              'Enter your email address to retrieve your username',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Recover',
                  onPress: async (email) => {
                    try {
                      const response = await fetch('http://YOUR_BACKEND_URL/api/auth/recover-username', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                      });
                      const data = await response.json();
                      if (data.username) {
                        Alert.alert('Username Found', `Your username is: ${data.username}`);
                      } else {
                        Alert.alert('Info', data.message);
                      }
                    } catch (error) {
                      Alert.alert('Error', 'Failed to recover username');
                    }
                  }
                }
              ],
              'plain-text'
            )}>
              <Text style={styles.forgotLink}>Forgot Username?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  biometricText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  forgotLink: {
    color: COLORS.primary,
    fontSize: 14,
  },
  forgotSeparator: {
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
