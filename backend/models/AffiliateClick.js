const mongoose = require('mongoose');

const affiliateClickSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  platform: {
    type: String,
    enum: ['amazon', 'bookshop', 'barnes-noble'],
    required: true
  },
  affiliateLink: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  converted: {
    type: Boolean,
    default: false
  },
  estimatedCommission: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AffiliateClick', affiliateClickSchema);
