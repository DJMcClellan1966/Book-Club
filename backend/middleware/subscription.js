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
module.exports = {
  getTierLimits,
  TIER_LIMITS
};
