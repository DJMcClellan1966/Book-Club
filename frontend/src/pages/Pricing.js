import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Pricing.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Pricing = () => {
  const [pricing, setPricing] = useState(null);
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPricing();
    fetchCurrentSubscription();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API_URL}/payments/pricing`);
      setPricing(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/payments/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentTier(response.data.tier);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = (tier) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    navigate('/checkout', { state: { tier } });
  };

  if (loading) {
    return <div className="pricing-loading">Loading pricing...</div>;
  }

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Unlock premium features and enhance your book club experience</p>
      </div>

      <div className="pricing-cards">
        {/* Free Tier */}
        <div className={`pricing-card ${currentTier === 'free' ? 'current' : ''}`}>
          <div className="pricing-card-header">
            <h2>Free</h2>
            <div className="price">
              <span className="amount">$0</span>
              <span className="period">/month</span>
            </div>
          </div>
          <ul className="features-list">
            <li>✓ Basic book reviews</li>
            <li>✓ 3 reading lists</li>
            <li>✓ Create 5 spaces</li>
            <li>✓ Join public forums</li>
            <li>✓ Text chat</li>
            <li>✓ Standard recommendations</li>
          </ul>
          {currentTier === 'free' ? (
            <button className="subscribe-btn current-plan" disabled>Current Plan</button>
          ) : (
            <button className="subscribe-btn" onClick={() => handleSubscribe('free')}>
              Downgrade
            </button>
          )}
        </div>

        {/* Premium Tier */}
        {pricing?.premium && (
          <div className={`pricing-card featured ${currentTier === 'premium' ? 'current' : ''}`}>
            <div className="popular-badge">Most Popular</div>
            <div className="pricing-card-header">
              <h2>Premium</h2>
              <div className="price">
                <span className="amount">${pricing.premium.price}</span>
                <span className="period">/{pricing.premium.interval}</span>
              </div>
            </div>
            <ul className="features-list">
              {pricing.premium.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
            {currentTier === 'premium' ? (
              <button className="subscribe-btn current-plan" disabled>Current Plan</button>
            ) : (
              <button className="subscribe-btn featured-btn" onClick={() => handleSubscribe('premium')}>
                {currentTier === 'free' ? 'Upgrade to Premium' : 'Switch to Premium'}
              </button>
            )}
            <p className="trial-info">7-day free trial included</p>
          </div>
        )}

        {/* Pro Tier */}
        {pricing?.pro && (
          <div className={`pricing-card ${currentTier === 'pro' ? 'current' : ''}`}>
            <div className="pricing-card-header">
              <h2>Pro</h2>
              <div className="price">
                <span className="amount">${pricing.pro.price}</span>
                <span className="period">/{pricing.pro.interval}</span>
              </div>
            </div>
            <ul className="features-list">
              {pricing.pro.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
            {currentTier === 'pro' ? (
              <button className="subscribe-btn current-plan" disabled>Current Plan</button>
            ) : (
              <button className="subscribe-btn" onClick={() => handleSubscribe('pro')}>
                {currentTier === 'free' ? 'Upgrade to Pro' : 'Switch to Pro'}
              </button>
            )}
            <p className="trial-info">7-day free trial included</p>
          </div>
        )}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-item">
          <h3>Can I cancel anytime?</h3>
          <p>Yes! You can cancel your subscription at any time from your billing settings.</p>
        </div>
        <div className="faq-item">
          <h3>What happens to my data if I cancel?</h3>
          <p>Your account remains active as a free tier. All your books, reviews, and spaces are preserved.</p>
        </div>
        <div className="faq-item">
          <h3>Can I change plans later?</h3>
          <p>Absolutely! You can upgrade or downgrade your plan at any time. Changes are prorated.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
