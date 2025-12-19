const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, phone, countryCode, displayName } = req.body;

    // Validate input
    if ((!email && !phone) || !password || !username) {
      return res.status(400).json({ message: 'Username, password, and either email or phone are required' });
    }

    // Validate password strength
    const passwordErrors = [];
    if (password.length < 8) passwordErrors.push('at least 8 characters');
    if (password.length > 128) passwordErrors.push('maximum 128 characters');
    if (!/[A-Z]/.test(password)) passwordErrors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) passwordErrors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) passwordErrors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) passwordErrors.push('one special character');
    
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Password must contain: ' + passwordErrors.join(', ')
      });
    }

    // Format phone number with country code
    const fullPhone = phone ? `${countryCode || '+1'}${phone.replace(/\D/g, '')}` : null;

    // Check if username is taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if phone is taken (if provided)
    if (fullPhone) {
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('phone_number', fullPhone)
        .single();
      
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
    }

    // Create auth user with email confirmation enabled
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email || `${username}@temp.local`,
      password,
      phone: fullPhone,
      options: {
        data: {
          username,
          display_name: displayName || username,
          phone_number: fullPhone
        },
        emailRedirectTo: process.env.CLIENT_URL || 'http://localhost:3000'
      }
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        display_name: displayName || username,
        email: email || null,
        email_verified: false,
        phone_number: fullPhone,
        phone_verified: false
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(500).json({ message: 'Failed to create profile' });
    }

    // Create free subscription
    await supabase
      .from('subscriptions')
      .insert({
        user_id: authData.user.id,
        tier: 'free',
        status: 'active'
      });

    res.status(201).json({
      message: fullPhone ? 'Registration successful. Please verify your phone number.' : 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        phone: fullPhone
      },
      session: authData.session,
      needsPhoneVerification: !!fullPhone
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email: emailUsernameOrPhone, password } = req.body;

    if (!emailUsernameOrPhone || !password) {
      return res.status(400).json({ message: 'Email/username/phone and password are required' });
    }

    let email = emailUsernameOrPhone;
    let phone = null;
    
    // Check if input is a phone number (starts with + or only digits)
    const isPhone = /^[+]?[0-9\s\-()]+$/.test(emailUsernameOrPhone);
    
    if (isPhone) {
      // Format phone number
      phone = emailUsernameOrPhone.replace(/\D/g, '');
      if (!emailUsernameOrPhone.startsWith('+')) {
        phone = '+1' + phone;
      } else {
        phone = '+' + phone;
      }
      
      // Look up email by phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone_number', phone)
        .single();
      
      if (!profile || !profile.email) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      email = profile.email;
    } else if (!emailUsernameOrPhone.includes('@')) {
      // Look up email by username
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailUsernameOrPhone)
        .single();
      
      if (!profile) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      email = profile.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Check if it's an email verification error
      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({ 
          message: 'Please verify your email address before logging in. Check your inbox for the confirmation link.',
          requiresVerification: true
        });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', data.user.id)
      .single();

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile,
        subscription: subscription || { tier: 'free', status: 'active' }
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Send phone verification
router.post('/send-phone-verification', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // In production, integrate with Twilio or similar SMS service
    // For now, just return success
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code (in production, use Redis or database with expiry)
    // For demo purposes, we'll just return it
    console.log(`Verification code for ${phone}: ${verificationCode}`);
    
    res.json({ 
      message: 'Verification code sent via SMS',
      // In production, don't send this
      code: verificationCode 
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify phone number
router.post('/verify-phone', async (req, res) => {
  try {
    const { phone, code, userId } = req.body;

    if (!phone || !code || !userId) {
      return res.status(400).json({ message: 'Phone, code, and userId are required' });
    }

    // In production, verify the code from Redis/database
    // For now, accept any 6-digit code
    if (code.length === 6) {
      // Update profile to mark phone as verified
      const { error } = await supabase
        .from('profiles')
        .update({ phone_verified: true })
        .eq('id', userId)
        .eq('phone_number', phone);

      if (error) {
        return res.status(500).json({ message: 'Failed to verify phone' });
      }

      res.json({ message: 'Phone number verified successfully' });
    } else {
      res.status(400).json({ message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get username by email
router.post('/recover-username', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Look up username by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('email', email)
      .single();

    if (!profile) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If this email is registered, the username has been sent.' });
    }

    // In a real app, you'd send an email here
    // For now, we'll return the username
    res.json({ 
      message: 'Username found',
      username: profile.username 
    });
  } catch (error) {
    console.error('Recover username error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single();

    res.json({
      id: user.id,
      email: user.email,
      ...profile,
      subscription: subscription || { tier: 'free', status: 'active' }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh session
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    res.json({
      session: data.session
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// MFA - Send SMS verification code
router.post('/send-sms-mfa', async (req, res) => {
  try {
    const { phone, userId } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number required' });
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    await supabase
      .from('mfa_codes')
      .insert({
        user_id: userId,
        code: verificationCode,
        method: 'sms',
        phone_number: phone,
        expires_at: expiresAt.toISOString()
      });

    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    // For now, just log the code (in production, send actual SMS)
    console.log(`SMS MFA Code for ${phone}: ${verificationCode}`);

    res.json({ 
      message: 'Verification code sent',
      // Remove this in production
      code: verificationCode
    });
  } catch (error) {
    console.error('Send SMS MFA error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// MFA - Send Email verification code
router.post('/send-email-mfa', async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    await supabase
      .from('mfa_codes')
      .insert({
        user_id: userId,
        code: verificationCode,
        method: 'email',
        email: email,
        expires_at: expiresAt.toISOString()
      });

    // TODO: Send email via Supabase or email provider
    console.log(`Email MFA Code for ${email}: ${verificationCode}`);

    res.json({ 
      message: 'Verification code sent',
      // Remove this in production
      code: verificationCode
    });
  } catch (error) {
    console.error('Send Email MFA error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// MFA - Verify code (SMS or Email)
router.post('/verify-mfa-code', async (req, res) => {
  try {
    const { userId, code, method } = req.body;

    if (!userId || !code || !method) {
      return res.status(400).json({ message: 'User ID, code, and method required' });
    }

    // Get the most recent unexpired code
    const { data: mfaCode, error } = await supabase
      .from('mfa_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('method', method)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !mfaCode) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Mark code as used
    await supabase
      .from('mfa_codes')
      .update({ used: true })
      .eq('id', mfaCode.id);

    // Update user profile with verified method
    const updateData = method === 'sms' 
      ? { phone_verified: true } 
      : { email_verified: true };
    
    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    res.json({ 
      message: 'Verification successful',
      verified: true
    });
  } catch (error) {
    console.error('Verify MFA code error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;
