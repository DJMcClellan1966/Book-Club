import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Billing.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Billing = () => {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
    fetchPayments();
  }, []);

  const fetchSubscription = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/payments/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscription(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/payments/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API_URL}/payments/cancel`,
        { immediately: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Subscription will be canceled at the end of the billing period.');
      fetchSubscription();
    } catch (error) {
      alert('Error canceling subscription');
    }
  };

  const handleReactivate = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API_URL}/payments/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Subscription reactivated!');
      fetchSubscription();
    } catch (error) {
      alert('Error reactivating subscription');
    }
  };

  const handleManageBilling = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_URL}/payments/portal`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = response.data.url;
    } catch (error) {
      alert('Error opening billing portal');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="billing-loading">Loading billing information...</div>;
  }

  return (
    <div className="billing-container">
      <h1>Billing & Subscription</h1>

      {/* Current Subscription */}
      <div className="billing-section">
        <h2>Current Plan</h2>
        <div className="subscription-card">
          <div className="subscription-info">
            <div className="tier-badge tier-{subscription.tier}">
              {subscription.tier.toUpperCase()}
            </div>
            <div className="subscription-status">
              Status: <span className={`status-${subscription.status}`}>
                {subscription.status}
              </span>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="billing-period">
                {subscription.cancelAtPeriodEnd ? (
                  <span className="cancel-notice">
                    Cancels on {formatDate(subscription.currentPeriodEnd)}
                  </span>
                ) : (
                  <span>
                    Renews on {formatDate(subscription.currentPeriodEnd)}
                  </span>
                )}
              </div>
            )}
            {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
              <div className="trial-notice">
                Trial ends on {formatDate(subscription.trialEnd)}
              </div>
            )}
          </div>

          <div className="subscription-actions">
            {subscription.tier !== 'free' && !subscription.cancelAtPeriodEnd && (
              <button onClick={handleCancelSubscription} className="btn-cancel">
                Cancel Subscription
              </button>
            )}
            {subscription.cancelAtPeriodEnd && (
              <button onClick={handleReactivate} className="btn-reactivate">
                Reactivate Subscription
              </button>
            )}
            {subscription.tier === 'free' ? (
              <button onClick={() => navigate('/pricing')} className="btn-upgrade">
                Upgrade Plan
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/pricing')} className="btn-change">
                  Change Plan
                </button>
                {subscription.stripeCustomerId && (
                  <button onClick={handleManageBilling} className="btn-manage">
                    Manage Billing
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="billing-section">
        <h2>Plan Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📚</span>
            <span className="feature-name">Reading Lists</span>
            <span className="feature-value">
              {subscription.features.maxReadingLists === -1 
                ? 'Unlimited' 
                : subscription.features.maxReadingLists}
            </span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💬</span>
            <span className="feature-name">Spaces</span>
            <span className="feature-value">
              {subscription.features.maxSpaces === -1 
                ? 'Unlimited' 
                : subscription.features.maxSpaces}
            </span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <span className="feature-name">Custom Themes</span>
            <span className="feature-value">
              {subscription.features.customThemes ? '✓' : '✗'}
            </span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎥</span>
            <span className="feature-name">Video Chat</span>
            <span className="feature-value">
              {subscription.features.videoChat ? '✓' : '✗'}
            </span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🚫</span>
            <span className="feature-name">Ad-Free</span>
            <span className="feature-value">
              {subscription.features.adFree ? '✓' : '✗'}
            </span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <span className="feature-name">Enhanced AI</span>
            <span className="feature-value">
              {subscription.features.enhancedRecommendations ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="billing-section">
          <h2>Payment History</h2>
          <div className="payments-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>{payment.description}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>
                      <span className={`payment-status status-${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
