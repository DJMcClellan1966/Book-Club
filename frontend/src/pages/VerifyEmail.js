import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'signup') {
          setStatus('error');
          setMessage('Invalid verification link.');
          return;
        }

        // The Supabase client will automatically handle the verification
        // when the page loads with the token in the URL
        
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {status === 'verifying' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h2>Verifying Email</h2>
              <p>{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h2 style={{ color: '#4caf50' }}>Email Verified!</h2>
              <p>{message}</p>
              <p style={{ marginTop: '20px', color: '#666' }}>
                Redirecting to login...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <h2 style={{ color: '#f44336' }}>Verification Failed</h2>
              <p>{message}</p>
              <button 
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
