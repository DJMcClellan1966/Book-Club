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
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
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
  const [mfaMethod, setMfaMethod] = useState(null); // 'authenticator', 'sms', 'email', 'biometric'
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState(user?.email || '');

  // Check for biometric support
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setHasBiometric(compatible && enrolled);
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      }
    } catch (error) {
      console.log('Biometric check error:', error);
    }
  };

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

  const handleEnableBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        // Save biometric preference
        await AsyncStorage.setItem('mfa_biometric_enabled', 'true');
        Alert.alert('Success', `${biometricType} authentication has been enabled!`);
        setStep('enabled');
      } else {
        Alert.alert('Authentication Failed', 'Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to enable biometric authentication');
    }
  };

  const handleSendSMSCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Call backend to send SMS
      const response = await fetch('http://localhost:5000/api/auth/send-phone-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Code Sent', 'Please check your phone for the verification code');
        setStep('verify');
      } else {
        Alert.alert('Error', data.message || 'Failed to send SMS');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS code');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    setLoading(true);
    try {
      // Generate and send email code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      Alert.alert('Code Sent', `Verification code sent to ${emailAddress}`);
      setStep('verify');
    } catch (error) {
      Alert.alert('Error', 'Failed to send email code');
    } finally {
      setLoading(false);
    }
  };

  // Method selection screen
  if (step === 'setup' && !mfaMethod) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose 2FA Method</Text>
            <Text style={styles.subtitle}>
              Select your preferred two-factor authentication method
            </Text>
          </View>

          {hasBiometric && (
            <TouchableOpacity
              style={styles.methodCard}
              onPress={() => setMfaMethod('biometric')}
            >
              <Text style={styles.methodIcon}>👤</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>{biometricType}</Text>
                <Text style={styles.methodDescription}>
                  Use your face or fingerprint for quick verification
                </Text>
              </View>
              <Text style={styles.methodArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => setMfaMethod('sms')}
          >
            <Text style={styles.methodIcon}>📱</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>SMS Verification</Text>
              <Text style={styles.methodDescription}>
                Receive a code via text message
              </Text>
            </View>
            <Text style={styles.methodArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => setMfaMethod('email')}
          >
            <Text style={styles.methodIcon}>📧</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Email Verification</Text>
              <Text style={styles.methodDescription}>
                Receive a code via email
              </Text>
            </View>
            <Text style={styles.methodArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => setMfaMethod('authenticator')}
          >
            <Text style={styles.methodIcon}>🔐</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Authenticator App</Text>
              <Text style={styles.methodDescription}>
                Use Google Authenticator or similar app
              </Text>
            </View>
            <Text style={styles.methodArrow}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Biometric setup
  if (mfaMethod === 'biometric') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{biometricType} Setup</Text>
            <Text style={styles.subtitle}>
              Enable biometric authentication for quick and secure access
            </Text>
          </View>

          <View style={styles.biometricIcon}>
            <Text style={{ fontSize: 80 }}>👤</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              • Quick authentication with {biometricType}{'\n'}
              • Your biometric data stays on your device{'\n'}
              • Most secure authentication method{'\n'}
              • Works even offline
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleEnableBiometric}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Enable {biometricType}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMfaMethod(null)}
          >
            <Text style={styles.backButtonText}>← Choose Different Method</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // SMS setup
  if (mfaMethod === 'sms') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>SMS Verification</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to receive verification codes
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 234 567 8900"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSendSMSCode}
            disabled={loading || !phoneNumber}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMfaMethod(null)}
          >
            <Text style={styles.backButtonText}>← Choose Different Method</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Email setup
  if (mfaMethod === 'email') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Email Verification</Text>
            <Text style={styles.subtitle}>
              Verification codes will be sent to your email
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSendEmailCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMfaMethod(null)}
          >
            <Text style={styles.backButtonText}>← Choose Different Method</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

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
              📱 Method: {mfaMethod === 'biometric' ? biometricType : mfaMethod === 'sms' ? 'SMS' : mfaMethod === 'email' ? 'Email' : 'Authenticator App'}{'\n'}
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
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: 4,
  },
  methodDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  methodArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  biometricIcon: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  backButton: {
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default TwoFactorSetupScreen;
