import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import QRCode from 'react-native-qrcode-svg';

const TwoFactorSetupScreen = ({ navigation }) => {
  const { user, enable2FA, verify2FA, disable2FA } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(user?.two_factor_enabled ? 'enabled' : 'setup');

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const data = await enable2FA();
      setQrData(data.totp.qr_code);
      setFactorId(data.id);
      setStep('verify');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await verify2FA(factorId, verificationCode);
      Alert.alert('Success', '2FA has been enabled!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setStep('enabled');
    } catch (error) {
      Alert.alert('Error', 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = () => {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Get all factors and unenroll
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser?.factors && authUser.factors.length > 0) {
                await disable2FA(authUser.factors[0].id);
                Alert.alert('Success', '2FA has been disabled');
                setStep('setup');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to disable 2FA');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (step === 'enabled') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🔒 2FA Enabled</Text>
            <Text style={styles.subtitle}>
              Your account is protected with two-factor authentication
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ✅ Two-factor authentication is active{'\n'}
              📱 Use your authenticator app to sign in{'\n'}
              🔐 Enhanced security for your account
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDisable}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Disable 2FA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === 'verify') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan QR Code</Text>
            <Text style={styles.subtitle}>
              Use an authenticator app like Google Authenticator or Authy
            </Text>
          </View>

          <View style={styles.qrContainer}>
            {qrData && (
              <QRCode
                value={qrData}
                size={250}
                backgroundColor="white"
              />
            )}
          </View>

          <Text style={styles.instructions}>
            1. Open your authenticator app{'\n'}
            2. Scan the QR code above{'\n'}
            3. Enter the 6-digit code below
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={COLORS.textSecondary}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Verify & Enable</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('setup')}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Setup step
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🔐 Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            Add an extra layer of security to your account
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why enable 2FA?</Text>
          <Text style={styles.infoText}>
            • Protects your account from unauthorized access{'\n'}
            • Requires both password and verification code{'\n'}
            • Industry-standard security practice{'\n'}
            • Works with popular authenticator apps
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What you'll need:</Text>
          <Text style={styles.infoText}>
            • An authenticator app (Google Authenticator, Authy, etc.){'\n'}
            • Your phone or tablet{'\n'}
            • A few minutes to set up
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleEnable2FA}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Enable 2FA</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  qrContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  instructions: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 4,
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
  dangerButton: {
    backgroundColor: COLORS.error || '#DC2626',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TwoFactorSetupScreen;
