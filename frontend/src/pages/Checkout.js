import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './Checkout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ tier }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      // Create subscription
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/payments/subscribe`,
        {
          tier,
          paymentMethodId: paymentMethod.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Handle 3D Secure if needed
      const { clientSecret } = response.data;
      if (clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
        
        if (confirmError) {
          setError(confirmError.message);
          setProcessing(false);
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  if (success) {
    return (
      <div className="checkout-success">
        <div className="success-icon">✓</div>
        <h2>Subscription Successful!</h2>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="form-group">
        <label>Card Information</label>
        <div className="card-element-wrapper">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button type="submit" disabled={!stripe || processing} className="submit-payment-btn">
        {processing ? 'Processing...' : 'Start 7-Day Free Trial'}
      </button>

      <p className="payment-note">
        Your card won't be charged during the trial period. Cancel anytime.
      </p>
    </form>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tier } = location.state || {};

  if (!tier) {
    navigate('/pricing');
    return null;
  }

  const tierInfo = {
    premium: {
      name: 'Premium',
      price: 9.99,
      features: [
        'Ad-free experience',
        'Enhanced AI recommendations',
        'Access to exclusive forums',
        'Video chat capability',
        'Up to 10 reading lists',
        'Create up to 20 spaces'
      ]
    },
    pro: {
      name: 'Pro',
      price: 19.99,
      features: [
        'All Premium features',
        'Custom themes',
        'Priority support',
        'Unlimited reading lists',
        'Unlimited spaces',
        'Early access to new features'
      ]
    }
  };

  const info = tierInfo[tier];

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-summary">
          <h2>Subscribe to {info.name}</h2>
          <div className="subscription-details">
            <div className="price-display">
              <span className="amount">${info.price}</span>
              <span className="period">/month</span>
            </div>
            <div className="trial-badge">7-Day Free Trial</div>
            <ul className="features-summary">
              {info.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="checkout-payment">
          <h3>Payment Information</h3>
          <Elements stripe={stripePromise}>
            <CheckoutForm tier={tier} />
          </Elements>
        </div>
      </div>

      <div className="checkout-footer">
        <p>Secure payment powered by Stripe</p>
        <p>Questions? Contact support@bookclub.com</p>
      </div>
    </div>
  );
};

export default Checkout;
