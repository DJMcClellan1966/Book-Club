const Subscription = require('../models/Subscription');

// Subscription tier limits
const TIER_LIMITS = {
  free: {
    diaryBooks: 2,
    maxBooklistSize: 50,
    aiChatsPerMonth: 5
  },
  premium: {
    diaryBooks: 10,
    maxBooklistSize: 200,
    aiChatsPerMonth: 50
  },
  pro: {
    diaryBooks: Infinity,
    maxBooklistSize: Infinity,
    aiChatsPerMonth: Infinity
  }
};

// Get limits for a subscription tier
const getTierLimits = (tier) => {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
};

// Middleware to check if user has premium access
const requirePremium = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.userId });
    
    if (!subscription || subscription.tier === 'free') {
      return res.status(403).json({ 
        message: 'Premium subscription required',
        upgrade: true 
      });
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return res.status(403).json({ 
        message: 'Subscription inactive. Please update payment method.',
        subscriptionStatus: subscription.status
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking subscription status' });
  }
};

// Middleware to check if user has pro access
const requirePro = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.userId });
    
    if (!subscription || subscription.tier !== 'pro') {
      return res.status(403).json({ 
        message: 'Pro subscription required',
        upgrade: true 
      });
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return res.status(403).json({ 
        message: 'Subscription inactive. Please update payment method.',
        subscriptionStatus: subscription.status
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking subscription status' });
  }
};

// Middleware to check feature access
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({ user: req.user.userId });
      
      if (!subscription) {
        return res.status(403).json({ 
          message: 'Subscription required for this feature',
          feature 
        });
      }

      if (!subscription.features[feature]) {
        return res.status(403).json({ 
          message: `This feature requires ${subscription.tier === 'free' ? 'Premium' : 'Pro'} subscription`,
          feature,
          currentTier: subscription.tier
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking feature access' });
    }
  };
};

// Middleware to check resource limits
const checkResourceLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({ user: req.user.userId });
      
      if (!subscription) {
        subscription = new Subscription({ user: req.user.userId, tier: 'free' });
        await subscription.save();
      }

      const limit = subscription.features[resourceType];
      
      // -1 means unlimited
      if (limit === -1) {
        req.subscription = subscription;
        return next();
      }

      // Count current resources (you'll need to implement the actual counting logic)
      // This is a placeholder - implement based on your needs
      const currentCount = 0; // Replace with actual count

      if (currentCount >= limit) {
        return res.status(403).json({ 
          message: `Resource limit reached. Upgrade to increase limit.`,
          limit,
          currentCount,
          resourceType
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking resource limits' });
    }
  };
};

// Middleware to attach subscription info to request
const attachSubscription = async (req, res, next) => {
  try {
    if (req.user) {
      const subscription = await Subscription.findOne({ user: req.user.userId });
      req.subscription = subscription || { tier: 'free', features: {} };
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  requirePremium,
  requirePro,
  checkFeatureAccess,
  checkResourceLimit,
  attachSubscription,
  getTierLimits,
  TIER_LIMITS
};
