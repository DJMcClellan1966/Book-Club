const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const { authenticateUser } = require('../middleware/auth.supabase');

// Get pricing tiers
router.get('/pricing', (req, res) => {
  try {
    const tiers = stripeService.getPricingTiers();
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pricing' });
  }
});

// Get current user's subscription
router.get('/subscription', authenticateUser, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user.userId });
    
    if (!subscription) {
      // Create free tier subscription if none exists
      subscription = new Subscription({
        user: req.user.userId,
        tier: 'free'
      });
      await subscription.save();
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription' });
  }
});

// Create a new subscription
router.post('/subscribe', authenticateUser, async (req, res) => {
  try {
    const { tier, paymentMethodId } = req.body;
    
    if (!['premium', 'pro'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    const user = req.user;
    let subscription = await Subscription.findOne({ user: user.userId });

    // Create or get Stripe customer
    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email, user.username);
      customerId = customer.id;
    }

    // Attach payment method to customer
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    // Get price ID for tier
    const pricing = stripeService.getPricingTiers();
    const priceId = pricing[tier].priceId;

    // Create Stripe subscription
    const stripeSubscription = await stripeService.createSubscription(customerId, priceId, 7); // 7 day trial

    // Update or create subscription record
    if (!subscription) {
      subscription = new Subscription({
        user: user.userId,
        tier,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
      });
    } else {
      subscription.tier = tier;
      subscription.stripeCustomerId = customerId;
      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.status = stripeSubscription.status;
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      subscription.trialEnd = stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null;
    }

    await subscription.save();

    res.json({
      subscription,
      clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Error creating subscription', error: error.message });
  }
});

// Cancel subscription
router.post('/cancel', authenticateUser, async (req, res) => {
  try {
    const { immediately } = req.body;
    const subscription = await Subscription.findOne({ user: req.user.userId });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    await stripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);

    if (immediately) {
      subscription.status = 'canceled';
      subscription.tier = 'free';
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    await subscription.save();
    res.json({ message: 'Subscription canceled', subscription });
  } catch (error) {
    res.status(500).json({ message: 'Error canceling subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', authenticateUser, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.userId });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    await stripeService.reactivateSubscription(subscription.stripeSubscriptionId);
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    res.json({ message: 'Subscription reactivated', subscription });
  } catch (error) {
    res.status(500).json({ message: 'Error reactivating subscription' });
  }
});

// Update subscription tier
router.post('/update-tier', authenticateUser, async (req, res) => {
  try {
    const { newTier } = req.body;
    const subscription = await Subscription.findOne({ user: req.user.userId });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const pricing = stripeService.getPricingTiers();
    const newPriceId = pricing[newTier].priceId;

    await stripeService.updateSubscription(subscription.stripeSubscriptionId, newPriceId);
    subscription.tier = newTier;
    await subscription.save();

    res.json({ message: 'Subscription updated', subscription });
  } catch (error) {
    res.status(500).json({ message: 'Error updating subscription' });
  }
});

// Get payment history
router.get('/payments', authenticateUser, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Create billing portal session
router.post('/portal', authenticateUser, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.userId });

    if (!subscription || !subscription.stripeCustomerId) {
      return res.status(404).json({ message: 'No customer found' });
    }

    const returnUrl = `${process.env.FRONTEND_URL}/billing`;
    const session = await stripeService.createPortalSession(subscription.stripeCustomerId, returnUrl);

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: 'Error creating portal session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripeService.verifyWebhook(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Helper functions for webhook events
async function handleSubscriptionUpdate(subscription) {
  const sub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
  if (sub) {
    sub.status = subscription.status;
    sub.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    sub.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    await sub.save();
  }
}

async function handleSubscriptionDeleted(subscription) {
  const sub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
  if (sub) {
    sub.status = 'canceled';
    sub.tier = 'free';
    await sub.save();
  }
}

async function handlePaymentSucceeded(invoice) {
  const subscription = await Subscription.findOne({ stripeCustomerId: invoice.customer });
  if (subscription) {
    await Payment.create({
      user: subscription.user,
      stripePaymentId: invoice.payment_intent,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'succeeded',
      type: 'subscription',
      description: `Payment for ${subscription.tier} subscription`
    });
  }
}

async function handlePaymentFailed(invoice) {
  const subscription = await Subscription.findOne({ stripeCustomerId: invoice.customer });
  if (subscription) {
    subscription.status = 'past_due';
    await subscription.save();

    await Payment.create({
      user: subscription.user,
      stripePaymentId: invoice.payment_intent,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      type: 'subscription',
      description: `Failed payment for ${subscription.tier} subscription`
    });
  }
}

module.exports = router;
