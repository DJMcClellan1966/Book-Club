import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Detect country code from browser/timezone
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('America')) setCountryCode('+1');
      else if (timezone.includes('Europe/London')) setCountryCode('+44');
      else if (timezone.includes('Europe')) setCountryCode('+33');
      else if (timezone.includes('Asia/Tokyo')) setCountryCode('+81');
      else if (timezone.includes('Australia')) setCountryCode('+61');
    } catch (e) {
      console.error('Error detecting country:', e);
    }
  }, []);

  // Password strength checker
  useEffect(() => {
    const errors = [];
    let score = 0;
    
    if (password.length >= 8) score++; else errors.push('at least 8 characters');
    if (/[A-Z]/.test(password)) score++; else errors.push('one uppercase letter');
    if (/[a-z]/.test(password)) score++; else errors.push('one lowercase letter');
    if (/[0-9]/.test(password)) score++; else errors.push('one number');
    if (/[!@#$%^&*(),.?\":{}|<>]/.test(password)) score++; else errors.push('one special character');
    
    setPasswordStrength({ score, feedback: errors });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email && !phone) {
      setError('Please provide either email or phone number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 5) {
      setError('Password must contain: ' + passwordStrength.feedback.join(', '));
      return;
    }

    setLoading(true);

    const result = await register(username, email, password, phone, countryCode);
    
    if (result.success) {
      // Save username and email for reference after email verification
      localStorage.setItem('pending_verification_username', username);
      localStorage.setItem('pending_verification_email', email);
      
      if (result.needsPhoneVerification) {
        alert('Please check your phone for a verification code');
      }
      
      // Show success message with verification instructions
      alert('Account created! Please check your email and click the verification link to activate your account.');
      navigate('/login');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join Community Hub</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choose a username"
              minLength={3}
            />
          </div>
          
          <div className="form-group">
            <label>Email (optional if phone provided)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Phone Number (optional if email provided)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                value={countryCode} 
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ width: '100px' }}
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+49">🇩🇪 +49</option>
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                style={{ flex: 1 }}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Choose a password"
              minLength={8}
            />
            {password && (
              <div style={{ marginTop: '5px', fontSize: '12px' }}>
                <div style={{ 
                  height: '4px', 
                  backgroundColor: '#e0e0e0', 
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '5px'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.score < 3 ? '#f44336' : passwordStrength.score < 5 ? '#ff9800' : '#4caf50',
                    transition: 'all 0.3s'
                  }} />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <span style={{ color: '#666' }}>
                    Missing: {passwordStrength.feedback.join(', ')}
                  </span>
                )}
                {passwordStrength.score === 5 && (
                  <span style={{ color: '#4caf50' }}>✓ Strong password</span>
                )}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
