const { supabase } = require('../config/supabase');

// Middleware to verify JWT and attach user to request
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      ...profile
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email,
        ...profile
      };
    }

    next();
  } catch (error) {
    next();
  }
};

// Subscription tier check middleware
const requireSubscription = (minTier = 'premium') => {
  return async (req, res, next) => {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', req.user.id)
        .single();

      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({ 
          message: 'Active subscription required',
          required: minTier
        });
      }

      const tiers = ['free', 'premium', 'pro'];
      const userTierIndex = tiers.indexOf(subscription.tier);
      const requiredTierIndex = tiers.indexOf(minTier);

      if (userTierIndex < requiredTierIndex) {
        return res.status(403).json({ 
          message: 'Subscription tier insufficient',
          current: subscription.tier,
          required: minTier
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ message: 'Error checking subscription' });
    }
  };
};

module.exports = { 
  authenticateUser, 
  optionalAuth,
  requireSubscription
};
