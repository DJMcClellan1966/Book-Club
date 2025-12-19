import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import axios from 'axios';

const Login = () => {
  const [emailOrUsernameOrPhone, setEmailOrUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showUsernameRecovery, setShowUsernameRecovery] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Pre-fill username if coming from email verification
  useEffect(() => {
    const pendingUsername = localStorage.getItem('pending_verification_username');
    if (pendingUsername) {
      setEmailOrUsernameOrPhone(pendingUsername);
      localStorage.removeItem('pending_verification_username');
      localStorage.removeItem('pending_verification_email');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(emailOrUsernameOrPhone, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setRecoveryMessage('');
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: forgotEmail
      });
      setRecoveryMessage(response.data.message);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setRecoveryMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  const handleRecoverUsername = async (e) => {
    e.preventDefault();
    setRecoveryMessage('');
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/recover-username', {
        email: forgotEmail
      });
      if (response.data.username) {
        setRecoveryMessage(`Your username is: ${response.data.username}`);
      } else {
        setRecoveryMessage(response.data.message);
      }
      setTimeout(() => {
        setShowUsernameRecovery(false);
        setForgotEmail('');
        setRecoveryMessage('');
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to recover username');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to Community Hub</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email, Username, or Phone</label>
            <input
              type="text"
              value={emailOrUsernameOrPhone}
              onChange={(e) => setEmailOrUsernameOrPhone(e.target.value)}
              required
              placeholder="Enter your email, username, or phone"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => setShowForgotPassword(true)}
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline', marginRight: '15px' }}
          >
            Forgot Password?
          </button>
          <button 
            type="button" 
            onClick={() => setShowUsernameRecovery(true)}
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Forgot Username?
          </button>
        </div>
        
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ marginTop: 0 }}>Reset Password</h3>
              {recoveryMessage && <div style={{ color: 'green', marginBottom: '15px' }}>{recoveryMessage}</div>}
              {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary">Send Reset Link</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotEmail('');
                      setRecoveryMessage('');
                      setError('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Username Recovery Modal */}
        {showUsernameRecovery && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ marginTop: 0 }}>Recover Username</h3>
              {recoveryMessage && <div style={{ color: 'green', marginBottom: '15px' }}>{recoveryMessage}</div>}
              {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
              <form onSubmit={handleRecoverUsername}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary">Recover Username</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowUsernameRecovery(false);
                      setForgotEmail('');
                      setRecoveryMessage('');
                      setError('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
