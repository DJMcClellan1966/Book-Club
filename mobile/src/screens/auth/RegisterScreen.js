import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext.supabase';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

// Password validation helper
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('at least 8 characters');
  }
  if (password.length > 128) {
    errors.push('maximum 128 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('one special character (!@#$%^&*...)');
  }
  
  return errors;
};

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [enableMFA, setEnableMFA] = useState(false);
  const { register } = useAuth();

  // Generate random secure username
  const generateUsername = () => {
    const adjectives = ['swift', 'bright', 'clever', 'brave', 'noble', 'wise', 'bold', 'keen', 'calm', 'fair'];
    const nouns = ['tiger', 'eagle', 'wolf', 'falcon', 'lion', 'bear', 'hawk', 'fox', 'owl', 'dragon'];
    const randomNum = Math.floor(Math.random() * 10000);
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const generatedUsername = `${adj}_${noun}_${randomNum}`;
    setUsername(generatedUsername);
    Alert.alert('Username Generated', `Your secure username is: ${generatedUsername}\n\nYou'll use this to login, but others will see your display name.`);
  };

  // Check password criteria
  const passwordCriteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const allCriteriaMet = Object.values(passwordCriteria).every(val => val);

  // Generate strong password
  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    let password = '';
    // Ensure at least one of each required character type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly to make it 12 characters
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setPassword(password);
    setConfirmPassword(password);
    Alert.alert('Password Generated', 'A strong password has been created for you!');
  };

  const handleRegister = async () => {
    if (!displayName || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (displayName.length < 2) {
      Alert.alert('Error', 'Display name must be at least 2 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate password strength
    if (!allCriteriaMet) {
      Alert.alert(
        'Weak Password',
        'Please ensure your password meets all the criteria shown below the password field.'
      );
      return;
    }

    setLoading(true);
    try {
      await register(email, password, username, displayName);
      setLoading(false);
      
      // Show success message
      Alert.alert(
        '✓ Account Created!',
        enableMFA 
          ? 'Your account has been created successfully. You can set up two-factor authentication from your profile settings for extra security.\n\nPlease check your email and verify your account before logging in.'
          : 'Please check your email and click the verification link before logging in.',
        [{ 
          text: 'OK',
          onPress: () => {
            // Navigate back to login - use replace to avoid navigation issues
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace('Login');
            }
          }
        }]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Book Club community!</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Display Name</Text>
              <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Shown to others</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="How you'll appear on the site"
              placeholderTextColor={COLORS.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Username (for login)</Text>
              <TouchableOpacity onPress={generateUsername} disabled={loading}>
                <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>🎲 Auto-Generate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Secure username for login"
              placeholderTextColor={COLORS.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />
            <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
              💡 Tip: Use auto-generate for a secure random username
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={generateStrongPassword} disabled={loading}>
                <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>🔑 Auto-Generate</Text>
              </TouchableOpacity>
            </View>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                maxLength={128}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 12, top: 15 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ fontSize: 18 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.criteriaContainer}>
                <Text style={styles.criteriaTitle}>Password must contain:</Text>
                <View style={styles.criteriaItem}>
                  <Text style={passwordCriteria.length ? styles.criteriaMet : styles.criteriaUnmet}>
                    {passwordCriteria.length ? '✓' : '○'}
                  </Text>
                  <Text style={passwordCriteria.length ? styles.criteriaTextMet : styles.criteriaTextUnmet}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Text style={passwordCriteria.uppercase ? styles.criteriaMet : styles.criteriaUnmet}>
                    {passwordCriteria.uppercase ? '✓' : '○'}
                  </Text>
                  <Text style={passwordCriteria.uppercase ? styles.criteriaTextMet : styles.criteriaTextUnmet}>
                    One uppercase letter (A-Z)
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Text style={passwordCriteria.lowercase ? styles.criteriaMet : styles.criteriaUnmet}>
                    {passwordCriteria.lowercase ? '✓' : '○'}
                  </Text>
                  <Text style={passwordCriteria.lowercase ? styles.criteriaTextMet : styles.criteriaTextUnmet}>
                    One lowercase letter (a-z)
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Text style={passwordCriteria.number ? styles.criteriaMet : styles.criteriaUnmet}>
                    {passwordCriteria.number ? '✓' : '○'}
                  </Text>
                  <Text style={passwordCriteria.number ? styles.criteriaTextMet : styles.criteriaTextUnmet}>
                    One number (0-9)
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Text style={passwordCriteria.special ? styles.criteriaMet : styles.criteriaUnmet}>
                    {passwordCriteria.special ? '✓' : '○'}
                  </Text>
                  <Text style={passwordCriteria.special ? styles.criteriaTextMet : styles.criteriaTextUnmet}>
                    One special character (!@#$%^&*...)
                  </Text>
                </View>
                {allCriteriaMet && (
                  <View style={styles.successBanner}>
                    <Text style={styles.successText}>✓ Strong password!</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={COLORS.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.mfaToggle}
              onPress={() => setEnableMFA(!enableMFA)}
              disabled={loading}
            >
              <View style={styles.checkbox}>
                {enableMFA && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.mfaLabel}>🔒 Enable Two-Factor Authentication (Recommended)</Text>
                <Text style={styles.mfaDescription}>
                  Add an extra layer of security with 2FA
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
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
    fontSize: 16,
    color: COLORS.text,
  },
  criteriaContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  criteriaTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  criteriaMet: {
    fontSize: 16,
    marginRight: 8,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  criteriaUnmet: {
    fontSize: 16,
    marginRight: 8,
    color: '#999',
  },
  criteriaTextMet: {
    fontSize: 12,
    color: '#4caf50',
  },
  criteriaTextUnmet: {
    fontSize: 12,
    color: '#666',
  },
  successBanner: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    alignItems: 'center',
  },
  successText: {
    color: '#4caf50',
    fontWeight: '600',
    fontSize: 13,
  },
  mfaToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d9ff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mfaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  mfaDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
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

export default RegisterScreen;
