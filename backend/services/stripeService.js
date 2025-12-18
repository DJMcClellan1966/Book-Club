const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  // Create a new customer
  async createCustomer(email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          platform: 'book-club'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription
  async createSubscription(customerId, priceId, trialDays = 0) {
    try {
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      };

      if (trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId, immediately = false) {
    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate a subscription
  async reactivateSubscription(subscriptionId) {
    try {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Update subscription tier
  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations'
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Create a payment intent for one-time purchases
  async createPaymentIntent(amount, currency = 'usd', customerId = null) {
    try {
      const paymentIntentData = {
        amount: amount * 100, // Convert to cents
        currency,
        automatic_payment_methods: { enabled: true }
      };

      if (customerId) {
        paymentIntentData.customer = customerId;
      }

      return await stripe.paymentIntents.create(paymentIntentData);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // Get customer details
  async getCustomer(customerId) {
    try {
      return await stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  }

  // List customer invoices
  async getCustomerInvoices(customerId, limit = 10) {
    try {
      return await stripe.invoices.list({
        customer: customerId,
        limit
      });
    } catch (error) {
      console.error('Error retrieving invoices:', error);
      throw error;
    }
  }

  // Create a portal session for customer self-service
  async createPortalSession(customerId, returnUrl) {
    try {
      return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhook(payload, signature, secret) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      console.error('Webhook verification failed:', error);
      throw error;
    }
  }

  // Get price tiers (for display)
  getPricingTiers() {
    return {
      premium: {
        name: 'Premium',
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
        price: 9.99,
        currency: 'USD',
        interval: 'month',
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
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'All Premium features',
          'Custom themes',
          'Priority support',
          'Unlimited reading lists',
          'Unlimited spaces',
          'Early access to new features',
          'Bulk import tools'
        ]
      }
    };
  }
}

module.exports = new StripeService();
