const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tier: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'],
    default: 'active'
  },
  currentPeriodStart: {
    type: Date,
    default: null
  },
  currentPeriodEnd: {
    type: Date,
    default: null
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  trialEnd: {
    type: Date,
    default: null
  },
  features: {
    adFree: {
      type: Boolean,
      default: false
    },
    enhancedRecommendations: {
      type: Boolean,
      default: false
    },
    exclusiveForums: {
      type: Boolean,
      default: false
    },
    videoChat: {
      type: Boolean,
      default: false
    },
    customThemes: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    maxReadingLists: {
      type: Number,
      default: 3
    },
    maxSpaces: {
      type: Number,
      default: 5
    },
    maxAIChats: {
      type: Number,
      default: 2
    },
    aiChatVideoEnabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Set features based on tier
subscriptionSchema.pre('save', function(next) {
  if (this.tier === 'premium') {
    this.features = {
      adFree: true,
      enhancedRecommendations: true,
      exclusiveForums: true,
      videoChat: true,
      customThemes: false,
      prioritySupport: false,
      maxReadingLists: 10,
      maxSpaces: 20,
      maxAIChats: 10,
      aiChatVideoEnabled: true
    };
  } else if (this.tier === 'pro') {
    this.features = {
      adFree: true,
      enhancedRecommendations: true,
      exclusiveForums: true,
      videoChat: true,
      customThemes: true,
      prioritySupport: true,
      maxReadingLists: -1, // unlimited
      maxSpaces: -1, // unlimited
      maxAIChats: -1, // unlimited
      aiChatVideoEnabled: true
    };
  } else {
    this.features = {
      adFree: false,
      enhancedRecommendations: false,
      exclusiveForums: false,
      videoChat: false,
      customThemes: false,
      prioritySupport: false,
      maxReadingLists: 3,
      maxSpaces: 5,
      maxAIChats: 2,
      aiChatVideoEnabled: false
    };
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
