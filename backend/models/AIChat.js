const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  characterType: {
    type: String,
    enum: ['author', 'character'],
    required: true
  },
  characterName: {
    type: String,
    required: true,
    trim: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    default: null
  },
  bookTitle: {
    type: String,
    default: ''
  },
  personality: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: null
  },
  videoEnabled: {
    type: Boolean,
    default: false
  },
  didVideoId: {
    type: String,
    default: null
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
aiChatSchema.index({ user: 1, isActive: 1 });
aiChatSchema.index({ user: 1, characterName: 1 });

module.exports = mongoose.model('AIChat', aiChatSchema);
